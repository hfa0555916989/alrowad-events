import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "admin_session";
const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "dev-secret";
const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

export function createToken() {
  const exp = String(Date.now() + 1000 * 60 * 60 * 24 * 7);
  return `${exp}.${sign(exp)}`;
}
export function verifyToken(t?: string) {
  if (!t) return false;
  const [exp, sig] = t.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
export async function isAuthed() {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}
export function checkPassword(p: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = Buffer.from(sign(p)), b = Buffer.from(sign(real));
  return crypto.timingSafeEqual(a, b);
}
