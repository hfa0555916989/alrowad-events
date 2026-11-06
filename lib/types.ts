export type Item = { title: string; desc: string; image?: string };
export type Media = { url: string; caption: string; type?: string };
export type Content = {
  seo: { title: string; description: string; keywords: string; ogImage: string };
  titles: Record<string, string>;
  identity: {
    logo: string; favicon: string; primary: string; secondary: string; background: string; surface: string; text: string;
    font: "tajawal" | "cairo"; logoSizeDesktop: number; logoSizeMobile: number;
  };
  hero: { badge: string; title: string; subtitle: string; cta: string; image: string };
  about: { text: string };
  services: Item[];
  cities: Item[];
  projects: Item[];
  why: Item[];
  gallery: Media[];
  videos: Media[];
  contact: { phone: string; whatsapp: string; email: string; address: string; workingHours: string };
  social: { instagram: string; x: string; snapchat: string; tiktok: string; facebook: string };
  footer: { text: string };
  sections: Record<string, boolean>;
};
