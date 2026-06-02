"use server";

import { createSession, clearSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email    = (formData.get("email")    as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const ok = await createSession(email, password);
  if (!ok) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/admin/login");
}
