import type { FontKey } from "./types";
const F: Record<FontKey, [string, string]> = {
  tajawal: ["Tajawal", "Tajawal:wght@400;500;700"],
  cairo: ["Cairo", "Cairo:wght@400;600;700;800"],
  almarai: ["Almarai", "Almarai:wght@400;700;800"],
  ibmplex: ["IBM Plex Sans Arabic", "IBM+Plex+Sans+Arabic:wght@400;500;700"],
  readex: ["Readex Pro", "Readex+Pro:wght@400;600;700"],
  elmessiri: ["El Messiri", "El+Messiri:wght@500;600;700"],
};
const get = (k: FontKey) => F[k] || F.tajawal;
export const fontVar = (k: FontKey) => `'${get(k)[0]}', system-ui, sans-serif`;
export const fontsHref = (...keys: FontKey[]) =>
  "https://fonts.googleapis.com/css2?" + [...new Set(keys.map((k) => get(k)[1]))].map((q) => "family=" + q).join("&") + "&display=swap";
