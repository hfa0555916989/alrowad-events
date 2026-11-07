import { NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/auth";
import { loadRange, deleteRange } from "../../../../lib/analytics";
import { daysInclusive, facetsFrom, hasFilter, legacyPageviews, prevPeriod, viewDay, type Filter } from "../../../../lib/analytics-model";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const ok = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const clip = (s: string | null, n: number) => (s || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const u = new URL(req.url);
  let from = u.searchParams.get("from");
  let to = u.searchParams.get("to");
  if (!ok(from) || !ok(to)) return NextResponse.json({ error: "bad range" }, { status: 400 });
  if (from > to) [from, to] = [to, from];
  if (daysInclusive(from, to) > 370) return NextResponse.json({ error: "range too long" }, { status: 400 });

  const country = clip(u.searchParams.get("cc"), 2).toUpperCase();
  const city = clip(u.searchParams.get("city"), 80);
  const source = clip(u.searchParams.get("src"), 40);
  const device = clip(u.searchParams.get("dv"), 16);
  const filter: Filter = {
    country: /^[A-Z]{2}$/.test(country) ? country : "",
    city,
    source,
    device: device === "mobile" || device === "tablet" || device === "desktop" ? device : "",
  };
  const [prevFrom, prevTo] = prevPeriod(from, to);
  const all = await loadRange(prevFrom, to);
  const rawDays = all.filter((d) => d.d >= from && d.d <= to);
  const rawPrev = all.filter((d) => d.d >= prevFrom && d.d <= prevTo);
  const legacyPv = rawDays.reduce((a, d) => a + legacyPageviews(d), 0);
  const body = {
    days: rawDays.map((d) => viewDay(d, filter)),
    prev: rawPrev.map((d) => viewDay(d, filter)),
    facets: facetsFrom(rawDays),
    legacyPv,
    from, to, prevFrom, prevTo,
    filtered: hasFilter(filter),
    blob: !!process.env.BLOB_READ_WRITE_TOKEN,
  };
  return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const u = new URL(req.url);
  const from = u.searchParams.get("from"), to = u.searchParams.get("to");
  if (!ok(from) || !ok(to)) return NextResponse.json({ error: "bad range" }, { status: 400 });
  return NextResponse.json({ deleted: await deleteRange(from, to) });
}
