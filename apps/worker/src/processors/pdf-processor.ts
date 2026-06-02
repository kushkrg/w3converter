import { Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs/promises";
import type { JobPayload } from "../types";
import { unbundleFiles } from "@pdf-tools/core";
import {
  mergePdfs, splitPdf, rotatePdf, deletePages, extractPages,
  organizePdf, repairPdf, compressPdf, compressPdfToTargetSize,
  grayscalePdf, protectPdf, unlockPdf, addWatermark, generateInvoice,
  addSignature,
} from "../engines/pdf";
import { imagesToPdf, pdfToImages } from "../engines/image";
import { officeToPdf, pdfToOffice, txtToPdf, pdfToTxt, pdfToZip } from "../engines/office";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env["UPLOAD_DIR"] ?? "/tmp/pdftools/uploads";
const OUTPUT_DIR = process.env["OUTPUT_DIR"] ?? "/tmp/pdftools/outputs";

export async function processPdfJob(job: Job<JobPayload>) {
  const { jobId, tool, params } = job.data;

  await prisma.job.update({ where: { id: jobId }, data: { status: "processing" } });

  // Create local directories for this job
  const uploadPath = path.join(UPLOAD_DIR, jobId);
  const outputDir = path.join(OUTPUT_DIR, jobId);
  await fs.mkdir(uploadPath, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  // Read input file data from the database
  const dbJob = await prisma.job.findUnique({
    where: { id: jobId },
    select: { inputData: true },
  });

  const savedPaths: string[] = [];
  if (dbJob?.inputData) {
    const files = unbundleFiles(Buffer.from(dbJob.inputData));
    for (const file of files) {
      const dest = path.join(uploadPath, file.name);
      await file.buffer.length > 0 && fs.writeFile(dest, file.buffer);
      savedPaths.push(dest);
    }
    // Clear inputData from DB to free space now that files are on disk
    await prisma.job.update({
      where: { id: jobId },
      data: { inputData: null },
    });
  }

  const inputPath = savedPaths[0] ?? "";
  let outputPath: string;

  try {
    switch (tool) {
      case "merge-pdf": {
        const paths = savedPaths.length > 0 ? savedPaths : [inputPath];
        outputPath = await mergePdfs(paths, outputDir);
        break;
      }
      case "split-pdf": {
        const ranges = (params["ranges"] as string[]) ?? ["1"];
        const files = await splitPdf(inputPath, outputDir, ranges);
        outputPath = files[0] ?? outputDir;
        break;
      }
      case "rotate-pdf": {
        const angle = (params["angle"] as 90 | 180 | 270) ?? 90;
        const pages = params["pages"] as number[] | undefined;
        outputPath = await rotatePdf(inputPath, outputDir, angle, pages);
        break;
      }
      case "delete-pages": {
        const pages = (params["pages"] as number[]) ?? [];
        outputPath = await deletePages(inputPath, outputDir, pages);
        break;
      }
      case "extract-pages": {
        const pages = (params["pages"] as number[]) ?? [1];
        outputPath = await extractPages(inputPath, outputDir, pages);
        break;
      }
      case "organize-pdf": {
        const order = (params["order"] as number[]) ?? [1];
        outputPath = await organizePdf(inputPath, outputDir, order);
        break;
      }
      case "repair-pdf": {
        outputPath = await repairPdf(inputPath, outputDir);
        break;
      }
      case "compress-pdf": {
        const mode = (params["mode"] as string) ?? "preset";
        if (mode === "target") {
          const targetKB = (params["targetKB"] as number) ?? 500;
          outputPath = await compressPdfToTargetSize(inputPath, outputDir, targetKB * 1024);
        } else {
          const quality = (params["quality"] as "low" | "medium" | "high") ?? "medium";
          outputPath = await compressPdf(inputPath, outputDir, quality);
        }
        break;
      }
      case "grayscale-pdf": {
        outputPath = await grayscalePdf(inputPath, outputDir);
        break;
      }
      case "jpg-to-pdf":
      case "png-to-pdf":
      case "bmp-to-pdf":
      case "tiff-to-pdf": {
        const paths = savedPaths.length > 0 ? savedPaths : [inputPath];
        outputPath = await imagesToPdf(paths, outputDir);
        break;
      }
      case "pdf-to-jpg":
      case "pdf-to-png":
      case "pdf-to-bmp":
      case "pdf-to-tiff": {
        const fmt = tool.replace("pdf-to-", "") as "jpg" | "png" | "bmp" | "tiff";
        const dpi = (params["dpi"] as number) ?? 150;
        const files = await pdfToImages(inputPath, outputDir, fmt, dpi);
        outputPath = files[0] ?? outputDir;
        break;
      }
      case "word-to-pdf":
      case "ppt-to-pdf":
      case "excel-to-pdf": {
        outputPath = await officeToPdf(inputPath, outputDir);
        break;
      }
      case "pdf-to-word": {
        outputPath = await pdfToOffice(inputPath, outputDir, "docx");
        break;
      }
      case "pdf-to-ppt": {
        outputPath = await pdfToOffice(inputPath, outputDir, "pptx");
        break;
      }
      case "txt-to-pdf": {
        outputPath = await txtToPdf(inputPath, outputDir);
        break;
      }
      case "pdf-to-txt": {
        outputPath = await pdfToTxt(inputPath, outputDir);
        break;
      }
      case "pdf-to-zip": {
        const files = await import("fs").then((m) =>
          m.readdirSync(outputDir).map((f: string) => path.join(outputDir, f))
        );
        outputPath = await pdfToZip(outputDir, files);
        break;
      }
      case "protect-pdf": {
        const userPwd = (params["userPassword"] as string) ?? "";
        const ownerPwd = (params["ownerPassword"] as string) ?? userPwd;
        const printing = (params["allowPrinting"] as boolean) ?? true;
        const copying = (params["allowCopying"] as boolean) ?? false;
        outputPath = await protectPdf(inputPath, outputDir, userPwd, ownerPwd, printing, copying);
        break;
      }
      case "unlock-pdf": {
        const pwd = (params["password"] as string) ?? "";
        outputPath = await unlockPdf(inputPath, outputDir, pwd);
        break;
      }
      case "watermark-pdf": {
        const logoPath = savedPaths[1]; // second file is the logo when type === "logo"
        const watermarkOpts: any = {
          type:       (params["type"]      as "text" | "logo" | "diagonal") ?? "text",
          text:       (params["text"]      as string)  ?? "CONFIDENTIAL",
          fontSize:   (params["fontSize"]  as number)  ?? 48,
          color:      (params["color"]     as string)  ?? "#9ca3af",
          opacity:    (params["opacity"]   as number)  ?? 0.3,
          placement:  (params["placement"] as "center" | "tile") ?? "center",
          logoSizePct:(params["logoSizePct"] as number) ?? 30,
          repeat:     (params["repeat"]    as boolean) ?? true,
        };
        if (logoPath) {
          watermarkOpts.logoPath = logoPath;
        }
        outputPath = await addWatermark(inputPath, outputDir, watermarkOpts);
        break;
      }
      case "signature-pdf": {
        const signaturePath = savedPaths[1];
        if (!signaturePath) throw new Error("No signature image provided.");
        outputPath = await addSignature(inputPath, outputDir, signaturePath, {
          page:        (params["page"]        as number)  ?? 1,
          xPct:        (params["xPct"]        as number)  ?? 58,
          yPct:        (params["yPct"]        as number)  ?? 75,
          widthPct:    (params["widthPct"]    as number)  ?? 32,
          signerName:  (params["signerName"]  as string)  ?? "",
          includeDate: (params["includeDate"] as boolean) ?? false,
          signerDate:  (params["signerDate"]  as string)  ?? "",
          showLine:    (params["showLine"]    as boolean) ?? true,
        });
        break;
      }
      case "invoice-pdf": {
        // inputPath is the logo path (if logo was uploaded); invoice data is in params
        const logoPath = inputPath || undefined;
        outputPath = await generateInvoice(outputDir, { ...params, logoPath });
        break;
      }
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }

    // Read all output files and store in the database so the download route
    // (on Vercel) can serve them without filesystem access.
    const outputFiles = await fs.readdir(outputDir);
    let outputData: Buffer;
    let outputName: string;

    if (outputFiles.length === 1 && outputFiles[0]) {
      // Single output file — store directly
      outputData = await fs.readFile(path.join(outputDir, outputFiles[0]));
      outputName = `w3converter-${tool}-${outputFiles[0]}`;
    } else if (outputFiles.length > 1) {
      // Multiple output files — zip them
      const archiver = (await import("archiver")).default;
      const { Writable } = await import("stream");
      const chunks: Buffer[] = [];
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
      });
      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.pipe(writable);
      for (const f of outputFiles) {
        archive.file(path.join(outputDir, f), { name: f });
      }
      await archive.finalize();
      await new Promise<void>((resolve) => writable.on("finish", resolve));
      outputData = Buffer.concat(chunks);
      outputName = `w3converter-${tool}-${jobId}.zip`;
    } else {
      // Fallback: read from outputPath directly
      outputData = await fs.readFile(outputPath);
      outputName = `w3converter-${tool}-${path.basename(outputPath)}`;
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "ready",
        outputPath,
        sizeOut: BigInt(outputData.length),
        outputData,
        outputName,
      },
    });

    // Clean up local files
    await Promise.allSettled([
      fs.rm(uploadPath, { recursive: true, force: true }),
      fs.rm(outputDir, { recursive: true, force: true }),
    ]);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", error },
    });
    // Clean up local files on failure too
    await Promise.allSettled([
      fs.rm(uploadPath, { recursive: true, force: true }),
      fs.rm(outputDir, { recursive: true, force: true }),
    ]);
    throw err;
  }
}
