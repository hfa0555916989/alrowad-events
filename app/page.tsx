import { getContent } from "../lib/store";
import { intl, siteUrl } from "../lib/url";
import type { Item } from "../lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Section({ id, title, children, alt }: { id: string; title: string; children: React.ReactNode; alt?: boolean }) {
  return (
    <section id={id} className="py-16 md:py-24 px-4" style={alt ? { background: "var(--surface)" } : undefined}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3 gold">{title}</h2>
        <div className="w-20 h-1 mx-auto mb-10 rounded" style={{ background: "var(--primary)" }} />
        {children}
      </div>
    </section>
  );
}
function Cards({ items, icon }: { items: Item[]; icon: string }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s, i) => (
        <div key={i} className="card p-6 hover:-translate-y-1 transition">
          {s.image ? <img src={s.image} alt={s.title} className="w-full h-48 object-cover rounded-lg mb-4" /> : <div className="text-3xl mb-3">{icon}</div>}
          <h3 className="text-xl font-bold mb-2 gold">{s.title}</h3>
          <p className="opacity-85 leading-8">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const c = await getContent();
  const t = c.titles, S = c.sections;
  const wa = `https://wa.me/${intl(c.contact.whatsapp || c.contact.phone)}`;
  const tel = `tel:+${intl(c.contact.phone)}`;
  const nav = [["about", t.about], ["services", t.services], ["cities", t.cities], ["projects", t.projects], ["gallery", t.gallery], ["videos", t.videos], ["contact", t.contact]].filter(([k]) => S[k] !== false);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: c.seo.title, description: c.seo.description,
    url: siteUrl(), telephone: "+" + intl(c.contact.phone), image: c.seo.ogImage || c.identity.logo || undefined,
    address: { "@type": "PostalAddress", addressCountry: "SA", addressLocality: c.contact.address },
    areaServed: c.cities.map((x) => x.title),
    sameAs: Object.values(c.social).filter(Boolean),
  };
  const socials = Object.entries(c.social).filter(([, v]) => v);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-40 backdrop-blur border-b" style={{ background: "color-mix(in srgb, var(--bg) 85%, transparent)", borderColor: "color-mix(in srgb, var(--primary) 25%, transparent)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3">
            {c.identity.logo ? <img src={c.identity.logo} alt={c.seo.title} className="logo" /> : <span className="logo flex items-center text-lg md:text-2xl font-extrabold gold">{c.hero.badge}</span>}
          </a>
          <nav className="hidden md:flex gap-5 text-sm font-medium">
            {nav.map(([k, v]) => <a key={k} href={`#${k}`} className="hover:opacity-70">{v}</a>)}
          </nav>
          <a href={tel} className="btn !py-2 !px-4 text-sm">{t.callNow || "اتصل الآن"}</a>
        </div>
      </header>

      <section className="relative min-h-[85vh] flex items-center justify-center text-center px-4 overflow-hidden">
        {c.hero.image && <img src={c.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at top, color-mix(in srgb, var(--primary) 25%, transparent), transparent 60%)" }} />
        <div className="relative max-w-3xl">
          <p className="inline-block mb-5 px-4 py-1 rounded-full border text-sm gold" style={{ borderColor: "var(--primary)" }}>{c.hero.badge}</p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">{c.hero.title}</h1>
          <p className="text-lg md:text-xl opacity-90 leading-9 mb-8">{c.hero.subtitle}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href={wa} className="btn">{c.hero.cta}</a>
            <a href="#services" className="rounded-full px-7 py-3 border font-bold" style={{ borderColor: "var(--primary)" }}>{t.services}</a>
          </div>
        </div>
      </section>

      {S.about !== false && c.about.text && <Section id="about" title={t.about} alt><p className="max-w-3xl mx-auto text-center text-lg leading-9 opacity-90 whitespace-pre-line">{c.about.text}</p></Section>}
      {S.services !== false && <Section id="services" title={t.services}><Cards items={c.services} icon="☕" /></Section>}
      {S.cities !== false && c.cities.length > 0 && (
        <Section id="cities" title={t.cities} alt>
          <div className="flex flex-wrap justify-center gap-4">
            {c.cities.map((x, i) => <div key={i} className="card px-6 py-4 text-center min-w-36"><div className="text-xl font-bold gold">📍 {x.title}</div>{x.desc && <div className="text-sm opacity-80 mt-1">{x.desc}</div>}</div>)}
          </div>
        </Section>
      )}
      {S.projects !== false && c.projects.length > 0 && <Section id="projects" title={t.projects} alt><Cards items={c.projects} icon="🏗️" /></Section>}
      {S.why !== false && <Section id="why" title={t.why}><Cards items={c.why} icon="⭐" /></Section>}
      {S.gallery !== false && (
        <Section id="gallery" title={t.gallery} alt>
          {c.gallery.length ? (
            <div className="columns-2 md:columns-3 gap-4 [&>figure]:mb-4">
              {c.gallery.map((g, i) => (
                <figure key={i} className="break-inside-avoid card overflow-hidden">
                  <img src={g.url} alt={g.caption || c.seo.title} loading="lazy" className="w-full h-auto block" />
                  {g.caption && <figcaption className="p-2 text-sm text-center">{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          ) : <p className="text-center opacity-70">{t.galleryEmpty || "سيتم إضافة الصور قريباً"}</p>}
        </Section>
      )}
      {S.videos !== false && (
        <Section id="videos" title={t.videos}>
          {c.videos.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {c.videos.map((v, i) => (
                <figure key={i} className="card overflow-hidden">
                  <video src={v.url} controls playsInline preload="metadata" className="w-full h-auto max-h-[80vh] bg-black" />
                  {v.caption && <figcaption className="p-3 text-center">{v.caption}</figcaption>}
                </figure>
              ))}
            </div>
          ) : <p className="text-center opacity-70">{t.videosEmpty || "سيتم إضافة الفيديوهات قريباً"}</p>}
        </Section>
      )}
      <Section id="contact" title={t.contact} alt>
        <div className="grid gap-5 md:grid-cols-3 text-center">
          <a href={tel} className="card p-6"><div className="text-3xl mb-2">📞</div><div className="font-bold gold">اتصال</div><div dir="ltr" className="mt-1">{c.contact.phone}</div></a>
          <a href={wa} className="card p-6"><div className="text-3xl mb-2">💬</div><div className="font-bold gold">واتساب</div><div dir="ltr" className="mt-1">{c.contact.whatsapp || c.contact.phone}</div></a>
          <div className="card p-6"><div className="text-3xl mb-2">📍</div><div className="font-bold gold">العنوان</div><div className="mt-1">{c.contact.address}</div>{c.contact.workingHours && <div className="text-sm opacity-80 mt-1">{c.contact.workingHours}</div>}{c.contact.email && <a href={`mailto:${c.contact.email}`} className="block text-sm mt-1">{c.contact.email}</a>}</div>
        </div>
      </Section>
      <footer className="py-8 px-4 text-center text-sm opacity-80 pb-28">
        {socials.length > 0 && <div className="flex justify-center gap-4 mb-3">{socials.map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener" className="gold capitalize">{k}</a>)}</div>}
        <p>{c.footer.text}</p>
      </footer>

      <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-3">
        <a href={wa} aria-label="واتساب" target="_blank" rel="noopener" className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl animate-bounce" style={{ background: "#25D366" }}>
          <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg>
        </a>
        <a href={tel} aria-label="اتصال" className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl" style={{ background: "var(--primary)" }}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="#111"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>
        </a>
      </div>
    </>
  );
}
