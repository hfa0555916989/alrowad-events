import type { Metadata } from "next";
import "./globals.css";
import { getContent } from "../lib/store";
import { siteUrl } from "../lib/url";

import Tracker from "../components/Tracker";
import { fontVar, fontsHref } from "../lib/fonts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const og = c.seo.ogImage || "/og.png";
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: c.seo.title, template: `%s | ${c.hero.badge}` },
    description: c.seo.description,
    keywords: c.seo.keywords.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
    icons: c.identity.favicon ? { icon: c.identity.favicon } : { icon: [{ url: "/mark.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32" }], apple: "/apple-touch-icon.png" },
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
    "--body": fontVar(i.font), "--heading": fontVar(i.headingFont || i.font),
  } as React.CSSProperties;
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontsHref(i.font, i.headingFont || i.font)} />
      </head>
      <body style={style}>{children}<Tracker /></body>
    </html>
  );
}
