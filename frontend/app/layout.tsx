import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "IDEAGO", template: "%s — IDEAGO" },
  description: "Empowering your ideas with multi-genius collaboration",
  applicationName: "IDEAGO",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F0F0F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="theme-color" content="#0F0F0F" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-full bg-black text-white antialiased
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
        pl-[env(safe-area-inset-left)]
        pr-[env(safe-area-inset-right)]"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
