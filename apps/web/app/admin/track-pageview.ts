"use server";

import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function trackPageView(toolId: string) {
  try {
    const hdrs = await headers();
    const ip   = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua   = hdrs.get("user-agent") ?? null;
    await prisma.pageView.create({ data: { toolId, ip, ua } });
  } catch {
    // never throw — tracking is best-effort
  }
}
