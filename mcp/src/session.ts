import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Range } from "./time.js";

export interface SessionWindow {
  start: Date;
  end: Date;
  rawSeconds: number;
  activeSeconds: number;
  ranges: Range[];
}

export function parseTimestamps(jsonl: string): Date[] {
  const result: Date[] = [];
  for (const line of jsonl.split("\n")) {
    if (!line.trim()) continue;
    let obj: unknown;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const ts = (obj as { timestamp?: unknown } | null)?.timestamp;
    if (typeof ts !== "string") continue;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) continue;
    d.setMilliseconds(0);
    result.push(d);
  }
  return result.sort((a, b) => a.getTime() - b.getTime());
}

export function computeWindow(timestamps: Date[], idleGapMinutes = 15): SessionWindow {
  if (timestamps.length === 0) throw new Error("No timestamps found in the session transcript");
  const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
  const gapMs = idleGapMinutes * 60_000;
  const ranges: Range[] = [];
  let current: Range = { start: sorted[0], end: sorted[0] };
  for (const ts of sorted.slice(1)) {
    if (ts.getTime() - current.end.getTime() > gapMs) {
      ranges.push(current);
      current = { start: ts, end: ts };
    } else {
      current.end = ts;
    }
  }
  ranges.push(current);
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  return {
    start,
    end,
    rawSeconds: (end.getTime() - start.getTime()) / 1000,
    activeSeconds: ranges.reduce((sum, r) => sum + (r.end.getTime() - r.start.getTime()) / 1000, 0),
    ranges,
  };
}

export function findSessionFile(projectsDir: string, sessionId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(sessionId)) throw new Error(`Invalid session id: "${sessionId}"`);
  if (!existsSync(projectsDir)) throw new Error(`Claude projects directory not found: ${projectsDir}`);
  for (const dir of readdirSync(projectsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const candidate = join(projectsDir, dir.name, `${sessionId}.jsonl`);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`No transcript ${sessionId}.jsonl found under ${projectsDir}/*/`);
}

export function readSessionWindow(projectsDir: string, sessionId: string, idleGapMinutes = 15): SessionWindow {
  const file = findSessionFile(projectsDir, sessionId);
  return computeWindow(parseTimestamps(readFileSync(file, "utf8")), idleGapMinutes);
}
