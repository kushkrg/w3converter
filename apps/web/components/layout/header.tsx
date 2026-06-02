import { getSettings } from "@/lib/settings";
import { HeaderClient } from "./header-client";
import { prisma } from "@/lib/db";

export async function Header() {
  const s = await getSettings(["site.name", "site.logoUrl"]);

  // Fetch all active HEADER navigation items ordered by order rank
  const items = await prisma.menuItem.findMany({
    where: { location: "HEADER", isActive: true },
    orderBy: { order: "asc" },
  });

  // Build hierarchal structure for parent dropdown menus
  const parentItems = items.filter((item) => item.parentId === null);
  const menuItems = parentItems.map((parent) => ({
    id: parent.id,
    label: parent.label,
    url: parent.url,
    newTab: parent.newTab,
    parentId: parent.parentId,
    children: items
      .filter((child) => child.parentId === parent.id)
      .map((child) => ({
        id: child.id,
        label: child.label,
        url: child.url,
        newTab: child.newTab,
        parentId: child.parentId,
      })),
  }));

  return (
    <HeaderClient
      siteName={s["site.name"]}
      logoUrl={s["site.logoUrl"]}
      menuItems={menuItems}
    />
  );
}
