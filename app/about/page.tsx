import type { Metadata } from "next";
import { getContent } from "../../lib/store";
import { pageMeta, crumbsLd, ld } from "../../lib/seo";
import Shell, { PageHero, PhotoFrame, Head } from "../../components/Shell";
import Counter from "../../components/Counter";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const p = c.pages.about;
  return pageMeta(c, { path: "/about", title: p.seoTitle || `${c.titles.about} | ${c.hero.badge}`, desc: p.seoDesc || c.about.text.slice(0, 160), image: p.ogImage || c.about.image });
}
export default async function AboutPage() {
  const c = await getContent();
  const crumbs: [string, string][] = [["الرئيسية", "/"], [c.titles.about || "من نحن", "/about"]];
  const points = (c.about.points || "").split("\n").map((s) => s.trim()).filter(Boolean);
  return (
    <Shell c={c}>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(crumbsLd(crumbs))} />
      <PageHero title={c.titles.about || "من نحن"} subtitle={c.about.title} image={c.about.image || c.hero.image} crumbs={crumbs} />
      <section className="py-20 md:py-28 px-4 pattern-soft">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="reveal">
            <p className="text-lg md:text-xl leading-10 opacity-90 whitespace-pre-line mb-8">{c.about.text}</p>
            <ul className="grid sm:grid-cols-2 gap-4">{points.map((p, i) => <li key={i} className="flex items-start gap-3"><CheckCircle2 className="gold shrink-0 mt-1" size={20} /><span>{p}</span></li>)}</ul>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full reveal">
            {c.services.slice(0, 4).map((s, i) => <PhotoFrame key={s.slug} src={s.image || ""} alt={s.title} sizes="(min-width:1024px) 22vw, 45vw" className={i % 2 === 0 ? "mt-14" : ""} />)}
          </div>
        </div>
      </section>
      {c.stats.length > 0 && (
        <section className="py-16 px-4" style={{ background: "var(--surface)" }}>
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {c.stats.map((s, i) => <div key={i} className="card cut p-6 text-center"><div className="display text-3xl md:text-5xl font-bold gold-grad"><Counter value={s.title} /></div><div className="mt-2 opacity-75">{s.desc}</div></div>)}
          </div>
        </section>
      )}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <Head title={c.titles.services} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.services.map((s) => <a key={s.slug} href={`/services/${s.slug}`} className="card cut p-6 flex items-center justify-between hover:-translate-y-1 transition"><span className="font-bold text-lg">{s.title}</span><ArrowLeft className="gold" size={18} /></a>)}
          </div>
        </div>
      </section>
    </Shell>
  );
}
