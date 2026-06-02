import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOLS, type ToolId } from "@pdf-tools/core/src/tools";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToolForm } from "@/components/tools/tool-form";
import {
  ICON_MAP,
  TOOL_GRADIENT,
  CATEGORY_GRADIENT,
} from "@/components/tools/tool-card";
import Link from "next/link";
import { ChevronRight, CheckCircle2, File, ArrowRight } from "lucide-react";
import messages from "@/messages/en.json";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { PageTracker } from "@/components/admin/page-tracker";
import { DEFAULT_SEO } from "@/lib/default-seo";
import { AdSlot } from "@/components/ads/ad-slot";
import { getSettings } from "@/lib/settings";

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ toolId: tool.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolId: string }>;
}): Promise<Metadata> {
  const { toolId } = await params;
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    try {
      const pageData = await prisma.page.findUnique({ where: { slug: toolId } });
      if (pageData) {
        return {
          title: pageData.title,
          description: `${pageData.title} on w3converter`,
        };
      }
    } catch {
      // Table may not exist during first deploy build
    }
    return {};
  }
  const data = (messages.tools as Record<string, { title: string; desc: string }>)[toolId];
  let cfg: Awaited<ReturnType<typeof prisma.toolConfig.findUnique>> = null;
  try {
    cfg = await prisma.toolConfig.findUnique({ where: { toolId } });
  } catch {
    // Table may not exist during first deploy build
  }
  const defaultSeo = DEFAULT_SEO[toolId];
  return {
    title:       cfg?.metaTitle  || defaultSeo?.metaTitle || data?.title || tool.label,
    description: cfg?.metaDesc   || defaultSeo?.metaDesc || data?.desc,
    keywords:    cfg?.keywords
      ? cfg.keywords.split(",").map((k) => k.trim())
      : defaultSeo?.keywords
        ? defaultSeo.keywords.split(",").map((k) => k.trim())
        : [tool.label, "PDF", "online", "free", toolId.replace(/-/g, " ")],
  };
}

const RELATED_TOOLS: Record<string, string[]> = {
  "merge-pdf":      ["split-pdf", "organize-pdf", "compress-pdf"],
  "split-pdf":      ["merge-pdf", "extract-pages", "delete-pages"],
  "compress-pdf":   ["grayscale-pdf", "merge-pdf", "protect-pdf"],
  "word-to-pdf":    ["pdf-to-word", "ppt-to-pdf", "excel-to-pdf"],
  "jpg-to-pdf":     ["png-to-pdf", "pdf-to-jpg", "merge-pdf"],
  "watermark-pdf":  ["protect-pdf", "compress-pdf", "grayscale-pdf"],
  "protect-pdf":    ["watermark-pdf", "unlock-pdf", "compress-pdf"],
};

const CATEGORY_COLORS: Record<string, { badge: string; heroBg: string; heroBlob: string }> = {
  organize: { badge: "bg-blue-50 text-blue-700 border-blue-200",        heroBg: "from-blue-50/50 to-background",    heroBlob: "bg-blue-200/20" },
  optimize: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", heroBg: "from-emerald-50/50 to-background", heroBlob: "bg-emerald-200/20" },
  convert:  { badge: "bg-amber-50 text-amber-700 border-amber-200",      heroBg: "from-amber-50/50 to-background",   heroBlob: "bg-amber-200/20" },
  security: { badge: "bg-violet-50 text-violet-700 border-violet-200",   heroBg: "from-violet-50/50 to-background",  heroBlob: "bg-violet-200/20" },
};

const CATEGORY_LABELS: Record<string, string> = {
  organize: "PDF Organization",
  optimize: "Optimization",
  convert:  "Convert",
  security: "Security",
};

export default async function ToolPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;
  const tool = TOOLS.find((t) => t.id === toolId);
  
  if (!tool) {
    let pageData: Awaited<ReturnType<typeof prisma.page.findUnique>> = null;
    try {
      pageData = await prisma.page.findUnique({ where: { slug: toolId } });
    } catch {
      // Table may not exist during first deploy build
    }
    if (!pageData) notFound();

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
                <span className="text-foreground font-medium">{pageData.title}</span>
              </nav>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">{pageData.title}</h1>
              <p className="text-xs text-muted-foreground">
                Last updated on {new Date(pageData.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
          </div>
        </main>
        <Footer />
        <PageTracker toolId={toolId} />
      </>
    );
  }

  let cfgPage: Awaited<ReturnType<typeof prisma.toolConfig.findUnique>> = null;
  let recaptchaSettings: Record<string, string> = {};
  try {
    cfgPage = await prisma.toolConfig.findUnique({ where: { toolId } });
    recaptchaSettings = await getSettings(["recaptcha.enabled", "recaptcha.siteKey"]);
  } catch {
    // Table may not exist during first deploy build
  }
  const cfg = cfgPage;
  const recaptchaSiteKey = recaptchaSettings["recaptcha.enabled"] === "true" ? recaptchaSettings["recaptcha.siteKey"] : "";
  if (cfg && !cfg.enabled) notFound();

  const allData = messages.tools as Record<string, { title: string; desc: string }>;
  const baseData = allData[toolId] ?? { title: tool.label, desc: "" };
  const defaultSeo = DEFAULT_SEO[toolId];
  const data = {
    title: cfg?.customTitle || baseData.title,
    desc:  cfg?.customDesc  || baseData.desc,
  };
  const relatedIds =
    RELATED_TOOLS[toolId] ??
    TOOLS.filter((t) => t.category === tool.category && t.id !== toolId)
      .slice(0, 3)
      .map((t) => t.id);
  const colors = CATEGORY_COLORS[tool.category] ?? CATEGORY_COLORS.organize;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={cn("relative overflow-hidden bg-linear-to-b border-b border-border/40 py-10 px-4", colors.heroBg)}>
          <div className={cn("absolute -top-20 right-0 w-72 h-72 rounded-full blur-3xl -z-10", colors.heroBlob)} />
          <div className="container mx-auto max-w-3xl">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{data.title}</span>
            </nav>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">{data.title}</h1>
            <p className="text-muted-foreground">{data.desc}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-3xl">
          {/* Ad: Above Tool Form */}
          <AdSlot slotKey="ads.toolPageTop" adFormat="horizontal" className="mb-6" />

          <div className="rounded-2xl border bg-card shadow-sm p-7">
            <ToolForm toolId={tool.id as ToolId} recaptchaSiteKey={recaptchaSiteKey} />
          </div>

          <section className="mt-12 rounded-2xl border bg-muted/20 p-7">
            <h2 className="text-lg font-bold mb-5">How to {data.title.toLowerCase()}</h2>
            <ol className="space-y-3">
              {[
                "Upload your file using the drop zone above.",
                "Configure any options if available.",
                `Click "Process File" and wait a few seconds.`,
                "Download the result — your file is automatically deleted after 1 hour.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            {["No registration needed", "Files deleted after 1 hour", "100% free, no limits"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Ad: Below How-To Section */}
          <AdSlot slotKey="ads.toolPageBottom" adFormat="horizontal" className="mt-8" />

          {(() => {
            const content = cfg?.seoContent || defaultSeo?.seoContent;
            if (!content) return null;
            const isHtml = content.includes("<p>") || content.includes("<br>") || content.includes("<ul>") || content.includes("<strong>");

            return (
              <article className="mt-12 rounded-2xl border border-border bg-card p-8 shadow-xs">
                <h2 className="text-xl font-bold tracking-tight text-foreground mb-5 flex items-center gap-2.5">
                  <span className={cn("w-1.5 h-6 rounded-full shrink-0", 
                    tool.category === "organize" && "bg-blue-500",
                    tool.category === "optimize" && "bg-emerald-500",
                    tool.category === "convert" && "bg-amber-500",
                    tool.category === "security" && "bg-violet-500"
                  )} />
                  {data.title} — Online Tool Guide
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-4 font-normal prose max-w-none prose-slate dark:prose-invert">
                  {isHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    content.split("\n\n").map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))
                  )}
                </div>
              </article>
            );
          })()}

          {relatedIds.length > 0 && (
            <section className="mt-10 pt-8 border-t border-border/50">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold">You might also like</h2>
                <Link
                  href="/tools"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  All tools <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedIds.map((id) => {
                  const rel = TOOLS.find((t) => t.id === id);
                  if (!rel) return null;
                  const relData = allData[id];
                  const Icon = ICON_MAP[rel.icon] ?? File;
                  const gradient =
                    TOOL_GRADIENT[id as ToolId] ??
                    CATEGORY_GRADIENT[rel.category as keyof typeof CATEGORY_GRADIENT];
                  return (
                    <Link
                      key={id}
                      href={`/${id}`}
                      className="group flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          gradient
                        )}
                      >
                        <Icon className="h-5 w-5 text-white drop-shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-snug truncate">
                          {relData?.title ?? rel.label}
                        </p>
                        {relData?.desc && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {relData.desc}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <PageTracker toolId={toolId} />
    </>
  );
}
