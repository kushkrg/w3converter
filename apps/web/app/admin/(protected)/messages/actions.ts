"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function deleteMessageAction(messageId: string) {
  await requireAdmin();

  await prisma.contactMessage.delete({
    where: { id: messageId },
  });

  revalidatePath("/admin/messages");
}
