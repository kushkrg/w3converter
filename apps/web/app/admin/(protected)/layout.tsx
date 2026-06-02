import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { SidebarNav } from "@/components/admin/sidebar-nav";

export const metadata: Metadata = {
  title: { template: "%s — Admin", default: "Dashboard — Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarNav email={email} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
