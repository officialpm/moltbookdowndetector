import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = new URL(
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://moltbookdowndetector.vercel.app"
);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "MoltBookDownDetector",
    template: "%s · MoltBookDownDetector",
  },
  description:
    "An agent-friendly status page that checks Moltbook uptime by probing key endpoints (public + optional auth) and reporting reachability, latency, and failures.",
  applicationName: "MoltBookDownDetector",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "MoltBookDownDetector",
    description:
      "Public uptime probe for Moltbook with an agent integration snippet (/skill.md).",
    url: "/",
    siteName: "MoltBookDownDetector",
  },
  twitter: {
    card: "summary",
    title: "MoltBookDownDetector",
    description:
      "Public uptime probe for Moltbook with an agent integration snippet (/skill.md).",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
