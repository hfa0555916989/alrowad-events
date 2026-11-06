import { list, put, del } from "@vercel/blob";
import { defaults } from "./defaults";
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
    return merge(defaults, await res.json());
  } catch (e) {
    console.error("getContent failed", e);
    return defaults;
  }
}

export async function saveContent(c: Content) {
  if (!hasBlob()) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  // unique file per save => never served stale from CDN; old versions cleaned up
  const saved = await put(`${PREFIX}.json`, JSON.stringify(c), {
    access: "public", addRandomSuffix: true, contentType: "application/json",
  });
  const { blobs } = await list({ prefix: PREFIX });
  const old = blobs.filter((b) => b.url !== saved.url).sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(2);
  if (old.length) await del(old.map((b) => b.url));
  return saved.url;
}
