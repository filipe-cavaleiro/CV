import type { Metadata } from "next";
import { fontVars } from "../fonts";
import "../[lang]/site.css";
import "./admin.css";

export const metadata: Metadata = {
  title: "Backoffice",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={fontVars}>
      <body className="admin">{children}</body>
    </html>
  );
}
