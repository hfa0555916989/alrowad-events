"use client";
import { useState } from "react";
import { upload } from "@vercel/blob/client";
import type { Content, Item, Media, FontKey, Service, PageSeo, CityPage } from "../lib/types";
import Analytics from "./Analytics";
import PasswordForm from "./PasswordForm";
import { FONT_OPTIONS } from "../lib/fontOptions";

type Tab = "analytics" | "seo" | "services" | "cityPages" | "identity" | "media" | "content" | "lists" | "password";
const TABS: [Tab, string][] = [["analytics", "📊 الزوار"], ["seo", "السيو SEO"], ["identity", "الهوية والشعار"], ["media", "الصور والفيديو"], ["services", "الخدمات وصفحاتها"], ["cityPages", "صفحات المدن"], ["content", "النصوص والتواصل"], ["lists", "المدن والمشاريع والأرقام والآراء"], ["password", "🔒 تغيير كلمة المرور"]];

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block mb-4"><span className="block text-sm font-semibold mb-1">{label}</span>{children}</label>;
}
function T({ v, on, area }: { v: string; on: (s: string) => void; area?: boolean }) {
  return area ? <textarea className="inp min-h-24" value={v} onChange={(e) => on(e.target.value)} /> : <input className="inp" value={v} onChange={(e) => on(e.target.value)} />;
}
async function doUpload(file: File, folder: string, onProgress?: (p: number) => void) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const b = await upload(`${folder}/${safe}`, file, { access: "public", handleUploadUrl: "/api/admin/upload", multipart: file.size > 20 * 1024 * 1024, onUploadProgress: (e) => onProgress?.(Math.round(e.percentage)) });
  return b.url;
}
function ImgField({ label, v, on, folder }: { label: string; v: string; on: (s: string) => void; folder: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <F label={label}>
      <div className="flex items-center gap-3 flex-wrap">
        {v && <img src={v} alt="" className="h-16 w-auto rounded border bg-gray-200" />}
        <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); try { on(await doUpload(f, folder)); } catch (er) { alert("فشل الرفع: " + (er as Error).message); } setBusy(false); }} />
        {busy && <span>جاري الرفع...</span>}
        {v && <button type="button" className="text-red-600 text-sm" onClick={() => on("")}>حذف</button>}
      </div>
    </F>
  );
}
function PageSeoFields({ v, on, folder }: { v: PageSeo; on: (p: Partial<PageSeo>) => void; folder: string }) {
  return (
    <div className="border-r-4 border-yellow-500 pr-3 mt-2">
      <F label="عنوان الصفحة في قوقل (SEO Title)"><T v={v.seoTitle || ""} on={(s) => on({ seoTitle: s })} /></F>
      <F label="وصف الصفحة في قوقل (Meta Description)"><T area v={v.seoDesc || ""} on={(s) => on({ seoDesc: s })} /></F>
      <ImgField label="صورة المشاركة لهذه الصفحة (اختياري)" folder={folder} v={v.ogImage || ""} on={(s) => on({ ogImage: s })} />
    </div>
  );
}
function GalleryField({ v, on, folder }: { v: string[]; on: (x: string[]) => void; folder: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <F label="صور الخدمة (يفضل 2–4 صور)">
      <div className="flex flex-wrap gap-2 mb-2">
        {v.map((u, i) => <div key={u + i} className="relative"><img src={u} alt="" className="h-20 w-20 object-cover rounded" /><button type="button" className="absolute -top-2 -left-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs" onClick={() => on(v.filter((_, j) => j !== i))}>×</button></div>)}
      </div>
      <input type="file" multiple accept="image/*" onChange={async (e) => { const fs = Array.from(e.target.files || []); if (!fs.length) return; setBusy(true); const out = [...v]; for (const f of fs) { try { out.push(await doUpload(f, folder)); on([...out]); } catch (er) { alert("فشل الرفع: " + (er as Error).message); } } setBusy(false); }} />
      {busy && <span className="mr-2">جاري الرفع...</span>}
    </F>
  );
}
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "service";
function ServiceList({ items, set }: { items: Service[]; set: (m: Service[]) => void }) {
  const ch = (i: number, p: Partial<Service>) => set(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <details key={i} className="border rounded-lg p-3 bg-gray-50" open={i === 0}>
          <summary className="font-bold cursor-pointer">{it.title} <span className="text-xs text-gray-500" dir="ltr">/services/{it.slug}</span></summary>
          <div className="mt-3">
            <F label="اسم الخدمة"><T v={it.title} on={(s) => ch(i, { title: s })} /></F>
            <F label="رابط الصفحة (بالإنجليزي بدون مسافات)"><input dir="ltr" className="inp" value={it.slug} onChange={(e) => ch(i, { slug: slugify(e.target.value) })} /></F>
            <F label="وصف مختصر"><T area v={it.desc} on={(s) => ch(i, { desc: s })} /></F>
            <F label="تفاصيل الخدمة (كل سطر نقطة)"><T area v={it.points || ""} on={(s) => ch(i, { points: s })} /></F>
            <F label="عبارة مميزة (اختياري)"><T v={it.highlight || ""} on={(s) => ch(i, { highlight: s })} /></F>
            <ImgField label="الصورة الرئيسية" folder="services" v={it.image || ""} on={(s) => ch(i, { image: s })} />
            <GalleryField folder="services" v={it.images || []} on={(x) => ch(i, { images: x })} />
            <PageSeoFields folder="seo" v={it} on={(p) => ch(i, p)} />
            <div className="flex gap-3 text-sm mt-2">
              <button type="button" onClick={() => set(move(items, i, -1))}>⬆️</button>
              <button type="button" onClick={() => set(move(items, i, 1))}>⬇️</button>
              <button type="button" className="text-red-600 mr-auto" onClick={() => confirm("حذف الخدمة وصفحتها؟") && set(items.filter((_, j) => j !== i))}>🗑 حذف</button>
            </div>
          </div>
        </details>
      ))}
      <button type="button" className="bg-green-600 text-white rounded px-4 py-2" onClick={() => set([...items, { title: "خدمة جديدة", slug: "new-service-" + (items.length + 1), desc: "", points: "", images: [], highlight: "", image: "", seoTitle: "", seoDesc: "", ogImage: "" }])}>+ إضافة خدمة</button>
    </div>
  );
}
function CityList({ items, set }: { items: CityPage[]; set: (m: CityPage[]) => void }) {
  const ch = (i: number, p: Partial<CityPage>) => set(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <details key={i} className="border rounded-lg p-3 bg-gray-50" open={i === 0}>
          <summary className="font-bold cursor-pointer">{it.title} <span className="text-xs text-gray-500" dir="ltr">/cities/{it.slug}</span></summary>
          <div className="mt-3">
            <F label="اسم المدينة"><T v={it.name} on={(s) => ch(i, { name: s })} /></F>
            <F label="عنوان الصفحة (H1) — مثل: قهوجيين الرياض"><T v={it.title} on={(s) => ch(i, { title: s })} /></F>
            <F label="رابط الصفحة (بالإنجليزي بدون مسافات)"><input dir="ltr" className="inp" value={it.slug} onChange={(e) => ch(i, { slug: slugify(e.target.value) })} /></F>
            <F label="مقدمة قصيرة"><T area v={it.intro} on={(s) => ch(i, { intro: s })} /></F>
            <F label="النص الرئيسي (اترك سطراً فارغاً بين الفقرات) — اجعله مختلفاً لكل مدينة"><T area v={it.body} on={(s) => ch(i, { body: s })} /></F>
            <F label="مميزات الخدمة في المدينة (كل سطر نقطة)"><T area v={it.points} on={(s) => ch(i, { points: s })} /></F>
            <F label="الأحياء والمناطق (افصل بفاصلة)"><T v={it.areas} on={(s) => ch(i, { areas: s })} /></F>
            <ImgField label="صورة الصفحة" folder="cities" v={it.image} on={(s) => ch(i, { image: s })} />
            <PageSeoFields folder="seo" v={it} on={(p) => ch(i, p)} />
            <div className="flex gap-3 text-sm mt-2">
              <button type="button" onClick={() => set(move(items, i, -1))}>⬆️</button>
              <button type="button" onClick={() => set(move(items, i, 1))}>⬇️</button>
              <button type="button" className="text-red-600 mr-auto" onClick={() => confirm("حذف صفحة المدينة؟") && set(items.filter((_, j) => j !== i))}>🗑 حذف</button>
            </div>
          </div>
        </details>
      ))}
      <button type="button" className="bg-green-600 text-white rounded px-4 py-2" onClick={() => set([...items, { slug: "city-" + (items.length + 1), name: "", title: "قهوجيين ", intro: "", body: "", points: "", areas: "", image: "", seoTitle: "", seoDesc: "", ogImage: "" }])}>+ إضافة مدينة</button>
    </div>
  );
}
const move = <X,>(a: X[], i: number, d: number) => { const b = [...a]; const j = i + d; if (j < 0 || j >= b.length) return b; [b[i], b[j]] = [b[j], b[i]]; return b; };

function MediaList({ kind, items, set }: { kind: "image" | "video"; items: Media[]; set: (m: Media[]) => void }) {
  const [prog, setProg] = useState<string>("");
  async function add(files: FileList | null) {
    if (!files) return;
    const out = [...items];
    for (const f of Array.from(files)) {
      try { const url = await doUpload(f, kind === "image" ? "gallery" : "videos", (p) => setProg(`${f.name}: ${p}%`)); out.push({ url, caption: "", type: f.type }); set([...out]); }
      catch (e) { alert("فشل رفع " + f.name + ": " + (e as Error).message); }
    }
    setProg("");
  }
  return (
    <div>
      <input type="file" multiple accept={kind === "image" ? "image/*" : "video/*"} onChange={(e) => add(e.target.files)} className="mb-2" />
      {prog && <p className="text-sm text-blue-700">جاري الرفع {prog}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
        {items.map((m, i) => (
          <div key={m.url + i} className="border rounded-lg p-2 bg-gray-50">
            {kind === "image" ? <img src={m.url} alt="" className="w-full h-40 object-contain bg-gray-200" /> : <video src={m.url} controls preload="metadata" className="w-full h-40 bg-black" />}
            <input className="inp mt-2" placeholder="وصف / تعليق" value={m.caption} onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
            <div className="flex gap-2 mt-2 text-sm">
              <button type="button" onClick={() => set(move(items, i, -1))}>⬆️ تقديم</button>
              <button type="button" onClick={() => set(move(items, i, 1))}>⬇️ تأخير</button>
              <button type="button" className="text-red-600 mr-auto" onClick={() => confirm("حذف؟") && set(items.filter((_, j) => j !== i))}>🗑 حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ItemList({ items, set, withImage, folder }: { items: Item[]; set: (m: Item[]) => void; withImage?: boolean; folder: string }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="border rounded-lg p-3 bg-gray-50">
          <F label="العنوان"><T v={it.title} on={(s) => set(items.map((x, j) => (j === i ? { ...x, title: s } : x)))} /></F>
          <F label="الوصف"><T area v={it.desc} on={(s) => set(items.map((x, j) => (j === i ? { ...x, desc: s } : x)))} /></F>
          {withImage && <ImgField label="صورة (اختياري)" folder={folder} v={it.image || ""} on={(s) => set(items.map((x, j) => (j === i ? { ...x, image: s } : x)))} />}
          <div className="flex gap-3 text-sm">
            <button type="button" onClick={() => set(move(items, i, -1))}>⬆️</button>
            <button type="button" onClick={() => set(move(items, i, 1))}>⬇️</button>
            <button type="button" className="text-red-600 mr-auto" onClick={() => confirm("حذف؟") && set(items.filter((_, j) => j !== i))}>🗑 حذف</button>
          </div>
        </div>
      ))}
      <button type="button" className="bg-green-600 text-white rounded px-4 py-2" onClick={() => set([...items, { title: "عنصر جديد", desc: "" }])}>+ إضافة</button>
    </div>
  );
}

const TITLE_LABELS: Record<string, string> = { about: "من نحن", services: "الخدمات", cities: "المدن", projects: "المشاريع", why: "لماذا نحن", stats: "الأرقام", testimonials: "آراء العملاء", gallery: "معرض الصور", videos: "الفيديوهات", contact: "تواصل معنا", callNow: "زر الاتصال في الأعلى" };

export default function Dashboard({ initial, blobReady }: { initial: Content; blobReady: boolean }) {
  const [c, setC] = useState<Content>(initial);
  const [tab, setTab] = useState<Tab>("analytics");
  const [msg, setMsg] = useState("");
  const up = <K extends keyof Content>(k: K, v: Partial<Content[K]>) => setC((p) => ({ ...p, [k]: Array.isArray(v) ? v : { ...(p[k] as object), ...v } }));
  async function save() {
    setMsg("جاري الحفظ...");
    const r = await fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(c) });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? "✅ تم الحفظ — التغييرات ظاهرة الآن في الموقع" : "❌ فشل الحفظ: " + (j.error || r.status));
  }
  const i = c.identity;
  return (
    <main className="min-h-screen bg-gray-100 text-gray-900" style={{ fontFamily: "inherit" }}>
      <header className="bg-gray-900 text-white px-4 py-3 flex flex-wrap items-center gap-3 sticky top-0 z-10">
        <h1 className="font-bold text-lg">لوحة التحكم</h1>
        <a href="/" target="_blank" className="text-sm underline">عرض الموقع ↗</a>
        <button onClick={save} className="mr-auto bg-yellow-500 text-black font-bold rounded px-5 py-2">💾 حفظ التغييرات</button>
        <button onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); location.reload(); }} className="text-sm">خروج</button>
      </header>
      {msg && <div className="bg-white border-b px-4 py-2 text-sm">{msg}</div>}
      {!blobReady && <div className="bg-red-100 text-red-800 px-4 py-2 text-sm">تنبيه: لم يتم ربط Vercel Blob (BLOB_READ_WRITE_TOKEN) — لن يعمل الحفظ والرفع.</div>}
      <nav className="flex overflow-x-auto bg-white border-b">
        {TABS.map(([k, v]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-3 whitespace-nowrap ${tab === k ? "border-b-4 border-yellow-500 font-bold" : ""}`}>{v}</button>)}
      </nav>
      <div className={`${tab === "analytics" ? "max-w-7xl" : "max-w-4xl"} mx-auto p-3 sm:p-4`}>
        <div className={`bg-white rounded-xl shadow ${tab === "analytics" ? "p-3 sm:p-5" : "p-5"}`}>
          {tab === "seo" && (<>
            <F label="عنوان الموقع (Title)"><T v={c.seo.title} on={(s) => up("seo", { title: s })} /></F>
            <F label="الوصف (Meta Description)"><T area v={c.seo.description} on={(s) => up("seo", { description: s })} /></F>
            <F label="الكلمات المفتاحية (افصل بفاصلة)"><T area v={c.seo.keywords} on={(s) => up("seo", { keywords: s })} /></F>
            <ImgField label="صورة المشاركة OG Image (1200×630 مفضل)" folder="seo" v={c.seo.ogImage} on={(s) => up("seo", { ogImage: s })} />
            <h3 className="font-bold mt-6 mb-1">صفحة من نحن (/about)</h3>
            <PageSeoFields folder="seo" v={c.pages.about} on={(p) => up("pages", { about: { ...c.pages.about, ...p } })} />
            <h3 className="font-bold mt-6 mb-1">صفحة تواصل معنا (/contact)</h3>
            <PageSeoFields folder="seo" v={c.pages.contact} on={(p) => up("pages", { contact: { ...c.pages.contact, ...p } })} />
            <p className="text-sm text-gray-600 mt-2">إعدادات SEO لكل خدمة في تبويب «الخدمات وصفحاتها»، ولكل مدينة في تبويب «صفحات المدن». خريطة الموقع: <a className="underline" href="/sitemap.xml" target="_blank">/sitemap.xml</a></p>
            <h3 className="font-bold mt-6 mb-3">عناوين الأقسام</h3>
            {Object.keys(TITLE_LABELS).map((k) => <F key={k} label={TITLE_LABELS[k]}><T v={c.titles[k] || ""} on={(s) => up("titles", { [k]: s })} /></F>)}
          </>)}
          {tab === "identity" && (<>
            <p className="text-sm text-gray-600 mb-2">الشعار الافتراضي هو شعار «الرواد» المصمم للموقع. ارفع شعاراً هنا لاستبداله، أو احذفه للرجوع للافتراضي. تحميل الشعار الافتراضي: <a className="underline" href="/logo.png" target="_blank">PNG داكن</a> · <a className="underline" href="/logo-light.png" target="_blank">PNG فاتح</a> · <a className="underline" href="/logo.svg" target="_blank">SVG</a></p>
            <ImgField label="الشعار (Logo)" folder="identity" v={i.logo} on={(s) => up("identity", { logo: s })} />
            <ImgField label="أيقونة المتصفح (Favicon)" folder="identity" v={i.favicon} on={(s) => up("identity", { favicon: s })} />
            <F label={`حجم الشعار — كمبيوتر: ${i.logoSizeDesktop}px`}><input type="range" min={24} max={220} value={i.logoSizeDesktop} onChange={(e) => up("identity", { logoSizeDesktop: +e.target.value })} className="w-full" /></F>
            <F label={`حجم الشعار — جوال: ${i.logoSizeMobile}px`}><input type="range" min={20} max={160} value={i.logoSizeMobile} onChange={(e) => up("identity", { logoSizeMobile: +e.target.value })} className="w-full" /></F>
            <div className="flex gap-6 items-end p-4 rounded mb-4" style={{ background: i.background }}>
              <div className="text-center text-xs text-white">كمبيوتر<br />{i.logo ? <img src={i.logo} style={{ height: i.logoSizeDesktop }} alt="" /> : <img src="/logo.svg" style={{ height: i.logoSizeDesktop }} alt="" />}</div>
              <div className="text-center text-xs text-white">جوال<br />{i.logo ? <img src={i.logo} style={{ height: i.logoSizeMobile }} alt="" /> : <img src="/logo.svg" style={{ height: i.logoSizeMobile }} alt="" />}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {([["primary", "اللون الأساسي"], ["secondary", "اللون الثانوي"], ["background", "الخلفية"], ["surface", "خلفية الأقسام"], ["text", "النص"]] as const).map(([k, l]) => (
                <F key={k} label={l}><input type="color" className="w-full h-10" value={i[k]} onChange={(e) => up("identity", { [k]: e.target.value })} /></F>
              ))}
            </div>
            <F label="خط النصوص"><select className="inp" value={i.font} onChange={(e) => up("identity", { font: e.target.value as FontKey })}>{FONT_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>
            <F label="خط العناوين"><select className="inp" value={i.headingFont} onChange={(e) => up("identity", { headingFont: e.target.value as FontKey })}>{FONT_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>
          </>)}
          {tab === "media" && (<>
            <h3 className="font-bold mb-2">معرض الصور (أي مقاس وأي صيغة)</h3>
            <MediaList kind="image" items={c.gallery} set={(m) => up("gallery", m)} />
            <h3 className="font-bold mt-8 mb-2">الفيديوهات (رفع مباشر لأي حجم — يختفي القسم تلقائياً إذا كان فارغاً)</h3>
            <MediaList kind="video" items={c.videos} set={(m) => up("videos", m)} />
            <ImgField label="صورة خلفية الواجهة الرئيسية" folder="hero" v={c.hero.image} on={(s) => up("hero", { image: s })} />
          </>)}
          {tab === "content" && (<>
            <h3 className="font-bold mb-3">الواجهة الرئيسية</h3>
            <F label="الشارة / اسم النشاط"><T v={c.hero.badge} on={(s) => up("hero", { badge: s })} /></F>
            <F label="العنوان الرئيسي"><T v={c.hero.title} on={(s) => up("hero", { title: s })} /></F>
            <F label="النص التعريفي"><T area v={c.hero.subtitle} on={(s) => up("hero", { subtitle: s })} /></F>
            <F label="نص الزر"><T v={c.hero.cta} on={(s) => up("hero", { cta: s })} /></F>
            <h3 className="font-bold mt-6 mb-3">من نحن</h3>
            <F label="عنوان قسم من نحن"><T v={c.about.title} on={(s) => up("about", { title: s })} /></F>
            <F label="نص من نحن"><T area v={c.about.text} on={(s) => up("about", { text: s })} /></F>
            <F label="نقاط مميزة (كل سطر نقطة)"><T area v={c.about.points} on={(s) => up("about", { points: s })} /></F>
            <ImgField label="صورة / خلفية قسم من نحن" folder="about" v={c.about.image} on={(s) => up("about", { image: s })} />
            <h3 className="font-bold mt-6 mb-3">شريط الدعوة للحجز (CTA)</h3>
            <F label="العنوان"><T v={c.cta.title} on={(s) => up("cta", { title: s })} /></F>
            <F label="النص"><T area v={c.cta.text} on={(s) => up("cta", { text: s })} /></F>
            <ImgField label="صورة الخلفية" folder="cta" v={c.cta.image} on={(s) => up("cta", { image: s })} />
            <h3 className="font-bold mt-6 mb-3">التواصل</h3>
            <F label="رقم الاتصال"><T v={c.contact.phone} on={(s) => up("contact", { phone: s })} /></F>
            <F label="رقم الواتساب"><T v={c.contact.whatsapp} on={(s) => up("contact", { whatsapp: s })} /></F>
            <F label="البريد الإلكتروني"><T v={c.contact.email} on={(s) => up("contact", { email: s })} /></F>
            <F label="العنوان / مناطق الخدمة"><T v={c.contact.address} on={(s) => up("contact", { address: s })} /></F>
            <F label="أوقات العمل"><T v={c.contact.workingHours} on={(s) => up("contact", { workingHours: s })} /></F>
            <h3 className="font-bold mt-6 mb-3">روابط التواصل الاجتماعي</h3>
            {(Object.keys(c.social) as (keyof Content["social"])[]).map((k) => <F key={k} label={k}><T v={c.social[k]} on={(s) => up("social", { [k]: s })} /></F>)}
            <F label="نص التذييل (Footer)"><T v={c.footer.text} on={(s) => up("footer", { text: s })} /></F>
            <h3 className="font-bold mt-6 mb-3">إظهار / إخفاء الأقسام</h3>
            <div className="flex flex-wrap gap-4">{["about", "stats", "services", "cities", "projects", "why", "gallery", "videos", "testimonials"].map((k) => <label key={k} className="flex gap-1"><input type="checkbox" checked={c.sections[k] !== false} onChange={(e) => up("sections", { [k]: e.target.checked })} />{TITLE_LABELS[k]}</label>)}</div>
          </>)}
          {tab === "analytics" && <Analytics names={Object.fromEntries([...c.services.map((x) => [`/services/${x.slug}`, `خدمة: ${x.title}`]), ...c.cityPages.map((x) => [`/cities/${x.slug}`, x.title])])} />}
          {tab === "cityPages" && (<><p className="text-sm text-gray-600 mb-3">كل مدينة لها صفحة خاصة تظهر في قوقل (مثل «قهوجيين الرياض»). اكتب لكل مدينة نصاً مختلفاً حتى لا يعتبره قوقل محتوى مكرراً. لا تنسَ «حفظ التغييرات».</p><CityList items={c.cityPages} set={(m) => up("cityPages", m)} /></>)}
          {tab === "password" && <PasswordForm />}
          {tab === "services" && (<><p className="text-sm text-gray-600 mb-3">كل خدمة لها صفحة خاصة تظهر في قوقل. لا تنسَ الضغط على «حفظ التغييرات».</p><ServiceList items={c.services} set={(m) => up("services", m)} /></>)}
          {tab === "lists" && (<>
            <h3 className="font-bold mb-3">المدن / مناطق الخدمة</h3><ItemList folder="cities" items={c.cities} set={(m) => up("cities", m)} />
            <h3 className="font-bold mt-8 mb-3">المشاريع</h3><ItemList folder="projects" withImage items={c.projects} set={(m) => up("projects", m)} />
            <h3 className="font-bold mt-8 mb-3">لماذا نحن</h3><ItemList folder="why" items={c.why} set={(m) => up("why", m)} />
            <h3 className="font-bold mt-8 mb-3">الأرقام والإحصائيات (العنوان = الرقم مثل 500+، الوصف = التسمية)</h3><ItemList folder="stats" items={c.stats} set={(m) => up("stats", m)} />
            <h3 className="font-bold mt-8 mb-3">آراء العملاء (العنوان = اسم العميل، الوصف = الرأي)</h3><ItemList folder="testimonials" items={c.testimonials} set={(m) => up("testimonials", m)} />
          </>)}
        </div>
        <button onClick={save} className="mt-4 w-full bg-yellow-500 font-bold rounded py-3">💾 حفظ التغييرات</button>
      </div>
    </main>
  );
}
