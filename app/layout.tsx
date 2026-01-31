import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";
import DynamicAnalytics from "@/components/analytics/DynamicAnalytics";
import type { SeoSettings } from "@/lib/types/settings";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import { getDb } from "@/lib/db";

async function getLayoutSettings() {
  const db = getDb();

  // Fetch all settings including seo
  const settings = db.prepare<string[]>(`
    SELECT key, value FROM system_settings 
    WHERE key IN ('site_name', 'site_logo', 'meta_title', 'meta_description', 'seo')
  `).all() as { key: string; value: string }[];

  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  // Parse SEO settings if they exist
  let seoSettings: SeoSettings | undefined = undefined;
  if (settingsMap.seo) {
    try {
      seoSettings = JSON.parse(settingsMap.seo);
    } catch (e) {
      console.error('Failed to parse SEO settings', e);
    }
  }

  return {
    siteName: settingsMap.site_name || "CeritaKita Studio",
    metaTitle: settingsMap.meta_title || `${settingsMap.site_name || "CeritaKita Studio"} - Booking Sesi Foto`,
    metaDescription: settingsMap.meta_description || "Booking sesi foto profesional bersama CeritaKita Studio. Pilih layanan, tentukan jadwal, dan abadikan momen terbaik Anda.",
    seoSettings
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, metaTitle, metaDescription } = await getLayoutSettings();

  const siteUrlRaw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://ceritakitastudio.site";
  const siteUrl = siteUrlRaw.replace(/\/+$/, "");

  return {
    title: metaTitle,
    description: metaDescription,
    applicationName: siteName,
    authors: [{ name: siteName }],
    keywords: ["foto", "photography", "booking", "sesi foto", siteName, "studio"],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
      locale: "id_ID",
      siteName: siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { seoSettings } = await getLayoutSettings();

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DynamicAnalytics seoSettings={seoSettings} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}