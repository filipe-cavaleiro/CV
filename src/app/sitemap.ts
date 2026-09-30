import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  return ["pt", "en"].map((lang) => ({
    url: `${base}/${lang}`,
    changeFrequency: "monthly",
    alternates: { languages: { "pt-PT": `${base}/pt`, en: `${base}/en` } },
  }));
}
