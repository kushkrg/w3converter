import Link from "next/link";
import {
  Merge, Scissors, RotateCw, Trash2, Layers, FileOutput, Wrench,
  Minimize2, Palette, Image, FileText, Presentation, Table, File,
  Archive, Lock, Unlock, Stamp, Receipt, PenLine,
} from "lucide-react";
import type { ToolId, ToolCategory } from "@pdf-tools/core/src/tools";
import { cn } from "@/lib/utils";

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  merge: Merge,
  split: Scissors,
  rotate: RotateCw,
  trash: Trash2,
  layers: Layers,
  scissors: Scissors,
  wrench: Wrench,
  compress: Minimize2,
  palette: Palette,
  image: Image,
  "file-text": FileText,
  presentation: Presentation,
  table: Table,
  file: File,
  archive: Archive,
  lock: Lock,
  unlock: Unlock,
  stamp: Stamp,
  receipt: Receipt,
  "pen-line": PenLine,
};

export const CATEGORY_GRADIENT: Record<ToolCategory, string> = {
  organize: "bg-linear-to-br from-orange-400 to-rose-500",
  optimize: "bg-linear-to-br from-green-400 to-emerald-600",
  convert:  "bg-linear-to-br from-sky-400 to-blue-600",
  security: "bg-linear-to-br from-violet-500 to-purple-700",
};

export const TOOL_GRADIENT: Partial<Record<ToolId, string>> = {
  "merge-pdf":     "bg-linear-to-br from-orange-400 to-red-500",
  "split-pdf":     "bg-linear-to-br from-rose-400 to-pink-600",
  "rotate-pdf":    "bg-linear-to-br from-amber-400 to-orange-500",
  "delete-pages":  "bg-linear-to-br from-red-400 to-rose-600",
  "organize-pdf":  "bg-linear-to-br from-orange-400 to-amber-500",
  "extract-pages": "bg-linear-to-br from-yellow-400 to-orange-500",
  "repair-pdf":    "bg-linear-to-br from-amber-500 to-orange-600",
  "compress-pdf":  "bg-linear-to-br from-green-400 to-emerald-600",
  "grayscale-pdf": "bg-linear-to-br from-slate-400 to-gray-600",
  "jpg-to-pdf":    "bg-linear-to-br from-yellow-400 to-amber-500",
  "png-to-pdf":    "bg-linear-to-br from-teal-400 to-cyan-600",
  "bmp-to-pdf":    "bg-linear-to-br from-indigo-400 to-blue-600",
  "tiff-to-pdf":   "bg-linear-to-br from-cyan-400 to-teal-600",
  "pdf-to-jpg":    "bg-linear-to-br from-amber-400 to-yellow-500",
  "pdf-to-png":    "bg-linear-to-br from-teal-400 to-emerald-600",
  "word-to-pdf":   "bg-linear-to-br from-blue-500 to-blue-700",
  "pdf-to-word":   "bg-linear-to-br from-sky-400 to-blue-600",
  "ppt-to-pdf":    "bg-linear-to-br from-red-500 to-orange-600",
  "pdf-to-ppt":    "bg-linear-to-br from-orange-500 to-red-600",
  "excel-to-pdf":  "bg-linear-to-br from-green-500 to-emerald-700",
  "txt-to-pdf":    "bg-linear-to-br from-slate-400 to-slate-600",
  "pdf-to-txt":    "bg-linear-to-br from-gray-400 to-slate-600",
  "pdf-to-zip":    "bg-linear-to-br from-amber-500 to-yellow-600",
  "protect-pdf":   "bg-linear-to-br from-violet-500 to-purple-700",
  "unlock-pdf":    "bg-linear-to-br from-purple-400 to-fuchsia-600",
  "watermark-pdf": "bg-linear-to-br from-cyan-500 to-indigo-600",
  "invoice-pdf":   "bg-linear-to-br from-emerald-500 to-teal-700",
  "signature-pdf": "bg-linear-to-br from-rose-500 to-pink-700",
};

interface ToolCardProps {
  toolId: ToolId;
  icon: string;
  title: string;
  desc: string;
  category: ToolCategory;
}

export function ToolCard({ toolId, icon, title, desc, category }: ToolCardProps) {
  const Icon = ICON_MAP[icon] ?? File;
  const gradient = TOOL_GRADIENT[toolId] ?? CATEGORY_GRADIENT[category];

  return (
    <Link href={`/${toolId}`} className="group block h-full">
      <div className="h-full bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        {/* Gradient icon box */}
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", gradient)}>
          <Icon className="h-7 w-7 text-white drop-shadow-sm" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-snug mb-1.5">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
