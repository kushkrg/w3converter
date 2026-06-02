import { getSettings, SETTING_DEFAULTS } from "@/lib/settings";
import { saveSettingsAction } from "./actions";
import { Settings, Save, Globe, Upload, Wrench, AlertTriangle, LayoutTemplate, Home } from "lucide-react";
import { AdminForm } from "@/components/admin/admin-form";

export const metadata = { title: "Settings" };

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

const INPUT = "w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export default async function SettingsPage() {
  const keys = Object.keys(SETTING_DEFAULTS).filter((k) => !k.startsWith("recaptcha"));
  const s = await getSettings(keys);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">General Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure site-wide behaviour and content</p>
      </div>

      <AdminForm action={saveSettingsAction} successMessage="Settings saved successfully!" className="space-y-6">

        {/* Site */}
        <Section icon={Globe} title="Site">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Site Name">
              <input name="site.name" type="text" defaultValue={s["site.name"]} placeholder={SETTING_DEFAULTS["site.name"]} className={INPUT} />
            </Field>
            <Field label="Contact Email">
              <input name="site.contactEmail" type="email" defaultValue={s["site.contactEmail"]} placeholder="contact@yoursite.com" className={INPUT} />
            </Field>
          </div>
          <Field label="Tagline">
            <input name="site.tagline" type="text" defaultValue={s["site.tagline"]} placeholder={SETTING_DEFAULTS["site.tagline"]} className={INPUT} />
          </Field>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-2 border-t border-slate-100">
            <Field label="Website Brand Logo Image" hint="Upload an SVG, PNG, or JPG to use as your website logo in the header and footer. Recommended height: 32px.">
              <input name="site.logoFile" type="file" accept=".svg,.png,.jpg,.jpeg" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer" />
            </Field>

            {s["site.logoUrl"] && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">Current Logo Preview</span>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-3 bg-slate-100 rounded-lg border border-slate-200 w-fit max-h-16 flex items-center justify-center">
                    <img src={s["site.logoUrl"]} alt="Current Logo" className="h-8 w-auto object-contain" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition-colors">
                    <input type="checkbox" name="site.clearLogo" className="rounded border-red-300 text-red-600 focus:ring-red-500 shrink-0" />
                    <span>Remove Logo</span>
                  </label>
                </div>
                <input type="hidden" name="site.logoUrl" value={s["site.logoUrl"]} />
              </div>
            )}
          </div>
        </Section>

        {/* Limits */}
        <Section icon={Upload} title="Upload & Processing Limits">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Max Upload Size (MB)" hint="Maximum file size per upload">
              <input name="upload.maxSizeMB" type="number" min={1} max={500} defaultValue={s["upload.maxSizeMB"]} className={INPUT} />
            </Field>
            <Field label="Job TTL (hours)" hint="How long output files are kept before deletion">
              <input name="job.ttlHours" type="number" min={1} max={24} defaultValue={s["job.ttlHours"]} className={INPUT} />
            </Field>
          </div>
        </Section>

        {/* Footer */}
        <Section icon={LayoutTemplate} title="Footer Text">
          <Field label="Tagline">
            <input name="footer.tagline" type="text" defaultValue={s["footer.tagline"]} placeholder={SETTING_DEFAULTS["footer.tagline"]} className={INPUT} />
          </Field>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Files Deleted Note">
              <input name="footer.filesDeletedNote" type="text" defaultValue={s["footer.filesDeletedNote"]} placeholder={SETTING_DEFAULTS["footer.filesDeletedNote"]} className={INPUT} />
            </Field>
            <Field label="Copyright Line" hint="Use {year} as a dynamic placeholder for the current year.">
              <input name="footer.copyright" type="text" defaultValue={s["footer.copyright"]} placeholder={SETTING_DEFAULTS["footer.copyright"]} className={INPUT} />
            </Field>
          </div>
        </Section>

        {/* Homepage Hero Content */}
        <Section icon={Home} title="Homepage Hero Content">
          <Field label="Hero Title">
            <input name="home.heroTitle" type="text" defaultValue={s["home.heroTitle"]} placeholder={SETTING_DEFAULTS["home.heroTitle"]} className={INPUT} />
          </Field>
          <Field label="Hero Description">
            <textarea
              name="home.heroDesc"
              rows={3}
              defaultValue={s["home.heroDesc"]}
              placeholder={SETTING_DEFAULTS["home.heroDesc"]}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </Field>
        </Section>

        {/* Maintenance */}
        <Section icon={AlertTriangle} title="Maintenance Mode">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="maintenance.enabled"
                defaultChecked={s["maintenance.enabled"] === "true"}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Enable Maintenance Mode</p>
              <p className="text-xs text-slate-400">Shows a banner and optionally blocks access</p>
            </div>
          </label>
          <Field label="Maintenance Message">
            <textarea
              name="maintenance.message"
              rows={2}
              defaultValue={s["maintenance.message"]}
              placeholder={SETTING_DEFAULTS["maintenance.message"]}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </Field>
        </Section>

        <div className="sticky bottom-6 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </AdminForm>
    </div>
  );
}
