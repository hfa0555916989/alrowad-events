import { list, put, del } from "@vercel/blob";

/** Aggregated, anonymous counters. No IPs, no user agents, no personal data are stored. */
export type Counts = { v: number; pv: number };
/** v = unique visitors (or sessions for sources), pv = page views. e = conversion events (wa / call), es = events by "event|source". */
export type DayAgg = {
  d: string; v: number; pv: number;
  c: Record<string, Counts>; r: Record<string, Counts>; ci: Record<string, Counts>; p: Record<string, Counts>;
  s: Record<string, Counts>; rd: Record<string, Counts>; cp: Record<string, Counts>;
  e: Record<string, number>; es: Record<string, number>;
};
const MAPS = ["c", "r", "ci", "p", "s", "rd", "cp"] as const;
const NUMS = ["e", "es"] as const;
const PREFIX = "analytics/";
export const TZ = "Asia/Riyadh";
export const dayKey = (t = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
const empty = (d: string): DayAgg => ({ d, v: 0, pv: 0, c: {}, r: {}, ci: {}, p: {}, s: {}, rd: {}, cp: {}, e: {}, es: {} });
const bump = (m: Record<string, Counts>, k: string, nv: boolean) => { const x = (m[k] ||= { v: 0, pv: 0 }); x.pv++; if (nv) x.v++; };

export function mergeAgg(a: DayAgg, b: DayAgg) {
  a.v += b.v || 0; a.pv += b.pv || 0;
  for (const key of MAPS) for (const [k, x] of Object.entries(b[key] || {})) { const y = ((a[key] ||= {})[k] ||= { v: 0, pv: 0 }); y.v += x.v || 0; y.pv += x.pv || 0; }
  for (const key of NUMS) for (const [k, n] of Object.entries(b[key] || {})) (a[key] ||= {})[k] = (a[key][k] || 0) + (n || 0);
  return a;
}

export const BOT_RE = /bot|crawl|spider|slurp|bing|google|yandex|baidu|duckduck|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|scrapy|petal|semrush|ahrefs|mj12|dotbot|gptbot|claude|perplexity|bytespider/i;

/* Per-instance buffer, written as small immutable "delta" blobs (no read-modify-write => safe under concurrency).
   Low traffic: every hit is flushed immediately. Bursts: flushed at most every 20s per instance. */
let buf: Record<string, DayAgg> = {};
let lastFlush = 0;
let flushing: Promise<void> | null = null;

export type Hit = { path: string; country: string; region: string; city: string; newVisitor: boolean; newPage: boolean; landing: boolean; src: string; ref: string; camp: string };
export function record(hit: Hit) {
  const d = dayKey();
  const a = (buf[d] ||= empty(d));
  a.pv++; if (hit.newVisitor) a.v++;
  bump(a.c, hit.country, hit.newVisitor);
  bump(a.r, `${hit.country}|${hit.region}`, hit.newVisitor);
  bump(a.ci, `${hit.country}|${hit.city}`, hit.newVisitor);
  bump(a.p, hit.path, hit.newPage);
  // traffic sources: v = visits (sessions that started from this source), pv = page views during those sessions
  bump(a.s, hit.src, hit.landing);
  if (hit.ref) bump(a.rd, hit.ref, hit.landing);
  if (hit.camp) bump(a.cp, hit.camp, hit.landing);
}
export function recordEvent(ev: string, src: string, float: boolean) {
  const d = dayKey();
  const a = (buf[d] ||= empty(d));
  a.e[ev] = (a.e[ev] || 0) + 1;
  if (float) a.e[`${ev}_float`] = (a.e[`${ev}_float`] || 0) + 1;
  a.es[`${ev}|${src}`] = (a.es[`${ev}|${src}`] || 0) + 1;
}

/* ---- traffic source classification ---- */
export const SOURCES = ["google", "gads", "search", "snap", "ig", "tiktok", "x", "fb", "wa", "yt", "email", "direct", "other"] as const;
const BY_UTM: [RegExp, string][] = [[/snap/i, "snap"], [/insta|^ig$/i, "ig"], [/tik/i, "tiktok"], [/twitter|^x$|x\.com/i, "x"], [/face|^fb$|meta/i, "fb"], [/whats|^wa$/i, "wa"], [/youtu/i, "yt"], [/mail|newsletter/i, "email"], [/google/i, "google"], [/bing|yahoo|duck|yandex/i, "search"]];
const BY_HOST: [RegExp, string][] = [[/(^|\.)google\.[a-z.]+$/, "google"], [/(^|\.)(bing|yahoo|duckduckgo|yandex|baidu|ecosia|brave)\.[a-z.]+$/, "search"], [/(^|\.)snapchat\.com$/, "snap"], [/(^|\.)instagram\.com$/, "ig"], [/(^|\.)tiktok\.com$/, "tiktok"], [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"], [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "fb"], [/(^|\.)(whatsapp\.com|wa\.me)$/, "wa"], [/(^|\.)(youtube\.com|youtu\.be)$/, "yt"], [/mail\./, "email"]];
export function classify(ref: string, utmSource: string, utmMedium: string) {
  if (utmSource) {
    if (/google/i.test(utmSource) && /cpc|ppc|paid|ads/i.test(utmMedium)) return "gads";
    for (const [re, k] of BY_UTM) if (re.test(utmSource)) return k;
    return "other";
  }
  if (!ref) return "direct";
  for (const [re, k] of BY_HOST) if (re.test(ref)) return k;
  return "other";
}
export async function maybeFlush(force = false) {
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

/** Called via after(): flush now, or — if throttled — wait out the window and flush, so buffered hits are not lost. */
export async function flushSoon() {
  await maybeFlush();
  if (!Object.keys(buf).length) return;
  const wait = Math.max(0, 20_000 - (Date.now() - lastFlush)) + 500;
  await new Promise((r) => setTimeout(r, wait));
  if (Object.keys(buf).length) await maybeFlush(true);
}
async function listAll() {
  const out: { pathname: string; url: string }[] = [];
  let cursor: string | undefined;
  do {
    const r = await list({ prefix: PREFIX, cursor, limit: 1000 });
    out.push(...r.blobs.map((b) => ({ pathname: b.pathname, url: b.url })));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}
async function fetchJson(url: string): Promise<DayAgg | null> {
  try { const r = await fetch(url, { cache: "no-store" }); return r.ok ? ((await r.json()) as DayAgg) : null; } catch { return null; }
}
async function pool<T, R>(xs: T[], n: number, f: (x: T) => Promise<R>) {
  const out: R[] = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, xs.length) }, async () => { while (i < xs.length) { const k = i++; out[k] = await f(xs[k]); } }));
  return out;
}

/** Load per-day aggregates for [from, to] (YYYY-MM-DD, inclusive). Past days with many deltas are compacted into one file. */
export async function loadRange(from: string, to: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [] as DayAgg[];
  await maybeFlush(true);
  const files = (await listAll()).filter((b) => { const d = b.pathname.slice(PREFIX.length, PREFIX.length + 10); return d >= from && d <= to; });
  const byDay = new Map<string, { pathname: string; url: string }[]>();
  for (const f of files) { const d = f.pathname.slice(PREFIX.length, PREFIX.length + 10); byDay.set(d, [...(byDay.get(d) || []), f]); }
  const today = dayKey();
  const days = await pool([...byDay.entries()], 8, async ([d, fs]) => {
    const parts = (await pool(fs, 12, (f) => fetchJson(f.url))).filter(Boolean) as DayAgg[];
    const agg = parts.reduce((a, b) => mergeAgg(a, b), empty(d));
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
  const files = (await listAll()).filter((b) => { const d = b.pathname.slice(PREFIX.length, PREFIX.length + 10); return d >= from && d <= to; });
  if (files.length) await del(files.map((f) => f.url));
  return files.length;
}
