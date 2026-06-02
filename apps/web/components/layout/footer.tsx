import Link from "next/link";
import { FileText, ShieldCheck, Clock } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

export async function Footer() {
  const s = await getSettings(["site.name", "footer.tagline", "footer.filesDeletedNote", "site.logoUrl"]);
  const siteName = s["site.name"] || "w3converter";
  const tagline = s["footer.tagline"] || "Free online PDF tools — no registration, no software needed.";
  const filesDeletedNote = s["footer.filesDeletedNote"] || "Uploaded files are automatically deleted after 1 hour";
  const logoUrl = s["site.logoUrl"] || "";

  // Fetch active footer links ordered by priority
  const footerItems = await prisma.menuItem.findMany({
    where: { location: "FOOTER", isActive: true },
    orderBy: { order: "asc" },
  });

  // Group footer links by custom column header categories
  const footerGroups: Record<string, typeof footerItems> = {};
  footerItems.forEach((item) => {
    const grp = item.group || "Links";
    if (!footerGroups[grp]) {
      footerGroups[grp] = [];
    }
    footerGroups[grp].push(item);
  });

  const hasDynamicFooter = footerItems.length > 0;

  // Split siteName into first part and last word for styling the logo
  const words = siteName.split(" ");
  const firstPart = words.slice(0, -1).join(" ");
  const lastWord = words[words.length - 1] ?? "";

  return (
    <footer className="mt-auto border-t border-border/50 bg-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 font-bold text-lg mb-3">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-7 w-auto object-contain" />
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span>
                    {firstPart}{firstPart ? " " : ""}<span className="text-primary">{lastWord}</span>
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {tagline}
            </p>
          </div>

          {/* Dynamic / Static Columns */}
          {hasDynamicFooter ? (
            Object.entries(footerGroups).map(([groupName, items]) => (
              <div key={groupName} className="flex flex-col gap-2">
                <p className="font-semibold text-sm mb-1">{groupName}</p>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.newTab ? "_blank" : undefined}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))
          ) : (
            /* Legal Fallback */
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-sm mb-1">Legal</p>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                Terms of Service
              </Link>
              <Link
                href="/disclaimer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                Disclaimer
              </Link>
            </div>
          )}

          {/* Trust signals */}
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-sm mb-1">Privacy & Security</p>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Files never indexed or shared with third parties</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{filesDeletedNote}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</span>
          <span>26+ free PDF tools · No registration · No software needed</span>
        </div>
      </div>
    </footer>
  );
}
