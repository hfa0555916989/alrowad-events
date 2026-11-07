"use client";
import { useEffect, useMemo, useState } from "react";

type Counts = { v: number; pv: number };
type Day = { d: string; v: number; pv: number; c: Record<string, Counts>; r: Record<string, Counts>; ci: Record<string, Counts>; p: Record<string, Counts>; s?: Record<string, Counts>; rd?: Record<string, Counts>; cp?: Record<string, Counts>; e?: Record<string, number>; es?: Record<string, number> };
type Mode = "today" | "7d" | "30d" | "month" | "year" | "custom";

const TZ = "Asia/Riyadh";
const dk = (t: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
const addDays = (s: string, n: number) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const flag = (cc: string) => /^[A-Z]{2}$/.test(cc) && cc !== "XX" ? String.fromCodePoint(...[...cc].map((ch) => 0x1f1a5 + ch.charCodeAt(0))) : "🌐";
let dn: Intl.DisplayNames | null = null;
const countryName = (cc: string) => { if (!/^[A-Z]{2}$/.test(cc) || cc === "XX") return "غير معروف"; try { dn ||= new Intl.DisplayNames(["ar"], { type: "region" }); return dn.of(cc) || cc; } catch { return cc; } };
const SA_REGIONS: Record<string, string> = { "01": "منطقة الرياض", "02": "منطقة مكة المكرمة", "03": "منطقة المدينة المنورة", "04": "المنطقة الشرقية", "05": "منطقة القصيم", "06": "منطقة حائل", "07": "منطقة تبوك", "08": "منطقة الحدود الشمالية", "09": "منطقة جازان", "10": "منطقة نجران", "11": "منطقة الباحة", "12": "منطقة الجوف", "14": "منطقة عسير" };
const regionName = (cc: string, r: string) => (r === "?" ? "غير معروف" : cc === "SA" && SA_REGIONS[r] ? SA_REGIONS[r] : r);
const PAGE_NAMES: Record<string, string> = { "/": "الرئيسية", "/about": "من نحن", "/contact": "تواصل معنا", "/services": "الخدمات", "/cities": "مدن الخدمة" };
export const SOURCE_NAMES: Record<string, string> = { google: "🔍 قوقل بحث", gads: "📢 إعلانات قوقل", search: "🔎 محركات بحث أخرى", snap: "👻 سناب شات", ig: "📸 انستقرام", tiktok: "🎵 تيك توك", x: "✖️ إكس / تويتر", fb: "📘 فيسبوك", wa: "💬 واتساب", yt: "▶️ يوتيوب", email: "✉️ البريد", direct: "🔗 دخول مباشر", other: "🌐 مواقع أخرى" };
const nf = new Intl.NumberFormat("ar-SA");
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function sumMap(days: Day[], key: "c" | "r" | "ci" | "p" | "s" | "rd" | "cp") {
  const m: Record<string, Counts> = {};
  for (const d of days) for (const [k, x] of Object.entries(d[key] || {})) { const y = (m[k] ||= { v: 0, pv: 0 }); y.v += x.v; y.pv += x.pv; }
  return Object.entries(m).sort((a, b) => b[1].v - a[1].v || b[1].pv - a[1].pv);
}

function Bars({ rows, max, cols = ["الزوار", "المشاهدات"], name = "الاسم" }: { rows: [string, Counts, string?][]; max: number; cols?: [string, string]; name?: string }) {
  if (!rows.length) return <p className="text-sm text-gray-500 py-6 text-center">لا توجد بيانات في هذه الفترة</p>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-gray-500 text-xs"><th className="text-right font-medium pb-2">{name}</th><th className="font-medium pb-2 w-20">{cols[0]}</th><th className="font-medium pb-2 w-24">{cols[1]}</th></tr></thead>
      <tbody>
        {rows.map(([label, x, sub], i) => (
          <tr key={label + i} className="border-t">
            <td className="py-2 pl-2">
              <div className="flex items-center justify-between gap-2"><span className="truncate">{label}</span>{sub && <span className="text-xs text-gray-400 shrink-0">{sub}</span>}</div>
              <div className="h-1.5 rounded bg-gray-100 mt-1 overflow-hidden"><div className="h-full rounded" style={{ width: `${Math.max(3, (x.v / (max || 1)) * 100)}%`, background: "linear-gradient(90deg,#7a4b2a,#c9a24a)" }} /></div>
            </td>
            <td className="text-center font-bold">{nf.format(x.v)}</td>
            <td className="text-center text-gray-600">{nf.format(x.pv)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Trend({ series, monthly }: { series: { label: string; v: number; pv: number }[]; monthly: boolean }) {
  const W = 760, H = 220, P = 30;
  const max = Math.max(1, ...series.map((s) => s.pv));
  const bw = (W - P * 2) / Math.max(1, series.length);
  const y = (n: number) => H - P - (n / max) * (H - P * 2);
  const line = series.map((s, i) => `${i ? "L" : "M"}${P + bw * i + bw / 2},${y(s.v)}`).join(" ");
  const step = Math.ceil(series.length / 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="الزوار عبر الزمن">
      {[0, 0.5, 1].map((f) => <g key={f}><line x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="#eee" /><text x={W - P + 4} y={y(max * f) + 4} fontSize="10" fill="#999">{Math.round(max * f)}</text></g>)}
      {series.map((s, i) => (
        <g key={i}>
          <rect x={P + bw * i + bw * 0.15} y={y(s.pv)} width={bw * 0.7} height={H - P - y(s.pv)} rx="2" fill="#c9a24a" opacity=".35"><title>{`${s.label}: ${s.pv} مشاهدة، ${s.v} زائر`}</title></rect>
          {i % step === 0 && <text x={P + bw * i + bw / 2} y={H - 10} fontSize="10" textAnchor="middle" fill="#888">{s.label}</text>}
        </g>
      ))}
      <path d={line} fill="none" stroke="#7a4b2a" strokeWidth="2.5" />
      {series.map((s, i) => <circle key={i} cx={P + bw * i + bw / 2} cy={y(s.v)} r={series.length > 40 ? 1.5 : 3} fill="#7a4b2a" />)}
      <text x={P} y={14} fontSize="11" fill="#7a4b2a">● الزوار</text><text x={P + 70} y={14} fontSize="11" fill="#c9a24a">■ المشاهدات</text>
      {monthly && null}
    </svg>
  );
}

export default function Analytics({ names = {} }: { names?: Record<string, string> }) {
  const today = dk(new Date());
  const [mode, setMode] = useState<Mode>("7d");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [year, setYear] = useState(today.slice(0, 4));
  const [from, setFrom] = useState(addDays(today, -29));
  const [to, setTo] = useState(today);
  const [country, setCountry] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const range = useMemo((): [string, string] => {
    if (mode === "today") return [today, today];
    if (mode === "7d") return [addDays(today, -6), today];
    if (mode === "30d") return [addDays(today, -29), today];
    if (mode === "month") { const [y, m] = month.split("-").map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); return [`${month}-01`, `${month}-${String(last).padStart(2, "0")}`]; }
    if (mode === "year") return [`${year}-01-01`, `${year}-12-31`];
    return from <= to ? [from, to] : [to, from];
  }, [mode, month, year, from, to, today]);

  useEffect(() => {
    let off = false;
    setLoading(true); setErr("");
    fetch(`/api/admin/analytics?from=${range[0]}&to=${range[1]}`).then((r) => r.ok ? r.json() : Promise.reject(r.status)).then((j) => { if (!off) setDays(j.days || []); }).catch((e) => !off && setErr("تعذر تحميل الإحصائيات (" + e + ")")).finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [range]);

  const totals = days.reduce((a, d) => ({ v: a.v + d.v, pv: a.pv + d.pv }), { v: 0, pv: 0 });
  const countries = sumMap(days, "c");
  const filt = (rows: [string, Counts][]) => rows.filter(([k]) => !country || k.startsWith(country + "|"));
  const regions = filt(sumMap(days, "r")).slice(0, 15);
  const cities = filt(sumMap(days, "ci")).slice(0, 15);
  const pages = sumMap(days, "p").sort((a, b) => b[1].pv - a[1].pv).slice(0, 20);
  const sources = sumMap(days, "s");
  const refs = sumMap(days, "rd").slice(0, 20);
  const camps = sumMap(days, "cp").slice(0, 20);
  const ev = days.reduce((m, d) => { for (const [k, n] of Object.entries(d.e || {})) m[k] = (m[k] || 0) + n; return m; }, {} as Record<string, number>);
  const evSrc = days.reduce((m, d) => { for (const [k, n] of Object.entries(d.es || {})) { const [e, src] = k.split("|"); const x = (m[src] ||= { wa: 0, call: 0 }); x[e as "wa" | "call"] = (x[e as "wa" | "call"] || 0) + n; } return m; }, {} as Record<string, { wa: number; call: number }>);
  const sessions = sources.reduce((a, [, x]) => a + x.v, 0);
  const pageName = (k: string) => names[k] || PAGE_NAMES[k] || decodeURIComponent(k);
  const yearly = mode === "year";
  const series = useMemo(() => {
    const byDay = new Map(days.map((d) => [d.d, d]));
    if (yearly) return AR_MONTHS.map((label, i) => { const pre = `${year}-${String(i + 1).padStart(2, "0")}`; const ds = days.filter((d) => d.d.startsWith(pre)); return { label, v: ds.reduce((a, d) => a + d.v, 0), pv: ds.reduce((a, d) => a + d.pv, 0) }; });
    const out = []; let cur = range[0]; let guard = 0;
    while (cur <= range[1] && guard++ < 400) { const d = byDay.get(cur); out.push({ label: cur.slice(5).replace("-", "/"), v: d?.v || 0, pv: d?.pv || 0 }); cur = addDays(cur, 1); }
    return out;
  }, [days, range, yearly, year]);
  const years = Array.from({ length: 5 }, (_, i) => String(Number(today.slice(0, 4)) - i));
  const btn = (m: Mode, l: string) => <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-full text-sm border ${mode === m ? "bg-gray-900 text-white border-gray-900" : "bg-white"}`}>{l}</button>;
  const card = (l: string, n: number | string, sub?: string) => <div className="rounded-xl border p-4 bg-gradient-to-br from-white to-yellow-50"><div className="text-xs text-gray-500">{l}</div><div className="text-3xl font-bold mt-1">{typeof n === "number" ? nf.format(n) : n}</div>{sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {btn("today", "اليوم")}{btn("7d", "آخر 7 أيام")}{btn("30d", "آخر 30 يوم")}{btn("month", "شهري")}{btn("year", "سنوي")}{btn("custom", "فترة مخصصة")}
        {mode === "month" && <input type="month" className="inp !w-auto" value={month} max={today.slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} />}
        {mode === "year" && <select className="inp !w-auto" value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</select>}
        {mode === "custom" && <><input type="date" className="inp !w-auto" value={from} max={today} onChange={(e) => setFrom(e.target.value)} /><span>إلى</span><input type="date" className="inp !w-auto" value={to} max={today} onChange={(e) => setTo(e.target.value)} /></>}
        {loading && <span className="text-sm text-gray-500">جاري التحميل…</span>}
      </div>
      <p className="text-xs text-gray-500 mb-4">الفترة: {range[0]} — {range[1]} (بتوقيت الرياض). الزائر = متصفح واحد في اليوم. لا تُحفظ أي بيانات شخصية، ولا تُحتسب زيارات محركات البحث أو لوحة التحكم.</p>
      {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {card("الزوار", totals.v)}{card("مشاهدات الصفحات", totals.pv)}{card("الدول", countries.filter(([k]) => k !== "XX").length)}{card("مشاهدات لكل زائر", totals.v ? (totals.pv / totals.v).toFixed(1) : "0")}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {card("💬 نقرات واتساب", ev.wa || 0, `منها الزر العائم: ${nf.format(ev.wa_float || 0)}`)}{card("📞 نقرات الاتصال", ev.call || 0, `منها الزر العائم: ${nf.format(ev.call_float || 0)}`)}
        {card("إجمالي التواصل", (ev.wa || 0) + (ev.call || 0))}{card("نسبة التحويل", totals.v ? (((ev.wa || 0) + (ev.call || 0)) / totals.v * 100).toFixed(1) + "%" : "0%", "نقرات التواصل ÷ الزوار")}
      </div>
      <div className="rounded-xl border p-4 mb-6"><h3 className="font-bold mb-2">{yearly ? "الزوار حسب الشهر" : "الزوار يومياً"}</h3><Trend series={series} monthly={yearly} /></div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-3">الدول</h3>
          <Bars rows={countries.slice(0, 20).map(([k, x]) => [`${flag(k)} ${countryName(k)}`, x, totals.v ? Math.round((x.v / totals.v) * 100) + "%" : ""])} max={countries[0]?.[1].v || 1} />
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="font-bold">المناطق</h3>
            <select className="inp !w-auto text-sm" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">كل الدول</option>{countries.map(([k]) => <option key={k} value={k}>{flag(k)} {countryName(k)}</option>)}
            </select>
          </div>
          <Bars rows={regions.map(([k, x]) => { const [cc, r] = k.split("|"); return [`${country ? "" : flag(cc) + " "}${regionName(cc, r)}`, x]; })} max={regions[0]?.[1].v || 1} />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-3">المدن</h3>
          <Bars rows={cities.map(([k, x]) => { const [cc, ci] = k.split("|"); return [`${country ? "" : flag(cc) + " "}${ci === "?" ? "غير معروف" : ci}`, x]; })} max={cities[0]?.[1].v || 1} />
        </div>
        <div className="rounded-xl border p-4 md:col-span-2">
          <h3 className="font-bold mb-3">أكثر الصفحات زيارة</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs"><th className="text-right font-medium pb-2">الصفحة</th><th className="font-medium pb-2 w-28">مشاهدات الصفحة</th><th className="font-medium pb-2 w-28">زوار فريدون</th></tr></thead>
            <tbody>
              {pages.length ? pages.map(([k, x]) => (
                <tr key={k} className="border-t">
                  <td className="py-2 pl-2"><div className="flex items-center justify-between gap-2"><span className="truncate font-medium">{pageName(k)}</span><span className="text-xs text-gray-400 shrink-0" dir="ltr">{decodeURIComponent(k)}</span></div>
                    <div className="h-1.5 rounded bg-gray-100 mt-1 overflow-hidden"><div className="h-full rounded" style={{ width: `${Math.max(3, (x.pv / (pages[0][1].pv || 1)) * 100)}%`, background: "linear-gradient(90deg,#7a4b2a,#c9a24a)" }} /></div></td>
                  <td className="text-center font-bold">{nf.format(x.pv)}</td><td className="text-center text-gray-600">{nf.format(x.v)}</td>
                </tr>)) : <tr><td colSpan={3} className="text-center text-gray-500 py-6">لا توجد بيانات في هذه الفترة</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-10 mb-1">مصادر الزيارات (الإحالة)</h2>
      <p className="text-xs text-gray-500 mb-4">الزيارة = جلسة تصفح بدأت من هذا المصدر. واتساب وسناب غالباً لا يرسلان مصدراً فتظهر زياراتهما ضمن «دخول مباشر» — استخدم روابط فيها utm_source (مثال: ?utm_source=snapchat&amp;utm_campaign=ramadan) لتمييزها.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-3">المصادر</h3>
          <Bars name="المصدر" cols={["الزيارات", "المشاهدات"]} rows={sources.map(([k, x]) => [SOURCE_NAMES[k] || k, x, sessions ? Math.round((x.v / sessions) * 100) + "%" : ""])} max={sources[0]?.[1].v || 1} />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-3">التواصل حسب المصدر</h3>
          {Object.keys(evSrc).length ? (
            <table className="w-full text-sm"><thead><tr className="text-gray-500 text-xs"><th className="text-right font-medium pb-2">المصدر</th><th className="font-medium pb-2 w-24">واتساب</th><th className="font-medium pb-2 w-24">اتصال</th></tr></thead>
              <tbody>{Object.entries(evSrc).sort((a, b) => b[1].wa + b[1].call - a[1].wa - a[1].call).map(([k, x]) => <tr key={k} className="border-t"><td className="py-2">{SOURCE_NAMES[k] || k}</td><td className="text-center font-bold">{nf.format(x.wa || 0)}</td><td className="text-center font-bold">{nf.format(x.call || 0)}</td></tr>)}</tbody></table>
          ) : <p className="text-sm text-gray-500 py-6 text-center">لا توجد نقرات تواصل في هذه الفترة</p>}
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-3">أكثر المواقع المُحيلة</h3>
          <Bars name="النطاق" cols={["الزيارات", "المشاهدات"]} rows={refs.map(([k, x]) => [k, x])} max={refs[0]?.[1].v || 1} />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-3">الحملات (UTM)</h3>
          <Bars name="المصدر / الوسيط / الحملة" cols={["الزيارات", "المشاهدات"]} rows={camps.map(([k, x]) => [k.split("|").map((p) => p === "-" ? "—" : p).join(" / "), x])} max={camps[0]?.[1].v || 1} />
        </div>
      </div>
    </div>
  );
}
