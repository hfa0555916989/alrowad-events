import type { Metadata } from "next";
import type { Content } from "./types";
import { siteUrl, intl } from "./url";

export const abs = (u: string) => (u && u.startsWith("/") ? siteUrl() + u : u);
export function pageMeta(c: Content, o: { path: string; title: string; desc: string; image?: string }): Metadata {
  const img = o.image || c.seo.ogImage || "/og.png";
  return {
    title: { absolute: o.title }, description: o.desc,
    alternates: { canonical: o.path },
    openGraph: { title: o.title, description: o.desc, url: o.path, locale: "ar_SA", type: "website", siteName: c.hero.badge, images: [{ url: img, alt: o.title }] },
    twitter: { card: "summary_large_image", title: o.title, description: o.desc, images: [img] },
  };
}
export function orgLd(c: Content) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org", "@type": ["Organization", "LocalBusiness"], "@id": url + "/#org",
    name: c.hero.badge, alternateName: "Alrowad Events & Hospitality", description: c.seo.description, url,
    logo: url + "/logo.png", image: abs(c.seo.ogImage || "/og.png"), telephone: "+" + intl(c.contact.phone),
    email: c.contact.email || undefined,
    address: { "@type": "PostalAddress", addressCountry: "SA", addressLocality: c.contact.address },
    areaServed: [...c.cityPages.map((x) => ({ "@type": "City", name: x.name })), { "@type": "AdministrativeArea", name: "المنطقة الشرقية" }],
    priceRange: "$$",
    contactPoint: [{ "@type": "ContactPoint", telephone: "+" + intl(c.contact.phone), contactType: "customer service", areaServed: "SA", availableLanguage: ["ar"] }],
    hasMap: undefined,
    makesOffer: c.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.title, url: `${url}/services/${s.slug}` } })),
    sameAs: Object.values(c.social).filter(Boolean),
  };
}
export function crumbsLd(items: [string, string][]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: siteUrl() + path })) };
}
export const ld = (o: object) => ({ __html: JSON.stringify(o).replace(/</g, "\\u003c") });
