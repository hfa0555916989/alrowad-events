import { NextResponse } from "next/server";
import { COOKIE } from "../../../../lib/auth";
export async function POST() {
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0, secure, sameSite: "lax" });
  res.cookies.set("rv_off", "", { path: "/", maxAge: 0, secure, sameSite: "lax" });
  return res;
}
