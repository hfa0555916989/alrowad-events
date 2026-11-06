import type { Metadata } from "next";
import { Tajawal, Cairo } from "next/font/google";
import "./globals.css";
import { getContent } from "../lib/store";
import { siteUrl } from "../lib/url";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "800"], variable: "--f-tajawal" });
const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "600", "700", "800"], variable: "--f-cairo" });

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const og = c.seo.ogImage || c.identity.logo || undefined;
  return {
    metadataBase: new URL(siteUrl()),
    title: c.seo.title,
    description: c.seo.description,
    keywords: c.seo.keywords.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
    alternates: { canonical: "/" },
    icons: c.identity.favicon ? { icon: c.identity.favicon } : undefined,
    openGraph: { title: c.seo.title, description: c.seo.description, locale: "ar_SA", type: "website", url: "/", siteName: c.seo.title, images: og ? [og] : undefined },
    twitter: { card: "summary_large_image", title: c.seo.title, description: c.seo.description, images: og ? [og] : undefined },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await getContent();
  const i = c.identity;
  const style = {
    "--primary": i.primary, "--secondary": i.secondary, "--bg": i.background, "--surface": i.surface, "--text": i.text,
    "--logo-d": `${i.logoSizeDesktop}px`, "--logo-m": `${i.logoSizeMobile}px`,
    fontFamily: i.font === "cairo" ? "var(--f-cairo)" : "var(--f-tajawal)",
  } as React.CSSProperties;
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${cairo.variable}`}>
      <body style={style}>{children}</body>
    </html>
  );
}
