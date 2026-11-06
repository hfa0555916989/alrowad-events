import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/url";
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl() + "/", lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
