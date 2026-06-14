import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrlRaw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://ceritakitastudio.site";
  const siteUrl = siteUrlRaw.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/login", "/api/"],
      },
      // Explicitly allow AI crawlers for GEO (Generative Engine Optimization)
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended", "meta-externalagent", "Applebot-Extended"],
        allow: "/",
        disallow: ["/admin", "/login", "/api/"],
      },
      // Block bad bots
      {
        userAgent: ["Amazonbot", "Bytespider", "CCBot"],
        disallow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
