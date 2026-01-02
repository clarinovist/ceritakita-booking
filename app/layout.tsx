import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";

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

export async function generateMetadata(): Promise<Metadata> {
  // Fetch site settings directly from DB for zero-latency updates
  const db = getDb();

  // Fetch all settings we need in a single query or separate queries
  // Since system_settings is key-value, we can fetch all or specific keys
  const settings = db.prepare<string[]>(`
    SELECT key, value FROM system_settings 
    WHERE key IN ('site_name', 'site_logo', 'meta_title', 'meta_description')
  `).all() as { key: string; value: string }[];

  // Convert array to object for easier access
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const siteName = settingsMap.site_name || "CeritaKita Studio";
  const siteLogo = settingsMap.site_logo || "/images/default-logo.png";
  const title = settingsMap.meta_title || `${siteName} - Booking Sesi Foto`;
  const description = settingsMap.meta_description || "Booking sesi foto profesional bersama CeritaKita Studio. Pilih layanan, tentukan jadwal, dan abadikan momen terbaik Anda.";

  return {
    title: title,
    description: description,
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
    metadataBase: new URL("https://ceritakita-studio.com"),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: title,
      description: description,
      type: "website",
      locale: "id_ID",
      siteName: siteName,
      images: [{
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: ["/twitter-image.jpg"],
    },
    icons: {
      icon: siteLogo,
      shortcut: siteLogo,
      apple: siteLogo,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}