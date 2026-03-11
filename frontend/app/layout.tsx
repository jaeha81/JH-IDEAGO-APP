import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "IDEAGO", template: "%s — IDEAGO" },
  description: "Empowering your ideas with multi-genius collaboration",
  applicationName: "IDEAGO",
};

export const viewport: Viewport = {
  // Tablet-first: disable pinch-zoom so canvas interactions are precise
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#0F0F0F] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
