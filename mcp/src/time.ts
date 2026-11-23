export interface Range {
  start: Date;
  end: Date;
}

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i;
const NAIVE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;

function tzOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

export function parseDateTime(input: string, timeZone: string): Date {
  const s = input.trim();
  if (HAS_OFFSET.test(s)) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: "${input}"`);
    return d;
  }
  const m = NAIVE.exec(s);
  if (!m) throw new Error(`Invalid date: "${input}" (expected ISO 8601, e.g. 2026-11-23T14:30:00+01:00 or 2026-11-23T14:30)`);
  const [, y, mo, d, h = "0", mi = "0", sec = "0"] = m;
  const guess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec));
  let result = guess - tzOffsetMs(guess, timeZone);
  result = guess - tzOffsetMs(result, timeZone);
  return new Date(result);
}

export function toApiDate(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function parseApiDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date from API: "${s}"`);
  return d;
}

export function formatLocal(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
}

export function splitAt(start: Date, end: Date, at: Date): Range[] {
  if (!(at.getTime() > start.getTime() && at.getTime() < end.getTime())) {
    throw new Error("Split time must be strictly inside the time entry");
  }
  return [
    { start, end: at },
    { start: at, end },
  ];
}

export function splitEqual(start: Date, end: Date, parts: number): Range[] {
  if (!Number.isInteger(parts) || parts < 2) throw new Error("parts must be an integer >= 2");
  const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (totalSeconds < parts) throw new Error("Time entry is too short to be split into that many parts");
  const base = Math.floor(totalSeconds / parts);
  const ranges: Range[] = [];
  let cursor = start.getTime();
  for (let i = 0; i < parts; i++) {
    const last = i === parts - 1;
    const next = last ? end.getTime() : cursor + base * 1000;
    ranges.push({ start: new Date(cursor), end: new Date(next) });
    cursor = next;
  }
  return ranges;
}
