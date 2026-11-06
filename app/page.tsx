import Image from "next/image";
import { getContent } from "../lib/store";
import { intl, siteUrl } from "../lib/url";
import { VARIANT } from "../lib/site";
import type { Item } from "../lib/types";
import Reveal from "../components/Reveal";
import Counter from "../components/Counter";
import MobileNav from "../components/MobileNav";
import { WhatsAppIcon, Divider } from "../components/Brand";
import {
  Coffee, Users, PartyPopper, Gem, Sparkles, Pickaxe, Building2, Shovel, Truck, Route, MapPin, Award, Clock, ShieldCheck,
  BadgePercent, Phone, Mail, Quote, Star, CheckCircle2, ArrowLeft, HardHat, Wrench, Globe, AtSign, Camera, Music2, Share2,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SERVICE_ICONS = VARIANT === "golden" ? [Pickaxe, Building2, Shovel, Truck, Route, HardHat, Wrench] : [Coffee, Users, PartyPopper, Gem, Sparkles, Coffee, Users];
const WHY_ICONS = VARIANT === "golden" ? [Award, Truck, ShieldCheck, Clock, HardHat, Wrench] : [Award, Clock, Gem, BadgePercent, ShieldCheck, Sparkles];
const SOCIAL_ICONS: Record<string, typeof Globe> = { instagram: Camera, x: AtSign, snapchat: Share2, tiktok: Music2, facebook: Globe };

function Head({ eyebrow, title, light }: { eyebrow?: string; title: string; light?: boolean }) {
  return (
    <div className="text-center mb-12 md:mb-16 reveal">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className={`text-3xl md:text-5xl font-bold mt-3 leading-tight ${light ? "" : "gold-grad"}`}>{title}</h2>
      <Divider variant={VARIANT} />
    </div>
  );
}
function Img({ src, alt, className, sizes, priority }: { src: string; alt: string; className?: string; sizes: string; priority?: boolean }) {
  if (!src) return null;
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className ?? "object-cover"} />;
}
function PhotoCards({ items, icons, sizes }: { items: Item[]; icons: typeof SERVICE_ICONS; sizes: string }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s, i) => {
        const Icon = icons[i % icons.length];
        return (
          <article key={i} className="card cut overflow-hidden group zoom reveal" style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
            {s.image && <div className="relative aspect-[4/3] overflow-hidden"><Img src={s.image} alt={s.title} sizes={sizes} /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" /></div>}
            <div className="p-6 relative">
              <div className={`icon-chip ${s.image ? "-mt-12 relative shadow-xl" : "mb-4"}`} style={s.image ? { background: "var(--surface)" } : undefined}><Icon size={24} strokeWidth={1.6} /></div>
              <h3 className="text-xl md:text-2xl font-bold mt-4 mb-2">{s.title}</h3>
              <p className="opacity-75 leading-8">{s.desc}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default async function Home() {
  const c = await getContent();
  const t = c.titles, S = c.sections, G = VARIANT === "golden";
  const wa = `https://wa.me/${intl(c.contact.whatsapp || c.contact.phone)}`;
  const tel = `tel:+${intl(c.contact.phone)}`;
  const on = (k: string) => S[k] !== false;
  const nav: [string, string][] = ([["about", t.about], ["services", t.services], ["cities", t.cities], ["projects", t.projects], ["gallery", t.gallery], ["videos", t.videos], ["contact", t.contact]] as [string, string][])
    .filter(([k]) => on(k) && (k !== "cities" || c.cities.length) && (k !== "projects" || c.projects.length) && (k !== "gallery" || c.gallery.length) && (k !== "videos" || c.videos.length));
  const abs = (u: string) => (u && u.startsWith("/") ? siteUrl() + u : u);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: c.hero.badge || c.seo.title, description: c.seo.description,
    url: siteUrl(), telephone: "+" + intl(c.contact.phone), image: abs(c.seo.ogImage || c.identity.logo || c.hero.image) || undefined,
    address: { "@type": "PostalAddress", addressCountry: "SA", addressLocality: c.contact.address },
    areaServed: c.cities.flatMap((x) => [x.title, ...(x.desc.includes("–") ? x.desc.split("–").map((s) => s.trim()) : [])]).filter(Boolean).map((name) => ({ "@type": "City", name })),
    sameAs: Object.values(c.social).filter(Boolean),
  };
  const socials = Object.entries(c.social).filter(([, v]) => v);
  const points = (c.about.points || "").split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className={G ? "v-golden" : "v-alrowad"}>
      <Reveal />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl border-b" style={{ background: "color-mix(in srgb, var(--bg) 78%, transparent)", borderColor: "color-mix(in srgb, var(--primary) 18%, transparent)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[72px] md:h-[84px] flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3 min-w-0">
            {c.identity.logo ? <img src={c.identity.logo} alt={c.hero.badge} className="logo" /> : (
              <span className="flex items-center gap-2.5">
                <span className="icon-chip !w-10 !h-10 md:!w-12 md:!h-12">{G ? <Pickaxe size={22} /> : <Coffee size={22} />}</span>
                <span className="display font-bold text-base md:text-xl leading-tight gold-grad">{c.hero.badge}</span>
              </span>
            )}
          </a>
          <nav className="hidden lg:flex items-center gap-7 text-[15px] font-medium">
            {nav.map(([k, v]) => <a key={k} href={`#${k}`} className="opacity-85 hover:opacity-100 hover:text-[var(--primary)] transition">{v}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href={tel} className="btn !py-2.5 !px-5 text-sm hidden md:inline-flex whitespace-nowrap"><Phone size={16} />{t.callNow || "اتصل الآن"}</a>
            <MobileNav links={nav} tel={tel} callLabel={t.callNow || "اتصل الآن"} />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden">
        <Img src={c.hero.image} alt={c.hero.title} sizes="100vw" priority />
        <div className="absolute inset-0" style={{ background: G ? "linear-gradient(100deg, rgba(10,11,13,.35) 0%, rgba(10,11,13,.75) 55%, rgba(10,11,13,.95) 100%)" : "linear-gradient(to left, rgba(14,9,7,.95) 0%, rgba(14,9,7,.7) 45%, rgba(14,9,7,.3) 100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto w-full px-4 md:px-6 pt-32 pb-20 md:py-0">
          <div className="max-w-2xl reveal">
            <span className="eyebrow">{c.hero.badge}</span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.15] mt-5 mb-6">{c.hero.title}</h1>
            <p className="text-lg md:text-xl opacity-90 leading-9 mb-9 max-w-xl">{c.hero.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <a href={wa} target="_blank" rel="noopener" className="btn"><WhatsAppIcon size={20} color="#111" />{c.hero.cta}</a>
              <a href={tel} className="btn-ghost"><Phone size={18} /><span dir="ltr">{c.contact.phone}</span></a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-10 text-sm opacity-85">
              {c.stats.slice(0, 3).map((s, i) => <span key={i} className="flex items-center gap-2"><CheckCircle2 size={16} className="gold" />{s.title} {s.desc}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {on("stats") && c.stats.length > 0 && (
        <section className="relative -mt-10 z-10 px-4">
          <div className="max-w-6xl mx-auto card cut grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse reveal" style={{ borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}>
            {c.stats.map((s, i) => (
              <div key={i} className="p-6 md:p-8 text-center" style={{ borderColor: "color-mix(in srgb, var(--primary) 15%, transparent)" }}>
                <div className="display text-3xl md:text-5xl font-bold gold-grad"><Counter value={s.title} /></div>
                <div className="mt-2 text-sm md:text-base opacity-75">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {on("about") && c.about.text && (
        <section id="about" className="relative py-24 md:py-32 px-4 overflow-hidden">
          {c.about.image && <div className="absolute inset-0 opacity-[.08]"><Img src={c.about.image} alt="" sizes="100vw" /></div>}
          <div className="absolute inset-0 pattern opacity-60" />
          <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative reveal">
              <div className="relative aspect-[4/5] md:aspect-[5/5] overflow-hidden card cut">
                <Img src={c.about.image} alt={c.about.title || t.about} sizes="(min-width:1024px) 45vw, 100vw" />
              </div>
              <div className="absolute -bottom-6 -left-2 md:-left-8 card cut px-6 py-5 shadow-2xl" style={{ background: "var(--primary)", color: "#111" }}>
                <div className="display text-3xl font-bold">{c.stats[1]?.title || ""}</div>
                <div className="text-sm font-semibold">{c.stats[1]?.desc || ""}</div>
              </div>
            </div>
            <div className="reveal">
              <span className="eyebrow">{t.about}</span>
              <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-6 leading-tight gold-grad">{c.about.title || t.about}</h2>
              <p className="text-lg leading-9 opacity-85 whitespace-pre-line mb-8">{c.about.text}</p>
              {points.length > 0 && (
                <ul className="grid sm:grid-cols-2 gap-4 mb-9">
                  {points.map((p, i) => <li key={i} className="flex items-start gap-3"><CheckCircle2 className="gold shrink-0 mt-1" size={20} /><span>{p}</span></li>)}
                </ul>
              )}
              <a href={wa} target="_blank" rel="noopener" className="btn">{c.hero.cta}<ArrowLeft size={18} /></a>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {on("services") && c.services.length > 0 && (
        <section id="services" className="py-24 md:py-32 px-4" style={{ background: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto"><Head eyebrow={c.hero.badge} title={t.services} /><PhotoCards items={c.services} icons={SERVICE_ICONS} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" /></div>
        </section>
      )}

      {/* Cities */}
      {on("cities") && c.cities.length > 0 && (
        <section id="cities" className="py-24 md:py-28 px-4 relative">
          <div className="absolute inset-0 pattern opacity-50" />
          <div className="relative max-w-6xl mx-auto">
            <Head title={t.cities} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {c.cities.map((x, i) => (
                <div key={i} className="card cut p-6 md:p-8 text-center reveal hover:-translate-y-1 transition" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="icon-chip mx-auto mb-4"><MapPin size={24} strokeWidth={1.6} /></div>
                  <div className="display text-2xl md:text-3xl font-bold">{x.title}</div>
                  {x.desc && <div className="text-sm md:text-base opacity-75 mt-2">{x.desc}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Projects / أعمالنا */}
      {on("projects") && c.projects.length > 0 && (
        <section id="projects" className="py-24 md:py-32 px-4" style={{ background: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto">
            <Head eyebrow={t.projects} title={t.projects} />
            <div className="grid gap-6 md:grid-cols-3">
              {c.projects.map((p, i) => (
                <article key={i} className={`relative overflow-hidden card cut zoom reveal ${i === 0 ? "md:col-span-2 md:row-span-2 min-h-[22rem] md:min-h-[36rem]" : "min-h-[22rem] md:min-h-0"}`}>
                  <Img src={p.image || c.hero.image} alt={p.title} sizes={i === 0 ? "(min-width:768px) 66vw, 100vw" : "(min-width:768px) 33vw, 100vw"} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 md:p-8">
                    <span className="inline-block h-1 w-10 mb-4" style={{ background: "var(--primary)" }} />
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{p.title}</h3>
                    <p className="text-white/80 leading-7">{p.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why us */}
      {on("why") && c.why.length > 0 && (
        <section id="why" className="py-24 md:py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <Head title={t.why} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {c.why.map((w, i) => { const Icon = WHY_ICONS[i % WHY_ICONS.length]; return (
                <div key={i} className="card cut p-7 reveal group hover:-translate-y-1 transition" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-between mb-6"><div className="icon-chip"><Icon size={24} strokeWidth={1.6} /></div><span className="display text-4xl font-bold opacity-15">0{i + 1}</span></div>
                  <h3 className="text-xl font-bold mb-2">{w.title}</h3>
                  <p className="opacity-75 leading-8">{w.desc}</p>
                </div>
              ); })}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {on("gallery") && c.gallery.length > 0 && (
        <section id="gallery" className="py-24 md:py-32 px-4" style={{ background: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto">
            <Head title={t.gallery} />
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>figure]:mb-4">
              {c.gallery.map((g, i) => (
                <figure key={i} className="break-inside-avoid relative overflow-hidden card cut zoom group reveal">
                  <Image src={g.url} alt={g.caption || c.seo.title} width={800} height={600} sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="w-full h-auto block" />
                  {g.caption && <figcaption className="absolute bottom-0 inset-x-0 p-3 text-sm text-white bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition">{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Videos (hidden when empty) */}
      {on("videos") && c.videos.length > 0 && (
        <section id="videos" className="py-24 md:py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <Head title={t.videos} />
            <div className="grid gap-6 md:grid-cols-2">
              {c.videos.map((v, i) => (
                <figure key={i} className="card cut overflow-hidden reveal">
                  <video src={v.url} controls playsInline preload="metadata" className="w-full h-auto max-h-[80vh] bg-black" />
                  {v.caption && <figcaption className="p-4 text-center">{v.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {on("testimonials") && c.testimonials.length > 0 && (
        <section id="testimonials" className="py-24 md:py-32 px-4 relative">
          <div className="absolute inset-0 pattern opacity-40" />
          <div className="relative max-w-7xl mx-auto">
            <Head title={t.testimonials || "آراء عملائنا"} />
            <div className="grid gap-6 md:grid-cols-3">
              {c.testimonials.map((r, i) => (
                <blockquote key={i} className="card cut p-8 reveal relative" style={{ transitionDelay: `${i * 90}ms` }}>
                  <Quote className="gold opacity-40 mb-4" size={36} />
                  <div className="flex gap-1 mb-4 gold">{[0, 1, 2, 3, 4].map((k) => <Star key={k} size={16} fill="currentColor" />)}</div>
                  <p className="leading-8 opacity-90 mb-6">{r.desc}</p>
                  <footer className="font-bold gold">{r.title}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA band */}
      {c.cta.title && (
        <section className="relative py-24 md:py-32 px-4 overflow-hidden">
          <Img src={c.cta.image || c.hero.image} alt="" sizes="100vw" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--bg) 92%, transparent), color-mix(in srgb, var(--bg) 70%, transparent))" }} />
          <div className="relative max-w-3xl mx-auto text-center reveal">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-5">{c.cta.title}</h2>
            <p className="text-lg opacity-85 leading-9 mb-9">{c.cta.text}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={wa} target="_blank" rel="noopener" className="btn"><WhatsAppIcon size={20} color="#111" />{c.hero.cta}</a>
              <a href={tel} className="btn-ghost"><Phone size={18} />{t.callNow || "اتصل الآن"}</a>
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="py-24 md:py-28 px-4" style={{ background: "var(--surface)" }}>
        <div className="max-w-6xl mx-auto">
          <Head title={t.contact} />
          <div className="grid gap-6 md:grid-cols-3">
            <a href={tel} className="card cut p-8 text-center reveal hover:-translate-y-1 transition"><div className="icon-chip mx-auto mb-4"><Phone size={24} /></div><div className="font-bold text-lg mb-1">اتصال مباشر</div><div dir="ltr" className="gold text-xl font-bold">{c.contact.phone}</div></a>
            <a href={wa} target="_blank" rel="noopener" className="card cut p-8 text-center reveal hover:-translate-y-1 transition"><div className="mx-auto mb-4 w-[3.25rem] h-[3.25rem] rounded-full grid place-items-center" style={{ background: "#25D366" }}><WhatsAppIcon size={26} /></div><div className="font-bold text-lg mb-1">واتساب</div><div dir="ltr" className="gold text-xl font-bold">{c.contact.whatsapp || c.contact.phone}</div></a>
            <div className="card cut p-8 text-center reveal"><div className="icon-chip mx-auto mb-4"><MapPin size={24} /></div><div className="font-bold text-lg mb-1">مناطق الخدمة</div><div className="opacity-85">{c.contact.address}</div>{c.contact.workingHours && <div className="text-sm opacity-70 mt-2 flex items-center justify-center gap-1"><Clock size={14} />{c.contact.workingHours}</div>}</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 pb-28 px-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--primary) 18%, transparent)" }}>
        <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            {c.identity.logo ? <img src={c.identity.logo} alt={c.hero.badge} className="logo mb-4" /> : <div className="display text-2xl font-bold gold-grad mb-4">{c.hero.badge}</div>}
            <p className="opacity-70 leading-8 max-w-md">{c.seo.description}</p>
            {socials.length > 0 && <div className="flex gap-3 mt-5">{socials.map(([k, v]) => { const I = SOCIAL_ICONS[k] || Globe; return <a key={k} href={v} target="_blank" rel="noopener" aria-label={k} className="icon-chip !w-10 !h-10"><I size={18} /></a>; })}</div>}
          </div>
          <div>
            <h4 className="display font-bold text-lg mb-4 gold">روابط سريعة</h4>
            <ul className="space-y-2 opacity-80">{nav.map(([k, v]) => <li key={k}><a href={`#${k}`} className="hover:text-[var(--primary)]">{v}</a></li>)}</ul>
          </div>
          <div>
            <h4 className="display font-bold text-lg mb-4 gold">{t.contact}</h4>
            <ul className="space-y-3 opacity-85">
              <li><a href={tel} className="flex items-center gap-2"><Phone size={16} className="gold" /><span dir="ltr">{c.contact.phone}</span></a></li>
              <li><a href={wa} className="flex items-center gap-2"><WhatsAppIcon size={16} color="var(--primary)" /><span dir="ltr">{c.contact.whatsapp || c.contact.phone}</span></a></li>
              {c.contact.email && <li><a href={`mailto:${c.contact.email}`} className="flex items-center gap-2"><Mail size={16} className="gold" />{c.contact.email}</a></li>}
              <li className="flex items-start gap-2"><MapPin size={16} className="gold mt-1 shrink-0" />{c.contact.address}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t text-center text-sm opacity-60" style={{ borderColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>{c.footer.text}</div>
      </footer>

      {/* Floating buttons */}
      <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-3">
        <a href={wa} aria-label="تواصل عبر واتساب" target="_blank" rel="noopener" className="wa-pulse w-[60px] h-[60px] rounded-full grid place-items-center shadow-[0_10px_25px_rgba(0,0,0,.35)] hover:scale-110 transition" style={{ background: "#25D366" }}>
          <WhatsAppIcon size={32} />
        </a>
        <a href={tel} aria-label="اتصال" className="w-[60px] h-[60px] rounded-full grid place-items-center shadow-[0_10px_25px_rgba(0,0,0,.35)] hover:scale-110 transition border-2" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 80%, #fff), var(--primary))", borderColor: "rgba(255,255,255,.25)" }}>
          <Phone size={26} color="#111" fill="#111" strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
}
