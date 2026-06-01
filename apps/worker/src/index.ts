import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processPdfJob } from "./processors/pdf-processor";

const redis = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker("pdf-jobs", processPdfJob, {
  connection: redis,
  concurrency: parseInt(process.env["WORKER_CONCURRENCY"] ?? "4", 10),
});

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} (${job.data.tool}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} (${job?.data.tool}) failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err);
});

console.log("[worker] PDF worker started. Waiting for jobs...");

process.on("SIGTERM", async () => {
  console.log("[worker] Shutting down gracefully...");
  await worker.close();
  process.exit(0);
});
