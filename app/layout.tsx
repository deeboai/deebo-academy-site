import type { Metadata } from "next";

import "./globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScrollToTop } from "@/components/scroll-to-top";

export const metadata: Metadata = {
  metadataBase: new URL("https://academy.deeboai.com"),
  title: {
    default: "Deebo Academy",
    template: "%s | Deebo Academy",
  },
  description:
    "One-on-one tutoring in math, biology, chemistry, physics, French, and select college-level courses with a clear online workflow.",
  openGraph: {
    title: "Deebo Academy",
    description:
      "One-on-one tutoring in math, biology, chemistry, physics, French, and select college-level courses with a clear online workflow.",
    url: "https://academy.deeboai.com",
    siteName: "Deebo Academy",
    images: [
      {
        url: "/branding/deebo-academy-logo-white-on-black.png",
        width: 1200,
        height: 1200,
        alt: "Deebo Academy logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deebo Academy",
    description:
      "One-on-one tutoring in math, biology, chemistry, physics, French, and select college-level courses with a clear online workflow.",
    images: ["/branding/deebo-academy-logo-white-on-black.png"],
  },
  icons: {
    icon: [
      { url: "/branding/deebo-academy-logo-white-on-black.png", type: "image/png" },
    ],
    apple: [{ url: "/branding/deebo-academy-logo-white-on-black.png" }],
    shortcut: [{ url: "/branding/deebo-academy-logo-white-on-black.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* The standalone Academy site uses its own shell so it behaves like a separate property from deeboai.com. */}
        <div className="min-h-screen">
          <ScrollToTop />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
