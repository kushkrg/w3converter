import { getSettings, SETTING_DEFAULTS } from "@/lib/settings";
import { saveRecaptchaAction } from "./actions";
import { ShieldCheck, Save, Eye, EyeOff, Info } from "lucide-react";
import { AdminForm } from "@/components/admin/admin-form";

export const metadata = { title: "reCAPTCHA Settings" };

const INPUT = "w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default async function RecaptchaPage() {
  const keys = ["recaptcha.enabled", "recaptcha.version", "recaptcha.siteKey", "recaptcha.secretKeyEnc", "recaptcha.v3Threshold"];
  const s = await getSettings(keys);

  const hasSecret = !!s["recaptcha.secretKeyEnc"];
  const version   = s["recaptcha.version"] || "v3";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Google reCAPTCHA</h1>
        <p className="text-sm text-slate-500 mt-0.5">Protect upload forms from bots with Google reCAPTCHA v2 or v3</p>
      </div>

      {/* Setup guide */}
      <div className="flex gap-3 p-4 rounded-xl border border-sky-200 bg-sky-50">
        <Info className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
        <div className="text-xs text-sky-700 space-y-1">
          <p className="font-semibold">How to get your keys</p>
          <ol className="list-decimal list-inside space-y-0.5 text-sky-600">
            <li>Go to <span className="font-mono bg-sky-100 px-1 rounded">google.com/recaptcha/admin</span> and sign in</li>
            <li>Register a new site — choose reCAPTCHA v2 (&quot;I&apos;m not a robot&quot;) or v3</li>
            <li>Add your domain(s) to the allowed list</li>
            <li>Copy the <strong>Site Key</strong> and <strong>Secret Key</strong> below</li>
          </ol>
        </div>
      </div>

      <AdminForm action={saveRecaptchaAction} successMessage="reCAPTCHA settings saved successfully!" className="space-y-6">

        {/* Enable toggle */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Enable reCAPTCHA</h2>
          </div>
          <div className="p-6 space-y-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  name="recaptcha.enabled"
                  defaultChecked={s["recaptcha.enabled"] === "true"}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Enable reCAPTCHA verification</p>
                <p className="text-xs text-slate-400">Adds bot protection to all file upload forms</p>
              </div>
            </label>

            {/* Version picker */}
            <Field label="reCAPTCHA Version">
              <div className="flex gap-3">
                {(["v2", "v3"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recaptcha.version"
                      value={v}
                      defaultChecked={version === v}
                      className="accent-primary"
                    />
                    <span className="text-sm text-slate-700">
                      {v === "v2" ? "v2 — Checkbox challenge" : "v3 — Invisible / score-based"}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {/* Keys */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">API Keys</h2>
          </div>
          <div className="p-6 space-y-4">
            <Field label="Site Key (public)" hint="Embedded in the page HTML — safe to expose">
              <input
                name="recaptcha.siteKey"
                type="text"
                defaultValue={s["recaptcha.siteKey"]}
                placeholder="6LcXXXXXXXXXXXXXXXXXXX..."
                className={INPUT}
              />
            </Field>

            <Field
              label="Secret Key (server-side)"
              hint={hasSecret ? "A secret key is already saved. Enter a new value to replace it, or leave blank to keep the existing one." : "Never shared with the client — stored AES-256 encrypted at rest"}
            >
              <div className="relative">
                <input
                  name="recaptcha.secretKey"
                  type="password"
                  defaultValue=""
                  placeholder={hasSecret ? "••••••••  (saved — leave blank to keep)" : "6LeXXXXXXXXXXXXXXXXXXX..."}
                  className={`${INPUT} pr-10`}
                  autoComplete="off"
                />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 pointer-events-none" />
              </div>
              {hasSecret && (
                <p className="text-xs text-emerald-600 font-medium mt-1">✓ Secret key is saved and encrypted</p>
              )}
            </Field>
          </div>
        </div>

        {/* v3 threshold */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">v3 Score Threshold</h2>
          </div>
          <div className="p-6 space-y-4">
            <Field
              label="Minimum score to pass (0.0 – 1.0)"
              hint="Scores range from 0.0 (likely bot) to 1.0 (likely human). Google recommends 0.5. Only applies when using reCAPTCHA v3."
            >
              <input
                name="recaptcha.v3Threshold"
                type="number"
                min="0"
                max="1"
                step="0.1"
                defaultValue={s["recaptcha.v3Threshold"] || SETTING_DEFAULTS["recaptcha.v3Threshold"]}
                className={INPUT}
              />
            </Field>
          </div>
        </div>

        <div className="sticky bottom-6 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save reCAPTCHA Settings
          </button>
        </div>
      </AdminForm>
    </div>
  );
}
