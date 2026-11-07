import { NextResponse } from "next/server";
import { isAuthed, changePassword } from "../../../../lib/auth";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { current, next, confirm } = await req.json().catch(() => ({}));
  if (!current || !next) return NextResponse.json({ ok: false, error: "أدخل كلمة المرور الحالية والجديدة" }, { status: 400 });
  if (next !== confirm) return NextResponse.json({ ok: false, error: "تأكيد كلمة المرور غير مطابق" }, { status: 400 });
  try {
    const err = await changePassword(String(current), String(next));
    if (err) return NextResponse.json({ ok: false, error: err }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
