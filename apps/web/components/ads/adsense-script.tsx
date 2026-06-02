import Script from "next/script";
import { getSettings } from "@/lib/settings";

export async function AdSenseScript() {
  const s = await getSettings(["ads.enabled", "ads.publisherId"]);
  const enabled = s["ads.enabled"] === "true";
  const publisherId = s["ads.publisherId"];

  if (!enabled || !publisherId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
