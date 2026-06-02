import { getSettings } from "@/lib/settings";
import { AdBanner } from "./ad-banner";

interface AdSlotProps {
  slotKey: "ads.toolPageTop" | "ads.toolPageBottom" | "ads.toolsListingAd" | "ads.sidebarAd";
  adFormat?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

export async function AdSlot({ slotKey, adFormat = "auto", className = "" }: AdSlotProps) {
  const s = await getSettings(["ads.enabled", "ads.publisherId", slotKey]);

  const enabled = s["ads.enabled"] === "true";
  const publisherId = s["ads.publisherId"];
  const slotId = s[slotKey];

  if (!enabled || !publisherId || !slotId) return null;

  return (
    <div className={`w-full ${className}`}>
      <AdBanner publisherId={publisherId} adSlot={slotId} adFormat={adFormat} />
    </div>
  );
}
