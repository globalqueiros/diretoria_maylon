import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import VLibras from "./components/vlibras";
import AuthGuard from "./components/authguard";

export const metadata: Metadata = {
  title: "Backoffice Maylon",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AuthGuard>{children}</AuthGuard>
        <VLibras />
        <GoogleAnalytics gaId="G-4R88G65G1X" />
      </body>
    </html>
  );
}