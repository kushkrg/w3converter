import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { TOOLS } from "@pdf-tools/core/src/tools";
import { MenuManagerClient } from "./menu-manager-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu Manager",
  description: "Manage navbar and footer links statically or dynamically.",
};

export default async function MenusAdminPage() {
  await requireAdmin();

  // Fetch all menu items ordered by position order
  let menuItems = await prisma.menuItem.findMany({
    orderBy: { order: "asc" },
  });

  // Automatically seed default menus if empty so the existing menus are editable immediately
  if (menuItems.length === 0) {
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

    // Refetch the seeded items
    menuItems = await prisma.menuItem.findMany({
      orderBy: { order: "asc" },
    });
  } else {
    // If already seeded but disclaimer is missing, automatically add it!
    const hasDisclaimer = menuItems.some((item) => item.url === "/disclaimer");
    if (!hasDisclaimer) {
      await prisma.menuItem.create({
        data: {
          label: "Disclaimer",
          url: "/disclaimer",
          location: "FOOTER",
          order: 3,
          group: "Legal",
          isActive: true,
        },
      });
      // Refetch
      menuItems = await prisma.menuItem.findMany({
        orderBy: { order: "asc" },
      });
    }
  }

  // Fetch all custom database-backed pages for autofill dropdown
  const customPages = await prisma.page.findMany({
    select: {
      slug: true,
      title: true,
    },
    orderBy: { title: "asc" },
  });

  // Extract core tools from standard static configuration list
  const toolsList = TOOLS.map((tool) => ({
    id: tool.id,
    label: tool.label,
  }));

  // Force JS Date parsing to prevent Next.js dynamic routing pre-render serialization alerts
  const serializedItems = menuItems.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));

  return (
    <MenuManagerClient
      initialItems={serializedItems}
      customPages={customPages}
      toolsList={toolsList}
    />
  );
}
