import { NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/auth";
import { loadRange, deleteRange } from "../../../../lib/analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const ok = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const u = new URL(req.url);
  const from = u.searchParams.get("from"), to = u.searchParams.get("to");
  if (!ok(from) || !ok(to)) return NextResponse.json({ error: "bad range" }, { status: 400 });
  return NextResponse.json({ days: await loadRange(from!, to!) });
}
export async function DELETE(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const u = new URL(req.url);
  const from = u.searchParams.get("from"), to = u.searchParams.get("to");
  if (!ok(from) || !ok(to)) return NextResponse.json({ error: "bad range" }, { status: 400 });
  return NextResponse.json({ deleted: await deleteRange(from!, to!) });
}
