"use client";

import Script from "next/script";

const GA4_ID = process.env["NEXT_PUBLIC_GA4_ID"];
const ADSENSE_PUB = process.env["NEXT_PUBLIC_ADSENSE_PUB_ID"];

export function Analytics() {
  if (!GA4_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_ID}');
        `}
      </Script>
    </>
  );
}

export function AdSenseScript() {
  if (!ADSENSE_PUB) return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}

interface AdSlotProps {
  slot: string;
  format?: string;
  className?: string;
}

export function AdSlot({ slot, format = "auto", className }: AdSlotProps) {
  if (!ADSENSE_PUB) return null;
  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_PUB}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
