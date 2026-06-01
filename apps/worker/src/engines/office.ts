import path from "path";
import fs from "fs/promises";
import os from "os";
import { runCommand } from "./shell";

const LIBREOFFICE = process.env["LIBREOFFICE_PATH"] ?? "soffice";

export async function officeToPdf(inputPath: string, outputDir: string): Promise<string> {
  await runCommand(LIBREOFFICE, [
    "--headless",
    "--nofirststartwizard",
    "--convert-to",
    "pdf",
    "--outdir",
    outputDir,
    inputPath,
  ], 120_000);

  const base = path.basename(inputPath, path.extname(inputPath));
  return path.join(outputDir, `${base}.pdf`);
}

export async function pdfToOffice(
  inputPath: string,
  outputDir: string,
  format: "docx" | "pptx"
): Promise<string> {
  const formatMap: Record<string, string> = {
    docx: "docx",
    pptx: "pptx",
  };

  await runCommand(LIBREOFFICE, [
    "--headless",
    "--nofirststartwizard",
    "--convert-to",
    formatMap[format] ?? "docx",
    "--outdir",
    outputDir,
    inputPath,
  ], 120_000);

  const base = path.basename(inputPath, path.extname(inputPath));
  return path.join(outputDir, `${base}.${format}`);
}

export async function txtToPdf(inputPath: string, outputDir: string): Promise<string> {
  return officeToPdf(inputPath, outputDir);
}

export async function pdfToTxt(inputPath: string, outputDir: string): Promise<string> {
  await runCommand("pdftotext", [inputPath, path.join(outputDir, "output.txt")]);
  return path.join(outputDir, "output.txt");
}

export async function pdfToZip(outputDir: string, sourceFiles: string[]): Promise<string> {
  const archiver = (await import("archiver")).default;
  const { createWriteStream } = await import("fs");
  const { pipeline } = await import("stream/promises");

  const zipPath = path.join(os.tmpdir(), `bundle-${Date.now()}.zip`);
  const output = createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 6 } });

  archive.pipe(output);
  for (const f of sourceFiles) {
    archive.file(f, { name: path.basename(f) });
  }
  await archive.finalize();
  await new Promise<void>((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
  });

  const dest = path.join(outputDir, "output.zip");
  await fs.copyFile(zipPath, dest);
  await fs.unlink(zipPath);
  return dest;
}
