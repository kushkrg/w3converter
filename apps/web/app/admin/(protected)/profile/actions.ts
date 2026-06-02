"use server";

import { requireAdmin, hashPassword, verifyPassword, clearSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const { email: currentEmail } = await requireAdmin();

  const newEmail = (formData.get("email") as string)?.trim() ?? "";
  const currentPassword = (formData.get("currentPassword") as string) ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!newEmail) {
    throw new Error("Administrator email address is required");
  }

  // 1. Fetch current stored credentials from database
  const emailRow = await prisma.settings.findUnique({ where: { key: "admin.email" } });
  const passHashRow = await prisma.settings.findUnique({ where: { key: "admin.passwordHash" } });

  const envEmail = process.env["ADMIN_EMAIL"] ?? "admin@example.com";
  const envPassword = process.env["ADMIN_PASSWORD"] ?? "admin";

  const targetEmail = emailRow?.value || envEmail;

  // 2. Handle Password Change if requested
  const isChangingPassword = currentPassword || newPassword || confirmPassword;
  
  if (isChangingPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error("All password fields (current, new, and confirm) must be filled to update password");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirm password fields do not match");
    }

    if (newPassword.length < 5) {
      throw new Error("New password must be at least 5 characters long for security");
    }

    // Verify current password is correct
    let isCurrentValid = false;
    if (passHashRow?.value) {
      isCurrentValid = verifyPassword(currentPassword, passHashRow.value);
    } else {
      isCurrentValid = currentPassword === envPassword;
    }

    if (!isCurrentValid) {
      throw new Error("The current secure password you entered is incorrect");
    }

    // Hash the new password and save it
    const newHash = hashPassword(newPassword);
    await prisma.settings.upsert({
      where: { key: "admin.passwordHash" },
      create: { key: "admin.passwordHash", value: newHash },
      update: { value: newHash },
    });
  }

  // 3. Handle Email Change
  const isChangingEmail = newEmail !== targetEmail;
  if (isChangingEmail) {
    await prisma.settings.upsert({
      where: { key: "admin.email" },
      create: { key: "admin.email", value: newEmail },
      update: { value: newEmail },
    });
    
    // Immediately log out active sessions because the session email changed
    await clearSession();
  }

  revalidatePath("/admin");
  revalidatePath("/admin/profile");
}
