import "@/lib/suppress-three-logs";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import InitialLoader from "@/components/effects/InitialLoader";
import CursorFollower from "@/components/effects/CursorFollower";
import SmoothScroll from "@/components/effects/SmoothScroll";
import { InteractionProvider } from "@/components/InteractionContext";
import Link from "next/link";
import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://sabrang.jklu.edu.in"),
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/favicon.ico" }, { url: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/favicon.ico", sizes: "any" }],
    shortcut: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  title: {
    default: "SABRANG 2026 | Sabrang JKLU | JK Lakshmipat University Fest",
    template: "%s | Sabrang 2026 | JKLU",
  },
  description:
    "SABRANG 2026 - JK Lakshmipat University's premier annual cultural & technical fest. Experience Sabrang JKLU with star-studded pro-shows, flagship competitions, dance battles, and live concerts in Jaipur.",
  keywords: [
    "Sabrang 2026",
    "Sabrang JKLU",
    "Sabrang JKLU 2026",
    "Sabrang",
    "JK Lakshmipat University Fest",
    "JKLU Annual Fest",
    "JKLU Fest",
    "College Fest Jaipur 2026",
    "Cultural Fest Jaipur",
    "Technical Fest JKLU",
    "Sabrang Registration",
    "JKLU Events",
    "Jaipur College Fest October 2026",
  ],
  authors: [{ name: "JKLU Student Organizing Committee" }],
  creator: "JK Lakshmipat University",
  publisher: "JK Lakshmipat University",
  category: "Cultural Festival",
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
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://sabrang.jklu.edu.in",
    siteName: "Sabrang 2026 - JKLU",
    title: "SABRANG 2026 | Sabrang JKLU | JK Lakshmipat University Fest",
    description:
      "SABRANG 2026 - JK Lakshmipat University's premier annual fest. Experience Sabrang JKLU with star-studded nights and thrilling competitions.",
    images: [
      {
        url: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/sabrang-logo.png",
        width: 1200,
        height: 630,
        alt: "Sabrang 2026 - JK Lakshmipat University Annual Cultural Fest",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SABRANG 2026 | Sabrang JKLU | JK Lakshmipat University Fest",
    description:
      "SABRANG 2026 - JK Lakshmipat University's premier annual cultural & technical fest.",
    images: ["https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/sabrang-logo.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "JK Lakshmipat University",
  alternateName: "JKLU",
  url: "https://jklu.edu.in",
  logo: "https://sabrang.jklu.edu.in/sabrang-logo/white_jklu_logo.png",
  sameAs: [
    "https://www.facebook.com/jklakshmipatuniversity",
    "https://www.instagram.com/jklakshmipatuniversity",
    "https://twitter.com/jklu_jaipur",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Near Mahindra SEZ, P.O. Mahapura, Ajmer Road",
    addressLocality: "Jaipur",
    addressRegion: "Rajasthan",
    postalCode: "302026",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${inter.className}`}>
        {process.env.NODE_ENV === "production" && (
          <Script
            defer
            data-domain="sabrang.jklu.edu.in"
            src="https://plausible.io/js/script.hash.outbound-links.pageview-props.revenue.tagged-events.js"
            strategy="afterInteractive"
          />
        )}
        <JsonLd data={organizationSchema} />
        <InteractionProvider>
          <AuthProvider>
            <SmoothScroll>
              <CursorFollower />
              {/* <InitialLoader /> */}
              <div className="min-h-screen flex flex-col text-white overflow-x-clip">
                <Navbar />
                <main className="flex-grow w-full">{children}</main>
                <footer className="relative z-30 py-6 border-t border-white/10 bg-black text-center text-white/50 text-sm flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4">
                  <span>&copy; 2026 Sabrang Festival. All rights reserved.</span>
                  <span className="hidden sm:inline text-white/20">•</span>
                  <Link
                    href="/credits"
                    className="inline-flex items-center gap-1.5 text-white/70 hover:text-purple-400 transition-colors group font-medium"
                  >
                    <span>Made with</span>
                    <span className="text-red-500 group-hover:scale-125 transition-transform inline-block">❤️</span>
                    <span>by Tech Team</span>
                  </Link>
                </footer>
              </div>
            </SmoothScroll>
          </AuthProvider>
        </InteractionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
