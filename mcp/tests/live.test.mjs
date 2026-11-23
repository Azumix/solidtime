import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { parseEnvFile } from "../dist/api.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const fileEnv = existsSync(envPath) ? parseEnvFile(readFileSync(envPath, "utf8")) : {};
const get = (k) => process.env[k] || fileEnv[k] || undefined;
const token = get("SOLIDTIME_API_TOKEN");
const baseUrl = (get("SOLIDTIME_URL") ?? "http://localhost:8080").replace(/\/+$/, "");

const EXPECTED_TOOLS = [
  "whoami",
  "list_projects",
  "list_tasks",
  "list_tags",
  "list_time_entries",
  "create_time_entry",
  "update_time_entry",
  "delete_time_entry",
  "split_time_entry",
  "get_claude_session_window",
  "log_claude_session",
];

async function pickOrganizationId() {
  const configured = get("SOLIDTIME_ORGANIZATION_ID");
  if (configured) return configured;
  const res = await fetch(`${baseUrl}/api/v1/users/me/memberships`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`memberships request failed: ${res.status}`);
  const { data } = await res.json();
  return data[0].organization.id;
}

const text = (r) => r.content.map((c) => c.text).join("\n");

test("live: list, create, split and delete a time entry through the MCP server", { skip: !token && "SOLIDTIME_API_TOKEN not configured" }, async (t) => {
  const env = { ...process.env, SOLIDTIME_ORGANIZATION_ID: await pickOrganizationId(), SOLIDTIME_TIMEZONE: "Europe/Paris" };
  const client = new Client({ name: "smoke", version: "0.0.0" });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [join(root, "dist", "index.js")], env }));
  const createdIds = new Set();
  const call = (name, args = {}) => client.callTool({ name, arguments: args });
  const idsFrom = (s) => [...s.matchAll(/^(?:Created|Shortened): ([0-9a-f-]{36}) \|/gm)].map((m) => m[1]);

  try {
    const tools = (await client.listTools()).tools.map((x) => x.name);
    for (const name of EXPECTED_TOOLS) assert.ok(tools.includes(name), `tool ${name} missing`);
    assert.equal(tools.length, EXPECTED_TOOLS.length);

    const who = await call("whoami");
    assert.ok(!who.isError, text(who));
    assert.match(text(who), /member_id: [0-9a-f-]{36}/);

    const marker = `[mcp-smoke] ${Date.now()}`;
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const created = await call("create_time_entry", { start: `${yesterday}T10:00`, duration_minutes: 30, description: marker });
    assert.ok(!created.isError, text(created));
    const [id] = idsFrom(text(created));
    assert.ok(id, `no id in: ${text(created)}`);
    createdIds.add(id);

    const split = await call("split_time_entry", { id, parts: 2 });
    assert.ok(!split.isError, text(split));
    for (const x of idsFrom(text(split))) createdIds.add(x);
    assert.equal(createdIds.size, 2, text(split));

    const listed = await call("list_time_entries", { start: `${yesterday}T00:00`, end: `${yesterday}T23:59`, limit: 500 });
    assert.ok(!listed.isError, text(listed));
    const mine = text(listed).split("\n").filter((l) => l.includes(marker));
    assert.equal(mine.length, 2, text(listed));
    for (const l of mine) assert.match(l, /\(0h15m00s\)/);
  } finally {
    for (const id of createdIds) {
      const r = await call("delete_time_entry", { id }).catch((e) => ({ isError: true, content: [{ text: String(e) }] }));
      if (r.isError) t.diagnostic(`cleanup failed for ${id}: ${text(r)}`);
    }
    await client.close();
  }
});
