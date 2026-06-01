export type JobPayload = {
  jobId: string;
  tool: string;
  inputPath: string;
  outputDir: string;
  params: Record<string, unknown>;
};
