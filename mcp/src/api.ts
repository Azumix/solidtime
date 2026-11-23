import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface Config {
  url: string;
  token: string;
  organizationId?: string;
  timezone: string;
  claudeProjectsDir: string;
}

export function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    let value = line.slice(eq + 1).trim();
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

export function loadConfig(): Config {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
  const file = existsSync(envPath) ? parseEnvFile(readFileSync(envPath, "utf8")) : {};
  const get = (key: string) => process.env[key] || file[key] || undefined;
  return {
    url: (get("SOLIDTIME_URL") ?? "http://localhost:8080").replace(/\/+$/, ""),
    token: get("SOLIDTIME_API_TOKEN") ?? "",
    organizationId: get("SOLIDTIME_ORGANIZATION_ID"),
    timezone: get("SOLIDTIME_TIMEZONE") ?? "Europe/Paris",
    claudeProjectsDir: get("CLAUDE_PROJECTS_DIR") ?? "/mnt/c/Users/elaffineur/.claude/projects",
  };
}

export interface NamedItem {
  id: string;
  name: string;
}

export function resolveRef<T extends NamedItem>(items: T[], input: string, kind: string): T {
  const byId = items.find((i) => i.id === input);
  if (byId) return byId;
  const wanted = input.trim().toLowerCase();
  const matches = items.filter((i) => i.name.trim().toLowerCase() === wanted);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous ${kind} "${input}": ${matches.length} matches (${matches.map((m) => `${m.name} [${m.id}]`).join(", ")}). Use the ID.`,
    );
  }
  const known = items.map((i) => i.name).join(", ") || "none";
  throw new Error(`Unknown ${kind} "${input}". Available: ${known}`);
}

export interface ApiProject extends NamedItem {
  is_billable: boolean;
  is_archived: boolean;
}
export interface ApiTask extends NamedItem {
  project_id: string;
  is_done: boolean;
}
export type ApiTag = NamedItem;
export interface ApiTimeEntry {
  id: string;
  start: string;
  end: string | null;
  duration: number;
  description: string | null;
  task_id: string | null;
  project_id: string | null;
  user_id: string;
  tags: string[];
  billable: boolean;
  type: string;
}
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  timezone: string;
}
export interface ApiMembership {
  id: string;
  organization: { id: string; name: string; currency: string };
  role: string;
}

export interface TimeEntryPayload {
  member_id?: string;
  project_id?: string | null;
  task_id?: string | null;
  start?: string;
  end?: string | null;
  billable?: boolean;
  description?: string | null;
  tags?: string[] | null;
}

export class ApiError extends Error {}

export function formatApiError(method: string, path: string, status: number, bodyText: string): string {
  let detail = bodyText.slice(0, 500);
  try {
    const body = JSON.parse(bodyText) as { message?: string; errors?: Record<string, string[]> };
    const parts: string[] = [];
    if (body.message) parts.push(body.message);
    if (body.errors) {
      for (const [field, msgs] of Object.entries(body.errors)) parts.push(`${field}: ${[msgs].flat().join(" ")}`);
    }
    if (parts.length) detail = parts.join(" | ");
  } catch {
    // non-JSON body: keep the raw text
  }
  return `solidtime API ${method} ${path} failed (${status}): ${detail}`;
}

export class SolidtimeClient {
  private context?: { organizationId: string; memberId: string; user: ApiUser; membership: ApiMembership };

  constructor(private config: Config) {}

  async request<T>(method: string, path: string, opts: { query?: Record<string, string | number | undefined>; body?: unknown } = {}): Promise<T> {
    if (!this.config.token) throw new ApiError("SOLIDTIME_API_TOKEN is not set (see mcp/.env.example)");
    const url = new URL(`${this.config.url}/api/v1${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: "application/json",
          ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch (e) {
      throw new ApiError(`Cannot reach solidtime at ${this.config.url}: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new ApiError(formatApiError(method, path, res.status, text));
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async getContext() {
    if (this.context) return this.context;
    const user = (await this.request<{ data: ApiUser }>("GET", "/users/me")).data;
    const memberships = (await this.request<{ data: ApiMembership[] }>("GET", "/users/me/memberships")).data;
    let membership: ApiMembership | undefined;
    if (this.config.organizationId) {
      membership = memberships.find((m) => m.organization.id === this.config.organizationId);
      if (!membership) throw new ApiError(`User is not a member of organization ${this.config.organizationId}`);
    } else if (memberships.length === 1) {
      membership = memberships[0];
    } else {
      throw new ApiError(
        `Several organizations, set SOLIDTIME_ORGANIZATION_ID: ${memberships.map((m) => `${m.organization.name} [${m.organization.id}]`).join(", ")}`,
      );
    }
    this.context = { organizationId: membership.organization.id, memberId: membership.id, user, membership };
    return this.context;
  }

  private async orgPath(suffix: string): Promise<string> {
    return `/organizations/${(await this.getContext()).organizationId}${suffix}`;
  }

  private async listAll<T>(suffix: string, query: Record<string, string | number | undefined> = {}): Promise<T[]> {
    const path = await this.orgPath(suffix);
    const items: T[] = [];
    for (let page = 1; ; page++) {
      const res = await this.request<{ data: T[]; meta?: { last_page?: number } }>("GET", path, { query: { ...query, page } });
      items.push(...res.data);
      if (page >= (res.meta?.last_page ?? 1)) return items;
    }
  }

  listProjects(archived: "true" | "false" | "all" = "false") {
    return this.listAll<ApiProject>("/projects", { archived });
  }
  listTasks(projectId?: string, done: "true" | "false" | "all" = "all") {
    return this.listAll<ApiTask>("/tasks", { project_id: projectId, done });
  }
  listTags() {
    return this.listAll<ApiTag>("/tags");
  }

  async listTimeEntries(query: { start?: string; end?: string; limit?: number }) {
    const ctx = await this.getContext();
    return this.request<{ data: ApiTimeEntry[]; meta?: { total?: number } }>("GET", await this.orgPath("/time-entries"), {
      query: { ...query, member_id: ctx.memberId },
    });
  }

  async getTimeEntry(id: string): Promise<ApiTimeEntry> {
    // No show route exists: the id is looked up in the member's recent entries
    const ctx = await this.getContext();
    const res = await this.request<{ data: ApiTimeEntry[] }>("GET", await this.orgPath("/time-entries"), {
      query: { member_id: ctx.memberId, limit: 500 },
    });
    const entry = res.data.find((e) => e.id === id);
    if (!entry) throw new ApiError(`Time entry ${id} not found among your 500 most recent entries`);
    return entry;
  }

  async createTimeEntry(payload: TimeEntryPayload): Promise<ApiTimeEntry> {
    const ctx = await this.getContext();
    const body = { member_id: ctx.memberId, ...payload };
    return (await this.request<{ data: ApiTimeEntry }>("POST", await this.orgPath("/time-entries"), { body })).data;
  }

  async updateTimeEntry(id: string, payload: TimeEntryPayload): Promise<ApiTimeEntry> {
    return (await this.request<{ data: ApiTimeEntry }>("PUT", await this.orgPath(`/time-entries/${id}`), { body: payload })).data;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await this.request("DELETE", await this.orgPath(`/time-entries/${id}`));
  }
}
