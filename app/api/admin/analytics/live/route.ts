import { NextResponse } from "next/server";
import { isAuthed } from "../../../../../lib/auth";
import { loadLive } from "../../../../../lib/analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const visitors = await loadLive();
  return NextResponse.json({ visitors, n: visitors.length }, { headers: { "cache-control": "no-store" } });
}
