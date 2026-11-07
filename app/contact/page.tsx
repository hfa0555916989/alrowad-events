import type { Metadata } from "next";
import { getContent } from "../../lib/store";
import { pageMeta, crumbsLd, ld } from "../../lib/seo";
import Shell, { PageHero, links } from "../../components/Shell";
import { WhatsAppIcon } from "../../components/Brand";
import { Phone, MapPin, Clock, Mail } from "lucide-react";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const p = c.pages.contact;
  return pageMeta(c, { path: "/contact", title: p.seoTitle || `${c.titles.contact} | ${c.hero.badge}`, desc: p.seoDesc || c.cta.text, image: p.ogImage });
}
export default async function ContactPage() {
  const c = await getContent();
  const { wa, tel } = links(c);
  const crumbs: [string, string][] = [["الرئيسية", "/"], [c.titles.contact || "تواصل معنا", "/contact"]];
  return (
    <Shell c={c}>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(crumbsLd(crumbs))} />
      <PageHero title={c.titles.contact || "تواصل معنا"} subtitle={c.cta.text} image={c.cta.image || c.hero.image} crumbs={crumbs} />
      <section className="py-20 md:py-28 px-4 pattern-soft">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3">
          <a href={tel} className="card cut p-8 text-center reveal hover:-translate-y-1 transition"><div className="icon-chip mx-auto mb-4"><Phone size={24} /></div><div className="font-bold text-lg mb-1">اتصال مباشر</div><div dir="ltr" className="gold text-xl font-bold">{c.contact.phone}</div></a>
          <a href={wa} target="_blank" rel="noopener" className="card cut p-8 text-center reveal hover:-translate-y-1 transition"><div className="mx-auto mb-4 w-[3.25rem] h-[3.25rem] rounded-full grid place-items-center" style={{ background: "#25D366" }}><WhatsAppIcon size={26} /></div><div className="font-bold text-lg mb-1">واتساب</div><div dir="ltr" className="gold text-xl font-bold">{c.contact.whatsapp || c.contact.phone}</div></a>
          <div className="card cut p-8 text-center reveal"><div className="icon-chip mx-auto mb-4"><MapPin size={24} /></div><div className="font-bold text-lg mb-1">العنوان</div><div className="opacity-85">{c.contact.address}</div>{c.contact.workingHours && <div className="text-sm opacity-70 mt-2 flex items-center justify-center gap-1"><Clock size={14} />{c.contact.workingHours}</div>}</div>
          {c.contact.email && <a href={`mailto:${c.contact.email}`} className="card cut p-8 text-center md:col-span-3 reveal"><Mail className="gold mx-auto mb-2" />{c.contact.email}</a>}
        </div>
      </section>
    </Shell>
  );
}
