"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function saveToolsAction(formData: FormData) {
  await requireAdmin();

  const toolIds = [...new Set(
    [...formData.keys()]
      .filter((k) => k.includes(":"))
      .map((k) => k.split(":")[0]!)
  )];

  await Promise.all(
    toolIds.map((toolId, idx) => {
      const enabled    = formData.has(`${toolId}:enabled`);
      const sortOrder  = parseInt(formData.get(`${toolId}:sortOrder`) as string ?? String(idx), 10);
      const customTitle = (formData.get(`${toolId}:customTitle`) as string) || null;
      const customDesc  = (formData.get(`${toolId}:customDesc`)  as string) || null;
      return prisma.toolConfig.upsert({
        where:  { toolId },
        create: { toolId, enabled, sortOrder, customTitle, customDesc },
        update: { enabled, sortOrder, customTitle, customDesc },
      });
    })
  );

  revalidatePath("/admin/tools");
  revalidatePath("/");
  revalidatePath("/tools");
}

export async function moveToolAction(toolId: string, direction: "up" | "down", allToolIds: string[], formData?: FormData) {
  await requireAdmin();

  if (formData) {
    const toolIds = [...new Set(
      [...formData.keys()]
        .filter((k) => k.includes(":"))
        .map((k) => k.split(":")[0]!)
    )];

    await Promise.all(
      toolIds.map((tid, idx) => {
        const enabled    = formData.has(`${tid}:enabled`);
        const sortOrder  = parseInt(formData.get(`${tid}:sortOrder`) as string ?? String(idx), 10);
        const customTitle = (formData.get(`${tid}:customTitle`) as string) || null;
        const customDesc  = (formData.get(`${tid}:customDesc`)  as string) || null;
        return prisma.toolConfig.upsert({
          where:  { toolId: tid },
          create: { toolId: tid, enabled, sortOrder, customTitle, customDesc },
          update: { enabled, sortOrder, customTitle, customDesc },
        });
      })
    );
  }

  const configs = await prisma.toolConfig.findMany({ orderBy: { sortOrder: "asc" } });
  const configMap = Object.fromEntries(configs.map((c) => [c.toolId, c]));

  // Build the current ordered list from allToolIds, filling in missing sort orders
  const ordered = allToolIds.map((id, i) => ({
    toolId: id,
    sortOrder: configMap[id]?.sortOrder ?? i,
  })).sort((a, b) => a.sortOrder - b.sortOrder);

  const idx = ordered.findIndex((t) => t.toolId === toolId);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ordered.length) return;

  // Swap sort orders
  const a = ordered[idx]!;
  const b = ordered[swapIdx]!;

  await Promise.all([
    prisma.toolConfig.upsert({ where: { toolId: a.toolId }, create: { toolId: a.toolId, sortOrder: b.sortOrder }, update: { sortOrder: b.sortOrder } }),
    prisma.toolConfig.upsert({ where: { toolId: b.toolId }, create: { toolId: b.toolId, sortOrder: a.sortOrder }, update: { sortOrder: a.sortOrder } }),
  ]);

  revalidatePath("/admin/tools");
  revalidatePath("/");
}
