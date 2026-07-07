import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrlRaw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://ceritakitastudio.site";
  const siteUrl = siteUrlRaw.replace(/\/+$/, "");

  const lastModified = new Date();

  const urls = ["/", "/booking", "/gallery", "/blog", "/blog/studio-foto-solo", "/blog/self-photo-sukoharjo", "/blog/harga-prewedding-solo", "/blog/wisuda-solo", "/blog/foto-keluarga-solo", "/blog/birthday-photo-solo", "/blog/pas-foto-solo", "/blog/studio-foto-klaten", "/blog/studio-foto-wonogiri", "/blog/studio-foto-sragen", "/blog/studio-foto-karanganyar"];

  return urls.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
  }));
}
