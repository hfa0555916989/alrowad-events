import { createHmac, randomBytes } from "crypto";
import { list, put, del } from "@vercel/blob";
import {
  applyHit, dayKey, emptyDay, hourKey, mergeAgg, normalizeDay,
  type DayAgg, type Hit,
} from "./analytics-model";

export {
  dayKey, hourKey, classify, parseUA, BOT_RE, screenBucket, langTag, viewDay, facetsFrom,
  hasFilter, prevPeriod, daysInclusive, legacyPageviews, totalsOf, metrics,
} from "./analytics-model";
export type { DayAgg, Hit, Filter, Facets } from "./analytics-model";

const PREFIX = "analytics/";
const PRESENCE = "presence/";

let buf: Record<string, DayAgg> = {};
let lastFlush = 0;
let flushing: Promise<void> | null = null;

/** Buffer a hit for the Riyadh day of `now`. Flushed as an immutable delta; nothing here stores an IP or visitor id. */
export function ingest(hit: Hit, now = new Date()) {
  const d = dayKey(now);
  const a = (buf[d] ||= emptyDay(d));
  applyHit(a, { ...hit, hour: hourKey(now) });
}

export async function maybeFlush(force = false) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  if (flushing) return flushing;
  if (!force && Date.now() - lastFlush < 20_000) return;
  const data = buf; buf = {};
  if (!Object.keys(data).length) return;
  lastFlush = Date.now();
  flushing = (async () => {
    try {
      for (const a of Object.values(data)) {
        await put(`${PREFIX}${a.d}/delta-${Date.now()}.json`, JSON.stringify(a), { access: "public", addRandomSuffix: true, contentType: "application/json" });
      }
    } catch (e) {
      console.error("analytics flush failed", e);
      for (const a of Object.values(data)) buf[a.d] = buf[a.d] ? mergeAgg(buf[a.d], a) : a;
    } finally { flushing = null; }
  })();
  return flushing;
}

export async function flushSoon() {
  await maybeFlush();
  if (!Object.keys(buf).length) return;
  const wait = Math.max(0, 20_000 - (Date.now() - lastFlush)) + 500;
  await new Promise((r) => setTimeout(r, wait));
  if (Object.keys(buf).length) await maybeFlush(true);
}

type BlobRef = { pathname: string; url: string; uploadedAt: Date };
async function listPrefix(prefix: string) {
  const out: BlobRef[] = [];
  let cursor: string | undefined;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    out.push(...r.blobs.map((b) => ({ pathname: b.pathname, url: b.url, uploadedAt: b.uploadedAt })));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

const fileCache = new Map<string, DayAgg>();
const CACHE_MAX = 1500;
function remember(url: string, day: DayAgg) {
  if (fileCache.has(url)) fileCache.delete(url);
  fileCache.set(url, day);
  while (fileCache.size > CACHE_MAX) {
    const first = fileCache.keys().next().value;
    if (!first) break;
    fileCache.delete(first);
  }
}
async function fetchJson(url: string): Promise<DayAgg | null> {
  const hit = fileCache.get(url);
  if (hit) { fileCache.delete(url); fileCache.set(url, hit); return hit; }
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    const day = normalizeDay(await r.json());
    remember(url, day);
    return day;
  } catch { return null; }
}
async function pool<T, R>(xs: T[], n: number, f: (x: T) => Promise<R>) {
  const out: R[] = new Array(xs.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, xs.length) }, async () => {
    while (i < xs.length) { const k = i++; out[k] = await f(xs[k]); }
  }));
  return out;
}

/** Load per-day aggregates for [from, to]. Past days with many deltas are compacted. Existing files are never discarded without a full merged copy. */
export async function loadRange(from: string, to: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const keys = Object.keys(buf).sort();
    while (keys.length > 4) delete buf[keys.shift()!];
    return Object.values(buf).filter((d) => d.d >= from && d.d <= to).map((d) => normalizeDay(d)).sort((a, b) => a.d.localeCompare(b.d));
  }
  await maybeFlush(true);
  const files = (await listPrefix(PREFIX)).filter((b) => {
    const d = b.pathname.slice(PREFIX.length, PREFIX.length + 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= from && d <= to;
  });
  const byDay = new Map<string, BlobRef[]>();
  for (const f of files) {
    const d = f.pathname.slice(PREFIX.length, PREFIX.length + 10);
    byDay.set(d, [...(byDay.get(d) || []), f]);
  }
  const today = dayKey();
  const days = await pool([...byDay.entries()], 8, async ([d, fs]) => {
    const parts = (await pool(fs, 12, (f) => fetchJson(f.url))).filter((x): x is DayAgg => !!x);
    const agg = parts.reduce((a, b) => mergeAgg(a, b), emptyDay(d));
    if (d < today && fs.length > 1 && parts.length === fs.length) {
      try {
        await put(`${PREFIX}${d}/day-${Date.now()}.json`, JSON.stringify(agg), { access: "public", addRandomSuffix: true, contentType: "application/json" });
        await del(fs.map((f) => f.url));
      } catch (e) { console.error("compact failed", e); }
    }
    return agg;
  });
  return days.sort((a, b) => a.d.localeCompare(b.d));
}

export async function deleteRange(from: string, to: string) {
  const files = (await listPrefix(PREFIX)).filter((b) => {
    const d = b.pathname.slice(PREFIX.length, PREFIX.length + 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= from && d <= to;
  });
  if (files.length) await del(files.map((f) => f.url));
  return files.length;
}

export type Presence = { path: string; country: string; region: string; city: string; device: string; src: string; t: number };

/** Daily-salted hash of the random cookie id. The raw id is never written to storage. */
export function presenceId(vid: string, day: string) {
  const pepper = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "rv-presence";
  return createHmac("sha256", pepper).update(`presence|${day}|${vid}`).digest("hex").slice(0, 24);
}
export function newVisitorId() {
  return randomBytes(16).toString("hex");
}

const presenceAt = new Map<string, number>();
const memPresence = new Map<string, Presence>();
export async function touchPresence(key: string, info: Presence) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) { memPresence.set(key, info); return; }
  if (!/^[a-f0-9]{16,64}$/.test(key)) return;
  const now = Date.now();
  if (now - (presenceAt.get(key) || 0) < 20_000) return;
  presenceAt.set(key, now);
  try {
    await put(`${PRESENCE}${key}.json`, JSON.stringify(info), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
  } catch (e) {
    presenceAt.delete(key);
    throw e;
  }
}

export async function loadLive() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const now = Date.now();
    for (const [k, p] of memPresence) if (now - p.t > 5 * 60 * 1000) memPresence.delete(k);
    return [...memPresence.values()];
  }
  const now = Date.now();
  const files = (await listPrefix(PRESENCE)).filter((b) => b.pathname.startsWith(PRESENCE));
  const fresh: BlobRef[] = [];
  const stale: BlobRef[] = [];
  for (const b of files) {
    const t = new Date(b.uploadedAt).getTime();
    if (!Number.isFinite(t)) continue;
    if (now - t <= 5 * 60 * 1000) fresh.push(b);
    else if (now - t > 30 * 60 * 1000) stale.push(b);
  }
  if (stale.length) await del(stale.map((b) => b.url)).catch((e) => console.error("presence cleanup", e));
  fresh.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
  const bodies = await pool(fresh.slice(0, 40), 8, async (f) => {
    try {
      const r = await fetch(f.url, { cache: "no-store" });
      if (!r.ok) return null;
      const j = await r.json();
      const path = String(j?.path || "/").slice(0, 120);
      return {
        path: path.startsWith("/") ? path : "/",
        country: String(j?.country || "XX").slice(0, 2),
        region: String(j?.region || "?").slice(0, 40),
        city: String(j?.city || "?").slice(0, 60),
        device: String(j?.device || ""),
        src: String(j?.src || ""),
        t: new Date(f.uploadedAt).getTime(),
      } satisfies Presence;
    } catch { return null; }
  });
  return bodies.filter((x): x is Presence => !!x);
}
