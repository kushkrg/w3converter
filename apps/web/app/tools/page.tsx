import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FilteredToolsGrid } from "@/components/tools/filtered-tools-grid";
import { TOOLS, type ToolCategory } from "@pdf-tools/core/src/tools";
import type { ToolItem } from "@/components/tools/filtered-tools-grid";
import messages from "@/messages/en.json";
import { AdSlot } from "@/components/ads/ad-slot";

export const metadata: Metadata = {
  title: "All PDF Tools",
  description: "All 26+ free PDF tools — merge, split, compress, convert, protect and more.",
};

export default function ToolsPage() {
  const tools: ToolItem[] = TOOLS.map((tool) => {
    const data = (messages.tools as Record<string, { title: string; desc: string }>)[tool.id] ?? {
      title: tool.label,
      desc: "",
    };
    return {
      id: tool.id,
      icon: tool.icon,
      category: tool.category as ToolCategory,
      title: data.title,
      desc: data.desc,
    };
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="relative overflow-hidden pt-14 pb-10 px-4">
          <div className="absolute inset-0 bg-linear-to-b from-rose-50/50 to-transparent -z-10 pointer-events-none" />
          <div className="container mx-auto text-center max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">All PDF Tools</h1>
            <p className="text-muted-foreground">
              26+ free online tools to manage, convert, and secure your PDF files — no sign-up required.
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-20 max-w-6xl">
          <AdSlot slotKey="ads.toolsListingAd" adFormat="horizontal" className="mb-8" />
          <FilteredToolsGrid tools={tools} />
        </div>
      </main>
      <Footer />
    </>
  );
}
