"use client";
import { useEffect, useRef, useState } from "react";
export default function Counter({ value }: { value: string }) {
  const m = value.match(/^(\D*)(\d+)(.*)$/);
  const target = m ? parseInt(m[2]) : 0;
  const [n, setN] = useState(m ? 0 : -1);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!m || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now(), dur = 1600;
      const step = (t: number) => { const p = Math.min(1, (t - t0) / dur); setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    io.observe(el); return () => io.disconnect();
  }, [target]); // eslint-disable-line
  return <span ref={ref} dir="ltr">{m ? `${m[1]}${n}${m[3]}` : value}</span>;
}
