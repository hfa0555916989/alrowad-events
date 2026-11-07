import { NextResponse } from "next/server";
import { checkPassword, createToken, COOKIE } from "../../../../lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!(await checkPassword(String(password || "")))) return NextResponse.json({ ok: false, error: "كلمة المرور غير صحيحة" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE, createToken(), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  res.cookies.set("rv_off", "1", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
