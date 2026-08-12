import { AuthProvider } from "@/components/auth/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import InitialLoader from "@/components/effects/InitialLoader";
import TubesCursor from "@/components/effects/TubesCursor";
import CursorFollower from "@/components/effects/CursorFollower";
import SmoothScroll from "@/components/effects/SmoothScroll";
import { InteractionProvider } from "@/components/InteractionContext";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://sabrang.jklu.edu.in"),
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon.ico", sizes: "any" }],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
    "Sabrang",
    "JK Lakshmipat University Fest",
    "JKLU Fest",
    "College Fest Jaipur",
    "Cultural Fest Jaipur",
    "Technical Fest JKLU",
    "Sabrang Registration",
    "JKLU Events",
  ],
  authors: [{ name: "JKLU Student Organizing Committee" }],
  creator: "JK Lakshmipat University",
  publisher: "JK Lakshmipat University",
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
        url: "/sabrang-logo.png",
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
    images: ["/sabrang-logo.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "JK Lakshmipat University",
  alternateName: "JKLU",
  url: "https://jklu.edu.in",
  logo: "https://sabrang.jklu.edu.in/white_jklu_logo.png",
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
      <body className={inter.className}>
        <JsonLd data={organizationSchema} />
        <InteractionProvider>
          <AuthProvider>
            <SmoothScroll>
              <TubesCursor />
              <CursorFollower />
              <InitialLoader />
              <div className="min-h-screen flex flex-col bg-black text-white overflow-x-clip">
                <Navbar />
                <main className="flex-grow w-full">{children}</main>
                <footer className="py-6 border-t border-white/10 bg-black text-center text-white/50 text-sm">
                  &copy; {new Date().getFullYear()} Sabrang Festival. All rights
                  reserved.
                </footer>
              </div>
            </SmoothScroll>
          </AuthProvider>
        </InteractionProvider>
      </body>
    </html>
  );
}
