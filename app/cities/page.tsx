import type { Metadata } from "next";
import { getContent } from "../../lib/store";
import { pageMeta, crumbsLd, ld } from "../../lib/seo";
import Shell, { PageHero, Img } from "../../components/Shell";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, { path: "/cities", title: `قهوجيين في ${c.cityPages.map((x) => x.name).join(" و")} | ${c.hero.badge}`, desc: `مدن خدمة ${c.hero.badge}: ${c.cityPages.map((x) => x.title).join("، ")}. قهوجيين وصبابين وضيافة مناسبات.` });
}
export default async function CitiesPage() {
  const c = await getContent();
  const crumbs: [string, string][] = [["الرئيسية", "/"], [c.titles.cities || "نخدمكم في", "/cities"]];
  return (
    <Shell c={c}>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(crumbsLd(crumbs))} />
      <PageHero title={c.titles.cities || "نخدمكم في"} subtitle={c.seo.description} image={c.cta.image || c.hero.image} crumbs={crumbs} />
      <section className="py-20 md:py-28 px-4 pattern-soft">
        <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.cityPages.map((x, i) => (
            <a key={x.slug} href={`/cities/${x.slug}`} className="relative overflow-hidden card cut zoom reveal min-h-[20rem] block" style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
              <Img src={x.image || c.hero.image} alt={x.title} sizes="(min-width:1024px) 33vw, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6"><h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{x.title}</h2><p className="text-white/80 leading-7 line-clamp-2">{x.intro}</p><span className="inline-flex items-center gap-1 gold font-semibold mt-3">التفاصيل<ArrowLeft size={16} /></span></div>
            </a>
          ))}
        </div>
      </section>
    </Shell>
  );
}
