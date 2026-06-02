import { getSettings, SETTING_DEFAULTS } from "@/lib/settings";
import { saveCustomCodeAction } from "./actions";
import { AdminForm } from "@/components/admin/admin-form";
import { Save, Code, Info, Terminal } from "lucide-react";

export const metadata = { title: "Custom Code Injection" };

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <Icon className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const EDITOR_CLASS = "w-full min-h-[250px] p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm text-sky-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y shadow-inner";

export default async function CustomCodePage() {
  const s = await getSettings(["custom.css", "custom.js"]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Custom Code Injection</h1>
        <p className="text-sm text-slate-500 mt-0.5">Inject custom styling and script behaviors globally across all public pages</p>
      </div>

      {/* Guide Banner */}
      <div className="flex gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Advanced Customization Guide</p>
          <ul className="list-disc list-inside space-y-1 text-slate-500">
            <li><strong>Custom CSS</strong> is dynamically inserted inside a &lt;style&gt; block in the head element of all public pages. You do not need to wrap it in &lt;style&gt; tags.</li>
            <li><strong>Custom JS</strong> is inserted inside a &lt;script&gt; tag at the very bottom of all public pages&apos; body element. You do not need to wrap it in &lt;script&gt; tags.</li>
            <li>Use custom CSS to override layout styles, colors, and button transitions, and custom JS to add third-party analytics or widgets.</li>
          </ul>
        </div>
      </div>

      <AdminForm action={saveCustomCodeAction} successMessage="Custom code saved and active!" className="space-y-6">
        
        {/* CSS Section */}
        <Section icon={Code} title="Custom CSS Styling">
          <Field 
            label="CSS Rules (Global)" 
            hint="Styling rules here take precedence and are loaded immediately in the head. Perfect for custom branding overrides."
          >
            <textarea
              name="custom.css"
              defaultValue={s["custom.css"]}
              placeholder="/* Example: invert theme or override primary buttons */&#10;.bg-primary { background-color: #6366f1 !important; }"
              className={EDITOR_CLASS}
            />
          </Field>
        </Section>

        {/* JS Section */}
        <Section icon={Terminal} title="Custom JS Scripts">
          <Field 
            label="Javascript Executables (Global)" 
            hint="Scripts here are loaded asynchronously at the end of the body element to optimize page performance."
          >
            <textarea
              name="custom.js"
              defaultValue={s["custom.js"]}
              placeholder="// Example: custom click events or analytics tracking&#10;console.log('Site initialized successfully!');"
              className={EDITOR_CLASS.replace("text-sky-400", "text-amber-400")}
            />
          </Field>
        </Section>

        <div className="sticky bottom-6 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save & Apply Code
          </button>
        </div>
      </AdminForm>
    </div>
  );
}
