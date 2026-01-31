import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrlRaw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://ceritakitastudio.site";
  const siteUrl = siteUrlRaw.replace(/\/+$/, "");

  const lastModified = new Date();

  const urls = ["/", "/booking", "/gallery"];

  return urls.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
  }));
}
