"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Src = { ref: string; us: string; um: string; uc: string };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
function send(body: object) {
  fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
}
/** Source of this browser session: external referrer + utm_* of the landing URL (stored in sessionStorage, nothing personal). */
function session(): [Src, boolean] {
  try {
    const old = sessionStorage.getItem("rv_src");
    if (old) return [JSON.parse(old), false];
  } catch {}
  const q = new URLSearchParams(location.search);
  let ref = "";
  try { const h = new URL(document.referrer).hostname; if (h && h !== location.hostname) ref = document.referrer; } catch {}
  const s: Src = { ref, us: q.get("utm_source") || "", um: q.get("utm_medium") || "", uc: q.get("utm_campaign") || "" };
  try { sessionStorage.setItem("rv_src", JSON.stringify(s)); } catch {}
  return [s, true];
}
function newPageToday(path: string) {
  try {
    const d = today(); const raw = JSON.parse(localStorage.getItem("rv_pages") || "{}");
    const seen: string[] = raw.d === d ? raw.p || [] : [];
    if (seen.includes(path)) return false;
    localStorage.setItem("rv_pages", JSON.stringify({ d, p: [...seen, path].slice(-60) }));
    return true;
  } catch { return true; }
}
const off = () => (navigator as Navigator & { webdriver?: boolean }).webdriver || location.pathname.startsWith("/admin552255");

export default function Tracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || off()) return;
    const [s, land] = session();
    send({ path, ...s, land, np: newPageToday(path) });
  }, [path]);
  useEffect(() => {
    // conversion events: clicks on WhatsApp / call links anywhere on the site
    const h = (e: MouseEvent) => {
      if (off()) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const ev = /wa\.me|whatsapp/i.test(href) ? "wa" : href.startsWith("tel:") ? "call" : "";
      if (ev) send({ event: ev, float: !!a.closest("[data-float]"), ...session()[0] });
    };
    document.addEventListener("click", h, true);
    return () => document.removeEventListener("click", h, true);
  }, []);
  return null;
}
