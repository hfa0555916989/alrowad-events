"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TZ = "Asia/Riyadh";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

function blocked() {
  try {
    if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return true;
    if (location.pathname.startsWith("/admin552255")) return true;
    if (/(?:^|;\s*)rv_off=/.test(document.cookie)) return true;
  } catch { return true; }
  return false;
}

type Src = { ref: string; us: string; um: string; uc: string };
function source(): Src {
  try {
    const old = sessionStorage.getItem("rv_src");
    if (old) return JSON.parse(old) as Src;
  } catch { /* private mode */ }
  const q = new URLSearchParams(location.search);
  let ref = "";
  try {
    const h = new URL(document.referrer).hostname;
    if (h && h !== location.hostname) ref = document.referrer;
  } catch { /* no referrer */ }
  const s: Src = {
    ref,
    us: (q.get("utm_source") || "").slice(0, 80),
    um: (q.get("utm_medium") || "").slice(0, 80),
    uc: (q.get("utm_campaign") || "").slice(0, 120),
  };
  try { sessionStorage.setItem("rv_src", JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}

function newPageToday(path: string) {
  try {
    const d = today();
    const raw = JSON.parse(localStorage.getItem("rv_pages") || "{}") as { d?: string; p?: string[] };
    const seen = raw.d === d && Array.isArray(raw.p) ? raw.p : [];
    if (seen.includes(path)) return false;
    localStorage.setItem("rv_pages", JSON.stringify({ d, p: [...seen, path].slice(-80) }));
    return true;
  } catch { return true; }
}

type Ses = { t: number; n: number; intent: boolean; click: boolean; exit: string };
const TIMEOUT = 30 * 60 * 1000;
function loadSes(): Ses {
  try {
    const s = JSON.parse(sessionStorage.getItem("rv_ses") || "") as Ses;
    if (s && typeof s.t === "number" && Date.now() - s.t < TIMEOUT && typeof s.n === "number") return s;
  } catch { /* ignore */ }
  return { t: Date.now(), n: 0, intent: false, click: false, exit: "" };
}
function saveSes(s: Ses) {
  s.t = Date.now();
  try { sessionStorage.setItem("rv_ses", JSON.stringify(s)); } catch { /* ignore */ }
}

function send(body: object, beacon = false) {
  try {
    const json = JSON.stringify(body);
    if (beacon && navigator.sendBeacon) {
      if (navigator.sendBeacon("/api/track", new Blob([json], { type: "application/json" }))) return;
    }
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: json, keepalive: true }).catch(() => {});
  } catch { /* ignore */ }
}

function depthNow() {
  const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  if (max <= 16) return 100;
  const pct = (window.scrollY / max) * 100;
  if (pct >= 99) return 100;
  if (pct >= 75) return 75;
  if (pct >= 50) return 50;
  if (pct >= 25) return 25;
  return 0;
}
function freshMarks(sent: number) {
  const fresh = [25, 50, 75, 100].filter((n) => n <= depthNow() && n > sent);
  return { fresh, sent: fresh.length ? fresh[fresh.length - 1] : sent };
}
const env = () => ({ sw: Math.round(window.screen?.width || 0), sh: Math.round(window.screen?.height || 0), lg: navigator.language || "" });

let seq = 0;
let livePath = "";
let liveDepth = 0;

export default function Tracker() {
  const path = usePathname() || "/";

  useEffect(() => {
    if (blocked()) return;
    const my = ++seq;
    const src = source();
    let duplicate = false;
    try {
      const prev = JSON.parse(sessionStorage.getItem("rv_claim") || "null") as { path?: string; t?: number } | null;
      if (prev && prev.path === path && Date.now() - (prev.t || 0) < 800) duplicate = true;
      else sessionStorage.setItem("rv_claim", JSON.stringify({ path, t: Date.now() }));
    } catch { /* ignore */ }

    let depthSent = duplicate && livePath === path ? liveDepth : 0;
    let acc = 0;
    let last = performance.now();
    const bump = (asVisible: boolean) => {
      const now = performance.now();
      const delta = Math.min(60, Math.max(0, (now - last) / 1000));
      last = now;
      if (asVisible || document.visibilityState === "visible") acc += delta;
    };
    const emit = (beacon: boolean) => {
      if (my !== seq) return;
      const whole = Math.floor(acc);
      acc -= whole;
      const sc = freshMarks(depthSent);
      depthSent = sc.sent;
      if (livePath === path) liveDepth = depthSent;
      if (whole < 1 && !sc.fresh.length) return;
      send({ hb: 1, path, ...src, dur: whole, sd: sc.fresh, ...env() }, beacon);
    };

    if (!duplicate) {
      const ses = loadSes();
      const ns = ses.n === 0;
      ses.n += 1;
      const ub = ses.n === 2;
      const prevExit = ses.exit || "";
      let it = false;
      if (!ses.intent && /^\/(services|cities)(\/|$)/.test(path)) { it = true; ses.intent = true; }
      ses.exit = path;
      saveSes(ses);
      const sc = freshMarks(0);
      depthSent = sc.sent;
      livePath = path;
      liveDepth = depthSent;
      send({ path, ...src, ns: ns ? 1 : 0, np: newPageToday(path) ? 1 : 0, ub: ub ? 1 : 0, it: it ? 1 : 0, px: prevExit, sd: sc.fresh, ...env() });
    }

    const onScroll = () => {
      if (my !== seq || !freshMarks(depthSent).fresh.length) return;
      bump(false);
      emit(false);
    };
    const onVis = () => {
      if (my !== seq) return;
      if (document.visibilityState === "hidden") { bump(true); emit(true); }
      else last = performance.now();
    };
    const onHide = () => { if (my === seq) { bump(true); emit(true); } };
    const timer = window.setInterval(() => {
      if (my !== seq) return;
      if (document.visibilityState !== "visible") { last = performance.now(); return; }
      bump(false);
      emit(false);
    }, 15000);
    document.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      if (my === seq && document.visibilityState === "visible") bump(true);
      emit(true);
    };
  }, [path]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (blocked()) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const ev = /wa\.me|whatsapp/i.test(href) ? "wa" : href.startsWith("tel:") ? "call" : "";
      if (!ev) return;
      const ses = loadSes();
      const ck = !ses.click;
      if (ck) { ses.click = true; saveSes(ses); }
      send({ ev, float: a.closest("[data-float]") ? 1 : 0, path: location.pathname, ck: ck ? 1 : 0, ...source(), ...env() });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
