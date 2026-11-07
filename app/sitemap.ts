import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/url";
import { getContent } from "../lib/store";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  const u = siteUrl(), now = new Date();
  return [
    { url: u + "/", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: u + "/about", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: u + "/services", lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...c.services.map((s) => ({ url: `${u}/services/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: u + "/cities", lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...c.cityPages.map((x) => ({ url: `${u}/cities/${x.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: u + "/contact", lastModified: now, changeFrequency: "yearly", priority: 0.7 },
  ];
}
