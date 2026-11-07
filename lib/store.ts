import { list, put, del } from "@vercel/blob";
import { defaults, CONTENT_VERSION } from "./defaults";
import type { Content } from "./types";

const PREFIX = "content/settings";

function merge<T>(base: T, over: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(over) ? over : base) as T;
  if (base && typeof base === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    if (over && typeof over === "object" && !Array.isArray(over)) {
      for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
        out[k] = k in out ? merge(out[k], v) : v;
      }
    }
    return out as T;
  }
  return (over === undefined || over === null ? base : over) as T;
}

export const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export async function getContent(): Promise<Content> {
  if (!hasBlob()) return defaults;
  try {
    const { blobs } = await list({ prefix: PREFIX });
    if (!blobs.length) return defaults;
    blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return defaults;
    const stored = (await res.json()) as Record<string, unknown>;
    return normalize(stored);
  } catch (e) {
    console.error("getContent failed", e);
    return defaults;
  }
}

/** Older saved content (before v3) has services without slugs/SEO fields; enrich them from defaults, keep the owner's edits. */
function normalize(stored: Record<string, unknown>): Content {
  if (Number(stored?.version || 0) < CONTENT_VERSION) {
    const seo = stored.seo as Record<string, unknown> | undefined;
    if (seo && seo.ogImage === "/images/hero.webp") delete seo.ogImage;
    const id = stored.identity as Record<string, unknown> | undefined;
    if (id && !id.logo && id.logoSizeDesktop === 64) delete id.logoSizeDesktop;
    if (id && !id.logo && id.logoSizeMobile === 44) delete id.logoSizeMobile;
  }
  const c = merge(defaults, stored);
  const blank = { slug: "", title: "", desc: "", image: "", seoTitle: "", seoDesc: "", ogImage: "", points: "", images: [] as string[], highlight: "" };
  const used = new Set<string>();
  c.services = (c.services as Partial<Content["services"][number]>[]).map((s, i) => {
    const def = defaults.services.find((d) => d.slug === s.slug || d.title === s.title) || (!s.slug ? defaults.services[i] : undefined);
    const out = { ...blank, ...(def && !s.slug ? def : {}), ...s } as Content["services"][number];
    for (const k of ["points", "seoTitle", "seoDesc"] as const) if (!out[k] && def) out[k] = def[k];
    if (!out.images?.length && def) out.images = def.images;
    let slug = out.slug || def?.slug || `service-${i + 1}`;
    while (used.has(slug)) slug += "-2";
    used.add(slug); out.slug = slug;
    return out;
  });
  const cb = { slug: "", name: "", title: "", intro: "", body: "", points: "", image: "", areas: "", seoTitle: "", seoDesc: "", ogImage: "" };
  c.cityPages = (c.cityPages || []).map((x, i) => ({ ...cb, ...x, slug: x.slug || `city-${i + 1}` }));
  return c;
}

export async function saveContent(c: Content) {
  if (!hasBlob()) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  // unique file per save => never served stale from CDN; old versions cleaned up
  const saved = await put(`${PREFIX}.json`, JSON.stringify({ ...c, version: CONTENT_VERSION }), {
    access: "public", addRandomSuffix: true, contentType: "application/json",
  });
  const { blobs } = await list({ prefix: PREFIX });
  const old = blobs.filter((b) => b.url !== saved.url).sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(2);
  if (old.length) await del(old.map((b) => b.url));
  return saved.url;
}

/* ---------- private admin settings (password hash) ---------- */
const AUTH_PREFIX = "private/auth";
export type AuthSettings = { passwordHash?: string; updatedAt?: string };
export async function getAuthSettings(): Promise<AuthSettings> {
  if (!hasBlob()) return {};
  const { blobs } = await list({ prefix: AUTH_PREFIX });
  if (!blobs.length) return {};
  blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
  const res = await fetch(blobs[0].url, { cache: "no-store" });
  if (!res.ok) throw new Error("auth settings read failed");
  return (await res.json()) as AuthSettings;
}
export async function saveAuthSettings(a: AuthSettings) {
  if (!hasBlob()) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  const saved = await put(`${AUTH_PREFIX}.json`, JSON.stringify(a), { access: "public", addRandomSuffix: true, contentType: "application/json" });
  const { blobs } = await list({ prefix: AUTH_PREFIX });
  const old = blobs.filter((b) => b.url !== saved.url);
  if (old.length) await del(old.map((b) => b.url));
}
