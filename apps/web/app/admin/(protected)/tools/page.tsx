import { prisma } from "@/lib/db";
import { TOOLS } from "@pdf-tools/core/src/tools";
import messages from "@/messages/en.json";
import { saveToolsAction, moveToolAction } from "./actions";
import { Save, ChevronUp, ChevronDown } from "lucide-react";
import { AdminForm } from "@/components/admin/admin-form";

export const metadata = { title: "Tools Manager" };

const CATEGORY_COLOR: Record<string, string> = {
  organize: "bg-orange-100 text-orange-700",
  optimize: "bg-green-100  text-green-700",
  convert:  "bg-sky-100    text-sky-700",
  security: "bg-violet-100 text-violet-700",
};

export default async function ToolsPage() {
  const configs = await prisma.toolConfig.findMany({ orderBy: { sortOrder: "asc" } });
  const configMap = Object.fromEntries(configs.map((c) => [c.toolId, c]));
  const allData = messages.tools as Record<string, { title: string; desc: string }>;

  // Sort TOOLS by saved sortOrder, falling back to the default array order
  const sorted = [...TOOLS].sort((a, b) => {
    const oa = configMap[a.id]?.sortOrder ?? 999;
    const ob = configMap[b.id]?.sortOrder ?? 999;
    return oa - ob;
  });

  const allToolIds = sorted.map((t) => t.id);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tools Manager</h1>
        <p className="text-sm text-slate-500 mt-0.5">Enable/disable tools, set custom labels, and reorder the homepage grid</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(CATEGORY_COLOR).map(([cat, cls]) => (
          <span key={cat} className={`px-2.5 py-1 rounded-full font-medium capitalize ${cls}`}>{cat}</span>
        ))}
      </div>

      <AdminForm action={saveToolsAction} successMessage="Tools settings saved successfully!">
        {/* Hidden ordered IDs for reference */}
        <input type="hidden" name="_allToolIds" value={allToolIds.join(",")} />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tool</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Custom Label</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Custom Desc</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Enabled</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Move</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map((tool, idx) => {
                const cfg      = configMap[tool.id];
                const defaults = allData[tool.id] ?? { title: tool.label, desc: "" };
                const enabled  = cfg?.enabled ?? true;

                return (
                  <tr key={tool.id} className={`hover:bg-slate-50/40 transition-colors ${!enabled ? "opacity-50" : ""}`}>
                    {/* Sort order hidden field */}
                    <td className="px-5 py-3 text-slate-400 text-xs tabular-nums">
                      <input type="hidden" name={`${tool.id}:sortOrder`} value={idx} />
                      {idx + 1}
                    </td>

                    {/* Tool name + category */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{defaults.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[tool.category] ?? ""}`}>
                          {tool.category}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{tool.id}</span>
                    </td>

                    {/* Custom title */}
                    <td className="px-5 py-3">
                      <input
                        name={`${tool.id}:customTitle`}
                        type="text"
                        defaultValue={cfg?.customTitle ?? ""}
                        placeholder={defaults.title}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </td>

                    {/* Custom desc */}
                    <td className="px-5 py-3">
                      <input
                        name={`${tool.id}:customDesc`}
                        type="text"
                        defaultValue={cfg?.customDesc ?? ""}
                        placeholder={defaults.desc.slice(0, 50) + "…"}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </td>

                    {/* Enabled toggle */}
                    <td className="px-5 py-3 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name={`${tool.id}:enabled`}
                          value="true"
                          defaultChecked={enabled}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                      </label>
                    </td>

                    {/* Move up/down */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="submit"
                          formAction={moveToolAction.bind(null, tool.id, "up", allToolIds)}
                          disabled={idx === 0}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="submit"
                          formAction={moveToolAction.bind(null, tool.id, "down", allToolIds)}
                          disabled={idx === sorted.length - 1}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="sticky bottom-6 mt-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Tool Settings
          </button>
        </div>
      </AdminForm>
    </div>
  );
}
