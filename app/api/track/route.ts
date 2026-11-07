import { NextResponse, after } from "next/server";
import { record, recordEvent, flushSoon, dayKey, classify, BOT_RE } from "../../../lib/analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const dec = (s: string | null) => { if (!s) return ""; try { return decodeURIComponent(s); } catch { return s; } };
const clean = (s: unknown, n = 60) => String(s || "").toLowerCase().replace(/[|\r\n]/g, " ").trim().slice(0, n);
const host = (u: unknown) => { try { return new URL(String(u)).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  const res = new NextResponse(null, { status: 204 });
  if (!ua || BOT_RE.test(ua)) return res;
  const body = await req.json().catch(() => ({}));
  let path = String(body?.path || "/").split("?")[0].split("#")[0].slice(0, 120) || "/";
  if (!path.startsWith("/")) path = "/";
  if (path.startsWith("/admin552255") || path.startsWith("/api")) return res;

  // traffic source (computed once per browser session by the client, sent with every hit)
  const self = host(req.url);
  let ref = host(body?.ref);
  if (ref === self || ref === "alrowadevent.com" || ref.endsWith(".vercel.app") && ref.startsWith("alrowad")) ref = "";
  const us = clean(body?.us, 40), um = clean(body?.um, 40), uc = clean(body?.uc, 60);
  const src = classify(ref, us, um);
  const camp = us || uc ? `${us || "-"}|${um || "-"}|${uc || "-"}` : "";

  if (body?.event === "wa" || body?.event === "call") {
    recordEvent(body.event, src, !!body?.float);
    after(() => flushSoon());
    return res;
  }
  const country = (req.headers.get("x-vercel-ip-country") || "XX").toUpperCase().slice(0, 2);
  const region = dec(req.headers.get("x-vercel-ip-country-region")).slice(0, 40) || "?";
  const city = dec(req.headers.get("x-vercel-ip-city")).slice(0, 60) || "?";
  // unique visitor = first page view of the day for this browser (anonymous day-stamp cookie, no ID)
  const today = dayKey();
  const cookie = req.headers.get("cookie") || "";
  const seen = /(?:^|;\s*)rv_day=([0-9-]+)/.exec(cookie)?.[1];
  const newVisitor = seen !== today;
  record({ path, country, region, city, newVisitor, newPage: newVisitor || !!body?.np, landing: !!body?.land, src, ref, camp });
  after(() => flushSoon());
  if (newVisitor) res.cookies.set("rv_day", today, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 26 });
  return res;
}
