"use client";
import { useEffect, useMemo, useState } from "react";
import type { Counts, DayAgg, Facets } from "../lib/analytics-model";
import {
  CHANNEL_LABELS, CHANNEL_ORDER, DEVICE_LABELS, SCREEN_LABELS, addDays, channelOf, dayKey, daysInclusive,
  fmtDur, metrics, pctChange, sourceLabel, totalsOf, weekday,
} from "../lib/analytics-model";

type Mode = "today" | "yesterday" | "7d" | "30d" | "month" | "last" | "year" | "custom";
type Resp = {
  days: DayAgg[]; prev: DayAgg[]; facets: Facets; legacyPv: number;
  from: string; to: string; prevFrom: string; prevTo: string; filtered: boolean; blob: boolean;
};
type Live = { path: string; country: string; region: string; city: string; device: string; src: string; t: number };

const nf = new Intl.NumberFormat("ar-SA");
const PAGE_NAMES: Record<string, string> = { "/": "الرئيسية", "/about": "من نحن", "/contact": "تواصل معنا", "/services": "الخدمات", "/cities": "مدن الخدمة" };
const SA_REGIONS: Record<string, string> = { "01": "منطقة الرياض", "02": "منطقة مكة المكرمة", "03": "منطقة المدينة المنورة", "04": "المنطقة الشرقية", "05": "منطقة القصيم", "06": "منطقة حائل", "07": "منطقة تبوك", "08": "منطقة الحدود الشمالية", "09": "منطقة جازان", "10": "منطقة نجران", "11": "منطقة الباحة", "12": "منطقة الجوف", "14": "منطقة عسير" };
const DOW = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DOW_ORDER = [6, 0, 1, 2, 3, 4, 5];
const MODES: [Mode, string][] = [["today", "اليوم"], ["yesterday", "أمس"], ["7d", "7 أيام"], ["30d", "30 يوم"], ["month", "هذا الشهر"], ["last", "الشهر الماضي"], ["year", "هذه السنة"], ["custom", "مخصص"]];
const NAV = [["live", "المباشر"], ["kpi", "المؤشرات"], ["time", "الزمن"], ["src", "المصادر"], ["geo", "الجغرافيا"], ["tech", "التقنية"], ["pages", "الصفحات"], ["conv", "التحويلات"]];
const CH_COLOR: Record<string, string> = { search: "#7a4b2a", social: "#c9a24a", direct: "#111827", referral: "#6b7280", campaign: "#b45309", email: "#0f766e" };

let regionNames: Intl.DisplayNames | null = null;
let langNames: Intl.DisplayNames | null = null;
const flag = (cc: string) => /^[A-Z]{2}$/.test(cc) && cc !== "XX" ? String.fromCodePoint(...[...cc].map((ch) => 0x1f1a5 + ch.charCodeAt(0))) : "🌐";
const countryName = (cc: string) => {
  if (!/^[A-Z]{2}$/.test(cc) || cc === "XX") return "غير معروف";
  try { regionNames ||= new Intl.DisplayNames(["ar"], { type: "region" }); return regionNames.of(cc) || cc; } catch { return cc; }
};
const langName = (code: string) => {
  if (!code) return "غير معروف";
  try { langNames ||= new Intl.DisplayNames(["ar"], { type: "language" }); return langNames.of(code) || code; } catch { return code; }
};
const regionName = (cc: string, r: string) => (r === "?" || !r ? "غير معروف" : cc === "SA" && SA_REGIONS[r] ? SA_REGIONS[r] : r);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const share = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "");

function sumCounts(days: DayAgg[], key: "c" | "r" | "ci" | "p" | "s" | "rd" | "cp" | "ch" | "dv" | "os" | "br" | "sc" | "lg") {
  const m: Record<string, Counts> = {};
  for (const d of days) for (const [k, x] of Object.entries(d[key] || {})) {
    const y = (m[k] ||= { v: 0, pv: 0 });
    y.v += x.v || 0; y.pv += x.pv || 0;
  }
  return Object.entries(m).filter(([, x]) => x.v || x.pv).sort((a, b) => b[1].v - a[1].v || b[1].pv - a[1].pv);
}
function sumNums(days: DayAgg[], key: "e" | "es" | "ep" | "ec" | "lp" | "xp" | "pt" | "sd" | "mp") {
  const m: Record<string, number> = {};
  for (const d of days) for (const [k, n] of Object.entries(d[key] || {})) m[k] = (m[k] || 0) + (n || 0);
  return m;
}

function Delta({ cur, prev, invert }: { cur: number | null; prev: number | null; invert?: boolean }) {
  if (cur == null || prev == null) return <span className="text-xs text-gray-400">—</span>;
  const p = pctChange(cur, prev);
  if (p == null) return <span className="text-xs font-semibold text-emerald-700">جديد</span>;
  if (Math.abs(p) < 0.05) return <span className="text-xs text-gray-400">0%</span>;
  const up = p > 0;
  const good = invert ? !up : up;
  return <span className={`text-xs font-semibold ${good ? "text-emerald-700" : "text-red-600"}`}>{up ? "▲" : "▼"} {Math.abs(p).toFixed(1)}%</span>;
}

function Card({ label, value, sub, cur, prev, invert }: { label: string; value: string; sub?: string; cur: number | null; prev: number | null; invert?: boolean }) {
  return (
    <div className="rounded-xl border p-3 sm:p-4 bg-gradient-to-br from-white to-yellow-50 min-w-0">
      <div className="text-[11px] sm:text-xs text-gray-500 leading-5">{label}</div>
      <div className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums truncate">{value}</div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <Delta cur={cur} prev={prev} invert={invert} />
        {sub && <span className="text-[11px] text-gray-400 truncate">{sub}</span>}
      </div>
    </div>
  );
}

function Bars({ rows, max, cols = ["الزوار", "المشاهدات"] }: { rows: [string, Counts, string?][]; max: number; cols?: [string, string] }) {
  if (!rows.length) return <p className="text-sm text-gray-500 py-6 text-center">لا توجد بيانات في هذه الفترة</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[280px]">
        <thead><tr className="text-gray-500 text-xs"><th className="text-right font-medium pb-2">الاسم</th><th className="font-medium pb-2 w-16">{cols[0]}</th><th className="font-medium pb-2 w-16">{cols[1]}</th></tr></thead>
        <tbody>
          {rows.map(([label, x, sub], i) => (
            <tr key={label + i} className="border-t">
              <td className="py-2 pl-2">
                <div className="flex items-center justify-between gap-2"><span className="truncate">{label}</span>{sub && <span className="text-xs text-gray-400 shrink-0">{sub}</span>}</div>
                <div className="h-1.5 rounded bg-gray-100 mt-1 overflow-hidden"><div className="h-full rounded" style={{ width: `${Math.max(3, ((x.v || x.pv) / (max || 1)) * 100)}%`, background: "linear-gradient(90deg,#7a4b2a,#c9a24a)" }} /></div>
              </td>
              <td className="text-center font-bold tabular-nums">{nf.format(x.v)}</td>
              <td className="text-center text-gray-600 tabular-nums">{nf.format(x.pv)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VBars({ series, label }: { series: { label: string; v: number; pv: number }[]; label: string }) {
  const W = 760, H = 210, P = 28;
  const max = Math.max(1, ...series.map((s) => Math.max(s.v, s.pv)));
  const bw = (W - P * 2) / Math.max(1, series.length);
  const y = (n: number) => H - P - (n / max) * (H - P * 1.7);
  const step = series.length <= 14 ? 1 : Math.ceil(series.length / 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
      {[0, 0.5, 1].map((f) => <line key={f} x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="#eee" />)}
      {series.map((s, i) => (
        <g key={s.label + i}>
          <rect x={P + bw * i + bw * 0.14} y={y(s.pv)} width={Math.max(1, bw * 0.32)} height={Math.max(0, H - P - y(s.pv))} rx="1" fill="#c9a24a"><title>{`${s.label}: ${s.pv} مشاهدة`}</title></rect>
          <rect x={P + bw * i + bw * 0.52} y={y(s.v)} width={Math.max(1, bw * 0.32)} height={Math.max(0, H - P - y(s.v))} rx="1" fill="#7a4b2a"><title>{`${s.label}: ${s.v} زائر`}</title></rect>
          {i % step === 0 && <text x={P + bw * i + bw / 2} y={H - 8} fontSize="10" textAnchor="middle" fill="#666">{s.label}</text>}
        </g>
      ))}
    </svg>
  );
}

function Trend({ series }: { series: { label: string; v: number; pv: number }[] }) {
  const W = 760, H = 220, P = 32;
  const max = Math.max(1, ...series.map((s) => s.pv));
  const bw = (W - P * 2) / Math.max(1, series.length);
  const y = (n: number) => H - P - (n / max) * (H - P * 2);
  const line = series.map((s, i) => `${i ? "L" : "M"}${P + bw * i + bw / 2},${y(s.v)}`).join(" ");
  const step = Math.ceil(series.length / 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="الزوار والمشاهدات عبر الزمن">
      {[0, 0.5, 1].map((f) => <g key={f}><line x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="#eee" /><text x={4} y={y(max * f) + 4} fontSize="10" fill="#999">{Math.round(max * f)}</text></g>)}
      {series.map((s, i) => <rect key={i} x={P + bw * i + bw * 0.18} y={y(s.pv)} width={Math.max(1, bw * 0.64)} height={Math.max(0, H - P - y(s.pv))} rx="2" fill="#c9a24a" opacity=".45"><title>{`${s.label}: ${s.pv} مشاهدة، ${s.v} زائر`}</title></rect>)}
      <path d={line} fill="none" stroke="#7a4b2a" strokeWidth="2.5" />
      {series.map((s, i) => <circle key={i} cx={P + bw * i + bw / 2} cy={y(s.v)} r={series.length > 40 ? 1.6 : 3} fill="#7a4b2a" />)}
      {series.map((s, i) => i % step === 0 ? <text key={s.label + i} x={P + bw * i + bw / 2} y={H - 8} fontSize="10" textAnchor="middle" fill="#666">{s.label}</text> : null)}
    </svg>
  );
}

function Legend() {
  return <p className="text-[11px] text-gray-500 mt-1"><span className="text-[#7a4b2a]">● الزوار</span> <span className="text-[#c9a24a] mr-3">■ المشاهدات</span></p>;
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob(["\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Analytics({ names = {} }: { names?: Record<string, string> }) {
  const [now, setNow] = useState(() => Date.now());
  const today = dayKey(new Date(now));
  const [mode, setMode] = useState<Mode>("7d");
  const [from, setFrom] = useState(addDays(today, -29));
  const [to, setTo] = useState(today);
  const [cc, setCc] = useState("");
  const [city, setCity] = useState("");
  const [src, setSrc] = useState("");
  const [dv, setDv] = useState("");
  const [resp, setResp] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [live, setLive] = useState<Live[]>([]);

  const range = useMemo((): [string, string] => {
    if (mode === "today") return [today, today];
    if (mode === "yesterday") { const y = addDays(today, -1); return [y, y]; }
    if (mode === "7d") return [addDays(today, -6), today];
    if (mode === "30d") return [addDays(today, -29), today];
    if (mode === "month") return [today.slice(0, 7) + "-01", today];
    if (mode === "last") { const end = addDays(today.slice(0, 7) + "-01", -1); return [end.slice(0, 7) + "-01", end]; }
    if (mode === "year") return [today.slice(0, 4) + "-01-01", today];
    const a = from <= to ? from : to;
    const b = from <= to ? to : from;
    return [a > today ? today : a, b > today ? today : b];
  }, [mode, from, to, today]);
  const tooLong = daysInclusive(range[0], range[1]) > 370;
  const singleDay = range[0] === range[1];

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (tooLong) { setErr("أقصى فترة هي 370 يوماً"); return; }
    let off = false;
    setLoading(true); setErr("");
    const q = new URLSearchParams({ from: range[0], to: range[1] });
    if (cc) q.set("cc", cc);
    if (city) q.set("city", city);
    if (src) q.set("src", src);
    if (dv) q.set("dv", dv);
    fetch(`/api/admin/analytics?${q}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((j) => { if (!off) setResp(j); })
      .catch((e) => { if (!off) setErr(e === 401 ? "انتهت الجلسة — أعد تحميل الصفحة" : "تعذر تحميل الإحصائيات (" + e + ")"); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [range, cc, city, src, dv, tooLong]);

  useEffect(() => {
    let off = false;
    const load = () => {
      if (document.visibilityState === "hidden") return;
      fetch("/api/admin/analytics/live", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((j) => { if (!off && j) setLive(j.visitors || []); })
        .catch(() => {});
    };
    load();
    const t = window.setInterval(load, 20_000);
    document.addEventListener("visibilitychange", load);
    return () => { off = true; window.clearInterval(t); document.removeEventListener("visibilitychange", load); };
  }, []);

  const days = resp?.days || [];
  const prevDays = resp?.prev || [];
  const totals = useMemo(() => totalsOf(days), [days]);
  const prevTotals = useMemo(() => totalsOf(prevDays), [prevDays]);
  const cur = useMemo(() => metrics(totals), [totals]);
  const prevM = useMemo(() => metrics(prevTotals), [prevTotals]);
  const facets = resp?.facets || { countries: [], cities: [], sources: [], devices: [] };
  const pageName = (k: string) => names[k] || PAGE_NAMES[k] || decodeURIComponent(k);

  const series = useMemo(() => {
    if (singleDay) {
      const h = days[0]?.h || {};
      return Array.from({ length: 24 }, (_, i) => ({ label: String(i), v: h[String(i)]?.v || 0, pv: h[String(i)]?.pv || 0 }));
    }
    const byDay = new Map(days.map((d) => [d.d, d]));
    const out: { label: string; v: number; pv: number }[] = [];
    let c = range[0]; let guard = 0;
    while (c <= range[1] && guard++ < 400) {
      const d = byDay.get(c);
      out.push({ label: c.slice(5).replace("-", "/"), v: d?.v || 0, pv: d?.pv || 0 });
      c = addDays(c, 1);
    }
    return out;
  }, [days, range, singleDay]);

  const hours = useMemo(() => {
    const h: Record<string, Counts> = {};
    for (const d of days) for (const [k, x] of Object.entries(d.h || {})) {
      const y = (h[k] ||= { v: 0, pv: 0 }); y.v += x.v || 0; y.pv += x.pv || 0;
    }
    return Array.from({ length: 24 }, (_, i) => ({ label: String(i), v: h[String(i)]?.v || 0, pv: h[String(i)]?.pv || 0 }));
  }, [days]);
  const dow = useMemo(() => {
    const m = DOW.map(() => ({ v: 0, pv: 0 }));
    for (const d of days) { const w = weekday(d.d); m[w].v += d.v || 0; m[w].pv += d.pv || 0; }
    return DOW_ORDER.map((i) => ({ label: DOW[i], v: m[i].v, pv: m[i].pv }));
  }, [days]);

  const countries = sumCounts(days, "c");
  const regions = sumCounts(days, "r").slice(0, 15);
  const cities = sumCounts(days, "ci").slice(0, 15);
  const sources = sumCounts(days, "s");
  const refs = sumCounts(days, "rd").slice(0, 20);
  const camps = sumCounts(days, "cp").slice(0, 20);
  const devices = sumCounts(days, "dv");
  const oses = sumCounts(days, "os");
  const browsers = sumCounts(days, "br");
  const screens = sumCounts(days, "sc");
  const langs = sumCounts(days, "lg");
  const allPages = sumCounts(days, "p").sort((a, b) => b[1].pv - a[1].pv);
  const pages = allPages.slice(0, 20);
  const mp = sumNums(days, "mp");
  const pt = sumNums(days, "pt");
  const lp = sumNums(days, "lp");
  const xp = sumNums(days, "xp");
  const sd = sumNums(days, "sd");
  const ep = sumNums(days, "ep");
  const ec = sumNums(days, "ec");
  const es = sumNums(days, "es");
  const measured = Object.values(mp).reduce((a, n) => a + n, 0);
  const scrollAll = [25, 50, 75, 100].map((n) => ({ n, v: Object.entries(sd).filter(([k]) => k.endsWith("|" + n)).reduce((a, [, v]) => a + v, 0) }));

  const landings = Object.entries(lp).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const exits = Object.entries(xp).map(([k, n]) => [k, Math.max(0, n)] as [string, number]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const pageConv = new Map<string, { wa: number; call: number }>();
  for (const [k, n] of Object.entries(ep)) {
    const i = k.indexOf("|"); if (i < 0) continue;
    const ev = k.slice(0, i); const p = k.slice(i + 1);
    const x = pageConv.get(p) || { wa: 0, call: 0 };
    if (ev === "wa") x.wa += n; else if (ev === "call") x.call += n;
    pageConv.set(p, x);
  }
  const srcConv = new Map<string, { wa: number; call: number }>();
  for (const [k, n] of Object.entries(es)) {
    const i = k.indexOf("|"); if (i < 0) continue;
    const ev = k.slice(0, i); const s = k.slice(i + 1);
    const x = srcConv.get(s) || { wa: 0, call: 0 };
    if (ev === "wa") x.wa += n; else if (ev === "call") x.call += n;
    srcConv.set(s, x);
  }
  const cityConv = new Map<string, { wa: number; call: number }>();
  for (const [k, n] of Object.entries(ec)) {
    const [ev, ccKey, ...rest] = k.split("|");
    const key = `${ccKey}|${rest.join("|")}`;
    const x = cityConv.get(key) || { wa: 0, call: 0 };
    if (ev === "wa") x.wa += n; else if (ev === "call") x.call += n;
    cityConv.set(key, x);
  }
  const channelGroups = CHANNEL_ORDER.map((ch) => {
    const items = sources.filter(([k]) => channelOf(k) === ch);
    const v = items.reduce((a, [, x]) => a + x.v, 0);
    const pv = items.reduce((a, [, x]) => a + x.pv, 0);
    return { ch, v, pv, items };
  }).filter((g) => g.v || g.pv);
  const sessionBase = sources.reduce((a, [, x]) => a + x.v, 0) || totals.ses || totals.v;
  const visitorBase = totals.v || totals.pv || 1;
  const hourlyKnown = hours.some((h) => h.pv > 0);
  const visitN = totals.ses > 0 ? totals.ses : totals.v;
  const clickN = totals.click > 0 ? totals.click : cur.conv;
  const funnel = [
    { label: totals.ses > 0 ? "زيارة (جلسة)" : "زيارة (زائر)", n: visitN },
    { label: "شاهد خدمة أو مدينة", n: totals.intent },
    { label: totals.click > 0 ? "جلسة فيها تواصل" : "نقرة واتساب أو اتصال", n: clickN },
  ];
  const funnelMax = Math.max(1, ...funnel.map((s) => s.n));

  const cityOptions = facets.cities.filter((c) => !cc || c.k.startsWith(cc + "|"));
  const countryOptions = [...facets.countries].sort((a, b) => (a.k === "SA" ? -1 : b.k === "SA" ? 1 : b.v - a.v));

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["الفترة", range[0], range[1]],
      ["الفترة السابقة", resp?.prevFrom || "", resp?.prevTo || ""],
      ["الدولة", cc ? countryName(cc) : "الكل", "المدينة", city || "الكل", "المصدر", src ? sourceLabel(src) : "الكل", "الجهاز", dv ? DEVICE_LABELS[dv] || dv : "الكل"],
      [],
      ["المؤشر", "الحالي", "السابق"],
      ["الزوار الفريدون", totals.v, prevTotals.v],
      ["الجلسات", totals.ses, prevTotals.ses],
      ["مشاهدات الصفحات", totals.pv, prevTotals.pv],
      ["متوسط مدة الجلسة (ثانية)", cur.avgDur == null ? "" : Math.round(cur.avgDur), prevM.avgDur == null ? "" : Math.round(prevM.avgDur)],
      ["معدل الارتداد", cur.bounce == null ? "" : cur.bounce.toFixed(4), prevM.bounce == null ? "" : prevM.bounce.toFixed(4)],
      ["صفحات لكل جلسة", cur.pps == null ? "" : cur.pps.toFixed(2), prevM.pps == null ? "" : prevM.pps.toFixed(2)],
      ["زوار جدد", totals.nv, prevTotals.nv],
      ["زوار عائدون", totals.ret, prevTotals.ret],
      ["نقرات واتساب", totals.wa, prevTotals.wa],
      ["نقرات الاتصال", totals.call, prevTotals.call],
      ["معدل التحويل", cur.cr == null ? "" : cur.cr.toFixed(4), prevM.cr == null ? "" : prevM.cr.toFixed(4)],
      [],
      ["التاريخ", "الزوار", "المشاهدات", "الجلسات", "المدة (ثانية)", "الارتداد"],
      ...days.map((d) => [d.d, d.v, d.pv, d.ses, d.dur, Math.max(0, d.bnc)]),
      [],
      ["الساعة", "الزوار", "المشاهدات"],
      ...hours.map((h) => [h.label, h.v, h.pv]),
      [],
      ["اليوم", "الزوار", "المشاهدات"],
      ...dow.map((d) => [d.label, d.v, d.pv]),
      [],
      ["المصدر", "القناة", "الجلسات", "المشاهدات"],
      ...sources.map(([k, x]) => [sourceLabel(k), CHANNEL_LABELS[channelOf(k)] || channelOf(k), x.v, x.pv]),
      [],
      ["النطاق المُحيل", "الجلسات", "المشاهدات"],
      ...refs.map(([k, x]) => [k, x.v, x.pv]),
      [],
      ["حملة UTM", "الجلسات", "المشاهدات"],
      ...camps.map(([k, x]) => [k.replace(/\|/g, " / "), x.v, x.pv]),
      [],
      ["الدولة", "الزوار", "المشاهدات"],
      ...countries.map(([k, x]) => [countryName(k), x.v, x.pv]),
      [],
      ["المنطقة", "الزوار", "المشاهدات"],
      ...regions.map(([k, x]) => { const [c, r] = k.split("|"); return [`${countryName(c)} / ${regionName(c, r)}`, x.v, x.pv]; }),
      [],
      ["المدينة", "الزوار", "المشاهدات"],
      ...cities.map(([k, x]) => { const [c, ci] = k.split("|"); return [`${countryName(c)} / ${ci === "?" ? "غير معروف" : ci}`, x.v, x.pv]; }),
      [],
      ["الجهاز", "الزوار", "المشاهدات"],
      ...devices.map(([k, x]) => [DEVICE_LABELS[k] || k, x.v, x.pv]),
      ["النظام", "الزوار", "المشاهدات"],
      ...oses.map(([k, x]) => [k, x.v, x.pv]),
      ["المتصفح", "الزوار", "المشاهدات"],
      ...browsers.map(([k, x]) => [k, x.v, x.pv]),
      ["مقاس الشاشة", "الزوار", "المشاهدات"],
      ...screens.map(([k, x]) => [SCREEN_LABELS[k] || k, x.v, x.pv]),
      ["اللغة", "الزوار", "المشاهدات"],
      ...langs.map(([k, x]) => [langName(k), x.v, x.pv]),
      [],
      ["الصفحة", "المشاهدات", "الزوار", "متوسط الثواني", "هبوط", "خروج", "تمرير 25", "50", "75", "100", "واتساب", "اتصال"],
      ...allPages.map(([k, x]) => {
        const base = mp[k] || 0;
        const conv = pageConv.get(k) || { wa: 0, call: 0 };
        return [pageName(k), x.pv, x.v, base ? Math.round((pt[k] || 0) / base) : "", lp[k] || 0, Math.max(0, xp[k] || 0), sd[`${k}|25`] || 0, sd[`${k}|50`] || 0, sd[`${k}|75`] || 0, sd[`${k}|100`] || 0, conv.wa, conv.call];
      }),
    ];
    downloadCsv(`analytics-${range[0]}-${range[1]}.csv`, rows);
  }

  const btn = (m: Mode, l: string) => <button key={m} type="button" onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-full text-sm border shrink-0 ${mode === m ? "bg-gray-900 text-white border-gray-900" : "bg-white"}`}>{l}</button>;

  return (
    <div className="min-w-0">
      <div className="sticky top-[4.5rem] z-20 -mx-3 px-3 sm:-mx-5 sm:px-5 py-2 bg-white/95 backdrop-blur border-b mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">{MODES.map(([m, l]) => btn(m, l))}</div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-center">
          {mode === "custom" && <>
            <input type="date" className="inp !w-auto col-span-1" dir="ltr" value={from} max={today} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="inp !w-auto col-span-1" dir="ltr" value={to} max={today} onChange={(e) => setTo(e.target.value)} />
          </>}
          <select className="inp !w-auto text-sm" value={cc} onChange={(e) => { const v = e.target.value; setCc(v); setCity((c) => (v && c && !c.startsWith(v + "|") ? "" : c)); }}>
            <option value="">كل الدول</option>
            {countryOptions.map((c) => <option key={c.k} value={c.k}>{flag(c.k)} {countryName(c.k)}</option>)}
          </select>
          <select className="inp !w-auto text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">كل المدن</option>
            {cityOptions.map((c) => { const [kcc, ...rest] = c.k.split("|"); const name = rest.join("|"); return <option key={c.k} value={c.k}>{flag(kcc)} {name === "?" ? "غير معروف" : name}</option>; })}
          </select>
          <select className="inp !w-auto text-sm" value={src} onChange={(e) => setSrc(e.target.value)}>
            <option value="">كل المصادر</option>
            {facets.sources.map((s) => <option key={s.k} value={s.k}>{sourceLabel(s.k)}</option>)}
          </select>
          <select className="inp !w-auto text-sm" value={dv} onChange={(e) => setDv(e.target.value)}>
            <option value="">كل الأجهزة</option>
            <option value="mobile">جوال</option>
            <option value="tablet">جهاز لوحي</option>
            <option value="desktop">كمبيوتر</option>
          </select>
          <button type="button" onClick={exportCsv} disabled={!days.length && !totals.pv} className="px-3 py-2 rounded-lg border text-sm bg-white disabled:opacity-40">تصدير CSV</button>
          {loading && <span className="text-sm text-gray-500">جاري التحميل…</span>}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto text-sm mb-3">
        {NAV.map(([id, label]) => <a key={id} href={`#an-${id}`} className="shrink-0 px-3 py-1 rounded-full bg-gray-100">{label}</a>)}
      </div>
      <p className="text-xs text-gray-500 mb-3">الفترة {range[0]} — {range[1]} بتوقيت الرياض، مقارنة بـ {resp?.prevFrom || "…"} — {resp?.prevTo || "…"}. الزائر = متصفح في اليوم، والجلسة تنتهي بعد 30 دقيقة من الخمول. لا يُحفظ عنوان IP؛ معرّف الزائر عشوائي في المتصفح ويُخزَّن حضوره اللحظي كمختصر مشفّر بملح يومي. زيارات حساب المدير وبرامج الزحف لا تُحتسب.</p>
      {resp?.filtered && (resp.legacyPv || 0) > 0 && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">جزء من مشاهدات هذه الفترة ({nf.format(resp.legacyPv)}) سُجّل قبل التفصيل الجديد، لذلك لا يدخل في فلتر الدولة أو المدينة أو المصدر أو الجهاز. بدون فلتر تبقى الأرقام الإجمالية شاملة له.</p>}
      {!resp?.filtered && (resp?.legacyPv || 0) > 0 && <p className="text-xs text-gray-500 mb-3">المدة، الارتداد، الجلسات، التقنية، وعمق التمرير تُحسب للزيارات الجديدة. الزوار والمشاهدات والمصادر والدول تشمل البيانات السابقة.</p>}
      {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

      <section id="an-live" className="rounded-xl border p-4 mb-6 scroll-mt-36">
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
          <h3 className="font-bold">الزوار الآن</h3>
          <span className="text-sm text-gray-500">آخر 5 دقائق · {nf.format(live.length)}</span>
        </div>
        {live.length ? (
          <ul className="divide-y">
            {live.slice(0, 8).map((v, i) => (
              <li key={v.t + v.path + i} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{pageName(v.path)}</span>
                  <span className="text-xs text-gray-400 shrink-0">{v.t && Date.now() - v.t < 20000 ? "الآن" : `منذ ${Math.max(1, Math.round((Date.now() - v.t) / 60000))} د`}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{flag(v.country)} {countryName(v.country)} · {v.city === "?" ? "مدينة غير معروفة" : v.city} · {DEVICE_LABELS[v.device] || v.device || "جهاز"} · {sourceLabel(v.src || "direct")}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-500 py-3 text-center">لا يوجد زوار متصلون الآن</p>}
        {live.length > 8 && <p className="text-xs text-gray-400 mt-1">و {nf.format(live.length - 8)} آخرون</p>}
      </section>

      <section id="an-kpi" className="scroll-mt-36">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <Card label="الزوار الفريدون" value={nf.format(totals.v)} cur={totals.v} prev={prevTotals.v} />
          <Card label="الجلسات" value={nf.format(totals.ses)} sub={totals.ses ? "" : "تُحسب من التتبع الجديد"} cur={totals.ses} prev={prevTotals.ses} />
          <Card label="مشاهدات الصفحات" value={nf.format(totals.pv)} cur={totals.pv} prev={prevTotals.pv} />
          <Card label="متوسط مدة الجلسة" value={fmtDur(cur.avgDur)} cur={cur.avgDur} prev={prevM.avgDur} />
          <Card label="معدل الارتداد" value={cur.bounce == null ? "—" : pct(cur.bounce)} sub="جلسة من صفحة واحدة" cur={cur.bounce} prev={prevM.bounce} invert />
          <Card label="صفحات / جلسة" value={cur.pps == null ? "—" : cur.pps.toFixed(1)} cur={cur.pps} prev={prevM.pps} />
          <Card label="جدد / عائدون" value={`${nf.format(totals.nv)} / ${nf.format(totals.ret)}`} sub={cur.unknown ? `غير مصنّف ${nf.format(cur.unknown)} · التغير للجدد` : "التغير للجدد"} cur={totals.nv} prev={prevTotals.nv} />
          <Card label="التحويلات (واتساب + اتصال)" value={nf.format(cur.conv)} sub={`واتساب ${nf.format(totals.wa)} · اتصال ${nf.format(totals.call)}`} cur={cur.conv} prev={prevM.conv} />
          <Card label="معدل التحويل" value={cur.cr == null ? "—" : pct(cur.cr)} sub={cur.crBase === "ses" ? "من الجلسات" : cur.crBase === "v" ? "من الزوار" : ""} cur={cur.cr} prev={prevM.cr} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border p-3 text-sm"><div className="text-xs text-gray-500">واتساب</div><div className="text-xl font-bold">{nf.format(totals.wa)}</div><div className="text-xs text-gray-400">منها الزر العائم {nf.format(totals.waFloat)}</div></div>
          <div className="rounded-xl border p-3 text-sm"><div className="text-xs text-gray-500">اتصال</div><div className="text-xl font-bold">{nf.format(totals.call)}</div><div className="text-xs text-gray-400">منها الزر العائم {nf.format(totals.callFloat)}</div></div>
        </div>
        {(totals.nv || totals.ret || cur.unknown) > 0 && (
          <div className="mb-6">
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
              {totals.nv > 0 && <div style={{ width: `${totals.nv / (totals.nv + totals.ret + cur.unknown) * 100}%`, background: "#7a4b2a" }} />}
              {totals.ret > 0 && <div style={{ width: `${totals.ret / (totals.nv + totals.ret + cur.unknown) * 100}%`, background: "#c9a24a" }} />}
              {cur.unknown > 0 && <div style={{ width: `${cur.unknown / (totals.nv + totals.ret + cur.unknown) * 100}%`, background: "#e5e7eb" }} />}
            </div>
            <p className="text-[11px] text-gray-500 mt-1"><span className="text-[#7a4b2a]">● جدد</span> <span className="text-[#c9a24a] mr-2">● عائدون</span> {cur.unknown > 0 && <span>● بيانات سابقة بلا تصنيف</span>}</p>
          </div>
        )}
      </section>

      <section id="an-time" className="scroll-mt-36">
        <div className="rounded-xl border p-3 sm:p-4 mb-4" dir="ltr">
          <h3 className="font-bold mb-2 text-right" dir="rtl">{singleDay ? "الزوار والمشاهدات حسب الساعة" : "الزوار والمشاهدات يومياً"}</h3>
          <Trend series={series} />
          <div dir="rtl"><Legend />{singleDay && !hourlyKnown && totals.pv > 0 && <p className="text-xs text-gray-500">التوزيع الساعي يبدأ مع الزيارات الجديدة. إجمالي اليوم ما زال في البطاقات أعلاه.</p>}</div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border p-3 sm:p-4" dir="ltr">
            <h3 className="font-bold mb-2 text-right" dir="rtl">ساعات اليوم</h3>
            <VBars series={hours} label="التوزيع حسب الساعة" />
            <div dir="rtl"><Legend /></div>
          </div>
          <div className="rounded-xl border p-3 sm:p-4" dir="ltr">
            <h3 className="font-bold mb-2 text-right" dir="rtl">أيام الأسبوع</h3>
            <VBars series={dow} label="التوزيع حسب اليوم" />
            <div dir="rtl"><Legend /></div>
          </div>
        </div>
      </section>

      <section id="an-src" className="scroll-mt-36">
        <h2 className="text-lg font-bold mb-1">مصادر الزيارات</h2>
        <p className="text-xs text-gray-500 mb-3">القناة تُجمع من المُحيل ووسوم UTM. واتساب وسناب داخل التطبيق غالباً لا يرسلان مُحيلاً فتظهر الزيارة «دخول مباشر» ما لم يُستخدم رابط فيه utm_source.</p>
        {!!channelGroups.length && (
          <div className="mb-4">
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
              {channelGroups.map((g) => <div key={g.ch} title={CHANNEL_LABELS[g.ch]} style={{ width: `${(g.v / (sessionBase || 1)) * 100}%`, background: CH_COLOR[g.ch] }} />)}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
              {channelGroups.map((g) => <span key={g.ch}><span className="inline-block w-2 h-2 rounded-full ml-1" style={{ background: CH_COLOR[g.ch] }} />{CHANNEL_LABELS[g.ch]} {share(g.v, sessionBase)}</span>)}
            </div>
          </div>
        )}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {channelGroups.map((g) => (
            <div key={g.ch} className="rounded-xl border p-4">
              <h3 className="font-bold mb-2">{CHANNEL_LABELS[g.ch]} <span className="text-xs font-normal text-gray-400">{share(g.v, sessionBase)}</span></h3>
              <Bars cols={["الجلسات", "المشاهدات"]} max={g.items[0]?.[1].v || g.items[0]?.[1].pv || 1} rows={g.items.map(([k, x]) => [sourceLabel(k), x, share(x.v, g.v || 1)])} />
            </div>
          ))}
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">النطاقات المُحيلة</h3>
            <Bars cols={["الجلسات", "المشاهدات"]} max={refs[0]?.[1].v || 1} rows={refs.map(([k, x]) => [k, x, share(x.v, sessionBase)])} />
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">الحملات (المصدر / الوسيط / الحملة)</h3>
            <Bars cols={["الجلسات", "المشاهدات"]} max={camps[0]?.[1].v || 1} rows={camps.map(([k, x]) => [k.split("|").map((p) => p === "-" ? "—" : p).join(" / "), x])} />
          </div>
        </div>
      </section>

      <section id="an-geo" className="scroll-mt-36">
        <h2 className="text-lg font-bold mb-3">الجغرافيا</h2>
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">الدول</h3>
            <Bars max={countries[0]?.[1].v || 1} rows={countries.slice(0, 20).map(([k, x]) => [`${flag(k)} ${countryName(k)}`, x, share(x.v, visitorBase)])} />
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">المناطق</h3>
            <Bars max={regions[0]?.[1].v || 1} rows={regions.map(([k, x]) => { const [c, r] = k.split("|"); return [`${flag(c)} ${regionName(c, r)}`, x, share(x.v, visitorBase)]; })} />
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">المدن</h3>
            <Bars max={cities[0]?.[1].v || 1} rows={cities.map(([k, x]) => { const [c, ci] = k.split("|"); return [`${flag(c)} ${ci === "?" ? "غير معروف" : ci}`, x, share(x.v, visitorBase)]; })} />
          </div>
        </div>
      </section>

      <section id="an-tech" className="scroll-mt-36">
        <h2 className="text-lg font-bold mb-3">التقنية</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border p-4"><h3 className="font-bold mb-2">نوع الجهاز</h3><Bars max={devices[0]?.[1].v || devices[0]?.[1].pv || 1} rows={devices.map(([k, x]) => [DEVICE_LABELS[k] || k, x, share(x.v || x.pv, visitorBase)])} /></div>
          <div className="rounded-xl border p-4"><h3 className="font-bold mb-2">نظام التشغيل</h3><Bars max={oses[0]?.[1].v || 1} rows={oses.map(([k, x]) => [k, x, share(x.v || x.pv, visitorBase)])} /></div>
          <div className="rounded-xl border p-4"><h3 className="font-bold mb-2">المتصفح</h3><Bars max={browsers[0]?.[1].v || 1} rows={browsers.map(([k, x]) => [k, x, share(x.v || x.pv, visitorBase)])} /></div>
          <div className="rounded-xl border p-4"><h3 className="font-bold mb-2">مقاس الشاشة</h3><Bars max={screens[0]?.[1].v || 1} rows={screens.map(([k, x]) => [SCREEN_LABELS[k] || k, x, share(x.v || x.pv, visitorBase)])} /></div>
          <div className="rounded-xl border p-4 md:col-span-2"><h3 className="font-bold mb-2">اللغة</h3><Bars max={langs[0]?.[1].v || 1} rows={langs.map(([k, x]) => [langName(k), x, share(x.v || x.pv, visitorBase)])} /></div>
        </div>
      </section>

      <section id="an-pages" className="scroll-mt-36">
        <h2 className="text-lg font-bold mb-1">الصفحات</h2>
        <p className="text-xs text-gray-500 mb-3">متوسط الوقت وعمق التمرير من الصفحات التي قيست بعد التحديث{measured ? ` (${nf.format(measured)} مشاهدة مقاسة)` : ""}.</p>
        <div className="rounded-xl border p-3 sm:p-4 mb-4 overflow-x-auto">
          <h3 className="font-bold mb-2">أكثر الصفحات زيارة</h3>
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-gray-500 text-xs"><th className="text-right font-medium pb-2">الصفحة</th><th className="pb-2">مشاهدات</th><th className="pb-2">زوار</th><th className="pb-2">متوسط الوقت</th><th className="pb-2">خروج</th></tr></thead>
            <tbody>
              {pages.length ? pages.map(([k, x]) => {
                const base = mp[k] || 0;
                const maxPv = pages[0][1].pv || 1;
                return (
                  <tr key={k} className="border-t">
                    <td className="py-2 pl-2">
                      <div className="flex items-center justify-between gap-2"><span className="font-medium truncate">{pageName(k)}</span><span className="text-xs text-gray-400 shrink-0" dir="ltr">{decodeURIComponent(k)}</span></div>
                      <div className="h-1.5 rounded bg-gray-100 mt-1 overflow-hidden"><div className="h-full rounded" style={{ width: `${Math.max(3, (x.pv / maxPv) * 100)}%`, background: "linear-gradient(90deg,#7a4b2a,#c9a24a)" }} /></div>
                    </td>
                    <td className="text-center font-bold tabular-nums">{nf.format(x.pv)}</td>
                    <td className="text-center tabular-nums">{nf.format(x.v)}</td>
                    <td className="text-center tabular-nums" dir="ltr">{base ? fmtDur((pt[k] || 0) / base) : "—"}</td>
                    <td className="text-center tabular-nums">{base ? pct(Math.min(1, Math.max(0, xp[k] || 0) / base)) : nf.format(Math.max(0, xp[k] || 0))}</td>
                  </tr>
                );
              }) : <tr><td colSpan={5} className="text-center text-gray-500 py-6">لا توجد بيانات في هذه الفترة</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">صفحات الهبوط</h3>
            {landings.length ? <table className="w-full text-sm"><tbody>{landings.map(([k, n]) => <tr key={k} className="border-t"><td className="py-2 truncate">{pageName(k)}</td><td className="text-center font-bold w-16">{nf.format(n)}</td><td className="text-center text-xs text-gray-400 w-12">{share(n, totals.ses || n)}</td></tr>)}</tbody></table> : <p className="text-sm text-gray-500 py-4 text-center">لا توجد جلسات مفصّلة بعد</p>}
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">صفحات الخروج</h3>
            {exits.length ? <table className="w-full text-sm"><tbody>{exits.map(([k, n]) => <tr key={k} className="border-t"><td className="py-2 truncate">{pageName(k)}</td><td className="text-center font-bold w-16">{nf.format(n)}</td><td className="text-center text-xs text-gray-400 w-12">{share(n, totals.ses || n)}</td></tr>)}</tbody></table> : <p className="text-sm text-gray-500 py-4 text-center">لا توجد جلسات مفصّلة بعد</p>}
          </div>
        </div>
        <div className="rounded-xl border p-4 mb-6">
          <h3 className="font-bold mb-2">عمق التمرير</h3>
          {measured ? (
            <>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {scrollAll.map((s) => (
                  <div key={s.n} className="text-center">
                    <div className="text-xs text-gray-500">{s.n}%</div>
                    <div className="h-16 flex items-end justify-center"><div className="w-8 rounded-t" style={{ height: `${Math.max(4, (s.v / measured) * 100)}%`, background: "#7a4b2a" }} /></div>
                    <div className="text-sm font-bold">{Math.round((s.v / measured) * 100)}%</div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead><tr className="text-xs text-gray-500"><th className="text-right pb-2">الصفحة</th><th>25%</th><th>50%</th><th>75%</th><th>100%</th></tr></thead>
                  <tbody>
                    {pages.slice(0, 10).map(([k]) => {
                      const base = mp[k] || 0;
                      return <tr key={k} className="border-t"><td className="py-2 truncate">{pageName(k)}</td>{[25, 50, 75, 100].map((n) => <td key={n} className="text-center">{base ? `${Math.round(((sd[`${k}|${n}`] || 0) / base) * 100)}%` : "—"}</td>)}</tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : <p className="text-sm text-gray-500 py-4 text-center">سيظهر عمق التمرير مع أول زيارات بعد هذا التحديث</p>}
        </div>
      </section>

      <section id="an-conv" className="scroll-mt-36">
        <h2 className="text-lg font-bold mb-1">التحويلات</h2>
        <p className="text-xs text-gray-500 mb-3">نقرة واتساب أو اتصال، بما فيها الزر العائم. القمع: زيارة، ثم مشاهدة صفحة خدمة أو مدينة، ثم نقرة تواصل داخل الجلسة.</p>
        <div className="rounded-xl border p-4 mb-4">
          <h3 className="font-bold mb-3">قمع بسيط</h3>
          <div className="space-y-3">
            {funnel.map((s, i) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1"><span>{i + 1}. {s.label}</span><span className="font-bold tabular-nums">{nf.format(s.n)}{visitN ? ` · ${Math.round((s.n / visitN) * 100)}%` : ""}</span></div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(s.n ? 4 : 0, (s.n / funnelMax) * 100)}%`, background: i === 2 ? "#0f766e" : "linear-gradient(90deg,#7a4b2a,#c9a24a)" }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-2">
          <div className="rounded-xl border p-4 overflow-x-auto">
            <h3 className="font-bold mb-2">حسب الصفحة</h3>
            {[...pageConv.entries()].filter(([, x]) => x.wa || x.call).sort((a, b) => b[1].wa + b[1].call - a[1].wa - a[1].call).length ? (
              <table className="w-full text-sm"><thead><tr className="text-xs text-gray-500"><th className="text-right pb-2">الصفحة</th><th>واتساب</th><th>اتصال</th></tr></thead><tbody>
                {[...pageConv.entries()].filter(([, x]) => x.wa || x.call).sort((a, b) => b[1].wa + b[1].call - a[1].wa - a[1].call).slice(0, 20).map(([k, x]) => <tr key={k} className="border-t"><td className="py-2 truncate">{pageName(k)}</td><td className="text-center font-bold">{nf.format(x.wa)}</td><td className="text-center font-bold">{nf.format(x.call)}</td></tr>)}
              </tbody></table>
            ) : <p className="text-sm text-gray-500 py-4 text-center">لا نقرات مرتبطة بصفحة بعد</p>}
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">حسب المصدر</h3>
            {[...srcConv.entries()].some(([, x]) => x.wa || x.call) ? (
              <table className="w-full text-sm"><thead><tr className="text-xs text-gray-500"><th className="text-right pb-2">المصدر</th><th>واتساب</th><th>اتصال</th></tr></thead><tbody>
                {[...srcConv.entries()].filter(([, x]) => x.wa || x.call).sort((a, b) => b[1].wa + b[1].call - a[1].wa - a[1].call).map(([k, x]) => <tr key={k} className="border-t"><td className="py-2">{sourceLabel(k)}</td><td className="text-center font-bold">{nf.format(x.wa)}</td><td className="text-center font-bold">{nf.format(x.call)}</td></tr>)}
              </tbody></table>
            ) : <p className="text-sm text-gray-500 py-4 text-center">لا نقرات في هذه الفترة</p>}
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-bold mb-2">حسب المدينة</h3>
            {[...cityConv.entries()].some(([, x]) => x.wa || x.call) ? (
              <table className="w-full text-sm"><thead><tr className="text-xs text-gray-500"><th className="text-right pb-2">المدينة</th><th>واتساب</th><th>اتصال</th></tr></thead><tbody>
                {[...cityConv.entries()].filter(([, x]) => x.wa || x.call).sort((a, b) => b[1].wa + b[1].call - a[1].wa - a[1].call).slice(0, 20).map(([k, x]) => { const [c, ...rest] = k.split("|"); const name = rest.join("|"); return <tr key={k} className="border-t"><td className="py-2 truncate">{flag(c)} {name === "?" ? "غير معروف" : name}</td><td className="text-center font-bold">{nf.format(x.wa)}</td><td className="text-center font-bold">{nf.format(x.call)}</td></tr>; })}
              </tbody></table>
            ) : <p className="text-sm text-gray-500 py-4 text-center">لا نقرات مرتبطة بمدينة بعد</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
