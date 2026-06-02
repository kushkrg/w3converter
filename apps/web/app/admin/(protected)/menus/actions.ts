"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function saveMenuItemAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string | null;
  const label = (formData.get("label") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();
  const location = formData.get("location") as string; // "HEADER" or "FOOTER"
  const group = (formData.get("group") as string | null)?.trim() || null;
  const order = parseInt(formData.get("order") as string || "0", 10);
  const newTab = formData.get("newTab") === "true";
  const isActive = formData.get("isActive") === "true";
  const parentId = (formData.get("parentId") as string | null) || null;

  if (!label || !url || !location) {
    throw new Error("Label, URL, and Location are required");
  }

  // Prevent linking an item to itself as a parent
  if (id && parentId && id === parentId) {
    throw new Error("A menu item cannot be its own parent");
  }

  // If a parent is selected, make sure it belongs to the same location
  if (parentId) {
    const parent = await prisma.menuItem.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new Error("Selected parent item does not exist");
    }
    if (parent.location !== location) {
      throw new Error("Child menu item must have the same location (Header/Footer) as its parent");
    }
  }

  const data = {
    label,
    url,
    location,
    group,
    order,
    newTab,
    isActive,
    parentId,
  };

  if (id) {
    await prisma.menuItem.update({
      where: { id },
      data,
    });
  } else {
    await prisma.menuItem.create({
      data,
    });
  }

  revalidateAllPaths();
}

export async function deleteMenuItemAction(id: string) {
  await requireAdmin();

  await prisma.menuItem.delete({
    where: { id },
  });

  revalidateAllPaths();
}

export async function reorderMenuItemsAction(items: { id: string; order: number }[]) {
  await requireAdmin();

  await prisma.$transaction(
    items.map((item) =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  revalidateAllPaths();
}

export async function loadDefaultMenusAction() {
  await requireAdmin();

  // Clear existing items
  await prisma.menuItem.deleteMany({});

  // Default Header items
  const headerDefaults = [
    { label: "Home", url: "/", order: 1 },
    { label: "Tools", url: "/tools", order: 2 },
    { label: "About", url: "/about", order: 3 },
    { label: "Contact", url: "/contact", order: 4 },
  ];

  for (const item of headerDefaults) {
    await prisma.menuItem.create({
      data: {
        label: item.label,
        url: item.url,
        location: "HEADER",
        order: item.order,
        isActive: true,
      },
    });
  }

  // Default Footer items (Legal column)
  const footerDefaults = [
    { label: "Privacy Policy", url: "/privacy", order: 1, group: "Legal" },
    { label: "Terms of Service", url: "/terms", order: 2, group: "Legal" },
    { label: "Disclaimer", url: "/disclaimer", order: 3, group: "Legal" },
  ];

  for (const item of footerDefaults) {
    await prisma.menuItem.create({
      data: {
        label: item.label,
        url: item.url,
        location: "FOOTER",
        order: item.order,
        group: item.group,
        isActive: true,
      },
    });
  }

  revalidateAllPaths();
}

function revalidateAllPaths() {
  revalidatePath("/");
  revalidatePath("/tools");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/privacy");
  revalidatePath("/terms");
  revalidatePath("/admin/menus");
  revalidatePath("/[toolId]", "layout");
}
