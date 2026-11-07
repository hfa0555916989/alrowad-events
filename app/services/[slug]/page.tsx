import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContent } from "../../../lib/store";
import { pageMeta, crumbsLd, ld, abs } from "../../../lib/seo";
import { siteUrl } from "../../../lib/url";
import Shell, { PageHero, PhotoFrame, Head, links } from "../../../components/Shell";
import ServiceCards from "../../../components/ServiceCards";
import { WhatsAppIcon } from "../../../components/Brand";
import { CheckCircle2, Phone, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const c = await getContent();
  const s = c.services.find((x) => x.slug === slug);
  if (!s) return { title: "الصفحة غير موجودة", robots: { index: false } };
  return pageMeta(c, { path: `/services/${s.slug}`, title: s.seoTitle || `${s.title} | ${c.hero.badge}`, desc: s.seoDesc || s.desc, image: s.ogImage || s.image });
}

export default async function ServicePage({ params }: P) {
  const { slug } = await params;
  const c = await getContent();
  const s = c.services.find((x) => x.slug === slug);
  if (!s) notFound();
  const { wa, tel } = links(c);
  const points = (s.points || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const imgs = (s.images?.length ? s.images : [s.image || ""]).filter(Boolean);
  const crumbs: [string, string][] = [["الرئيسية", "/"], [c.titles.services || "خدماتنا", "/services"], [s.title, `/services/${s.slug}`]];
  const serviceLd = { "@context": "https://schema.org", "@type": "Service", name: s.title, description: s.seoDesc || s.desc, serviceType: s.title, url: `${siteUrl()}/services/${s.slug}`, image: abs(s.image || ""), areaServed: c.cityPages.map((x) => ({ "@type": "City", name: x.name })), provider: { "@id": siteUrl() + "/#org" } };
  return (
    <Shell c={c}>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(crumbsLd(crumbs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(serviceLd)} />
      <PageHero title={s.title} subtitle={s.desc} image={s.image || imgs[0]} crumbs={crumbs} />
      <section className="py-20 md:py-28 px-4 pattern-soft">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="reveal">
            {s.highlight && <div className="display text-4xl md:text-5xl font-bold gold-grad mb-6">{s.highlight}</div>}
            {points.length > 0 ? (
              <ul className="space-y-5">
                {points.map((p, i) => <li key={i} className="flex items-start gap-4 text-lg md:text-xl leading-9"><CheckCircle2 className="gold shrink-0 mt-1.5" size={24} /><span>{p}</span></li>)}
              </ul>
            ) : <p className="text-lg leading-9 opacity-90">{s.desc}</p>}
            <div className="flex flex-wrap gap-3 mt-10">
              <a href={wa} target="_blank" rel="noopener" className="btn"><WhatsAppIcon size={20} color="#111" />{c.hero.cta}</a>
              <a href={tel} className="btn-ghost"><Phone size={18} /><span dir="ltr">{c.contact.phone}</span></a>
            </div>
          </div>
          <div className={`grid gap-4 max-w-xl mx-auto w-full reveal ${imgs.length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-sm"}`}>
            {imgs.slice(0, 4).map((u, i) => <PhotoFrame key={u + i} src={u} alt={`${s.title} ${i + 1}`} sizes="(min-width:1024px) 22vw, 45vw" className={imgs.length > 1 && i % 2 === 0 ? "mt-14" : ""} />)}
          </div>
        </div>
      </section>
      {c.cityPages.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{s.title} في مدن المملكة</h2>
            <div className="flex flex-wrap justify-center gap-3">{c.cityPages.map((x) => <a key={x.slug} href={`/cities/${x.slug}`} className="btn-ghost !py-2.5 !px-5"><MapPin size={16} className="gold" />{x.title}</a>)}</div>
          </div>
        </section>
      )}
      <section className="py-20 md:py-28 px-4" style={{ background: "var(--surface)" }}>
        <div className="max-w-7xl mx-auto"><Head title="خدمات أخرى" /><ServiceCards items={c.services.filter((x) => x.slug !== s.slug)} /></div>
      </section>
    </Shell>
  );
}
