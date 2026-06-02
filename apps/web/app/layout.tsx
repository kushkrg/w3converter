import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { AdSenseScript } from "@/components/ads/adsense-script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | w3converter",
    default: "w3converter — Free Online PDF Utilities",
  },
  description:
    "Merge, split, compress, convert, protect and more — 26+ free online PDF tools, no registration required.",
  metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings(["custom.css", "custom.js", "recaptcha.enabled", "recaptcha.siteKey"]);
  const customCss = s["custom.css"];
  const customJs = s["custom.js"];
  const isRecaptcha = s["recaptcha.enabled"] === "true" && s["recaptcha.siteKey"];

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        {customCss && (
          <style id="custom-css" dangerouslySetInnerHTML={{ __html: customCss }} />
        )}
        {children}
        <Toaster />
        <AdSenseScript />
        {isRecaptcha && (
          <script
            src={`https://www.google.com/recaptcha/api.js?render=${s["recaptcha.siteKey"]}`}
            async
            defer
          />
        )}
        {customJs && (
          <script id="custom-js" dangerouslySetInnerHTML={{ __html: customJs }} />
        )}
      </body>
    </html>
  );
}
