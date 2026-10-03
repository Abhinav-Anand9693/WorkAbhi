import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { siteConfig } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),

  title: {
    default: "WorkAbhi - Free Online Tools",
    template: "%s | WorkAbhi",
  },

  description: siteConfig.description,

  keywords: siteConfig.keywords,

  alternates: {
    canonical: siteConfig.url,
  },

  openGraph: {
    title: "WorkAbhi - Free Online Tools",
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
    url: siteConfig.url,
  },

  twitter: {
    card: "summary_large_image",
    title: "WorkAbhi - Free Online Tools",
    description: siteConfig.description,
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>

        <Navbar />

        <main>
          {children}
        </main>

        <Footer />

      </body>
    </html>
  );
}