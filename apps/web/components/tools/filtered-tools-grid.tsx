"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ToolCard } from "./tool-card";
import type { ToolCategory } from "@pdf-tools/core/src/tools";

export interface ToolItem {
  id: string;
  icon: string;
  category: ToolCategory;
  title: string;
  desc: string;
}

const TABS: { id: ToolCategory | "all"; label: string }[] = [
  { id: "all",      label: "All Tools" },
  { id: "organize", label: "Organize PDF" },
  { id: "optimize", label: "Optimize PDF" },
  { id: "convert",  label: "Convert PDF" },
  { id: "security", label: "PDF Security" },
];

export function FilteredToolsGrid({ tools }: { tools: ToolItem[] }) {
  const [active, setActive] = useState<ToolCategory | "all">("all");

  const filtered = active === "all" ? tools : tools.filter((t) => t.category === active);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all border",
              active === tab.id
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((tool) => (
          <ToolCard
            key={tool.id}
            toolId={tool.id as import("@pdf-tools/core/src/tools").ToolId}
            icon={tool.icon}
            title={tool.title}
            desc={tool.desc}
            category={tool.category}
          />
        ))}
      </div>
    </div>
  );
}
