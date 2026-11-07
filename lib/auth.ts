import crypto from "crypto";
import { cookies } from "next/headers";
import { getAuthSettings, saveAuthSettings } from "./store";

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

export function hashPassword(p: string) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(p, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${h.toString("hex")}`;
}
function verifyHash(p: string, stored: string) {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, "hex");
  const got = crypto.scryptSync(p, Buffer.from(saltHex, "hex"), want.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(got, want);
}
/** A password changed from the dashboard (scrypt hash in Blob) overrides the ADMIN_PASSWORD env var. */
export async function checkPassword(p: string) {
  if (!p) return false;
  let hash: string | undefined;
  try { hash = (await getAuthSettings()).passwordHash; } catch (e) { console.error("auth settings", e); }
  if (hash) return verifyHash(p, hash);
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  return crypto.timingSafeEqual(Buffer.from(sign(p)), Buffer.from(sign(real)));
}
export async function changePassword(current: string, next: string) {
  if (!(await checkPassword(current))) return "كلمة المرور الحالية غير صحيحة";
  if (next.length < 6) return "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل";
  await saveAuthSettings({ passwordHash: hashPassword(next), updatedAt: new Date().toISOString() });
  return "";
}
