import Image from "next/image";
import type { Content } from "../lib/types";
import { intl } from "../lib/url";
import { orgLd, ld } from "../lib/seo";
import Reveal from "./Reveal";
import MobileNav from "./MobileNav";
import Logo from "./Logo";
import { WhatsAppIcon, Divider } from "./Brand";
import { Phone, Mail, MapPin, Globe, AtSign, Camera, Music2, Share2, ChevronDown, ChevronLeft } from "lucide-react";

const SOCIAL_ICONS: Record<string, typeof Globe> = { instagram: Camera, x: AtSign, snapchat: Share2, tiktok: Music2, facebook: Globe };
export const links = (c: Content) => {
  const wa = `https://wa.me/${intl(c.contact.whatsapp || c.contact.phone)}`;
  const tel = `tel:+${intl(c.contact.phone)}`;
  return { wa, tel };
};

export function Head({ eyebrow, title, light }: { eyebrow?: string; title: string; light?: boolean }) {
  return (
    <div className="text-center mb-12 md:mb-16 reveal">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className={`text-3xl md:text-5xl font-bold mt-3 leading-tight ${light ? "" : "gold-grad"}`}>{title}</h2>
      <Divider variant="alrowad" />
    </div>
  );
}
export function Img({ src, alt, className, sizes, priority }: { src: string; alt: string; className?: string; sizes: string; priority?: boolean }) {
  if (!src) return null;
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className ?? "object-cover"} />;
}
export function PhotoFrame({ src, alt, sizes, className = "" }: { src: string; alt: string; sizes: string; className?: string }) {
  return (
    <div className={`relative aspect-[4/5] overflow-hidden card cut zoom ${className}`}>
      <Img src={src} alt={alt} sizes={sizes} />
    </div>
  );
}
export function BrandMark({ c, className = "" }: { c: Content; className?: string }) {
  return c.identity.logo ? <img src={c.identity.logo} alt={c.hero.badge} className={`logo ${className}`} /> : <Logo className={className} />;
}

export function Crumbs({ items }: { items: [string, string][] }) {
  return (
    <nav aria-label="مسار التنقل" className="text-sm opacity-80 flex flex-wrap items-center gap-1.5">
      {items.map(([n, h], i) => (
        <span key={h} className="flex items-center gap-1.5">
          {i < items.length - 1 ? <a href={h} className="hover:text-[var(--primary)]">{n}</a> : <span className="gold">{n}</span>}
          {i < items.length - 1 && <ChevronLeft size={14} className="opacity-60" />}
        </span>
      ))}
    </nav>
  );
}

export function PageHero({ title, subtitle, image, crumbs }: { title: string; subtitle?: string; image: string; crumbs: [string, string][] }) {
  return (
    <section className="relative pt-36 md:pt-44 pb-20 md:pb-28 px-4 overflow-hidden">
      <Img src={image} alt={title} sizes="100vw" priority />
      <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(14,9,7,.45) 0%, rgba(14,9,7,.8) 55%, rgba(14,9,7,.96) 100%)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
      <div className="relative max-w-7xl mx-auto">
        <Crumbs items={crumbs} />
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mt-5 mb-5 max-w-3xl">{title}</h1>
        {subtitle && <p className="text-lg md:text-xl opacity-90 leading-9 max-w-2xl">{subtitle}</p>}
      </div>
    </section>
  );
}

export default function Shell({ c, children }: { c: Content; children: React.ReactNode }) {
  const t = c.titles;
  const { wa, tel } = links(c);
  const socials = Object.entries(c.social).filter(([, v]) => v);
  const nav: [string, string][] = [["/", "الرئيسية"], ["/about", t.about || "من نحن"], ["/services", t.services || "خدماتنا"], ["/cities", t.cities || "نخدمكم في"], ["/#projects", t.projects], ["/#gallery", t.gallery], ["/contact", t.contact || "تواصل معنا"]];
  const drops: Record<string, [string, string][]> = {
    "/services": c.services.map((s) => [`/services/${s.slug}`, s.title]),
    "/cities": c.cityPages.map((x) => [`/cities/${x.slug}`, x.title]),
  };
  const mobileLinks: [string, string][] = [["/", "الرئيسية"], ["/about", t.about], ...drops["/services"], ...drops["/cities"], ["/contact", t.contact]];
  return (
    <div className="v-alrowad">
      <Reveal />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(orgLd(c))} />
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl border-b" style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)", borderColor: "color-mix(in srgb, var(--primary) 18%, transparent)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[76px] md:h-[92px] flex items-center justify-between gap-4">
          <a href="/" className="flex items-center min-w-0" aria-label={c.hero.badge}><BrandMark c={c} /></a>
          <nav className="hidden lg:flex items-center gap-6 text-[15px] font-medium" aria-label="القائمة الرئيسية">
            {nav.map(([h, v]) => drops[h] ? (
              <div key={h} className="nav-drop">
                <a href={h} className="opacity-85 hover:opacity-100 hover:text-[var(--primary)] transition inline-flex items-center gap-1 py-6">{v}<ChevronDown size={14} /></a>
                <div className="drop card shadow-2xl">
                  {drops[h].map(([href, label]) => <a key={href} href={href} className="block px-4 py-2.5 rounded hover:bg-white/5 hover:text-[var(--primary)]">{label}</a>)}
                </div>
              </div>
            ) : <a key={h} href={h} className="opacity-85 hover:opacity-100 hover:text-[var(--primary)] transition">{v}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href={tel} className="btn !py-2.5 !px-5 text-sm hidden md:inline-flex whitespace-nowrap"><Phone size={16} />{t.callNow || "اتصل الآن"}</a>
            <MobileNav links={mobileLinks} tel={tel} callLabel={t.callNow || "اتصل الآن"} />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="pt-16 pb-28 px-4 border-t pattern-soft" style={{ borderColor: "color-mix(in srgb, var(--primary) 18%, transparent)" }}>
        <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-5"><BrandMark c={c} /></div>
            <p className="opacity-70 leading-8 max-w-md">{c.seo.description}</p>
            {socials.length > 0 && <div className="flex gap-3 mt-5">{socials.map(([k, v]) => { const I = SOCIAL_ICONS[k] || Globe; return <a key={k} href={v} target="_blank" rel="noopener" aria-label={k} className="icon-chip !w-10 !h-10"><I size={18} /></a>; })}</div>}
          </div>
          <div>
            <h2 className="display font-bold text-lg mb-4 gold">{t.services}</h2>
            <ul className="space-y-2 opacity-80">{c.services.map((s) => <li key={s.slug}><a href={`/services/${s.slug}`} className="hover:text-[var(--primary)]">{s.title}</a></li>)}</ul>
          </div>
          <div>
            <h2 className="display font-bold text-lg mb-4 gold">{t.cities || "نخدمكم في"}</h2>
            <ul className="space-y-2 opacity-80">{c.cityPages.map((x) => <li key={x.slug}><a href={`/cities/${x.slug}`} className="hover:text-[var(--primary)]">{x.title}</a></li>)}</ul>
          </div>
          <div>
            <h2 className="display font-bold text-lg mb-4 gold">{t.contact}</h2>
            <ul className="space-y-3 opacity-85">
              <li><a href={tel} className="flex items-center gap-2"><Phone size={16} className="gold" /><span dir="ltr">{c.contact.phone}</span></a></li>
              <li><a href={wa} className="flex items-center gap-2"><WhatsAppIcon size={16} color="var(--primary)" /><span dir="ltr">{c.contact.whatsapp || c.contact.phone}</span></a></li>
              {c.contact.email && <li><a href={`mailto:${c.contact.email}`} className="flex items-center gap-2"><Mail size={16} className="gold" />{c.contact.email}</a></li>}
              <li className="flex items-start gap-2"><MapPin size={16} className="gold mt-1 shrink-0" />{c.contact.address}</li>
              <li className="pt-2 flex gap-4 text-sm"><a href="/about" className="hover:text-[var(--primary)]">{t.about}</a><a href="/contact" className="hover:text-[var(--primary)]">{t.contact}</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t text-center text-sm opacity-60" style={{ borderColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>{c.footer.text}</div>
      </footer>

      <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-3" data-float>
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
