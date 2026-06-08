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
        areaServed: {
          "@type": "City",
          name: "Sukoharjo",
          containedInPlace: {
            "@type": "State",
            name: "Jawa Tengah"
          }
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: "Indonesian"
        }
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name,
        publisher: { "@id": orgId }
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: `${siteUrl}/`,
        name: `${name} — Self Photo, Family, Wisuda & Pas Foto Sukoharjo`,
        isPartOf: { "@id": websiteId },
        about: { "@id": orgId },
        description: "Studio foto Sukoharjo untuk self photo, family, wisuda, pas foto, dan prewedding. Booking online atau via WhatsApp."
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
