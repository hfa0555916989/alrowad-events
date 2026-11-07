import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContent } from "../../../lib/store";
import { pageMeta, crumbsLd, ld, abs } from "../../../lib/seo";
import { siteUrl, intl } from "../../../lib/url";
import Shell, { PageHero, PhotoFrame, Head, links } from "../../../components/Shell";
import ServiceCards from "../../../components/ServiceCards";
import { WhatsAppIcon } from "../../../components/Brand";
import { CheckCircle2, Phone, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const c = await getContent();
  const x = c.cityPages.find((y) => y.slug === slug);
  if (!x) return { title: "الصفحة غير موجودة", robots: { index: false } };
  return pageMeta(c, { path: `/cities/${x.slug}`, title: x.seoTitle || `${x.title} | ${c.hero.badge}`, desc: x.seoDesc || x.intro, image: x.ogImage || x.image });
}

export default async function CityPage({ params }: P) {
  const { slug } = await params;
  const c = await getContent();
  const x = c.cityPages.find((y) => y.slug === slug);
  if (!x) notFound();
  const { wa, tel } = links(c);
  const points = (x.points || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const areas = (x.areas || "").split(/[,،]/).map((s) => s.trim()).filter(Boolean);
  const crumbs: [string, string][] = [["الرئيسية", "/"], [c.titles.cities || "نخدمكم في", "/cities"], [x.title, `/cities/${x.slug}`]];
  const url = `${siteUrl()}/cities/${x.slug}`;
  const localLd = {
    "@context": "https://schema.org", "@type": "LocalBusiness", "@id": url + "#business", name: `${c.hero.badge} — ${x.title}`, url,
    description: x.seoDesc || x.intro, image: abs(x.image || c.seo.ogImage || "/og.png"), logo: siteUrl() + "/logo.png", telephone: "+" + intl(c.contact.phone), priceRange: "$$",
    address: { "@type": "PostalAddress", addressCountry: "SA", addressLocality: x.name },
    areaServed: [{ "@type": "City", name: x.name }, ...areas.map((a) => ({ "@type": "Place", name: `${a} — ${x.name}` }))],
    parentOrganization: { "@id": siteUrl() + "/#org" },
    makesOffer: c.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: `${s.title} في ${x.name}`, url: `${siteUrl()}/services/${s.slug}` } })),
  };
  return (
    <Shell c={c}>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(crumbsLd(crumbs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(localLd)} />
      <PageHero title={x.title} subtitle={x.intro} image={x.image || c.hero.image} crumbs={crumbs} />
      <section className="py-20 md:py-28 px-4 pattern-soft">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-14 items-start">
          <div className="lg:col-span-3 reveal">
            <h2 className="text-3xl md:text-4xl font-bold gold-grad mb-6">ضيافة الرواد في {x.name}</h2>
            <div className="prose-ar text-lg leading-9 opacity-90">{x.body.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>
            {points.length > 0 && <ul className="grid sm:grid-cols-2 gap-4 mt-8">{points.map((p, i) => <li key={i} className="flex items-start gap-3"><CheckCircle2 className="gold shrink-0 mt-1" size={20} /><span>{p}</span></li>)}</ul>}
            <div className="flex flex-wrap gap-3 mt-10">
              <a href={wa} target="_blank" rel="noopener" className="btn"><WhatsAppIcon size={20} color="#111" />احجز {x.title}</a>
              <a href={tel} className="btn-ghost"><Phone size={18} /><span dir="ltr">{c.contact.phone}</span></a>
            </div>
          </div>
          <div className="lg:col-span-2 reveal">
            <PhotoFrame src={x.image || c.hero.image} alt={`${x.title} — ${c.hero.badge}`} sizes="(min-width:1024px) 35vw, 100vw" />
            {areas.length > 0 && (
              <div className="card cut p-6 mt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MapPin className="gold" size={20} />أحياء ومناطق نخدمها في {x.name}</h3>
                <div className="flex flex-wrap gap-2">{areas.map((a) => <span key={a} className="px-3 py-1.5 rounded-full text-sm border" style={{ borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}>{a}</span>)}</div>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="py-20 md:py-28 px-4" style={{ background: "var(--surface)" }}>
        <div className="max-w-7xl mx-auto"><Head title={`خدماتنا في ${x.name}`} /><ServiceCards items={c.services} /></div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">مدن أخرى نخدمها</h2>
          <div className="flex flex-wrap justify-center gap-3">{c.cityPages.filter((y) => y.slug !== x.slug).map((y) => <a key={y.slug} href={`/cities/${y.slug}`} className="btn-ghost !py-2.5 !px-5"><MapPin size={16} className="gold" />{y.title}</a>)}</div>
        </div>
      </section>
    </Shell>
  );
}
