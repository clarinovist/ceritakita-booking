import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrlRaw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://ceritakitastudio.site";
  const siteUrl = siteUrlRaw.replace(/\/+$/, "");

  const lastModified = new Date();

  const urls = ["/", "/booking", "/gallery", "/blog",
    "/blog/studio-foto-solo", "/blog/self-photo-sukoharjo", "/blog/harga-prewedding-solo",
    "/blog/wisuda-solo", "/blog/foto-keluarga-solo", "/blog/birthday-photo-solo",
    "/blog/pas-foto-solo", "/blog/studio-foto-klaten", "/blog/studio-foto-wonogiri",
    "/blog/studio-foto-sragen", "/blog/studio-foto-karanganyar",
    "/blog/studio-foto-boyolali", "/blog/studio-foto-klaten-murah", "/blog/fotografer-wonogiri",
    "/blog/foto-wisuda-sragen", "/blog/self-photo-klaten", "/blog/foto-prewedding-wonogiri",
    "/blog/foto-keluarga-sragen", "/blog/pas-foto-solo-murah", "/blog/foto-wisuda-solo-2026",
    "/blog/self-photo-solo-raya", "/blog/tips-foto-studio-pertama-kali",
    "/blog/persiapan-foto-prewedding", "/blog/harga-foto-wisuda-2026",
    "/blog/ide-pose-self-photo", "/blog/perbedaan-self-photo-dan-foto-studio",
    "/blog/foto-studio-untuk-cv-kerja", "/blog/foto-keluarga-adat-jawa"];

  return urls.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
  }));
}
