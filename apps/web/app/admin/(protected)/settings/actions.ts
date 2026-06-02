"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { upsertSettings } from "@/lib/settings";
import { revalidatePath, revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";

const SETTINGS_KEYS = [
  "site.name", "site.tagline", "site.contactEmail",
  "upload.maxSizeMB", "job.ttlHours",
  "maintenance.enabled", "maintenance.message",
  "footer.tagline", "footer.filesDeletedNote",
  "home.heroTitle", "home.heroDesc",
  "site.logoUrl",
];

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();

  const entries: Record<string, string> = {};
  for (const key of SETTINGS_KEYS) {
    const val = formData.get(key);
    if (val !== null) entries[key] = val as string;
  }
  // Handle checkbox (unchecked = not submitted)
  entries["maintenance.enabled"] = formData.has("maintenance.enabled") ? "true" : "false";

  // Handle Logo Upload
  const logoFile = formData.get("site.logoFile") as File | null;
  if (logoFile && logoFile.size > 0) {
    const bytes = await logoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(logoFile.name) || ".png";
    const filename = `logo-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    entries["site.logoUrl"] = `/uploads/${filename}`;
  } else if (formData.has("site.clearLogo")) {
    entries["site.logoUrl"] = "";
  }

  await upsertSettings(entries);
  revalidateTag("settings", {});
  revalidatePath("/admin/settings");
}
