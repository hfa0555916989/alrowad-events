import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/url";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }], sitemap: siteUrl() + "/sitemap.xml" };
}
