"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { upsertSettings } from "@/lib/settings";
import { encrypt } from "@/lib/crypto";
import { revalidatePath, revalidateTag } from "next/cache";

export async function saveRecaptchaAction(formData: FormData) {
  await requireAdmin();

  const enabled   = formData.has("recaptcha.enabled") ? "true" : "false";
  const version   = (formData.get("recaptcha.version")      as string) || "v3";
  const siteKey   = (formData.get("recaptcha.siteKey")      as string) || "";
  const secretRaw = (formData.get("recaptcha.secretKey")    as string) || "";
  const threshold = (formData.get("recaptcha.v3Threshold")  as string) || "0.5";

  const entries: Record<string, string> = {
    "recaptcha.enabled":   enabled,
    "recaptcha.version":   version,
    "recaptcha.siteKey":   siteKey,
    "recaptcha.v3Threshold": threshold,
  };

  // Only re-encrypt if a new secret key was provided (non-empty input means user changed it)
  if (secretRaw.trim()) {
    entries["recaptcha.secretKeyEnc"] = encrypt(secretRaw.trim());
  }

  await upsertSettings(entries);
  revalidateTag("settings", {});
  revalidatePath("/admin/recaptcha");
}
