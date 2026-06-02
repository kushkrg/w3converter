import { prisma } from "./db";
import { unstable_cache } from "next/cache";

export const SETTING_DEFAULTS: Record<string, string> = {
  "site.name":                  "w3converter",
  "site.tagline":               "Fast, private, and free PDF tools",
  "site.contactEmail":          "",
  "upload.maxSizeMB":           "50",
  "job.ttlHours":               "1",
  "maintenance.enabled":        "false",
  "maintenance.message":        "We are currently under maintenance. Please check back soon.",
  "footer.tagline":             "Fast, private, and free PDF tools — no registration required.",
  "footer.filesDeletedNote":    "All files are automatically deleted after 1 hour.",
  "home.heroTitle":             "Every tool you need to work with PDFs in one place",
  "home.heroDesc":              "Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and protect PDFs with just a few clicks.",
  "site.logoUrl":               "",
  "custom.css":                 "",
  "custom.js":                  "",
  "recaptcha.enabled":          "false",
  "recaptcha.version":          "v3",
  "recaptcha.siteKey":          "",
  "recaptcha.secretKeyEnc":     "",
  "recaptcha.v3Threshold":      "0.5",
  "ads.enabled":                "false",
  "ads.publisherId":            "",
  "ads.toolPageTop":            "",
  "ads.toolPageBottom":         "",
  "ads.toolsListingAd":         "",
  "ads.sidebarAd":              "",
};

export const getSettings = unstable_cache(
  async (keys: string[]): Promise<Record<string, string>> => {
    const rows = await prisma.settings.findMany({ where: { key: { in: keys } } });
    const map  = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return Object.fromEntries(
      keys.map((k) => [k, map[k] ?? SETTING_DEFAULTS[k] ?? ""])
    );
  },
  ["settings"],
  { revalidate: 60, tags: ["settings"] }
);

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.settings.findUnique({ where: { key } });
  return row?.value ?? SETTING_DEFAULTS[key] ?? "";
}

export async function upsertSettings(entries: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(entries).map(([key, value]) =>
      prisma.settings.upsert({ where: { key }, create: { key, value }, update: { value } })
    )
  );
}
