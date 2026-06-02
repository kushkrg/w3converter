import { Suspense } from "react";
import { getDashboardStats } from "@/lib/admin-analytics";
import { JobsLineChart, PopularToolsChart, StatusDonut, PageViewsChart } from "@/components/admin/charts";
import {
  Activity, CheckCircle2, Users, Zap, TrendingUp, Eye,
  Clock, AlertCircle, FileText, ChevronLeft, ChevronRight, MapPin
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCountryFromIp } from "@/lib/geo";
import Link from "next/link";

export const metadata = { title: "Dashboard" };
export const revalidate = 60; // refresh every minute

function fmtBytes(n: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_BADGE: Record<string, string> = {
  ready:      "bg-green-100  text-green-700",
  failed:     "bg-red-100    text-red-700",
  queued:     "bg-blue-100   text-blue-700",
  processing: "bg-amber-100  text-amber-700",
  expired:    "bg-slate-100  text-slate-500",
};

function fmtTool(s: string) {
  return s.replace(/-pdf$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function DashboardContent({ page }: { page: number }) {
  const stats = await getDashboardStats();

  const jobsPerPage = 10;
  const totalJobsCount = stats.totalJobs;
  const totalPages = Math.ceil(totalJobsCount / jobsPerPage);
  
  // Fetch paginated jobs
  const skip = (page - 1) * jobsPerPage;
  const rawJobs = await prisma.job.findMany({
    select: { id: true, tool: true, status: true, sizeIn: true, sizeOut: true, createdAt: true, ip: true, error: true },
    orderBy: { createdAt: "desc" },
    skip,
    take: jobsPerPage,
  });

  const jobs = rawJobs.map((j) => ({
    ...j,
    sizeIn:  Number(j.sizeIn),
    sizeOut: j.sizeOut ? Number(j.sizeOut) : null,
  }));

  // Resolve countries for unique IPs in parallel
  const uniqueIps = Array.from(new Set(jobs.map((j) => j.ip).filter(Boolean))) as string[];
  const ipCountryMap = new Map<string, string>();
  
  await Promise.all(
    uniqueIps.map(async (ip) => {
      const country = await getCountryFromIp(ip);
      ipCountryMap.set(ip, country);
    })
  );

  const statCards = [
    { label: "Total Jobs",     value: stats.totalJobs.toLocaleString(), icon: Activity,      color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Jobs Today",     value: stats.todayJobs.toLocaleString(), icon: Zap,           color: "text-amber-600",  bg: "bg-amber-50" },
    { label: "Success Rate",   value: `${stats.successRate}%`,          icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50" },
    { label: "Unique IPs Today",value: stats.uniqueIpsToday.toLocaleString(), icon: Users,  color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Failed Jobs",    value: stats.failedCount.toLocaleString(),icon: AlertCircle,  color: "text-red-600",    bg: "bg-red-50" },
    { label: "Page Views",     value: stats.totalPageViews.toLocaleString(), icon: Eye,     color: "text-pink-600",   bg: "bg-pink-50" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Last 30 days overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-full">
          <Clock className="h-3 w-3" />
          Refreshes every 60s
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
            <p className="text-xs text-slate-500 mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs over time */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Jobs Over Time</h2>
            <span className="ml-auto text-xs text-slate-400">Last 30 days</span>
          </div>
          <JobsLineChart data={stats.jobsPerDay} />
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Status Breakdown</h2>
          </div>
          <StatusDonut data={stats.statusData} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular tools */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Popular Tools</h2>
            <span className="ml-auto text-xs text-slate-400">Last 30 days · grey=total / red=success</span>
          </div>
          <PopularToolsChart data={stats.toolStats} />
        </div>

        {/* Page views per tool */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Eye className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Page Views by Tool</h2>
          </div>
          <PageViewsChart data={stats.pageViewsPerTool} />
        </div>
      </div>

      {/* Recent jobs table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/20">
          <FileText className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Recent Jobs</h2>
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
            Page {page} of {totalPages || 1}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Tool","Status","Size In","Size Out","Time","IP","Country"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{fmtTool(job.tool)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[job.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 tabular-nums">{fmtBytes(job.sizeIn)}</td>
                  <td className="px-5 py-3 text-slate-500 tabular-nums">{fmtBytes(job.sizeOut)}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{timeAgo(job.createdAt)}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{job.ip ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[120px]">{ipCountryMap.get(job.ip || "") || "—"}</span>
                    </span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm">No jobs found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500 font-medium">
            Showing Page <span className="font-semibold text-slate-700">{page}</span> of <span className="font-semibold text-slate-700">{totalPages || 1}</span> ({totalJobsCount} total jobs)
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/admin?page=${page - 1}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-350 cursor-not-allowed shadow-2xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
            )}
            
            {page < totalPages ? (
              <Link
                href={`/admin?page=${page + 1}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-350 cursor-not-allowed shadow-2xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading dashboard…</div>}>
      <DashboardContent page={currentPage} />
    </Suspense>
  );
}
