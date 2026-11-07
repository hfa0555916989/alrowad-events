/** Pure analytics shapes and math. No IPs, no visitor ids, no Blob. Legacy day files still merge. */

export const TZ = "Asia/Riyadh";
export const SEP = "\u001f";

export type Counts = { v: number; pv: number };
export type PageStat = {
  v: number; pv: number; dur: number; land: number; exit: number;
  s25: number; s50: number; s75: number; s100: number;
  wa: number; call: number;
};
export type Slice = {
  v: number; pv: number; ses: number; bnc: number; dur: number;
  nv: number; ret: number; intent: number; click: number;
  h: Record<string, Counts>;
  p: Record<string, PageStat>;
  rd: Record<string, Counts>;
  cp: Record<string, Counts>;
  os: Record<string, Counts>;
  br: Record<string, Counts>;
  sc: Record<string, Counts>;
  lg: Record<string, Counts>;
  e: Record<string, number>;
};
export type DayAgg = {
  d: string;
  v: number; pv: number; ses: number; bnc: number; dur: number;
  nv: number; ret: number; intent: number; click: number;
  c: Record<string, Counts>;
  r: Record<string, Counts>;
  ci: Record<string, Counts>;
  p: Record<string, Counts>;
  s: Record<string, Counts>;
  rd: Record<string, Counts>;
  cp: Record<string, Counts>;
  ch: Record<string, Counts>;
  dv: Record<string, Counts>;
  os: Record<string, Counts>;
  br: Record<string, Counts>;
  sc: Record<string, Counts>;
  lg: Record<string, Counts>;
  h: Record<string, Counts>;
  e: Record<string, number>;
  es: Record<string, number>;
  ep: Record<string, number>;
  ec: Record<string, number>;
  lp: Record<string, number>;
  xp: Record<string, number>;
  pt: Record<string, number>;
  sd: Record<string, number>;
  mp: Record<string, number>;
  x?: Record<string, Slice>;
};

const NUM_FIELDS = ["v", "pv", "ses", "bnc", "dur", "nv", "ret", "intent", "click"] as const;
const COUNT_FIELDS = ["c", "r", "ci", "p", "s", "rd", "cp", "ch", "dv", "os", "br", "sc", "lg", "h"] as const;
const NUM_MAPS = ["e", "es", "ep", "ec", "lp", "xp", "pt", "sd", "mp"] as const;

const num = (x: unknown) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

export function emptyPage(): PageStat {
  return { v: 0, pv: 0, dur: 0, land: 0, exit: 0, s25: 0, s50: 0, s75: 0, s100: 0, wa: 0, call: 0 };
}
export function emptySlice(): Slice {
  return {
    v: 0, pv: 0, ses: 0, bnc: 0, dur: 0, nv: 0, ret: 0, intent: 0, click: 0,
    h: {}, p: {}, rd: {}, cp: {}, os: {}, br: {}, sc: {}, lg: {}, e: {},
  };
}
export function emptyDay(d: string): DayAgg {
  return {
    d,
    v: 0, pv: 0, ses: 0, bnc: 0, dur: 0, nv: 0, ret: 0, intent: 0, click: 0,
    c: {}, r: {}, ci: {}, p: {}, s: {}, rd: {}, cp: {}, ch: {}, dv: {}, os: {}, br: {}, sc: {}, lg: {}, h: {},
    e: {}, es: {}, ep: {}, ec: {}, lp: {}, xp: {}, pt: {}, sd: {}, mp: {},
    x: {},
  };
}

function mergeCounts(a: Record<string, Counts>, b?: Record<string, Counts>) {
  if (!b) return;
  for (const [k, x] of Object.entries(b)) {
    if (!x || typeof x !== "object") continue;
    const y = (a[k] ||= { v: 0, pv: 0 });
    y.v += num(x.v);
    y.pv += num(x.pv);
  }
}
function mergeNums(a: Record<string, number>, b?: Record<string, number>) {
  if (!b) return;
  for (const [k, n] of Object.entries(b)) {
    const v = num(n);
    if (v) a[k] = (a[k] || 0) + v;
  }
}
function asPage(p?: Partial<PageStat>): PageStat {
  const e = emptyPage();
  if (!p) return e;
  e.v = num(p.v); e.pv = num(p.pv); e.dur = num(p.dur); e.land = num(p.land); e.exit = num(p.exit);
  e.s25 = num(p.s25); e.s50 = num(p.s50); e.s75 = num(p.s75); e.s100 = num(p.s100);
  e.wa = num(p.wa); e.call = num(p.call);
  return e;
}
function addPage(a: PageStat, b: PageStat) {
  a.v += b.v; a.pv += b.pv; a.dur += b.dur; a.land += b.land; a.exit += b.exit;
  a.s25 += b.s25; a.s50 += b.s50; a.s75 += b.s75; a.s100 += b.s100;
  a.wa += b.wa; a.call += b.call;
  return a;
}
function mergeSlice(a: Slice, b: Partial<Slice>) {
  a.v += num(b.v); a.pv += num(b.pv); a.ses += num(b.ses); a.bnc += num(b.bnc); a.dur += num(b.dur);
  a.nv += num(b.nv); a.ret += num(b.ret); a.intent += num(b.intent); a.click += num(b.click);
  mergeCounts(a.h, b.h);
  if (b.p) for (const [k, p] of Object.entries(b.p)) a.p[k] = addPage(a.p[k] || emptyPage(), asPage(p));
  mergeCounts(a.rd, b.rd); mergeCounts(a.cp, b.cp);
  mergeCounts(a.os, b.os); mergeCounts(a.br, b.br); mergeCounts(a.sc, b.sc); mergeCounts(a.lg, b.lg);
  mergeNums(a.e, b.e);
}

/** Add b into a. Nested objects are copied by value so cached blobs stay immutable. */
export function mergeAgg(a: DayAgg, b: Partial<DayAgg>): DayAgg {
  for (const k of NUM_FIELDS) a[k] += num(b[k]);
  for (const k of COUNT_FIELDS) mergeCounts(a[k], b[k]);
  for (const k of NUM_MAPS) mergeNums(a[k], b[k]);
  if (b.x && typeof b.x === "object") {
    a.x ||= {};
    for (const [key, sl] of Object.entries(b.x)) {
      if (!sl || typeof sl !== "object") continue;
      mergeSlice((a.x[key] ||= emptySlice()), sl);
    }
  }
  return a;
}

export function normalizeDay(raw: Partial<DayAgg> | null | undefined, fallbackDate = ""): DayAgg {
  const base = emptyDay((raw && raw.d) || fallbackDate);
  if (!raw || typeof raw !== "object") return base;
  return mergeAgg(base, raw);
}

export function dayKey(t = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
}
export function hourKey(t = new Date()) {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).formatToParts(t).find((p) => p.type === "hour")?.value;
  const n = Number(h);
  return Number.isFinite(n) ? ((n % 24) + 24) % 24 : 0;
}
export function addDays(s: string, n: number) {
  const d = new Date(s + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysInclusive(from: string, to: string) {
  const ms = Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z");
  if (!Number.isFinite(ms)) return 0;
  return Math.round(ms / 86400000) + 1;
}
export function prevPeriod(from: string, to: string): [string, string] {
  const n = Math.max(1, daysInclusive(from, to));
  const prevTo = addDays(from, -1);
  return [addDays(prevTo, -(n - 1)), prevTo];
}
export function weekday(date: string) {
  return new Date(date + "T12:00:00Z").getUTCDay();
}

export const BOT_RE = /bot|crawl|spider|slurp|bing|google|yandex|baidu|duckduck|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|scrapy|petal|semrush|ahrefs|mj12|dotbot|gptbot|claude|perplexity|bytespider|meta-externalagent/i;

const SEARCH = new Set(["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu", "ecosia", "brave", "search"]);
const SOCIAL = new Set(["snap", "ig", "tiktok", "x", "fb", "wa", "yt", "linkedin", "pinterest", "telegram"]);

export function channelOf(src: string) {
  if (!src || src === "direct") return "direct";
  if (src === "gads" || src === "campaign" || src.startsWith("ads:")) return "campaign";
  if (SEARCH.has(src)) return "search";
  if (SOCIAL.has(src)) return "social";
  if (src === "email") return "email";
  if (src === "other") return "referral";
  return "referral";
}

const TOKEN_MAP: [RegExp, string][] = [
  [/snap/i, "snap"], [/insta|^ig$/i, "ig"], [/tik/i, "tiktok"], [/twitter|^x$|x\.com/i, "x"],
  [/face|^fb$|^meta$/i, "fb"], [/whats|^wa$/i, "wa"], [/youtu/i, "yt"], [/linked/i, "linkedin"],
  [/pinterest|^pin$/i, "pinterest"], [/telegr|^tg$/i, "telegram"], [/newslet|^mail$|email/i, "email"],
  [/bing/i, "bing"], [/yahoo/i, "yahoo"], [/duck/i, "duckduckgo"], [/yandex/i, "yandex"],
  [/baidu/i, "baidu"], [/ecosia/i, "ecosia"], [/brave/i, "brave"], [/google/i, "google"],
];
const HOST_MAP: [RegExp, string][] = [
  [/(^|\.)mail\.google\.[a-z.]+$/, "email"],
  [/(^|\.)(outlook\.live\.com|outlook\.office\.com|hotmail\.com|mail\.yahoo\.[a-z.]+)$/, "email"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)yahoo\.[a-z.]+$/, "yahoo"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)yandex\.[a-z.]+$/, "yandex"],
  [/(^|\.)baidu\.com$/, "baidu"],
  [/(^|\.)ecosia\.org$/, "ecosia"],
  [/(^|\.)search\.brave\.com$/, "brave"],
  [/(^|\.)snapchat\.com$/, "snap"],
  [/(^|\.)instagram\.com$/, "ig"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "fb"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "wa"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "yt"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(pinterest\.com|pin\.it)$/, "pinterest"],
  [/(^|\.)(telegram\.org|telegram\.me|t\.me)$/, "telegram"],
];
const PAID = /cpc|ppc|paid|cpm|cpv|display|\bads\b|paidsocial|paid_social|paid-social/i;

function mapToken(s: string) {
  const t = s.trim().toLowerCase();
  if (!t) return "";
  for (const [re, k] of TOKEN_MAP) if (re.test(t)) return k;
  const safe = t.replace(/[^a-z0-9._-]+/g, "").slice(0, 24);
  return safe || "other";
}
export function classify(ref: string, utmSource: string, utmMedium: string) {
  if (utmSource) {
    const base = mapToken(utmSource);
    if (PAID.test(utmMedium)) {
      if (base === "google" || base === "gads") return { src: "gads", channel: "campaign" };
      if (!base || base === "other") return { src: "campaign", channel: "campaign" };
      return { src: `ads:${base}`, channel: "campaign" };
    }
    const src = base || "other";
    return { src, channel: channelOf(src) };
  }
  if (!ref) return { src: "direct", channel: "direct" };
  for (const [re, k] of HOST_MAP) if (re.test(ref)) return { src: k, channel: channelOf(k) };
  return { src: "other", channel: "referral" };
}

export function parseUA(ua: string) {
  let browser = "أخرى";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung";
  else if (/Instagram/i.test(ua)) browser = "Instagram";
  else if (/FBAN|FBAV/i.test(ua)) browser = "Facebook";
  else if (/TikTok/i.test(ua)) browser = "TikTok";
  else if (/Snapchat/i.test(ua)) browser = "Snapchat";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "أخرى";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))) os = "iOS";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let device: "mobile" | "tablet" | "desktop" = "desktop";
  if (/iPad|Tablet|PlayBook/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) device = "tablet";
  else if (/Mobi|iPhone|iPod|Android/i.test(ua)) device = "mobile";
  return { os, browser, device };
}

export function screenBucket(width: number) {
  if (!Number.isFinite(width) || width < 200 || width > 8000) return "";
  if (width <= 360) return "≤360";
  if (width <= 430) return "361–430";
  if (width <= 767) return "431–767";
  if (width <= 1024) return "768–1024";
  if (width <= 1440) return "1025–1440";
  return "1441+";
}
export function langTag(raw: string) {
  const m = /[a-z]{2}/i.exec(String(raw || "").trim());
  return m ? m[0].toLowerCase() : "";
}

export const SOURCE_LABELS: Record<string, string> = {
  google: "قوقل (بحث)", gads: "إعلانات قوقل", search: "محركات بحث أخرى", bing: "بينغ", yahoo: "ياهو",
  duckduckgo: "داك داك غو", yandex: "ياندكس", baidu: "بايدو", ecosia: "إيكوسيا", brave: "بريف",
  snap: "سناب شات", ig: "انستقرام", tiktok: "تيك توك", x: "إكس", fb: "فيسبوك", wa: "واتساب", yt: "يوتيوب",
  linkedin: "لينكدإن", pinterest: "بنترست", telegram: "تيليجرام", email: "البريد", direct: "دخول مباشر",
  other: "مواقع أخرى", campaign: "حملة",
};
export function sourceLabel(src: string) {
  if (src.startsWith("ads:")) return `إعلان · ${SOURCE_LABELS[src.slice(4)] || src.slice(4)}`;
  return SOURCE_LABELS[src] || src;
}
export const CHANNEL_LABELS: Record<string, string> = {
  search: "بحث", social: "تواصل اجتماعي", direct: "دخول مباشر", referral: "إحالة من مواقع", campaign: "حملات", email: "بريد",
};
export const CHANNEL_ORDER = ["search", "social", "direct", "referral", "campaign", "email"] as const;
export const DEVICE_LABELS: Record<string, string> = { mobile: "جوال", tablet: "جهاز لوحي", desktop: "كمبيوتر" };
export const SCREEN_LABELS: Record<string, string> = {
  "≤360": "هاتف صغير (≤360)", "361–430": "هاتف (361–430)", "431–767": "هاتف كبير",
  "768–1024": "جهاز لوحي", "1025–1440": "حاسوب", "1441+": "شاشة كبيرة",
};

export type Hit = {
  kind: "pv" | "hb" | "cv";
  path: string;
  country: string;
  region: string;
  city: string;
  src: string;
  ref?: string;
  camp?: string;
  device?: string;
  os?: string;
  browser?: string;
  screen?: string;
  lang?: string;
  hour: number;
  dailyUnique?: boolean;
  newVisitor?: boolean;
  newPage?: boolean;
  newSession?: boolean;
  unbounce?: boolean;
  hourUnique?: boolean;
  dur?: number;
  scroll?: number[];
  prevExit?: string;
  event?: "wa" | "call";
  float?: boolean;
  intent?: boolean;
  funnelClick?: boolean;
};

const clip = (s: string, n: number) => String(s || "").replace(/[\u0000-\u001f]/g, " ").replace(/\|/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
function clipPath(s: string) {
  const p = clip(s, 120);
  if (!p) return "/";
  return p.startsWith("/") ? p : `/${p}`;
}
function touch(m: Record<string, Counts>, key: string, pv: number, v: number) {
  if (!key || (!pv && !v)) return;
  const x = (m[key] ||= { v: 0, pv: 0 });
  x.pv += pv;
  x.v += v;
}
function addN(m: Record<string, number>, key: string, n: number) {
  if (!key || !n) return;
  m[key] = (m[key] || 0) + n;
}
type Dim = { country: string; region: string; city: string; src: string; device: string };
export function sliceKey(dim: Dim) {
  return [dim.country, dim.region, dim.city, dim.src, dim.device].join(SEP);
}
export function parseSliceKey(k: string): Dim {
  const [country, region, city, src, device] = k.split(SEP);
  return { country: country || "XX", region: region || "?", city: city || "?", src: src || "direct", device: device || "desktop" };
}

function boundPath(day: DayAgg, path: string) {
  if (day.p[path] || day.mp[path] || Object.keys(day.p).length < 300) return path;
  return "/other";
}

/** Fold one hit into the day aggregate and the matching slice. Safe to call on the in-memory buffer. */
export function applyHit(day: DayAgg, hit: Hit) {
  day.x ||= {};
  const kind = hit.kind;
  const path = boundPath(day, clipPath(hit.path));
  const country = (clip(hit.country, 2) || "XX").toUpperCase();
  const region = clip(hit.region, 40) || "?";
  const city = clip(hit.city, 60) || "?";
  const src = clip(hit.src, 40) || "direct";
  const device = hit.device === "mobile" || hit.device === "tablet" || hit.device === "desktop" ? hit.device : "desktop";
  const os = clip(hit.os || "", 24) || "أخرى";
  const browser = clip(hit.browser || "", 24) || "أخرى";
  const screen = clip(hit.screen || "", 16);
  const lang = clip(hit.lang || "", 8);
  const ref = clip(hit.ref || "", 80);
  const camp = clip(hit.camp || "", 160);
  const hour = String(Math.max(0, Math.min(23, Math.floor(num(hit.hour)))));
  const dur = Math.max(0, Math.min(60, Math.round(num(hit.dur))));
  const prev = hit.prevExit ? boundPath(day, clipPath(hit.prevExit)) : "";
  const scroll = [...new Set((hit.scroll || []).map((n) => Number(n)).filter((n) => n === 25 || n === 50 || n === 75 || n === 100))];

  let key = sliceKey({ country, region, city, src, device });
  if (!day.x[key] && Object.keys(day.x).length >= 500) key = sliceKey({ country: "XX", region: "?", city: "?", src: "other", device: "desktop" });
  const sl = (day.x[key] ||= emptySlice());
  const dim = parseSliceKey(key);

  const page = () => (sl.p[path] ||= emptyPage());

  if (kind !== "cv" && dur > 0) {
    day.dur += dur;
    sl.dur += dur;
    addN(day.pt, path, dur);
    page().dur += dur;
  }
  if (kind !== "cv") {
    for (const m of scroll) {
      addN(day.sd, `${path}|${m}`, 1);
      const ps = page();
      if (m === 25) ps.s25++;
      else if (m === 50) ps.s50++;
      else if (m === 75) ps.s75++;
      else ps.s100++;
    }
  }

  if (kind === "pv") {
    const v = hit.dailyUnique ? 1 : 0;
    const ses = hit.newSession ? 1 : 0;
    day.pv++; sl.pv++;
    day.v += v; sl.v += v;
    day.ses += ses; sl.ses += ses;
    if (ses) { day.bnc++; sl.bnc++; }
    if (hit.unbounce) { day.bnc--; sl.bnc--; }
    if (v && hit.newVisitor) { day.nv++; sl.nv++; }
    if (v && !hit.newVisitor) { day.ret++; sl.ret++; }
    if (hit.intent) { day.intent++; sl.intent++; }
    touch(day.c, dim.country, 1, v);
    touch(day.r, `${dim.country}|${dim.region}`, 1, v);
    touch(day.ci, `${dim.country}|${dim.city}`, 1, v);
    touch(day.p, path, 1, hit.newPage ? 1 : 0);
    addN(day.mp, path, 1);
    touch(day.s, dim.src, 1, ses);
    touch(day.ch, channelOf(dim.src), 1, ses);
    touch(day.dv, dim.device, 1, v);
    touch(day.os, os, 1, v); touch(sl.os, os, 1, v);
    touch(day.br, browser, 1, v); touch(sl.br, browser, 1, v);
    if (screen) { touch(day.sc, screen, 1, v); touch(sl.sc, screen, 1, v); }
    if (lang) { touch(day.lg, lang, 1, v); touch(sl.lg, lang, 1, v); }
    if (ref) { touch(day.rd, ref, 1, ses); touch(sl.rd, ref, 1, ses); }
    if (camp) { touch(day.cp, camp, 1, ses); touch(sl.cp, camp, 1, ses); }
    touch(day.h, hour, 1, hit.hourUnique ? 1 : 0);
    touch(sl.h, hour, 1, hit.hourUnique ? 1 : 0);
    if (ses) addN(day.lp, path, 1);
    addN(day.xp, path, 1);
    if (prev) addN(day.xp, prev, -1);
    const ps = page();
    ps.pv++;
    if (hit.newPage) ps.v++;
    if (ses) ps.land++;
    ps.exit++;
    if (prev && sl.p[prev]) sl.p[prev].exit--;
  }

  if (kind === "cv" && (hit.event === "wa" || hit.event === "call")) {
    const ev = hit.event;
    addN(day.e, ev, 1); addN(sl.e, ev, 1);
    if (hit.float) { addN(day.e, `${ev}_float`, 1); addN(sl.e, `${ev}_float`, 1); }
    addN(day.es, `${ev}|${dim.src}`, 1);
    addN(day.ep, `${ev}|${path}`, 1);
    addN(day.ec, `${ev}|${dim.country}|${dim.city}`, 1);
    const ps = page();
    if (ev === "wa") ps.wa++; else ps.call++;
    if (hit.funnelClick) { day.click++; sl.click++; }
  }
}

function foldSlice(a: DayAgg, sl: Slice, dim: Dim) {
  a.v += num(sl.v); a.pv += num(sl.pv); a.ses += num(sl.ses); a.bnc += num(sl.bnc); a.dur += num(sl.dur);
  a.nv += num(sl.nv); a.ret += num(sl.ret); a.intent += num(sl.intent); a.click += num(sl.click);
  mergeCounts(a.h, sl.h);
  touch(a.c, dim.country, num(sl.pv), num(sl.v));
  touch(a.r, `${dim.country}|${dim.region}`, num(sl.pv), num(sl.v));
  touch(a.ci, `${dim.country}|${dim.city}`, num(sl.pv), num(sl.v));
  touch(a.s, dim.src, num(sl.pv), num(sl.ses));
  touch(a.ch, channelOf(dim.src), num(sl.pv), num(sl.ses));
  touch(a.dv, dim.device, num(sl.pv), num(sl.v));
  mergeCounts(a.os, sl.os); mergeCounts(a.br, sl.br); mergeCounts(a.sc, sl.sc); mergeCounts(a.lg, sl.lg);
  mergeCounts(a.rd, sl.rd); mergeCounts(a.cp, sl.cp);
  for (const [p, ps] of Object.entries(sl.p || {})) {
    const page = asPage(ps);
    touch(a.p, p, page.pv, page.v);
    addN(a.mp, p, page.pv);
    addN(a.lp, p, page.land);
    addN(a.xp, p, page.exit);
    addN(a.pt, p, page.dur);
    addN(a.sd, `${p}|25`, page.s25); addN(a.sd, `${p}|50`, page.s50); addN(a.sd, `${p}|75`, page.s75); addN(a.sd, `${p}|100`, page.s100);
    addN(a.ep, `wa|${p}`, page.wa); addN(a.ep, `call|${p}`, page.call);
    addN(a.ec, `wa|${dim.country}|${dim.city}`, page.wa);
    addN(a.ec, `call|${dim.country}|${dim.city}`, page.call);
  }
  for (const [k, n] of Object.entries(sl.e || {})) {
    addN(a.e, k, num(n));
    if (k === "wa" || k === "call") addN(a.es, `${k}|${dim.src}`, num(n));
  }
}

export type Filter = { country?: string; city?: string; source?: string; device?: string };
export function hasFilter(f?: Filter) {
  return !!(f && (f.country || f.city || f.source || f.device));
}

/** Project a day for the dashboard. No filter returns totals (including legacy). A filter uses slices only. */
export function viewDay(day: DayAgg, f?: Filter): DayAgg {
  if (!hasFilter(f)) {
    const out = normalizeDay(day, day.d);
    delete out.x;
    return out;
  }
  const out = emptyDay(day.d);
  delete out.x;
  for (const [k, sl] of Object.entries(day.x || {})) {
    const dim = parseSliceKey(k);
    if (f!.country && dim.country !== f!.country) continue;
    if (f!.city && `${dim.country}|${dim.city}` !== f!.city) continue;
    if (f!.source && dim.src !== f!.source) continue;
    if (f!.device && dim.device !== f!.device) continue;
    foldSlice(out, sl, dim);
  }
  return out;
}

export function slicePageviews(d: DayAgg) {
  let n = 0;
  for (const sl of Object.values(d.x || {})) n += num(sl.pv);
  return n;
}
export function legacyPageviews(d: DayAgg) {
  return Math.max(0, num(d.pv) - slicePageviews(d));
}

export type Facet = { k: string; v: number };
export type Facets = { countries: Facet[]; cities: Facet[]; sources: Facet[]; devices: Facet[] };
function facetList(days: DayAgg[], key: "c" | "ci" | "s" | "dv"): Facet[] {
  const m: Record<string, number> = {};
  for (const d of days) for (const [k, x] of Object.entries(d[key] || {})) {
    const score = num(x.v) + num(x.pv);
    if (score > 0) m[k] = (m[k] || 0) + (num(x.v) || num(x.pv));
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k, v }));
}
export function facetsFrom(days: DayAgg[]): Facets {
  return { countries: facetList(days, "c"), cities: facetList(days, "ci"), sources: facetList(days, "s"), devices: facetList(days, "dv") };
}

export type Totals = {
  v: number; pv: number; ses: number; bnc: number; dur: number;
  nv: number; ret: number; intent: number; click: number;
  wa: number; call: number; waFloat: number; callFloat: number;
};
export function totalsOf(days: DayAgg[]): Totals {
  const t: Totals = { v: 0, pv: 0, ses: 0, bnc: 0, dur: 0, nv: 0, ret: 0, intent: 0, click: 0, wa: 0, call: 0, waFloat: 0, callFloat: 0 };
  for (const d of days) {
    t.v += num(d.v); t.pv += num(d.pv); t.ses += num(d.ses); t.bnc += num(d.bnc); t.dur += num(d.dur);
    t.nv += num(d.nv); t.ret += num(d.ret); t.intent += num(d.intent); t.click += num(d.click);
    t.wa += num(d.e?.wa); t.call += num(d.e?.call); t.waFloat += num(d.e?.wa_float); t.callFloat += num(d.e?.call_float);
  }
  return t;
}
export function metrics(t: Totals) {
  const conv = t.wa + t.call;
  const ses = t.ses;
  const bounce = ses > 0 ? Math.min(1, Math.max(0, t.bnc) / ses) : null;
  const avgDur = ses > 0 ? Math.max(0, t.dur) / ses : null;
  const pps = ses > 0 ? t.pv / ses : null;
  const cr = ses > 0 ? conv / ses : t.v > 0 ? conv / t.v : null;
  const crBase: "ses" | "v" | null = ses > 0 ? "ses" : t.v > 0 ? "v" : null;
  const unknown = Math.max(0, t.v - t.nv - t.ret);
  return { conv, bounce, avgDur, pps, cr, crBase, unknown };
}
export function pctChange(cur: number, prev: number): number | null {
  if (!Number.isFinite(cur) || !Number.isFinite(prev)) return null;
  if (prev === 0) return cur === 0 ? 0 : null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}
export function fmtDur(sec: number | null | undefined) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}
