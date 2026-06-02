import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signDownloadUrl } from "@/lib/signer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      tool: true,
      error: true,
      outputPath: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let downloadUrl: string | null = null;

  if (job.status === "ready" && job.outputPath) {
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    const token = signDownloadUrl(job.id, expiresAt);
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "";
    downloadUrl = `${appUrl}/api/download/${job.id}?token=${token}&exp=${expiresAt}`;
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    tool: job.tool,
    error: job.error ?? null,
    downloadUrl,
    createdAt: job.createdAt.toISOString(),
    expiresAt: job.expiresAt.toISOString(),
  });
}
