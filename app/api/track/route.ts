import { NextResponse, after } from "next/server";
import { COOKIE, verifyToken } from "../../../lib/auth";
import {
  ingest, flushSoon, dayKey, hourKey, classify, parseUA, BOT_RE, screenBucket, langTag,
  presenceId, newVisitorId, touchPresence,
} from "../../../lib/analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const clean = (s: unknown, n = 60) => String(s || "").toLowerCase().replace(/[|\r\n\u0000-\u001f]/g, " ").trim().slice(0, n);
const hostOf = (u: unknown) => { try { return new URL(String(u)).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const readCookie = (header: string, name: string) => {
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(header);
  if (!m) return "";
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
};
const dec = (s: string | null) => { if (!s) return ""; try { return decodeURIComponent(s); } catch { return s; } };
const pathOf = (s: unknown) => {
  let path = String(s || "/").split("?")[0].split("#")[0].replace(/[|\u0000-\u001f]/g, "").slice(0, 120) || "/";
  if (!path.startsWith("/")) path = "/";
  return path;
};

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  const res = new NextResponse(null, { status: 204 });
  const purpose = req.headers.get("purpose") || req.headers.get("sec-purpose") || "";
  if (!ua || BOT_RE.test(ua) || req.headers.get("next-router-prefetch") || /prefetch/i.test(purpose)) return res;

  const cookie = req.headers.get("cookie") || "";
  if (verifyToken(readCookie(cookie, COOKIE))) return res;

  const text = await req.text().catch(() => "");
  if (!text || text.length > 8000) return res;
  let body: Record<string, unknown>;
  try { body = JSON.parse(text); } catch { return res; }
  if (!body || typeof body !== "object") return res;

  const path = pathOf(body.path);
  if (path.startsWith("/admin552255") || path.startsWith("/api") || path.startsWith("/_next")) return res;

  const event = body.ev === "wa" || body.event === "wa" ? "wa" : body.ev === "call" || body.event === "call" ? "call" : "";
  const kind = event ? "cv" : body.hb ? "hb" : "pv";

  const self = hostOf(req.headers.get("x-forwarded-host") || req.headers.get("host") || req.url);
  let ref = hostOf(body.ref);
  if (ref === self || ref === "alrowadevent.com" || (ref.endsWith(".vercel.app") && ref.startsWith("alrowad"))) ref = "";
  const us = clean(body.us, 40), um = clean(body.um, 40), uc = clean(body.uc, 60);
  const src = classify(ref, us, um).src;
  const camp = us || uc ? `${us || "-"}|${um || "-"}|${uc || "-"}` : "";

  const country = (req.headers.get("x-vercel-ip-country") || "XX").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) || "XX";
  const region = dec(req.headers.get("x-vercel-ip-country-region")).replace(/[|\u0000-\u001f]/g, " ").trim().slice(0, 40) || "?";
  const city = dec(req.headers.get("x-vercel-ip-city")).replace(/[|\u0000-\u001f]/g, " ").trim().slice(0, 60) || "?";
  const tech = parseUA(ua);
  const screen = screenBucket(Number(body.sw) || 0);
  const lang = langTag(String(body.lg || req.headers.get("accept-language") || ""));

  const now = new Date();
  const today = dayKey(now);
  const hour = hourKey(now);
  const vid = readCookie(cookie, "rv_id");
  const dayRaw = readCookie(cookie, "rv_day");
  const dayMatch = /^(\d{4}-\d{2}-\d{2})(?::([0-9a-f]+))?$/i.exec(dayRaw);
  const dayPart = dayMatch?.[1] || "";
  const mask = (parseInt(dayMatch?.[2] || "0", 16) || 0) & 0xffffff;
  const dailyUnique = dayPart !== today;
  const hourUnique = dailyUnique || ((mask >> hour) & 1) === 0;
  const newVisitor = !vid && !dayPart;

  let presenceVid = vid;
  const secure = process.env.NODE_ENV === "production";
  const base = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
  if (kind === "pv") {
    if (!presenceVid) {
      presenceVid = newVisitorId();
      res.cookies.set("rv_id", presenceVid, { ...base, maxAge: 60 * 60 * 24 * 400 });
    }
    if (dailyUnique || hourUnique) {
      const next = (dailyUnique ? 0 : mask) | (1 << hour);
      res.cookies.set("rv_day", `${today}:${(next & 0xffffff).toString(16)}`, { ...base, maxAge: 60 * 60 * 26 });
    }
  }

  ingest({
    kind, path, country, region, city, src, ref, camp,
    device: tech.device, os: tech.os, browser: tech.browser, screen, lang, hour,
    dailyUnique: kind === "pv" && dailyUnique,
    newVisitor: kind === "pv" && newVisitor,
    newPage: kind === "pv" && !!body.np,
    newSession: kind === "pv" && !!(body.ns || body.land),
    unbounce: kind === "pv" && !!body.ub,
    hourUnique: kind === "pv" && hourUnique,
    dur: kind === "hb" ? Number(body.dur) || 0 : 0,
    scroll: kind === "cv" || !Array.isArray(body.sd) ? [] : body.sd as number[],
    prevExit: kind === "pv" ? String(body.px || "") : "",
    event: event || undefined,
    float: !!body.float,
    intent: kind === "pv" && !!body.it,
    funnelClick: kind === "cv" && !!body.ck,
  }, now);

  const liveVid = presenceVid;
  if (liveVid) {
    after(async () => {
      await touchPresence(presenceId(liveVid, today), { path, country, region, city, device: tech.device, src, t: now.getTime() }).catch((e) => console.error("presence", e));
      await flushSoon();
    });
  } else {
    after(() => flushSoon());
  }
  return res;
}
