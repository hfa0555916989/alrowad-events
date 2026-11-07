import type { Service } from "../lib/types";
import { Img } from "./Shell";
import { ArrowLeft, Coffee, Users, PartyPopper, Gem, Sparkles } from "lucide-react";
const ICONS = [Coffee, Users, PartyPopper, Gem, Sparkles];
export default function ServiceCards({ items }: { items: Service[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s, i) => {
        const Icon = ICONS[i % ICONS.length];
        return (
          <a key={s.slug} href={`/services/${s.slug}`} className="card cut overflow-hidden group zoom reveal block" style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
            {(s.image || s.images[0]) && <div className="relative aspect-[4/3] overflow-hidden"><Img src={s.image || s.images[0]} alt={s.title} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" /></div>}
            <div className="p-6 relative">
              <div className="icon-chip -mt-12 relative shadow-xl" style={{ background: "var(--surface)" }}><Icon size={24} strokeWidth={1.6} /></div>
              <h3 className="text-xl md:text-2xl font-bold mt-4 mb-2 group-hover:text-[var(--primary)] transition">{s.title}</h3>
              <p className="opacity-75 leading-8">{s.desc}</p>
              <span className="inline-flex items-center gap-1.5 mt-3 gold font-semibold text-sm">التفاصيل<ArrowLeft size={16} className="group-hover:-translate-x-1 transition" /></span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
