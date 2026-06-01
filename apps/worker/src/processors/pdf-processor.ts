import { Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import path from "path";
import type { JobPayload } from "../types";
import {
  mergePdfs, splitPdf, rotatePdf, deletePages, extractPages,
  organizePdf, repairPdf, compressPdf, compressPdfToTargetSize,
  grayscalePdf, protectPdf, unlockPdf, addWatermark, generateInvoice,
  addSignature,
} from "../engines/pdf";
import { imagesToPdf, pdfToImages } from "../engines/image";
import { officeToPdf, pdfToOffice, txtToPdf, pdfToTxt, pdfToZip } from "../engines/office";

const prisma = new PrismaClient();

export async function processPdfJob(job: Job<JobPayload>) {
  const { jobId, tool, inputPath, outputDir, params } = job.data;

  await prisma.job.update({ where: { id: jobId }, data: { status: "processing" } });

  let outputPath: string;

  try {
    switch (tool) {
      case "merge-pdf": {
        const paths = (params["inputPaths"] as string[]) ?? [inputPath];
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
        const paths = (params["inputPaths"] as string[]) ?? [inputPath];
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
        const allPaths = (params["inputPaths"] as string[]) ?? [inputPath];
        const logoPath = allPaths[1]; // second file is the logo when type === "logo"
        outputPath = await addWatermark(inputPath, outputDir, {
          type:       (params["type"]      as "text" | "logo" | "diagonal") ?? "text",
          text:       (params["text"]      as string)  ?? "CONFIDENTIAL",
          fontSize:   (params["fontSize"]  as number)  ?? 48,
          color:      (params["color"]     as string)  ?? "#9ca3af",
          opacity:    (params["opacity"]   as number)  ?? 0.3,
          placement:  (params["placement"] as "center" | "tile") ?? "center",
          logoPath,
          logoSizePct:(params["logoSizePct"] as number) ?? 30,
          repeat:     (params["repeat"]    as boolean) ?? true,
        });
        break;
      }
      case "signature-pdf": {
        const allPaths = (params["inputPaths"] as string[]) ?? [inputPath];
        const signaturePath = allPaths[1];
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

    const stat = await import("fs").then((m) => {
      try { return m.statSync(outputPath); } catch { return null; }
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "ready",
        outputPath,
        sizeOut: BigInt(stat?.size ?? 0),
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", error },
    });
    throw err;
  }
}
