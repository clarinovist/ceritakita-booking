import { getSiteUrl } from "./site";

export function buildHomeJsonLd() {
  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const pageId = `${siteUrl}/#homepage`;

  const name = "CeritaKita Studio";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name,
        url: siteUrl,
        logo: `${siteUrl}/site-logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name,
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: `${siteUrl}/`,
        name: `${name} - Booking Sesi Foto`,
        isPartOf: { "@id": websiteId },
        about: { "@id": orgId },
      },
    ],
  };
}

export function buildBookingJsonLd() {
  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const pageId = `${siteUrl}/booking#webpage`;
  const serviceId = `${siteUrl}/booking#service`;

  const name = "CeritaKita Studio";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name,
        url: siteUrl,
        logo: `${siteUrl}/site-logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name,
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: `${siteUrl}/booking`,
        name: `Booking Sesi Foto | ${name}`,
        isPartOf: { "@id": websiteId },
        about: { "@id": orgId },
      },
      {
        "@type": "Service",
        "@id": serviceId,
        name: "Sesi Foto Profesional",
        serviceType: "Photography Session",
        provider: { "@id": orgId },
      },
    ],
  };
}
