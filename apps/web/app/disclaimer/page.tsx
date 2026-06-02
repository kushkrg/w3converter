import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/db";
import { DEFAULT_PAGES } from "@/lib/default-pages";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer and legal terms for using w3converter free online PDF tools.",
};

export default async function DisclaimerPage() {
  let pageData: Awaited<ReturnType<typeof prisma.page.findUnique>> = null;
  try {
    pageData = await prisma.page.findUnique({ where: { slug: "disclaimer" } });
  } catch {
    // Table may not exist during first deploy build
  }
  const content = pageData?.content || DEFAULT_PAGES.disclaimer.content;
  const title = pageData?.title || "Disclaimer";
  const updatedAt = pageData?.updatedAt || new Date("2026-05-26");

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="relative overflow-hidden bg-linear-to-b from-slate-50/50 to-background dark:from-slate-900/10 border-b border-border/40 py-10 px-4">
          <div className="absolute -top-20 right-0 w-72 h-72 rounded-full blur-3xl -z-10 bg-slate-200/20 dark:bg-slate-800/10" />
          <div className="container mx-auto max-w-3xl">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{title}</span>
            </nav>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">{title}</h1>
            <p className="text-xs text-muted-foreground">
              Last updated on {new Date(updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </main>
      <Footer />
    </>
  );
}
