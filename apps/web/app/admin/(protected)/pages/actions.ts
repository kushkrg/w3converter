"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function savePageAction(formData: FormData) {
  await requireAdmin();

  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string) || "";

  if (!slug || !title) {
    throw new Error("Slug and Title are required");
  }

  // Validate slug formatting (alphanumeric and dashes only)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Slug must contain only lowercase letters, numbers, and dashes");
  }

  await prisma.page.upsert({
    where: { slug },
    create: {
      slug,
      title,
      content,
    },
    update: {
      title,
      content,
    },
  });

  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  revalidatePath("/[toolId]", "page");
}

export async function deletePageAction(slug: string) {
  await requireAdmin();

  if (slug === "privacy" || slug === "terms") {
    throw new Error("Core legal pages cannot be deleted");
  }

  await prisma.page.delete({
    where: { slug },
  });

  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  revalidatePath("/[toolId]", "page");
}
