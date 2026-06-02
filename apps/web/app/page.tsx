import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FilteredToolsGrid } from "@/components/tools/filtered-tools-grid";
import { TOOLS, type ToolCategory } from "@pdf-tools/core/src/tools";
import type { ToolItem } from "@/components/tools/filtered-tools-grid";
import messages from "@/messages/en.json";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "w3converter — Free Online PDF Utilities",
  description:
    "Every tool you need to work with PDFs — merge, split, compress, convert, protect and more. 100% free, no registration required.",
};

export default async function HomePage() {
  let configs: Awaited<ReturnType<typeof prisma.toolConfig.findMany>> = [];
  let s: Record<string, string> = {};
  try {
    [configs, s] = await Promise.all([
      prisma.toolConfig.findMany({ orderBy: { sortOrder: "asc" } }),
      getSettings(["home.heroTitle", "home.heroDesc"]),
    ]);
  } catch {
    // Tables may not exist during first deploy build — use defaults
    s = {
      "home.heroTitle": "Every tool you need to work with PDFs in one place",
      "home.heroDesc": "Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and protect PDFs with just a few clicks.",
    };
  }

  const configMap = Object.fromEntries(configs.map((c) => [c.toolId, c]));

  const heroTitle = s["home.heroTitle"];
  const heroDesc = s["home.heroDesc"];

  const tools: ToolItem[] = TOOLS
    .filter((tool) => configMap[tool.id]?.enabled !== false)
    .sort((a, b) => {
      const oa = configMap[a.id]?.sortOrder ?? 999;
      const ob = configMap[b.id]?.sortOrder ?? 999;
      return oa - ob;
    })
    .map((tool) => {
      const cfg  = configMap[tool.id];
      const data = (messages.tools as Record<string, { title: string; desc: string }>)[tool.id] ?? {
        title: tool.label,
        desc: "",
      };
      return {
        id: tool.id,
        icon: tool.icon,
        category: tool.category as ToolCategory,
        title: cfg?.customTitle || data.title,
        desc:  cfg?.customDesc  || data.desc,
      };
    });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-12 px-4">
          <div className="absolute inset-0 bg-linear-to-b from-rose-50/60 via-orange-50/30 to-transparent -z-10 pointer-events-none" />
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5 whitespace-pre-line">
              {heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {heroDesc}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20 max-w-6xl">
          <FilteredToolsGrid tools={tools} />
        </section>

        {/* SEO-friendly content section */}
        <section className="border-t border-border bg-muted/20 py-16 px-4">
          <div className="container mx-auto max-w-4xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
                Free, Quick, and Secure Online PDF Tools
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Discover why thousands of users trust w3converter every day for all their document editing and conversion needs.
              </p>
            </div>

            <div className="text-muted-foreground space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                Welcome to your ultimate home for simple and free document editing. We know that working with PDF files can sometimes be frustrating, expensive, or require installing complicated software. That is why we built a complete collection of online tools to help you manage your files in seconds. Whether you need to merge multiple reports into one, split a large document into separate pages, or compress a file to make it small enough for email, our platform has you covered. Everything runs directly inside your web browser, which means you can get your work done from any device, anywhere in the world.
              </p>
              <p>
                Security and privacy are at the heart of everything we do. When you upload your sensitive business reports, school assignments, or personal documents, you can rest easy knowing they are fully protected. Our system automatically deletes all uploaded and processed files from our secure servers after exactly one hour. We never read, share, or store your files, and we do not index them for search engines. This gives you complete peace of mind, making our site one of the safest and most reliable document managers available online today.
              </p>
              <p>
                Our tools are designed to be incredibly easy for everyone to use, regardless of your computer skills. You do not need to sign up for an account, fill out any forms, or enter your credit card details. Every utility is one hundred percent free with no hidden charges, limitations on file counts, or annoying watermarks on your final downloads. With a clean, modern, and simple interface, all it takes is a quick drag and drop to successfully convert files, rotate pages, or secure documents with passwords. We believe that professional document editing should be accessible to everyone without barriers.
              </p>
              <p>
                Beyond standard PDF features, we also provide a wide range of utility options to handle your everyday tasks. You can seamlessly convert other file types to and from PDF, protect your private information with strong passwords, or unlock previously protected files when you need to make changes. Our fast processing servers ensure that even large documents are converted or optimized almost instantly. Thank you for choosing us as your go-to document helper. We are continuously improving our service to make sure you always have the best and most seamless file experience possible.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
