import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyDownloadToken } from "@/lib/signer";
import { listOutputFiles } from "@/lib/storage";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiverCreate = require("archiver") as typeof import("archiver");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const exp = Number(url.searchParams.get("exp") ?? "0");

  if (!verifyDownloadToken(jobId, exp, token)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "ready") {
    return NextResponse.json({ error: "Not ready" }, { status: 404 });
  }

  // If outputData is stored in the database, serve it directly.
  if (job.outputData) {
    const data = Buffer.from(job.outputData);
    const filename = job.outputName || `w3converter-${job.tool}-${job.id}`;
    const ext = path.extname(filename).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".bmp") contentType = "image/bmp";
    else if (ext === ".tiff" || ext === ".tif") contentType = "image/tiff";
    else if (ext === ".zip") contentType = "application/zip";
    else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    else if (ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === ".txt") contentType = "text/plain";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(data.length),
      },
    });
  }

  // Fallback to local filesystem if database storage is empty (e.g. legacy jobs or local dev)
  const files = await listOutputFiles(jobId);
  if (files.length === 0) {
    return NextResponse.json({ error: "Output not found" }, { status: 404 });
  }

  if (files.length === 1 && files[0]) {
    const file = files[0];
    const data = fs.readFileSync(file);
    const baseName = path.basename(file);
    
    // Prefix with w3converter and the tool name
    const prefix = `w3converter-${job.tool}-`;
    const filename = baseName.startsWith(prefix) ? baseName : `${prefix}${baseName}`;

    // Resolve MIME Content-Type dynamically based on file extension
    const ext = path.extname(file).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".bmp") contentType = "image/bmp";
    else if (ext === ".tiff" || ext === ".tif") contentType = "image/tiff";
    else if (ext === ".zip") contentType = "application/zip";
    else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    else if (ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === ".txt") contentType = "text/plain";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(data.length),
      },
    });
  }

  // Multiple files — serve as ZIP via streaming
  const { Readable } = await import("stream");
  const archive = archiverCreate("zip", { zlib: { level: 6 } });
  for (const file of files) {
    archive.file(file, { name: path.basename(file) });
  }
  archive.finalize();

  const webStream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;
  const zipFilename = `w3converter-${job.tool}-${jobId}.zip`;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename}"`,
    },
  });
}
