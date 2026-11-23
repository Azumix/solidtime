#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadConfig, resolveRef, SolidtimeClient, type ApiProject, type ApiTag, type ApiTimeEntry } from "./api.js";
import { readSessionWindow } from "./session.js";
import {
  formatDuration,
  formatLocal,
  parseApiDate,
  parseDateTime,
  splitAt,
  splitEqual,
  toApiDate,
  type Range,
} from "./time.js";

const config = loadConfig();
const client = new SolidtimeClient(config);
const tz = config.timezone;
const server = new McpServer({ name: "solidtime", version: "0.1.0" });

function register<S extends z.ZodRawShape>(
  name: string,
  description: string,
  shape: S,
  fn: (args: z.infer<z.ZodObject<S>>) => Promise<string>,
) {
  (server.registerTool as any)(name, { description, inputSchema: shape }, async (args: any): Promise<CallToolResult> => {
    try {
      return { content: [{ type: "text" as const, text: await fn(args) }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: (e as Error).message }], isError: true };
    }
  });
}

let catalogCache: { at: number; projects: ApiProject[]; tags: ApiTag[] } | undefined;
async function catalog() {
  if (!catalogCache || Date.now() - catalogCache.at > 30_000) {
    const [projects, tags] = await Promise.all([client.listProjects("all"), client.listTags()]);
    catalogCache = { at: Date.now(), projects, tags };
  }
  return catalogCache;
}

interface Refs {
  project?: string | null;
  task?: string | null;
  tags?: string[] | null;
}

async function resolveRefs(refs: Refs) {
  const cat = await catalog();
  const out: { project?: ApiProject | null; taskId?: string | null; tagIds?: string[] | null } = {};
  if (refs.project === null) out.project = null;
  else if (refs.project !== undefined) out.project = resolveRef(cat.projects, refs.project, "project");
  if (refs.task === null) out.taskId = null;
  else if (refs.task !== undefined) {
    const tasks = await client.listTasks(out.project?.id);
    out.taskId = resolveRef(tasks, refs.task, "task").id;
  }
  if (refs.tags === null) out.tagIds = null;
  else if (refs.tags !== undefined) out.tagIds = refs.tags.map((t) => resolveRef(cat.tags, t, "tag").id);
  return out;
}

async function describeEntry(e: ApiTimeEntry): Promise<string> {
  const cat = await catalog();
  const project = cat.projects.find((p) => p.id === e.project_id)?.name ?? e.project_id ?? "-";
  const tags = e.tags.map((id) => cat.tags.find((t) => t.id === id)?.name ?? id).join(", ") || "-";
  const end = e.end ? formatLocal(parseApiDate(e.end), tz) : "running";
  return `${e.id} | ${formatLocal(parseApiDate(e.start), tz)} -> ${end} (${formatDuration(e.duration)}) | project: ${project} | tags: ${tags} | billable: ${e.billable} | ${e.description || "(no description)"}`;
}

const dateDoc = `ISO 8601 with offset (e.g. 2026-11-23T14:30:00+01:00) or naive local time interpreted in ${tz}`;
const refDoc = "ID or case-insensitive name";

async function createEntry(range: Range, o: { project?: string; task?: string; tags?: string[]; description?: string; billable?: boolean }) {
  const refs = await resolveRefs(o);
  const entry = await client.createTimeEntry({
    start: toApiDate(range.start),
    end: toApiDate(range.end),
    project_id: refs.project?.id ?? null,
    task_id: refs.taskId ?? null,
    tags: refs.tagIds ?? undefined,
    description: o.description ?? "",
    billable: o.billable ?? refs.project?.is_billable ?? false,
  });
  return describeEntry(entry);
}

register("whoami", "Current solidtime user, organization and member_id.", {}, async () => {
  const ctx = await client.getContext();
  return [
    `user: ${ctx.user.name} <${ctx.user.email}> [${ctx.user.id}]`,
    `organization: ${ctx.membership.organization.name} [${ctx.organizationId}]`,
    `member_id: ${ctx.memberId} (role: ${ctx.membership.role})`,
    `timezone used for inputs/outputs: ${tz}`,
  ].join("\n");
});

register(
  "list_projects",
  "List projects (id, name, billable, archived) to find IDs from names.",
  { include_archived: z.boolean().optional().describe("Include archived projects (default false)") },
  async ({ include_archived }) => {
    const projects = await client.listProjects(include_archived ? "all" : "false");
    return projects.map((p) => `${p.id} | ${p.name} | billable: ${p.is_billable}${p.is_archived ? " | archived" : ""}`).join("\n") || "No projects.";
  },
);

register(
  "list_tasks",
  "List tasks, optionally for one project.",
  { project: z.string().optional().describe(refDoc) },
  async ({ project }) => {
    const projectId = project ? resolveRef((await catalog()).projects, project, "project").id : undefined;
    const tasks = await client.listTasks(projectId);
    return tasks.map((t) => `${t.id} | ${t.name} | project_id: ${t.project_id}${t.is_done ? " | done" : ""}`).join("\n") || "No tasks.";
  },
);

register("list_tags", "List tags.", {}, async () => {
  const tags = await client.listTags();
  return tags.map((t) => `${t.id} | ${t.name}`).join("\n") || "No tags.";
});

register(
  "list_time_entries",
  "List your time entries on a period (default: today).",
  {
    start: z.string().optional().describe(`Period start, ${dateDoc} (a date alone means midnight). Default: today 00:00`),
    end: z.string().optional().describe("Period end, same format. Default: now + 1 day"),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async ({ start, end, limit }) => {
    const startDate = start ? parseDateTime(start, tz) : end ? undefined : parseDateTime(formatLocal(new Date(), tz).slice(0, 10), tz);
    const endDate = end ? parseDateTime(end, tz) : startDate ? new Date(Date.now() + 86_400_000) : undefined;
    const res = await client.listTimeEntries({
      start: startDate && toApiDate(startDate),
      end: endDate && toApiDate(endDate),
      limit: limit ?? 100,
    });
    const lines = await Promise.all(res.data.map(describeEntry));
    const total = res.data.reduce((s, e) => s + e.duration, 0);
    return `${lines.join("\n") || "No time entries."}\n\n${res.data.length} entries (total matching: ${res.meta?.total ?? "?"}), duration shown: ${formatDuration(total)}`;
  },
);

register(
  "create_time_entry",
  "Create a time entry. Give either `end` or `duration_minutes`. billable defaults to the project's is_billable.",
  {
    start: z.string().describe(dateDoc),
    end: z.string().optional().describe(dateDoc),
    duration_minutes: z.number().positive().optional(),
    project: z.string().optional().describe(refDoc),
    task: z.string().optional().describe(`${refDoc}; requires project`),
    tags: z.array(z.string()).optional().describe(`Tags, each an ${refDoc}`),
    description: z.string().optional(),
    billable: z.boolean().optional(),
  },
  async ({ start, end, duration_minutes, ...rest }) => {
    if ((end === undefined) === (duration_minutes === undefined)) throw new Error("Provide exactly one of `end` or `duration_minutes`");
    const startDate = parseDateTime(start, tz);
    const endDate = end ? parseDateTime(end, tz) : new Date(startDate.getTime() + Math.round(duration_minutes! * 60) * 1000);
    if (endDate.getTime() <= startDate.getTime()) throw new Error("End must be after start");
    return `Created: ${await createEntry({ start: startDate, end: endDate }, rest)}`;
  },
);

register(
  "update_time_entry",
  "Update fields of one of your time entries. Omitted fields are unchanged; project/task/tags/description accept null to clear.",
  {
    id: z.string(),
    start: z.string().optional().describe(dateDoc),
    end: z.string().optional().describe(dateDoc),
    project: z.string().nullable().optional().describe(refDoc),
    task: z.string().nullable().optional().describe(refDoc),
    tags: z.array(z.string()).nullable().optional().describe(`Replaces all tags; each an ${refDoc}`),
    description: z.string().nullable().optional(),
    billable: z.boolean().optional(),
  },
  async ({ id, start, end, project, task, tags, description, billable }) => {
    const refs = await resolveRefs({ project, task, tags });
    const entry = await client.updateTimeEntry(id, {
      ...(start !== undefined && { start: toApiDate(parseDateTime(start, tz)) }),
      ...(end !== undefined && { end: toApiDate(parseDateTime(end, tz)) }),
      ...(refs.project !== undefined && { project_id: refs.project?.id ?? null }),
      ...(refs.taskId !== undefined && { task_id: refs.taskId }),
      ...(refs.tagIds !== undefined && { tags: refs.tagIds }),
      ...(description !== undefined && { description }),
      ...(billable !== undefined && { billable }),
    });
    return `Updated: ${await describeEntry(entry)}`;
  },
);

register("delete_time_entry", "Delete a time entry by ID.", { id: z.string() }, async ({ id }) => {
  await client.deleteTimeEntry(id);
  return `Deleted time entry ${id}`;
});

register(
  "split_time_entry",
  "Split a finished time entry, either at a given time (`at`) or into N equal parts (`parts`). The original is shortened; new entries copy project, task, tags, description and billable.",
  {
    id: z.string(),
    at: z.string().optional().describe(`${dateDoc}; must be strictly inside the entry`),
    parts: z.number().int().min(2).optional().describe("Number of equal parts; the last absorbs rounding"),
  },
  async ({ id, at, parts }) => {
    if ((at === undefined) === (parts === undefined)) throw new Error("Provide exactly one of `at` or `parts`");
    const ctx = await client.getContext();
    const entry = await client.getTimeEntry(id);
    if (entry.end === null) throw new Error("Cannot split a running time entry (no end): stop it first");
    if (entry.user_id !== ctx.user.id) throw new Error("Can only split your own time entries");
    const start = parseApiDate(entry.start);
    const end = parseApiDate(entry.end);
    const ranges = at !== undefined ? splitAt(start, end, parseDateTime(at, tz)) : splitEqual(start, end, parts!);

    const lines: string[] = [];
    const first = await client.updateTimeEntry(id, { end: toApiDate(ranges[0].end) });
    lines.push(`Shortened: ${await describeEntry(first)}`);
    for (const r of ranges.slice(1)) {
      try {
        const created = await client.createTimeEntry({
          project_id: entry.project_id,
          task_id: entry.task_id,
          start: toApiDate(r.start),
          end: toApiDate(r.end),
          billable: entry.billable,
          description: entry.description ?? "",
          tags: entry.tags,
        });
        lines.push(`Created: ${await describeEntry(created)}`);
      } catch (e) {
        lines.push(`FAILED to create part ${formatLocal(r.start, tz)} -> ${formatLocal(r.end, tz)}: ${(e as Error).message}`);
        throw new Error(`${lines.join("\n")}\nSplit is incomplete: the original entry was already shortened.`);
      }
    }
    return lines.join("\n");
  },
);

function describeWindow(w: ReturnType<typeof readSessionWindow>, idle: number): string {
  const ranges = w.ranges.map((r) => `  ${formatLocal(r.start, tz)} -> ${formatLocal(r.end, tz)} (${formatDuration((r.end.getTime() - r.start.getTime()) / 1000)})`);
  return [
    `start: ${formatLocal(w.start, tz)}`,
    `end (last message): ${formatLocal(w.end, tz)}`,
    `raw duration: ${formatDuration(w.rawSeconds)}`,
    `active duration (gaps > ${idle} min removed): ${formatDuration(w.activeSeconds)}`,
    `active ranges (${w.ranges.length}):`,
    ...ranges,
  ].join("\n");
}

const sessionIdDoc = "Claude session id (env var CLAUDE_CODE_SESSION_ID)";
const idleDoc = "Gaps longer than this many minutes are not counted as active (default 15)";

register(
  "get_claude_session_window",
  "Start, end, raw and active duration of a Claude Code session, read from its transcript.",
  {
    session_id: z.string().describe(sessionIdDoc),
    idle_gap_minutes: z.number().positive().optional().describe(idleDoc),
  },
  async ({ session_id, idle_gap_minutes }) => {
    const idle = idle_gap_minutes ?? 15;
    return describeWindow(readSessionWindow(config.claudeProjectsDir, session_id, idle), idle);
  },
);

register(
  "log_claude_session",
  "Log a Claude session as time on a project. Show the user get_claude_session_window first and confirm mode, project and description before calling. mode=active: one entry of the active duration starting at session start; mode=raw: start to last message; split_on_gaps: one entry per active range.",
  {
    session_id: z.string().describe(sessionIdDoc),
    project: z.string().describe(refDoc),
    description: z.string(),
    mode: z.enum(["active", "raw"]),
    split_on_gaps: z.boolean().optional().describe("One entry per active range instead of a single entry"),
    idle_gap_minutes: z.number().positive().optional().describe(idleDoc),
    task: z.string().optional().describe(`${refDoc}; requires project`),
    tags: z.array(z.string()).optional(),
  },
  async ({ session_id, project, description, mode, split_on_gaps, idle_gap_minutes, task, tags }) => {
    const w = readSessionWindow(config.claudeProjectsDir, session_id, idle_gap_minutes ?? 15);
    let ranges: Range[];
    if (split_on_gaps) ranges = w.ranges.filter((r) => r.end.getTime() > r.start.getTime());
    else if (mode === "raw") ranges = [{ start: w.start, end: w.end }];
    else ranges = [{ start: w.start, end: new Date(w.start.getTime() + w.activeSeconds * 1000) }];
    if (ranges.length === 0 || ranges.every((r) => r.end.getTime() <= r.start.getTime())) throw new Error("Session has no measurable duration");
    const lines: string[] = [];
    for (const r of ranges) lines.push(`Created: ${await createEntry(r, { project, task, tags, description })}`);
    return lines.join("\n");
  },
);

await server.connect(new StdioServerTransport());
