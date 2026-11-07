import {
  BOT_RE, addDays, applyHit, channelOf, classify, emptyDay, hourKey, dayKey, legacyPageviews,
  mergeAgg, metrics, normalizeDay, parseUA, pctChange, prevPeriod, screenBucket, totalsOf, viewDay,
  type Hit,
} from "../lib/analytics-model";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}
function eq(a: unknown, b: unknown, msg: string) {
  if (a !== b) throw new Error(`${msg}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
}

const chrome = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ipad = "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
const samsung = "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36";
assert(!BOT_RE.test(chrome), "chrome is not a bot");
assert(!BOT_RE.test(iphone), "iphone is not a bot");
assert(BOT_RE.test("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), "googlebot");
assert(BOT_RE.test("meta-externalagent/1.0"), "meta agent");

eq(parseUA(chrome).browser, "Chrome", "chrome browser");
eq(parseUA(chrome).os, "Windows", "chrome os");
eq(parseUA(chrome).device, "desktop", "chrome device");
eq(parseUA(iphone).device, "mobile", "iphone device");
eq(parseUA(iphone).os, "iOS", "iphone os");
eq(parseUA(ipad).device, "tablet", "ipad device");
eq(parseUA(samsung).browser, "Samsung", "samsung browser");
eq(parseUA(samsung).device, "mobile", "samsung device");
eq(parseUA(samsung).os, "Android", "samsung os");

eq(classify("", "", "").src, "direct", "direct");
eq(classify("google.com", "", "").src, "google", "google host");
eq(classify("google.com", "", "").channel, "search", "google channel");
eq(classify("mail.google.com", "", "").src, "email", "gmail");
eq(classify("bing.com", "", "").src, "bing", "bing");
eq(classify("instagram.com", "", "").channel, "social", "ig channel");
eq(classify("example.com", "", "").channel, "referral", "referral");
eq(classify("", "google", "cpc").src, "gads", "gads");
eq(classify("", "google", "cpc").channel, "campaign", "gads channel");
eq(classify("", "snapchat", "paid_social").src, "ads:snap", "snap ads");
eq(classify("", "snapchat", "social").src, "snap", "snap organic utm");
eq(classify("", "newsletter", "email").channel, "email", "email utm");
eq(channelOf("ads:fb"), "campaign", "channel ads");
eq(channelOf("other"), "referral", "channel other");

eq(screenBucket(390), "361–430", "screen phone");
eq(screenBucket(1920), "1441+", "screen big");
eq(screenBucket(0), "", "screen empty");
eq(dayKey(new Date("2026-11-07T00:30:00Z")), "2026-11-07", "day morning utc");
eq(hourKey(new Date("2026-11-07T00:30:00Z")), 3, "hour riyadh +3");
eq(dayKey(new Date("2026-11-07T21:30:00Z")), "2026-11-08", "day rolls");
eq(hourKey(new Date("2026-11-07T21:30:00Z")), 0, "hour midnight");
eq(prevPeriod("2026-11-01", "2026-11-07").join("|"), "2026-10-25|2026-10-31", "prev period");
eq(addDays("2026-01-31", 1), "2026-02-01", "add days");
eq(pctChange(110, 100), 10, "pct");
assert(pctChange(5, 0) === null, "pct new");
eq(pctChange(0, 0), 0, "pct zero");

const base: Omit<Hit, "kind" | "path"> = {
  country: "SA", region: "01", city: "Riyadh", src: "google", device: "mobile",
  os: "iOS", browser: "Safari", screen: "361–430", lang: "ar", hour: 10,
};
const day = emptyDay("2026-11-07");
applyHit(day, { kind: "pv", path: "/", ...base, dailyUnique: true, newVisitor: true, newPage: true, newSession: true, hourUnique: true, scroll: [25] });
applyHit(day, { kind: "pv", path: "/services/coffee", ...base, newPage: true, unbounce: true, intent: true, prevExit: "/", scroll: [25, 50] });
applyHit(day, { kind: "hb", path: "/services/coffee", ...base, dur: 15, scroll: [75] });
applyHit(day, { kind: "cv", path: "/services/coffee", ...base, event: "wa", float: true, funnelClick: true });
applyHit(day, {
  kind: "pv", path: "/contact", country: "SA", region: "02", city: "Jeddah", src: "direct", device: "desktop",
  os: "Windows", browser: "Chrome", screen: "1025–1440", lang: "en", hour: 15,
  dailyUnique: true, newVisitor: false, newPage: true, newSession: true, hourUnique: true,
});

eq(day.v, 2, "uniques");
eq(day.pv, 3, "views");
eq(day.ses, 2, "sessions");
eq(day.bnc, 1, "bounces");
eq(day.dur, 15, "duration");
eq(day.nv, 1, "new");
eq(day.ret, 1, "returning");
eq(day.intent, 1, "intent");
eq(day.click, 1, "funnel click");
eq(day.e.wa, 1, "wa");
eq(day.e.wa_float, 1, "wa float");
eq(day.ep["wa|/services/coffee"], 1, "wa page");
eq(day.es["wa|google"], 1, "wa source");
eq(day.ec["wa|SA|Riyadh"], 1, "wa city");
eq(day.xp["/"], 0, "home not exit");
eq(day.xp["/services/coffee"], 1, "service exit");
eq(day.lp["/"], 1, "home landing");
eq(day.mp["/services/coffee"], 1, "measured");
eq(day.pt["/services/coffee"], 15, "time on page");
eq(day.h["10"].pv, 2, "hour views");
eq(day.h["10"].v, 1, "hour uniques");
eq(day.p["/"].pv, 1, "home views");
eq(day.sd["/services/coffee|75"], 1, "scroll 75");

const mobile = viewDay(day, { device: "mobile" });
const desktop = viewDay(day, { device: "desktop" });
const tablet = viewDay(day, { device: "tablet" });
eq(mobile.pv + desktop.pv + tablet.pv, day.pv, "filter pv sums");
eq(mobile.v + desktop.v + tablet.v, day.v, "filter v sums");
eq(mobile.ses + desktop.ses + tablet.ses, day.ses, "filter ses sums");
eq(mobile.dur + desktop.dur + tablet.dur, day.dur, "filter dur sums");
eq(mobile.e.wa + (desktop.e.wa || 0) + (tablet.e.wa || 0), day.e.wa, "filter wa sums");
eq(mobile.intent, 1, "intent stays on mobile");
eq(viewDay(day, { city: "SA|Jeddah" }).pv, 1, "jeddah filter");
eq(viewDay(day, { city: "SA|Riyadh", source: "google" }).pv, 2, "city+source");
eq(viewDay(day, { country: "AE" }).pv, 0, "other country");
eq(viewDay(day).pv, day.pv, "unfiltered clone");
eq(viewDay(day).x, undefined, "slices stripped");

const legacyRaw = { d: "2026-11-06", v: 5, pv: 9, c: { SA: { v: 5, pv: 9 } }, p: { "/": { v: 5, pv: 9 } }, s: { direct: { v: 4, pv: 9 } }, e: { wa: 2 }, es: { "wa|direct": 2 } };
const legacy = normalizeDay(legacyRaw);
eq(legacy.v, 5, "legacy v");
eq(legacy.ses, 0, "legacy sessions absent");
eq(legacy.e.wa, 2, "legacy wa");
eq(legacyPageviews(legacy), 9, "legacy pv marker");
eq(viewDay(legacy, { device: "mobile" }).pv, 0, "legacy ignored by device filter");
eq(viewDay(legacy).v, 5, "legacy kept unfiltered");
const merged = mergeAgg(normalizeDay(legacyRaw), day);
eq(merged.v, 7, "legacy+new visitors");
eq(merged.pv, 12, "legacy+new views");
eq(legacyPageviews(merged), 9, "legacy remainder");
eq(legacyRaw.v, 5, "source object not mutated");

const m = metrics(totalsOf([day]));
eq(m.conv, 1, "conv");
eq(m.bounce, 0.5, "bounce rate");
eq(m.avgDur, 7.5, "avg duration");
eq(m.pps, 1.5, "pages per session");
eq(m.cr, 0.5, "cr");
eq(m.crBase, "ses", "cr base");
eq(m.unknown, 0, "unknown visitors");
eq(metrics(totalsOf([legacy])).crBase, "v", "legacy cr uses visitors");

console.log("analytics checks ok");
