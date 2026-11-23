import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseDateTime, toApiDate, splitAt, splitEqual } from "../dist/time.js";
import { computeWindow, parseTimestamps, findSessionFile } from "../dist/session.js";
import { resolveRef } from "../dist/api.js";

const TZ = "Europe/Paris";
const d = (s) => new Date(s);

test("parseDateTime keeps an explicit offset", () => {
  assert.equal(parseDateTime("2026-11-23T14:30:00+01:00", TZ).toISOString(), "2026-11-23T13:30:00.000Z");
  assert.equal(parseDateTime("2026-11-23T14:30:00Z", TZ).toISOString(), "2026-11-23T14:30:00.000Z");
});

test("parseDateTime reads naive input as Paris time in winter and summer", () => {
  assert.equal(parseDateTime("2026-11-23T14:30", TZ).toISOString(), "2026-11-23T13:30:00.000Z");
  assert.equal(parseDateTime("2026-07-01T14:30", TZ).toISOString(), "2026-07-01T12:30:00.000Z");
});

test("parseDateTime handles the day of the spring DST change", () => {
  assert.equal(parseDateTime("2026-03-29T01:30", TZ).toISOString(), "2026-03-29T00:30:00.000Z");
  assert.equal(parseDateTime("2026-03-29T12:00", TZ).toISOString(), "2026-03-29T10:00:00.000Z");
});

test("parseDateTime treats a bare date as local midnight and rejects garbage", () => {
  assert.equal(parseDateTime("2026-11-23", TZ).toISOString(), "2026-11-22T23:00:00.000Z");
  assert.throws(() => parseDateTime("not a date", TZ), /Invalid date/);
});

test("toApiDate formats as Y-m-dTH:i:sZ without milliseconds", () => {
  assert.equal(toApiDate(d("2026-11-23T13:30:00.123Z")), "2026-11-23T13:30:00Z");
});

test("splitAt cuts strictly inside the entry", () => {
  const s = d("2026-11-22T10:00:00Z");
  const e = d("2026-11-22T11:00:00Z");
  const at = d("2026-11-22T10:20:00Z");
  const r = splitAt(s, e, at);
  assert.equal(r.length, 2);
  assert.equal(r[0].start.getTime(), s.getTime());
  assert.equal(r[0].end.getTime(), at.getTime());
  assert.equal(r[1].start.getTime(), at.getTime());
  assert.equal(r[1].end.getTime(), e.getTime());
});

test("splitAt rejects the boundaries and outside points", () => {
  const s = d("2026-11-22T10:00:00Z");
  const e = d("2026-11-22T11:00:00Z");
  assert.throws(() => splitAt(s, e, s), /strictly inside/);
  assert.throws(() => splitAt(s, e, e), /strictly inside/);
  assert.throws(() => splitAt(s, e, d("2026-11-22T12:00:00Z")), /strictly inside/);
});

test("splitEqual last part absorbs the rounding and parts are contiguous", () => {
  const s = d("2026-11-22T10:00:00Z");
  const e = d("2026-11-22T10:00:10Z");
  const r = splitEqual(s, e, 3);
  assert.deepEqual(r.map((x) => (x.end - x.start) / 1000), [3, 3, 4]);
  assert.equal(r[0].start.getTime(), s.getTime());
  assert.equal(r[2].end.getTime(), e.getTime());
  assert.equal(r[0].end.getTime(), r[1].start.getTime());
  assert.equal(r[1].end.getTime(), r[2].start.getTime());
});

test("splitEqual rejects parts < 2 and entries too short", () => {
  const s = d("2026-11-22T10:00:00Z");
  assert.throws(() => splitEqual(s, d("2026-11-22T11:00:00Z"), 1), /parts/);
  assert.throws(() => splitEqual(s, d("2026-11-22T10:00:01Z"), 2), /too short/);
});

test("computeWindow separates raw and active duration around a gap over 15 min", () => {
  const ts = ["10:00:00", "10:05:00", "10:10:00", "10:40:00", "10:50:00"].map((t) => d(`2026-11-22T${t}Z`));
  const w = computeWindow(ts);
  assert.equal(w.rawSeconds, 50 * 60);
  assert.equal(w.activeSeconds, 20 * 60);
  assert.equal(w.ranges.length, 2);
  assert.equal(w.ranges[0].start.toISOString(), "2026-11-22T10:00:00.000Z");
  assert.equal(w.ranges[0].end.toISOString(), "2026-11-22T10:10:00.000Z");
  assert.equal(w.ranges[1].start.toISOString(), "2026-11-22T10:40:00.000Z");
  assert.equal(w.ranges[1].end.toISOString(), "2026-11-22T10:50:00.000Z");
});

test("computeWindow does not split on a gap of exactly the threshold", () => {
  const w = computeWindow([d("2026-11-22T10:00:00Z"), d("2026-11-22T10:15:00Z")]);
  assert.equal(w.ranges.length, 1);
  assert.equal(w.activeSeconds, 15 * 60);
});

test("computeWindow sorts unordered input and rejects an empty list", () => {
  const w = computeWindow([d("2026-11-22T10:05:00Z"), d("2026-11-22T10:00:00Z")]);
  assert.equal(w.start.toISOString(), "2026-11-22T10:00:00.000Z");
  assert.throws(() => computeWindow([]), /No timestamps/);
});

test("parseTimestamps skips bad lines and sorts the rest", () => {
  const jsonl = [
    JSON.stringify({ timestamp: "2026-11-22T10:05:00.789Z" }),
    "{ not json",
    "",
    JSON.stringify({ type: "no-timestamp" }),
    JSON.stringify({ timestamp: 12345 }),
    JSON.stringify({ timestamp: "garbage" }),
    "null",
    JSON.stringify({ timestamp: "2026-11-22T10:00:00Z" }),
  ].join("\n");
  const r = parseTimestamps(jsonl);
  assert.deepEqual(r.map((x) => x.toISOString()), ["2026-11-22T10:00:00.000Z", "2026-11-22T10:05:00.000Z"]);
});

test("findSessionFile finds a transcript in a project subdir and rejects bad ids", () => {
  const root = mkdtempSync(join(tmpdir(), "mcp-sessions-"));
  try {
    mkdirSync(join(root, "proj-a"));
    mkdirSync(join(root, "proj-b"));
    writeFileSync(join(root, "proj-b", "abc-123.jsonl"), "");
    assert.equal(findSessionFile(root, "abc-123"), join(root, "proj-b", "abc-123.jsonl"));
    assert.throws(() => findSessionFile(root, "missing"), /No transcript/);
    assert.throws(() => findSessionFile(root, "../etc/passwd"), /Invalid session id/);
    assert.throws(() => findSessionFile(join(root, "nope"), "abc-123"), /not found/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolveRef matches by id, by case-insensitive name, and errors on ambiguous or unknown", () => {
  const items = [
    { id: "id-1", name: "Alpha" },
    { id: "id-2", name: "Beta" },
    { id: "id-3", name: "beta" },
  ];
  assert.equal(resolveRef(items, "id-1", "project").id, "id-1");
  assert.equal(resolveRef(items, "  aLPHA ", "project").id, "id-1");
  assert.throws(() => resolveRef(items, "BETA", "project"), /Ambiguous project/);
  assert.equal(resolveRef(items, "id-3", "project").id, "id-3");
  assert.throws(() => resolveRef(items, "gamma", "project"), /Unknown project "gamma"/);
});
