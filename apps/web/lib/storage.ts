import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = process.env["UPLOAD_DIR"] ?? "/tmp/pdftools/uploads";
const OUTPUT_DIR = process.env["OUTPUT_DIR"] ?? "/tmp/pdftools/outputs";

export async function ensureDirs(jobId: string) {
  const uploadPath = path.join(UPLOAD_DIR, jobId);
  const outputPath = path.join(OUTPUT_DIR, jobId);
  await fs.mkdir(uploadPath, { recursive: true });
  await fs.mkdir(outputPath, { recursive: true });
  return { uploadPath, outputPath };
}

export function getUploadDir(jobId: string) {
  return path.join(UPLOAD_DIR, jobId);
}

export function getOutputDir(jobId: string) {
  return path.join(OUTPUT_DIR, jobId);
}

export async function listOutputFiles(jobId: string): Promise<string[]> {
  const dir = getOutputDir(jobId);
  try {
    const files = await fs.readdir(dir);
    return files.map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

export async function deleteJobFiles(jobId: string) {
  await Promise.allSettled([
    fs.rm(getUploadDir(jobId), { recursive: true, force: true }),
    fs.rm(getOutputDir(jobId), { recursive: true, force: true }),
  ]);
}
