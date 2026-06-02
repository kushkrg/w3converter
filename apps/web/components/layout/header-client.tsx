"use client";

import Link from "next/link";
import { FileText, Menu, X, Search, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TOOLS } from "@pdf-tools/core/src/tools";
import messages from "@/messages/en.json";

const TOOL_INDEX = TOOLS.map((t) => {
  const data = (messages.tools as Record<string, { title: string; desc: string }>)[t.id];
  return { id: t.id, title: data?.title ?? t.label, category: t.category };
});

export interface MenuItemType {
  id: string;
  label: string;
  url: string;
  newTab: boolean;
  parentId: string | null;
  children?: MenuItemType[];
}

export function HeaderClient({
  siteName = "w3converter",
  logoUrl = "",
  menuItems = []
}: {
  siteName?: string;
  logoUrl?: string;
  menuItems?: MenuItemType[];
}) {
  const fallbackMenu: MenuItemType[] = [
    { id: "home", label: "Home", url: "/", newTab: false, parentId: null, children: [] },
    { id: "tools", label: "Tools", url: "/tools", newTab: false, parentId: null, children: [] },
    { id: "about", label: "About", url: "/about", newTab: false, parentId: null, children: [] },
    { id: "contact", label: "Contact", url: "/contact", newTab: false, parentId: null, children: [] },
  ];

  const activeLinks = menuItems.length > 0 ? menuItems : fallbackMenu;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const results =
    query.length >= 1
      ? TOOL_INDEX.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
      : [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Split siteName into first part and last word for styling the logo
  const words = siteName.split(" ");
  const firstPart = words.slice(0, -1).join(" ");
  const lastWord = words[words.length - 1] ?? "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-primary/30 transition-shadow">
                <FileText className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <span className="tracking-tight">
                {firstPart}{firstPart ? " " : ""}<span className="text-primary">{lastWord}</span>
              </span>
            </>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1.5 shrink-0">
          {activeLinks.map((link) => {
            const hasChildren = link.children && link.children.length > 0;
            if (hasChildren) {
              return (
                <div key={link.id} className="relative group/nav">
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer focus:outline-none">
                    {link.label}
                    <ChevronDown className="h-3 w-3 text-muted-foreground/75" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-border bg-background p-1.5 shadow-lg opacity-0 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:pointer-events-auto transition-all duration-200 z-50">
                    {link.children?.map((child) => (
                      <Link
                        key={child.id}
                        href={child.url}
                        target={child.newTab ? "_blank" : undefined}
                        className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={link.id}
                href={link.url}
                target={link.newTab ? "_blank" : undefined}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 justify-end">
          <div ref={searchRef} className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search tools…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border/60 bg-muted/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
            />
            {showResults && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border bg-background shadow-lg z-50 overflow-hidden">
                {results.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/${tool.id}`}
                    onClick={() => {
                      setQuery("");
                      setShowResults(false);
                    }}
                    className="flex items-center px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {tool.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 ml-auto"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-2">
            {/* Mobile search (static — no dropdown for simplicity) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search tools…"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border/60 bg-muted/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <nav className="flex flex-col gap-1">
              {activeLinks.map((link) => {
                const hasChildren = link.children && link.children.length > 0;
                return (
                  <div key={link.id} className="flex flex-col">
                    <Link
                      href={link.url}
                      target={link.newTab ? "_blank" : undefined}
                      className="px-3 py-2 text-sm font-semibold rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                    {hasChildren && (
                      <div className="pl-4 flex flex-col border-l border-border/50 ml-3 mt-0.5 mb-1.5 gap-1">
                        {link.children?.map((child) => (
                          <Link
                            key={child.id}
                            href={child.url}
                            target={child.newTab ? "_blank" : undefined}
                            className="px-3 py-1.5 text-xs text-muted-foreground font-medium rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
