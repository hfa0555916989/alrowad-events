import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "../../../../lib/auth";
import { getContent, saveContent } from "../../../../lib/store";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getContent());
}
export async function PUT(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    await saveContent(body);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
