"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Search, Wrench, Settings, Shield,
  FileText, LogOut, ExternalLink, Code2, Mail, Menu, DollarSign, User
} from "lucide-react";
import { logoutAction } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/admin/profile",   label: "Admin Profile",icon: User },
  { href: "/admin/messages",  label: "Messages",   icon: Mail },
  { href: "/admin/pages",     label: "Page Manager",icon: FileText },
  { href: "/admin/menus",     label: "Menu Manager",icon: Menu },
  { href: "/admin/ads",       label: "Google Ads",  icon: DollarSign },
  { href: "/admin/seo",       label: "SEO Manager",icon: Search },
  { href: "/admin/tools",     label: "Tools",      icon: Wrench },
  { href: "/admin/settings",  label: "Settings",   icon: Settings },
  { href: "/admin/recaptcha", label: "reCAPTCHA",  icon: Shield },
  { href: "/admin/custom-code",label: "Custom Code",icon: Code2 },
];

export function SidebarNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col min-h-screen">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">w3converter</p>
          <p className="text-slate-500 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-slate-400 hover:text-white hover:bg-slate-800",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Site
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </form>

        <div className="px-3 pt-2">
          <p className="text-xs text-slate-600 truncate">{email}</p>
        </div>
      </div>
    </aside>
  );
}
