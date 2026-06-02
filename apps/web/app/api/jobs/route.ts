import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { pdfQueue } from "@/lib/queue";
import { rateLimit } from "@/lib/rate-limit";
import { JOB_TTL_MS, bundleFiles } from "@pdf-tools/core";
import { verifyRecaptcha } from "@/lib/recaptcha";

const CreateJobSchema = z.object({
  tool: z.string().min(1),
  params: z.record(z.unknown()).default({}),
});

// Tools that require every uploaded file to be a valid PDF
const PDF_INPUT_TOOLS = new Set([
  "merge-pdf", "split-pdf", "rotate-pdf", "delete-pages", "organize-pdf",
  "extract-pages", "repair-pdf", "compress-pdf", "grayscale-pdf",
  "protect-pdf", "unlock-pdf", "watermark-pdf", "signature-pdf",
  "pdf-to-jpg", "pdf-to-png", "pdf-to-bmp", "pdf-to-tiff",
  "pdf-to-word", "pdf-to-ppt", "pdf-to-txt", "pdf-to-zip",
]);

async function isPdf(file: File): Promise<boolean> {
  const header = await file.slice(0, 5).arrayBuffer();
  const bytes = new Uint8Array(header);
  // PDF magic bytes: %PDF-
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "";

  // Rate limit: 20 jobs per IP per hour
  const rl = await rateLimit(`jobs:${ip}`, 20, 3600).catch(() => null);
  if (rl && !rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in an hour." },
      { status: 429, headers: { "Retry-After": String(rl.resetAt) } }
    );
  }

  let body: any;
  let files: File[] = [];
  let recaptchaToken = "";

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const toolVal = form.get("tool");
    const paramsVal = form.get("params");
    const recaptchaVal = form.get("recaptchaToken");
    
    body = {
      tool: typeof toolVal === "string" ? toolVal : "",
      params: paramsVal && typeof paramsVal === "string" ? JSON.parse(paramsVal) : {},
    };
    files = form.getAll("files").filter((f): f is File => f instanceof File);
    recaptchaToken = typeof recaptchaVal === "string" ? recaptchaVal : "";
  } else {
    const jsonBody = await request.json();
    body = jsonBody;
    recaptchaToken = (jsonBody && typeof jsonBody === "object" && "recaptchaToken" in jsonBody) ? (jsonBody.recaptchaToken as string) : "";
  }

  // Verify reCAPTCHA token
  const isHuman = await verifyRecaptcha(recaptchaToken);
  if (!isHuman) {
    return NextResponse.json({ error: "reCAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  const parsed = CreateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { tool, params } = parsed.data;

  // Server-side file type validation
  // watermark-pdf / signature-pdf: only the first file (the PDF) is validated;
  // the second is a logo/signature image
  const filesToValidate =
    tool === "watermark-pdf" || tool === "signature-pdf" ? files.slice(0, 1) : files;
  if (PDF_INPUT_TOOLS.has(tool)) {
    for (const file of filesToValidate) {
      if (!(await isPdf(file))) {
        return NextResponse.json(
          { error: `"${file.name}" is not a valid PDF file. Only PDF files are accepted for this tool.` },
          { status: 400 }
        );
      }
    }
  }

  if (tool === "merge-pdf" && files.length < 2) {
    return NextResponse.json(
      { error: "Merge PDF requires at least 2 files." },
      { status: 400 }
    );
  }

  // Bundle all uploaded files into a single binary blob for database storage.
  // This allows the worker (on Railway) to read files from the shared database
  // even though it doesn't share a filesystem with the web app (on Vercel).
  const fileBuffers = await Promise.all(
    files.map(async (file) => ({
      name: file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_"),
      buffer: Buffer.from(await file.arrayBuffer()),
    }))
  );
  const inputData = fileBuffers.length > 0 ? bundleFiles(fileBuffers) : null;

  const expiresAt = new Date(Date.now() + JOB_TTL_MS);

  const job = await prisma.job.create({
    data: {
      tool,
      inputPath: "",
      params: params as object,
      expiresAt,
      ip,
      userAgent,
      sizeIn: BigInt(files.reduce((sum, f) => sum + f.size, 0)),
      inputData,
    },
  });

  // Enqueue the background job — only pass metadata, not file data.
  // The worker will read file data from the database using the jobId.
  await pdfQueue.add(tool, {
    jobId: job.id,
    tool,
    inputPath: "",
    outputDir: "",
    params: params as Record<string, unknown>,
  });

  return NextResponse.json({ jobId: job.id, status: "queued" }, { status: 201 });
}
