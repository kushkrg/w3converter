import { Queue } from "bullmq";
import { redis } from "./redis";

export type JobPayload = {
  jobId: string;
  tool: string;
  inputPath: string;
  outputDir: string;
  params: Record<string, unknown>;
};

export const pdfQueue = new Queue<JobPayload>("pdf-jobs", {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
