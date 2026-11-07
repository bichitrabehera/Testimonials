import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Proofly — Verified reviews for your business",
    template: "%s · Proofly",
  },
  description:
    "Proofly collects verified customer reviews over WhatsApp, lets you approve them, and shows them on your website with one line of code.",
  openGraph: {
    title: "Proofly — Verified reviews for your business",
    description:
      "Verified customer reviews, collected on WhatsApp and shown on your website with one line of code.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
