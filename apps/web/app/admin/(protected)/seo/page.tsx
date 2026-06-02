import { prisma } from "@/lib/db";
import { TOOLS } from "@pdf-tools/core/src/tools";
import messages from "@/messages/en.json";
import { saveSeoAction } from "./actions";
import { Search, Save, Info } from "lucide-react";
import { AdminForm } from "@/components/admin/admin-form";
import { DEFAULT_SEO } from "@/lib/default-seo";
import { CKEditorTextArea } from "@/components/admin/ckeditor-textarea";

export const metadata = { title: "SEO Manager" };

const CATEGORY_COLOR: Record<string, string> = {
  organize: "bg-orange-100 text-orange-700",
  optimize: "bg-green-100  text-green-700",
  convert:  "bg-sky-100    text-sky-700",
  security: "bg-violet-100 text-violet-700",
};

export default async function SeoPage() {
  const configs = await prisma.toolConfig.findMany();
  const configMap = Object.fromEntries(configs.map((c) => [c.toolId, c]));
  const allData = messages.tools as Record<string, { title: string; desc: string }>;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SEO Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">Override meta titles, descriptions and keywords per tool</p>
        </div>
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg max-w-xs">
          <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
          Pre-populated with high-quality SEO defaults. Edit to override!
        </div>
      </div>

      <AdminForm action={saveSeoAction} successMessage="SEO settings saved successfully!">
        <div className="space-y-3">
          {TOOLS.map((tool) => {
            const defaults = allData[tool.id] ?? { title: tool.label, desc: "" };
            const cfg      = configMap[tool.id];
            const defaultSeo = DEFAULT_SEO[tool.id];

            return (
              <details key={tool.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors list-none">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800 flex-1">{defaults.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[tool.category] ?? ""}`}>
                    {tool.category}
                  </span>
                  {(cfg?.metaTitle || cfg?.metaDesc || cfg?.seoContent) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">customised</span>
                  )}
                  <svg className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </summary>

                <div className="px-5 pb-5 pt-1 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Meta Title */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Meta Title</label>
                      <span className="text-xs text-slate-400">max 60 chars</span>
                    </div>
                    <input
                      name={`${tool.id}:metaTitle`}
                      type="text"
                      maxLength={60}
                      defaultValue={cfg?.metaTitle ?? defaultSeo?.metaTitle ?? ""}
                      placeholder={`${defaults.title} — Free Online PDF Tool`}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Keywords */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Keywords</label>
                    <input
                      name={`${tool.id}:keywords`}
                      type="text"
                      defaultValue={cfg?.keywords ?? defaultSeo?.keywords ?? ""}
                      placeholder="e.g. merge pdf, combine pdf files"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-1.5 lg:col-span-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Meta Description</label>
                      <span className="text-xs text-slate-400">max 160 chars</span>
                    </div>
                    <textarea
                      name={`${tool.id}:metaDesc`}
                      maxLength={160}
                      rows={2}
                      defaultValue={cfg?.metaDesc ?? defaultSeo?.metaDesc ?? ""}
                      placeholder={defaults.desc}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {/* SEO Article Content */}
                  <div className="space-y-1.5 lg:col-span-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">SEO Article Content (Dynamic Section)</label>
                      <span className="text-xs text-slate-400">Rich text enabled via CKEditor</span>
                    </div>
                    <CKEditorTextArea
                      name={`${tool.id}:seoContent`}
                      defaultValue={cfg?.seoContent ?? defaultSeo?.seoContent ?? ""}
                      placeholder="Write a 2-3 paragraph SEO friendly article for this tool."
                    />
                  </div>
                </div>
              </details>
            );
          })}
        </div>

        <div className="sticky bottom-6 mt-6 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save All SEO Settings
          </button>
        </div>
      </AdminForm>
    </div>
  );
}
