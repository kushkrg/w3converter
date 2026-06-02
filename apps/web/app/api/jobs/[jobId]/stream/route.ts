import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signDownloadUrl } from "@/lib/signer";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const POLL_INTERVAL = 1000;
      const MAX_WAIT = 5 * 60 * 1000;
      const started = Date.now();

      while (Date.now() - started < MAX_WAIT) {
        const job = await prisma.job.findUnique({
          where: { id: jobId },
          select: { id: true, status: true, error: true },
        });

        if (!job) {
          send({ status: "error", error: "Job not found" });
          break;
        }

        if (job.status === "ready") {
          const expiresAt = Date.now() + 60 * 60 * 1000;
          const token = signDownloadUrl(job.id, expiresAt);
          const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "";
          const downloadUrl = `${appUrl}/api/download/${job.id}?token=${token}&exp=${expiresAt}`;
          send({ status: "ready", downloadUrl });
          break;
        }

        if (job.status === "failed" || job.status === "expired") {
          send({ status: job.status, error: job.error ?? "Job failed" });
          break;
        }

        send({ status: job.status });
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
