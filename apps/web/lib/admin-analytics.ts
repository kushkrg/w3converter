import { prisma } from "./db";

export interface DayCount  { day: string; count: number }
export interface ToolCount { tool: string; total: number; success: number }
export interface StatusCount { status: string; count: number }

export async function getDashboardStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalJobs,
    todayJobs,
    statusGroups,
    popularTools,
    jobsPerDayRaw,
    recentJobs,
    uniqueIpsToday,
    totalPageViews,
    pageViewsPerTool,
  ] = await Promise.all([
    prisma.job.count(),

    prisma.job.count({ where: { createdAt: { gte: todayStart } } }),

    prisma.job.groupBy({ by: ["status"], _count: { _all: true } }),

    prisma.job.groupBy({
      by: ["tool"],
      where: { createdAt: { gte: thirtyAgo } },
      _count: { _all: true },
      orderBy: { _count: { tool: "desc" } },
      take: 10,
    }),

    prisma.$queryRaw<{ day: string; count: string }[]>`
      SELECT TO_CHAR("createdAt"::date, 'YYYY-MM-DD') AS day,
             COUNT(*)::text AS count
      FROM   "Job"
      WHERE  "createdAt" >= ${thirtyAgo}
      GROUP  BY "createdAt"::date
      ORDER  BY "createdAt"::date
    `,

    prisma.job.findMany({
      select: { id: true, tool: true, status: true, sizeIn: true, sizeOut: true, createdAt: true, ip: true, error: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    prisma.job
      .findMany({
        where: { createdAt: { gte: todayStart }, ip: { not: null } },
        distinct: ["ip"],
        select: { ip: true },
      })
      .then((r) => r.length),

    prisma.pageView.count(),
    prisma.pageView.groupBy({ by: ["toolId"], _count: { _all: true }, orderBy: { _count: { toolId: "desc" } }, take: 10 }),
  ]);

  const readyCount  = statusGroups.find((g) => g.status === "ready")?._count._all ?? 0;
  const failedCount = statusGroups.find((g) => g.status === "failed")?._count._all ?? 0;
  const successRate = totalJobs > 0 ? Math.round((readyCount / totalJobs) * 100 * 10) / 10 : 0;

  const jobsPerDay: DayCount[] = jobsPerDayRaw.map((r) => ({
    day:   r.day,
    count: parseInt(r.count, 10),
  }));

  const toolStats: ToolCount[] = popularTools.map((g) => ({
    tool:    g.tool,
    total:   g._count._all,
    success: 0, // enriched below
  }));

  // Enrich with success counts in one query
  const successByTool = await prisma.job.groupBy({
    by: ["tool"],
    where: {
      tool:      { in: toolStats.map((t) => t.tool) },
      status:    "ready",
      createdAt: { gte: thirtyAgo },
    },
    _count: { _all: true },
  });
  for (const ts of toolStats) {
    ts.success = successByTool.find((s) => s.tool === ts.tool)?._count._all ?? 0;
  }

  const statusData: StatusCount[] = statusGroups.map((g) => ({
    status: g.status,
    count:  g._count._all,
  }));

  // Serialize BigInt so Next.js can pass to Client Components as JSON
  const recentJobsSafe = recentJobs.map((j) => ({
    ...j,
    sizeIn:  Number(j.sizeIn),
    sizeOut: j.sizeOut ? Number(j.sizeOut) : null,
  }));

  return {
    totalJobs,
    todayJobs,
    successRate,
    uniqueIpsToday,
    readyCount,
    failedCount,
    jobsPerDay,
    toolStats,
    statusData,
    recentJobs: recentJobsSafe,
    totalPageViews,
    pageViewsPerTool: pageViewsPerTool.map((p) => ({
      toolId: p.toolId,
      count:  p._count._all,
    })),
  };
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
