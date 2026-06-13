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
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#localbusiness`,
        name,
        image: `${siteUrl}/site-logo.png`,
        url: siteUrl,
        telephone: "+6285190832058",
        priceRange: "Rp150.000 - Rp500.000",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Jl. Pahlawan No.8, Triyagan",
          addressLocality: "Kec. Mojolaban, Kabupaten Sukoharjo",
          addressRegion: "Jawa Tengah",
          postalCode: "57554",
          addressCountry: "ID"
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: -7.5693,
          longitude: 110.8544
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "09:00",
            closes: "21:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Sunday",
            opens: "10:00",
            closes: "18:00"
          }
        ],
        areaServed: {
          "@type": "City",
          name: "Sukoharjo",
          containedInPlace: {
            "@type": "State",
            name: "Jawa Tengah"
          }
        },
        sameAs: [
          "https://www.instagram.com/ceritakita_studio",
          "https://www.tiktok.com/@ceritakita_studio",
          "https://www.facebook.com/61558109984006"
        ]
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
