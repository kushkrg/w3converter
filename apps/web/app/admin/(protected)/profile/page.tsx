import { requireAdmin } from "@/lib/admin-auth";
import { User, Lock, Key, ShieldCheck, Save, Mail } from "lucide-react";
import { updateProfileAction } from "./actions";
import { AdminForm } from "@/components/admin/admin-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Profile" };

export default async function AdminProfilePage() {
  const { email } = await requireAdmin();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">Admin Profile Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your credentials, change secure passwords, and keep your administrator access secure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Security Status Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-md flex flex-col justify-between h-full min-h-[300px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-md font-bold">Access Protection</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Your administrator login uses PBKDF2 cryptography with SHA-512 one-way hashing and secure salts to ensure modern password protection.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 mt-6 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Hashing: PBKDF2-SHA512</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Salts: Dynamic Cryptographic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active Session: Secure SSL Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Update Forms */}
        <div className="md:col-span-2 space-y-6">
          <AdminForm action={updateProfileAction} successMessage="Profile settings updated successfully!">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              
              {/* Section 1: Change Email */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <User className="h-5 w-5 text-slate-400" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Account Credentials</h2>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Administrator Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={email}
                      placeholder="admin@example.com"
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Note: Changing this will immediately log you out, requiring re-authentication under the new email address.
                  </p>
                </div>
              </div>

              {/* Section 2: Change Password */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security Password Management</h2>
                </div>

                <div className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Current Secure Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        name="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">New Secure Password</label>
                      <input
                        name="newPassword"
                        type="password"
                        placeholder="••••••••"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Confirm New Password</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Leave password fields blank if you only wish to update your administrator email address.
                  </p>
                </div>
              </div>

              {/* Form Footer Action */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-sm shadow-sm transition-all duration-200 hover:shadow hover:scale-98 active:scale-95 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Save Admin Profile
                </button>
              </div>

            </div>
          </AdminForm>
        </div>
      </div>
    </div>
  );
}
