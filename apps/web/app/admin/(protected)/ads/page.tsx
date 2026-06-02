import { getSettings } from "@/lib/settings";
import { saveAdsSettingsAction } from "./actions";
import { DollarSign, Save, Zap, LayoutTemplate, Monitor, PanelRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminForm } from "@/components/admin/admin-form";

export const metadata = { title: "Google Ads" };

function Section({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <Icon className="h-4 w-4 text-slate-400" />
        <div>
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {desc && <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>}
        </div>
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

const INPUT = "w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors font-mono";

export default async function AdsAdminPage() {
  const s = await getSettings([
    "ads.enabled", "ads.publisherId",
    "ads.toolPageTop", "ads.toolPageBottom",
    "ads.toolsListingAd", "ads.sidebarAd",
  ]);

  const isEnabled = s["ads.enabled"] === "true";
  const hasPublisherId = !!s["ads.publisherId"];

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <DollarSign className="h-6 w-6 text-emerald-500" />
          Google Ads Manager
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monetize your website with Google AdSense. Configure your Publisher ID and ad slots to show ads on tool pages.
        </p>
      </div>

      {/* Status Banner */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
        isEnabled && hasPublisherId
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}>
        {isEnabled && hasPublisherId ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div>
          <p className="font-bold">
            {isEnabled && hasPublisherId
              ? "Ads are active and serving on your website"
              : !isEnabled
                ? "Ads are currently disabled"
                : "Publisher ID is missing"}
          </p>
          <p className="text-xs mt-0.5 opacity-80">
            {isEnabled && hasPublisherId
              ? "Google AdSense is loaded on every page and ad slots are being served."
              : !isEnabled
                ? "Toggle the switch below to enable Google AdSense on your website."
                : "Enter your Google AdSense Publisher ID (ca-pub-XXXXXXX) to start serving ads."}
          </p>
        </div>
      </div>

      <AdminForm action={saveAdsSettingsAction} successMessage="Ads settings saved successfully!" className="space-y-6">

        {/* Core Config */}
        <Section icon={Zap} title="Google AdSense Configuration" desc="Your Google AdSense account credentials">
          {/* Enable Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="ads.enabled"
                defaultChecked={isEnabled}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Enable Google Ads</p>
              <p className="text-xs text-slate-400">Load the AdSense script and display ads across your site</p>
            </div>
          </label>

          <Field label="AdSense Publisher ID" hint="Find this in your Google AdSense dashboard → Account → Account information. Format: ca-pub-XXXXXXXXXXXXXXXX">
            <input
              name="ads.publisherId"
              type="text"
              defaultValue={s["ads.publisherId"]}
              placeholder="ca-pub-1234567890123456"
              className={INPUT}
            />
          </Field>
        </Section>

        {/* Ad Slot Configuration */}
        <Section icon={LayoutTemplate} title="Ad Slot IDs" desc="Create ad units in Google AdSense → Ads → By ad unit, then paste the slot IDs here">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Tool Page — Top Banner" hint="Displays above the file upload form on every tool page">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  name="ads.toolPageTop"
                  type="text"
                  defaultValue={s["ads.toolPageTop"]}
                  placeholder="1234567890"
                  className={INPUT}
                />
              </div>
            </Field>

            <Field label="Tool Page — Bottom Banner" hint="Displays below the how-to steps section on every tool page">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  name="ads.toolPageBottom"
                  type="text"
                  defaultValue={s["ads.toolPageBottom"]}
                  placeholder="1234567890"
                  className={INPUT}
                />
              </div>
            </Field>

            <Field label="Tools Listing Page" hint="Displays on the /tools page above the tool cards grid">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  name="ads.toolsListingAd"
                  type="text"
                  defaultValue={s["ads.toolsListingAd"]}
                  placeholder="1234567890"
                  className={INPUT}
                />
              </div>
            </Field>

            <Field label="Sidebar Ad (Reserved)" hint="Reserved for future sidebar ad placement on wider layouts">
              <div className="flex items-center gap-2">
                <PanelRight className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  name="ads.sidebarAd"
                  type="text"
                  defaultValue={s["ads.sidebarAd"]}
                  placeholder="1234567890"
                  className={INPUT}
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3 text-sm text-blue-800">
          <p className="font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            How to Set Up Google AdSense
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs text-blue-700 leading-relaxed">
            <li>Go to <span className="font-mono bg-blue-100 px-1 rounded">adsense.google.com</span> and sign up with your Google account.</li>
            <li>Add your website domain and verify ownership.</li>
            <li>Once approved, copy your <strong>Publisher ID</strong> (starts with <span className="font-mono">ca-pub-</span>) from Account info.</li>
            <li>Go to <strong>Ads → By ad unit → Display ads</strong>, create ad units, and copy each <strong>Slot ID</strong> (numeric).</li>
            <li>Paste the Publisher ID and Slot IDs above, enable the toggle, and save.</li>
          </ol>
        </div>

        <div className="sticky bottom-6 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-colors cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Save Ads Settings
          </button>
        </div>
      </AdminForm>
    </div>
  );
}
