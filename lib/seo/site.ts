export function getSiteUrl() {
  const siteUrlRaw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://ceritakitastudio.site";

  return siteUrlRaw.replace(/\/+$/, "");
}
