import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { fontVars } from "../fonts";
import { LOCALES, isLocale } from "@/lib/schema";
import "./site.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#131311" },
  ],
};

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
};

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang === "pt" ? "pt-PT" : "en"} className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
