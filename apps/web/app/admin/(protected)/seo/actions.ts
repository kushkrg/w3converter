"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function saveSeoAction(formData: FormData) {
  await requireAdmin();

  const toolIds = [...new Set(
    [...formData.keys()]
      .filter((k) => k.includes(":"))
      .map((k) => k.split(":")[0]!)
  )];

  await Promise.all(
    toolIds.map((toolId) =>
      prisma.toolConfig.upsert({
        where:  { toolId },
        create: {
          toolId,
          metaTitle: (formData.get(`${toolId}:metaTitle`) as string) || null,
          metaDesc:  (formData.get(`${toolId}:metaDesc`)  as string) || null,
          keywords:  (formData.get(`${toolId}:keywords`)  as string) || null,
          seoContent: (formData.get(`${toolId}:seoContent`) as string) || null,
        },
        update: {
          metaTitle: (formData.get(`${toolId}:metaTitle`) as string) || null,
          metaDesc:  (formData.get(`${toolId}:metaDesc`)  as string) || null,
          keywords:  (formData.get(`${toolId}:keywords`)  as string) || null,
          seoContent: (formData.get(`${toolId}:seoContent`) as string) || null,
        },
      })
    )
  );

  revalidatePath("/admin/seo");
  revalidatePath("/[toolId]", "page");
}
