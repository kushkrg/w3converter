"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { upsertSettings } from "@/lib/settings";
import { revalidatePath, revalidateTag } from "next/cache";

const ADS_KEYS = [
  "ads.enabled",
  "ads.publisherId",
  "ads.toolPageTop",
  "ads.toolPageBottom",
  "ads.toolsListingAd",
  "ads.sidebarAd",
];

export async function saveAdsSettingsAction(formData: FormData) {
  await requireAdmin();

  const entries: Record<string, string> = {};
  for (const key of ADS_KEYS) {
    const val = formData.get(key);
    if (val !== null) entries[key] = (val as string).trim();
  }

  // Handle checkbox toggle (unchecked = not submitted)
  entries["ads.enabled"] = formData.has("ads.enabled") ? "true" : "false";

  await upsertSettings(entries);
  revalidateTag("settings", {});
  revalidatePath("/admin/ads");
  revalidatePath("/");
  revalidatePath("/tools");
  revalidatePath("/[toolId]", "page");
}
