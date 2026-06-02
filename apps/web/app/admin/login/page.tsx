import { FileText, Lock } from "lucide-react";
import { loginAction } from "./actions";

export const metadata = { title: "Admin Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/30">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">w3converter</h1>
          <p className="text-slate-400 text-sm mt-1">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              Invalid email or password. Please try again.
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@example.com"
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-colors shadow-lg shadow-primary/20 mt-2"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600">
          Protected area — authorised users only
        </p>
      </div>
    </div>
  );
}
