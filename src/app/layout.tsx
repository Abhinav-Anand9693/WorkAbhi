import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { siteConfig } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase:
    new URL(siteConfig.url),

  title: {
    default:
      "WorkAbhi - Free Online Tools",
    template:
      "%s | WorkAbhi"
  },

  description:
    siteConfig.description,

  keywords:
    siteConfig.keywords,

  openGraph: {
    title:
      "WorkAbhi - Free Online Tools",

    description:
      siteConfig.description,

    siteName:
      siteConfig.name,

    type: "website",

    url:
      siteConfig.url
  },

  robots: {
    index: true,
    follow: true
  }
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