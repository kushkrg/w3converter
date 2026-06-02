"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { upsertSettings } from "@/lib/settings";
import { revalidatePath, revalidateTag } from "next/cache";

export async function saveCustomCodeAction(formData: FormData) {
  await requireAdmin();

  const css = (formData.get("custom.css") as string) || "";
  const js = (formData.get("custom.js") as string) || "";

  await upsertSettings({
    "custom.css": css,
    "custom.js": js,
  });

  revalidateTag("settings", {});
  revalidatePath("/");
  revalidatePath("/admin/custom-code");
}
