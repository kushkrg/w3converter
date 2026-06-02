import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env["UPLOAD_DIR"] ?? "/tmp/pdftools/uploads";
const OUTPUT_DIR = process.env["OUTPUT_DIR"] ?? "/tmp/pdftools/outputs";
const INTERVAL_MS = parseInt(process.env["JANITOR_INTERVAL_MS"] ?? "300000", 10); // 5 min

async function sweep() {
  const now = new Date();
  const expiredJobs = await prisma.job.findMany({
    where: { expiresAt: { lte: now }, status: { not: "expired" } },
    select: { id: true },
  });

  if (expiredJobs.length === 0) {
    console.log(`[janitor] ${now.toISOString()} — no expired jobs`);
    return;
  }

  const ids = expiredJobs.map((j) => j.id);
  console.log(`[janitor] Cleaning ${ids.length} expired jobs`);

  await Promise.allSettled(
    ids.map(async (id) => {
      await Promise.allSettled([
        fs.rm(path.join(UPLOAD_DIR, id), { recursive: true, force: true }),
        fs.rm(path.join(OUTPUT_DIR, id), { recursive: true, force: true }),
      ]);
    })
  );

  await prisma.job.updateMany({
    where: { id: { in: ids } },
    data: {
      status: "expired",
      inputPath: "",
      outputPath: null,
      inputData: null,
      outputData: null,
      outputName: null,
    },
  });

  console.log(`[janitor] Done. Marked ${ids.length} jobs as expired.`);
}

async function main() {
  console.log("[janitor] Started. Interval:", INTERVAL_MS, "ms");
  await sweep(); // immediate first run

  setInterval(() => {
    sweep().catch((err) => console.error("[janitor] Error:", err));
  }, INTERVAL_MS);
}

main().catch((err) => {
  console.error("[janitor] Fatal:", err);
  process.exit(1);
});