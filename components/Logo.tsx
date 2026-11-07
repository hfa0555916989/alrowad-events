/** Default brand logo (used when no logo is uploaded in the dashboard): dallah (Arabic coffee pot) in an arch. */
export function Emblem({ className, dark = true }: { className?: string; dark?: boolean }) {
  const id = dark ? "ar-d" : "ar-l";
  const G = `url(#${id}-g)`;
  const bg = dark ? "#140d09" : "#1d130d";
  return (
    <svg viewBox="0 0 100 112" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dc9a" /><stop offset=".45" stopColor="#c9a24a" /><stop offset="1" stopColor="#7d5a22" />
        </linearGradient>
      </defs>
      <path d="M50 4C70 4 92 20 92 46v54a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V46C8 20 30 4 50 4z" fill={bg} stroke={G} strokeWidth="4.5"/>
<path d="M50 12C66 12 84 25 84 47v51H16V47C16 25 34 12 50 12z" fill="none" stroke={G} strokeWidth="1.2" opacity=".55"/>
<g fill={G}>
<circle cx="53" cy="22.5" r="2.6"/><rect x="52.2" y="23" width="1.6" height="5"/>
<path d="M44 36Q53 22 62 36z"/>
<rect x="41.5" y="36" width="23" height="3.6" rx="1.2"/>
<path d="M46 39.6h14l-2 12.4h-10z"/>
<rect x="44" y="52" width="18" height="3.4" rx="1.2"/>
<path d="M45 55.4h16c9 6 11 22 4 31.6H41c-7-9.6-5-25.6 4-31.6z"/>
<path d="M41.5 87h23l4 6.5h-31z"/>
<path d="M42 64C33 60 27 50 20 39.5l-3.4.8 1.2 2.6C24 53 30 64 40 70.5z"/>
<path d="M14.6 38.6l7.4-1.2-1.4 4z"/>
</g>
<path d="M62 41.5c13 1.5 16 24 4.5 35" fill="none" stroke={G} strokeWidth="3.4" strokeLinecap="round"/>
<path d="M44 66h18M43 74h20" stroke="#140d09" strokeWidth="1.3" opacity=".55"/>
<path d="M28 99h44" stroke={G} strokeWidth="2.2" strokeLinecap="round"/>
<circle cx="24" cy="99" r="1.6" fill={G}/><circle cx="76" cy="99" r="1.6" fill={G}/>
    </svg>
  );
}
export default function Logo({ dark = true, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <span className={`brand-logo ${className}`} role="img" aria-label="الرواد للحفلات والضيافة — Alrowad Events & Hospitality">
      <Emblem className="brand-emblem" dark={dark} />
      <span className="brand-words">
        <span className="brand-ar gold-grad">الرواد</span>
        <span className="brand-sub" style={{ color: dark ? "#f1e4c8" : "#2b1d14" }}>للحفلات والضيافة</span>
        <span className="brand-en" dir="ltr" style={{ color: dark ? "#c7a868" : "#7a4b2a" }}>ALROWAD — EVENTS &amp; HOSPITALITY</span>
      </span>
    </span>
  );
}
