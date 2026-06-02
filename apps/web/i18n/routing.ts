import { defineRouting } from "next-intl/routing";

export const locales = ["en", "es", "fr", "de", "pt", "ar", "hi", "zh"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});
