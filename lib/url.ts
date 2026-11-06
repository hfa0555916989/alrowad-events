export function siteUrl() {
  const u = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return u.replace(/\/$/, "");
}
export const digits = (p: string) => p.replace(/\D/g, "");
export const intl = (p: string) => { const d = digits(p); return d.startsWith("0") ? "966" + d.slice(1) : d; };
