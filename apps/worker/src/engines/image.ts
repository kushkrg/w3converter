import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { runCommand } from "./shell";

type ImageFormat = "jpg" | "png" | "bmp" | "tiff";

export async function imagesToPdf(imagePaths: string[], outputDir: string): Promise<string> {
  const doc = await PDFDocument.create();

  for (const imgPath of imagePaths) {
    // Normalize to PNG via sharp for pdf-lib compatibility
    const pngBuf = await sharp(imgPath).toFormat("png").toBuffer();
    const img = await doc.embedPng(pngBuf);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }

  const bytes = await doc.save();
  const out = path.join(outputDir, "images.pdf");
  await fs.writeFile(out, bytes);
  return out;
}

export async function pdfToImages(
  inputPath: string,
  outputDir: string,
  format: ImageFormat,
  dpi: number
): Promise<string[]> {
  // Use pdftoppm (Poppler) for rasterizing PDF pages
  const prefix = path.join(outputDir, "page");
  const resolution = String(dpi);

  const formatFlag: Record<ImageFormat, string> = {
    jpg: "-jpeg",
    png: "-png",
    bmp: "-bmp",
    tiff: "-tiff",
  };

  await runCommand("pdftoppm", [
    formatFlag[format],
    "-r",
    resolution,
    inputPath,
    prefix,
  ]);

  const files = await fs.readdir(outputDir);
  return files
    .filter((f) => f.startsWith("page-") || f.startsWith("page"))
    .map((f) => path.join(outputDir, f))
    .sort();
}
