import { PDFDocument, degrees, rgb, StandardFonts, BlendMode } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// ── Shared font helpers ──────────────────────────────────────────────────────
const FONT_PATHS_R = [
  "/Library/Fonts/Arial Unicode.ttf",
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];
const FONT_PATHS_B = [
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
  "/Library/Fonts/Arial Bold.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
];

async function readFirstExisting(paths: string[]): Promise<Buffer | null> {
  for (const p of paths) {
    const b = await fs.readFile(p).catch(() => null);
    if (b) return b;
  }
  return null;
}
import fs from "fs/promises";
import path from "path";
import { runCommand } from "./shell";

export async function mergePdfs(inputPaths: string[], outputDir: string): Promise<string> {
  const merged = await PDFDocument.create();
  for (const inputPath of inputPaths) {
    const bytes = await fs.readFile(inputPath);
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  const out = path.join(outputDir, "merged.pdf");
  await fs.writeFile(out, bytes);
  return out;
}

export async function splitPdf(
  inputPath: string,
  outputDir: string,
  ranges: string[]
): Promise<string[]> {
  const srcBytes = await fs.readFile(inputPath);
  const src = await PDFDocument.load(srcBytes);
  const totalPages = src.getPageCount();
  const outputs: string[] = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i] ?? "";
    const pageNums = parseRange(range, totalPages);
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, pageNums.map((n) => n - 1));
    pages.forEach((p) => doc.addPage(p));
    const bytes = await doc.save();
    const out = path.join(outputDir, `part-${i + 1}.pdf`);
    await fs.writeFile(out, bytes);
    outputs.push(out);
  }
  return outputs;
}

export async function rotatePdf(
  inputPath: string,
  outputDir: string,
  angle: 90 | 180 | 270,
  pageNums?: number[]
): Promise<string> {
  const srcBytes = await fs.readFile(inputPath);
  const doc = await PDFDocument.load(srcBytes);
  const total = doc.getPageCount();
  const targets = pageNums ?? Array.from({ length: total }, (_, i) => i + 1);

  for (const num of targets) {
    if (num < 1 || num > total) continue;
    const page = doc.getPage(num - 1);
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }

  const bytes = await doc.save();
  const out = path.join(outputDir, "rotated.pdf");
  await fs.writeFile(out, bytes);
  return out;
}

export async function deletePages(
  inputPath: string,
  outputDir: string,
  pagesToDelete: number[]
): Promise<string> {
  const srcBytes = await fs.readFile(inputPath);
  const src = await PDFDocument.load(srcBytes);
  const total = src.getPageCount();
  const keepIndices = Array.from({ length: total }, (_, i) => i)
    .filter((i) => !pagesToDelete.includes(i + 1));

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, keepIndices);
  pages.forEach((p) => doc.addPage(p));

  const bytes = await doc.save();
  const out = path.join(outputDir, "deleted-pages.pdf");
  await fs.writeFile(out, bytes);
  return out;
}

export async function extractPages(
  inputPath: string,
  outputDir: string,
  pagesToExtract: number[]
): Promise<string> {
  const srcBytes = await fs.readFile(inputPath);
  const src = await PDFDocument.load(srcBytes);
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, pagesToExtract.map((n) => n - 1));
  pages.forEach((p) => doc.addPage(p));

  const bytes = await doc.save();
  const out = path.join(outputDir, "extracted.pdf");
  await fs.writeFile(out, bytes);
  return out;
}

export async function organizePdf(
  inputPath: string,
  outputDir: string,
  newOrder: number[]
): Promise<string> {
  const srcBytes = await fs.readFile(inputPath);
  const src = await PDFDocument.load(srcBytes);
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, newOrder.map((n) => n - 1));
  pages.forEach((p) => doc.addPage(p));

  const bytes = await doc.save();
  const out = path.join(outputDir, "organized.pdf");
  await fs.writeFile(out, bytes);
  return out;
}

export async function repairPdf(inputPath: string, outputDir: string): Promise<string> {
  // Best-effort: reload with pdf-lib and re-save
  const srcBytes = await fs.readFile(inputPath);
  const doc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
  const bytes = await doc.save();
  const out = path.join(outputDir, "repaired.pdf");
  await fs.writeFile(out, bytes);
  return out;
}

export async function compressPdf(
  inputPath: string,
  outputDir: string,
  quality: "low" | "medium" | "high"
): Promise<string> {
  const qualityMap = {
    low: "/screen",
    medium: "/ebook",
    high: "/printer",
  };
  const out = path.join(outputDir, "compressed.pdf");
  await runCommand("gs", [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    `-dPDFSETTINGS=${qualityMap[quality]}`,
    "-dNOPAUSE",
    "-dBATCH",
    "-dQUIET",
    `-sOutputFile=${out}`,
    inputPath,
  ]);
  return out;
}

// Compression levels ordered from MOST aggressive (smallest) to LEAST aggressive (best quality).
// We iterate in this order, stopping once a level exceeds the target — the previous result
// is the highest quality that still fits.
const COMPRESS_LEVELS = [
  { tag: "dpi48",   gsArgs: ["-dPDFSETTINGS=/screen", "-dColorImageResolution=48",  "-dGrayImageResolution=48",  "-dMonoImageResolution=96"]  },
  { tag: "screen",  gsArgs: ["-dPDFSETTINGS=/screen"]  },
  { tag: "dpi100",  gsArgs: ["-dPDFSETTINGS=/ebook",   "-dColorImageResolution=100", "-dGrayImageResolution=100", "-dMonoImageResolution=200"] },
  { tag: "ebook",   gsArgs: ["-dPDFSETTINGS=/ebook"]   },
  { tag: "dpi200",  gsArgs: ["-dPDFSETTINGS=/printer",  "-dColorImageResolution=200", "-dGrayImageResolution=200", "-dMonoImageResolution=400"] },
  { tag: "printer", gsArgs: ["-dPDFSETTINGS=/printer"]  },
];

async function runGsCompress(inputPath: string, outputPath: string, extraArgs: string[]): Promise<void> {
  await runCommand("gs", [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    ...extraArgs,
    "-dNOPAUSE",
    "-dBATCH",
    "-dQUIET",
    `-sOutputFile=${outputPath}`,
    inputPath,
  ]);
}

export async function compressPdfToTargetSize(
  inputPath: string,
  outputDir: string,
  targetBytes: number
): Promise<string> {
  const inputSize = (await fs.stat(inputPath)).size;
  const finalOut = path.join(outputDir, "compressed.pdf");

  // If target >= input, just run a light compress pass and return
  if (targetBytes >= inputSize) {
    await runGsCompress(inputPath, finalOut, ["-dPDFSETTINGS=/printer"]);
    return finalOut;
  }

  const tmpPaths: string[] = [];
  let bestPath: string | null = null;

  for (const level of COMPRESS_LEVELS) {
    const tmp = path.join(outputDir, `_cmp_${level.tag}.pdf`);
    tmpPaths.push(tmp);
    await runGsCompress(inputPath, tmp, level.gsArgs);

    const size = (await fs.stat(tmp)).size;

    if (size <= targetBytes) {
      bestPath = tmp; // This level fits — keep updating; next iterations are less aggressive
    } else {
      // This level exceeds the target — no point trying less aggressive (larger) levels
      break;
    }
  }

  if (!bestPath) {
    // Even the most aggressive level couldn't reach the target — return it as best effort
    bestPath = tmpPaths[0]!;
  }

  await fs.copyFile(bestPath, finalOut);

  // Clean up temp files
  await Promise.allSettled(
    tmpPaths.filter((p) => p !== bestPath).map((p) => fs.unlink(p).catch(() => {}))
  );

  return finalOut;
}

export async function grayscalePdf(inputPath: string, outputDir: string): Promise<string> {
  const out = path.join(outputDir, "grayscale.pdf");
  await runCommand("gs", [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    "-sColorConversionStrategy=Gray",
    "-dProcessColorModel=/DeviceGray",
    "-dNOPAUSE",
    "-dBATCH",
    "-dQUIET",
    `-sOutputFile=${out}`,
    inputPath,
  ]);
  return out;
}

export async function protectPdf(
  inputPath: string,
  outputDir: string,
  userPassword: string,
  ownerPassword: string,
  allowPrinting: boolean,
  allowCopying: boolean
): Promise<string> {
  const out = path.join(outputDir, "protected.pdf");
  await runCommand("qpdf", [
    "--encrypt",
    userPassword,
    ownerPassword,
    "256",
    `--print=${allowPrinting ? "full" : "none"}`,
    `--extract=${allowCopying ? "y" : "n"}`,
    "--modify=none",
    "--",
    inputPath,
    out,
  ]);
  return out;
}

export async function unlockPdf(
  inputPath: string,
  outputDir: string,
  password: string
): Promise<string> {
  const out = path.join(outputDir, "unlocked.pdf");
  await runCommand("qpdf", [
    `--password=${password}`,
    "--decrypt",
    inputPath,
    out,
  ]);
  return out;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

interface WatermarkOptions {
  type: "text" | "logo" | "diagonal";
  text?: string;
  fontSize?: number;
  color?: string;        // hex e.g. "#9ca3af"
  opacity?: number;      // 0–1
  placement?: "center" | "tile";
  logoPath?: string;
  logoSizePct?: number;  // percentage of page width
  repeat?: boolean;      // diagonal tiled
}

export async function addWatermark(
  inputPath: string,
  outputDir: string,
  opts: WatermarkOptions
): Promise<string> {
  const {
    type = "text",
    text = "CONFIDENTIAL",
    fontSize = 48,
    color = "#9ca3af",
    opacity = 0.3,
    placement = "center",
    logoPath,
    logoSizePct = 30,
    repeat = true,
  } = opts;

  const srcBytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(srcBytes);
  const pages = pdfDoc.getPages();

  if (type === "text" || type === "diagonal") {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const [r, g, b] = hexToRgb(color);
    const angle = type === "diagonal" ? 45 : 0;
    const isRepeat = type === "diagonal" ? repeat : placement === "tile";

    for (const page of pages) {
      const { width, height } = page.getSize();

      if (isRepeat) {
        // Tiled grid — covers page with extra margin so rotated items don't leave gaps
        const stepX = Math.max(fontSize * 6, 180);
        const stepY = Math.max(fontSize * 3, 120);
        const cols = Math.ceil(width / stepX) + 3;
        const rows = Math.ceil(height / stepY) + 3;
        for (let c = -1; c < cols; c++) {
          for (let rr = -1; rr < rows; rr++) {
            page.drawText(text, {
              x: c * stepX,
              y: rr * stepY,
              size: fontSize,
              font,
              color: rgb(r, g, b),
              opacity,
              rotate: degrees(angle),
            });
          }
        }
      } else {
        // Single centered watermark
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const cx = (width - textWidth * Math.cos((angle * Math.PI) / 180)) / 2;
        const cy = (height - fontSize * Math.sin((angle * Math.PI) / 180)) / 2;
        page.drawText(text, {
          x: cx,
          y: cy,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(angle),
        });
      }
    }
  } else if (type === "logo" && logoPath) {
    const logoBytes = await fs.readFile(logoPath);
    const lower = logoPath.toLowerCase();
    const logo = lower.endsWith(".png")
      ? await pdfDoc.embedPng(logoBytes)
      : await pdfDoc.embedJpg(logoBytes);

    for (const page of pages) {
      const { width, height } = page.getSize();
      const logoW = (width * logoSizePct) / 100;
      const logoH = (logoW / logo.width) * logo.height;

      if (placement === "tile") {
        const stepX = logoW * 1.8;
        const stepY = logoH * 1.8;
        const cols = Math.ceil(width / stepX) + 2;
        const rows = Math.ceil(height / stepY) + 2;
        for (let c = -1; c < cols; c++) {
          for (let rr = -1; rr < rows; rr++) {
            page.drawImage(logo, {
              x: c * stepX,
              y: rr * stepY,
              width: logoW,
              height: logoH,
              opacity,
            });
          }
        }
      } else {
        page.drawImage(logo, {
          x: (width - logoW) / 2,
          y: (height - logoH) / 2,
          width: logoW,
          height: logoH,
          opacity,
        });
      }
    }
  }

  const out = path.join(outputDir, "watermarked.pdf");
  await fs.writeFile(out, await pdfDoc.save());
  return out;
}

// ── Signature ────────────────────────────────────────────────────────────────

export async function addSignature(
  inputPath: string,
  outputDir: string,
  signaturePath: string,
  opts: {
    page?: number;
    xPct?: number;
    yPct?: number;
    widthPct?: number;
    signerName?: string;
    includeDate?: boolean;
    signerDate?: string;
    showLine?: boolean;
  }
): Promise<string> {
  const {
    page = 1,
    xPct = 58,
    yPct = 75,
    widthPct = 32,
    signerName,
    includeDate = false,
    signerDate,
    showLine = true,
  } = opts;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [srcBytes, sigBytes] = await Promise.all([
    fs.readFile(inputPath),
    fs.readFile(signaturePath),
  ]);

  const srcDoc = await PDFDocument.load(srcBytes);
  const copied = await pdfDoc.copyPages(srcDoc, srcDoc.getPageIndices());
  copied.forEach((p) => pdfDoc.addPage(p));

  // Embed signature image — PNG (from canvas) or JPG (uploaded)
  const isJpg = /\.(jpe?g)$/i.test(signaturePath);
  const sigImg = isJpg
    ? await pdfDoc.embedJpg(sigBytes)
    : await pdfDoc.embedPng(sigBytes);

  const pageIdx = Math.max(0, Math.min(page - 1, pdfDoc.getPageCount() - 1));
  const targetPage = pdfDoc.getPage(pageIdx);
  const { width: PW, height: PH } = targetPage.getSize();

  const sigW = (widthPct / 100) * PW;
  const sigH = sigW * (sigImg.height / sigImg.width);
  const sigX = (xPct / 100) * PW;
  // yPct is % from top; pdf-lib y=0 is at bottom
  const sigY = PH - (yPct / 100) * PH - sigH;

  targetPage.drawImage(sigImg, { x: sigX, y: sigY, width: sigW, height: sigH });

  let curY = sigY - 6;

  if (showLine) {
    targetPage.drawLine({
      start: { x: sigX, y: curY },
      end:   { x: sigX + sigW, y: curY },
      thickness: 0.8,
      color: rgb(0.5, 0.5, 0.5),
    });
    curY -= 12;
  }

  const fontBytes = await readFirstExisting(FONT_PATHS_R);
  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: true })
    : await pdfDoc.embedFont(StandardFonts.Helvetica);

  if (signerName) {
    targetPage.drawText(signerName, {
      x: sigX, y: curY, size: 8, font, color: rgb(0.15, 0.15, 0.15),
    });
    curY -= 11;
  }
  if (includeDate && signerDate) {
    targetPage.drawText(signerDate, {
      x: sigX, y: curY, size: 7, font, color: rgb(0.5, 0.5, 0.5),
    });
  }

  const slug = path.basename(inputPath, ".pdf");
  const out = path.join(outputDir, `signed-${slug}.pdf`);
  await fs.writeFile(out, await pdfDoc.save());
  return out;
}

// ── Invoice Generator ────────────────────────────────────────────────────────

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  theme: string;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyEmail: string;
  companyPhone: string;
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientEmail: string;
  items: InvoiceLineItem[];
  discount: number;
  discountType: "percent" | "fixed";
  notes: string;
  paymentTerms: string;
  logoPath?: string;
}

export async function generateInvoice(outputDir: string, raw: Record<string, unknown>): Promise<string> {
  const data = raw as InvoiceData;
  const items: InvoiceLineItem[] = Array.isArray(data.items) ? data.items : [];

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Embed Unicode fonts so symbols like ₹, €, ¥ render correctly.
  const [regularBytes, boldBytes] = await Promise.all([
    readFirstExisting(FONT_PATHS_R),
    readFirstExisting(FONT_PATHS_B),
  ]);

  const fontR = regularBytes
    ? await pdfDoc.embedFont(regularBytes, { subset: true })
    : await pdfDoc.embedFont(StandardFonts.Helvetica);
  // Bold: use bold font if available, otherwise reuse the Unicode regular font
  // so that ₹/€ etc. at least render (without faux-bold) rather than crashing.
  const fontB = boldBytes
    ? await pdfDoc.embedFont(boldBytes, { subset: true })
    : regularBytes
    ? await pdfDoc.embedFont(regularBytes, { subset: true })
    : await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PW = 595.28;
  const PH = 841.89;
  const ML = 45;   // margin left
  const MR = 45;   // margin right
  const CW = PW - ML - MR; // 505.28

  // y-from-top → pdf-lib y (y=0 at bottom)
  const YY = (t: number) => PH - t;

  const THEMES: Record<string, [number, number, number]> = {
    blue:   [0.145, 0.369, 0.894],
    red:    [0.753, 0.106, 0.106],
    dark:   [0.114, 0.114, 0.153],
    green:  [0.067, 0.533, 0.357],
    purple: [0.467, 0.275, 0.796],
  };
  const [tr, tg, tb] = THEMES[data.theme ?? "blue"] ?? THEMES.blue!;
  const TC  = rgb(tr, tg, tb);
  const TCL = rgb(tr * 0.25 + 0.75, tg * 0.25 + 0.75, tb * 0.25 + 0.75); // very light tint
  const WHITE     = rgb(1, 1, 1);
  const BLACK     = rgb(0.08, 0.08, 0.08);
  const GRAY      = rgb(0.45, 0.45, 0.45);
  const LGRAY     = rgb(0.93, 0.93, 0.95);
  const MID       = rgb(0.7, 0.7, 0.7);

  const sym = data.currencySymbol || "$";
  const trunc = (s: string, n: number) => (!s ? "" : s.length > n ? s.slice(0, n - 1) + "…" : s);
  const fmt = (n: number) => `${sym}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const tw = (s: string, sz: number, f: typeof fontR) => f.widthOfTextAtSize(s, sz);

  // Compute totals
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.taxRate / 100), 0);
  const discAmt  = data.discountType === "percent" ? subtotal * ((data.discount || 0) / 100) : (data.discount || 0);
  const total    = subtotal + taxTotal - discAmt;

  // ── PAGE SETUP ───────────────────────────────────────────────
  const page = pdfDoc.addPage([PW, PH]);

  // ── HEADER BAND (0 → 145 from top) ──────────────────────────
  const HEADER_H = 145;
  page.drawRectangle({ x: 0, y: YY(HEADER_H), width: PW, height: HEADER_H, color: TC });

  // "INVOICE" title — right side
  const titleTxt = "INVOICE";
  const titleSz  = 26;
  page.drawText(titleTxt, {
    x: PW - MR - tw(titleTxt, titleSz, fontB),
    y: YY(48),
    size: titleSz, font: fontB, color: WHITE,
  });

  // Invoice meta (right side)
  const numTxt = `#${data.invoiceNumber || "INV-001"}`;
  page.drawText(numTxt, { x: PW - MR - tw(numTxt, 10, fontB), y: YY(70), size: 10, font: fontB, color: rgb(0.9, 0.9, 0.9) });

  const drawRightMeta = (label: string, val: string, yTop: number) => {
    if (!val) return;
    const valW = tw(val, 8.5, fontR);
    const labW = tw(label, 8.5, fontB);
    page.drawText(label, { x: PW - MR - valW - labW - 4, y: YY(yTop), size: 8.5, font: fontB, color: rgb(0.75, 0.75, 0.75) });
    page.drawText(val,   { x: PW - MR - valW,             y: YY(yTop), size: 8.5, font: fontR, color: rgb(0.95, 0.95, 0.95) });
  };
  drawRightMeta("Date:   ", data.issueDate || "", 92);
  drawRightMeta("Due:    ", data.dueDate    || "", 107);
  if (data.paymentTerms) drawRightMeta("Terms:  ", data.paymentTerms, 122);

  // Logo (left side)
  let bodyLeftX = ML;
  if (data.logoPath) {
    try {
      const logoBytes = await fs.readFile(data.logoPath);
      const isP = data.logoPath.toLowerCase().endsWith(".png");
      const img = isP ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes);
      const maxH = 60, maxW = 70;
      let lw = maxW, lh = (maxW / img.width) * img.height;
      if (lh > maxH) { lh = maxH; lw = (maxH / img.height) * img.width; }
      page.drawImage(img, { x: ML, y: YY(28 + lh), width: lw, height: lh });
      bodyLeftX = ML + lw + 10;
    } catch { /* skip on error */ }
  }

  // Company info (left side of header)
  const drawHeaderLeft = (text: string, yTop: number, bold = false, sz = 9) => {
    if (!text) return;
    page.drawText(trunc(text, 38), { x: bodyLeftX, y: YY(yTop), size: sz, font: bold ? fontB : fontR, color: bold ? WHITE : rgb(0.88, 0.88, 0.88) });
  };
  drawHeaderLeft(data.companyName  || "Your Company", 44, true, 14);
  drawHeaderLeft(data.companyEmail || "",  64);
  drawHeaderLeft(data.companyPhone || "",  77);
  drawHeaderLeft(data.companyAddress || "", 90);
  drawHeaderLeft(data.companyCity  || "", 103);

  // ── BILL TO / FROM SECTION (155 → 250) ──────────────────────
  let cY = HEADER_H + 22; // cursor y from top

  const drawSectionLabel = (label: string, x: number, y: number) => {
    page.drawText(label, { x, y: YY(y), size: 7.5, font: fontB, color: TC });
    page.drawLine({ start: { x, y: YY(y + 4) }, end: { x: x + 110, y: YY(y + 4) }, thickness: 0.8, color: TC });
  };

  const col2X = ML + CW / 2 + 15;

  drawSectionLabel("BILL TO", ML, cY);
  drawSectionLabel("BILL FROM", col2X, cY);
  cY += 14;

  const drawCol = (lines: string[], x: number, startY: number, firstBold = true) => {
    let y = startY;
    lines.forEach((line, i) => {
      if (!line) return;
      page.drawText(trunc(line, 34), { x, y: YY(y), size: i === 0 && firstBold ? 10 : 8.5, font: i === 0 && firstBold ? fontB : fontR, color: i === 0 ? BLACK : GRAY });
      y += i === 0 ? 14 : 12;
    });
  };

  drawCol([data.clientName, data.clientCompany, data.clientAddress, data.clientEmail].filter(Boolean), ML, cY);
  drawCol([data.companyName, data.companyEmail, data.companyAddress, data.companyCity].filter(Boolean), col2X, cY, false);

  cY = HEADER_H + 22 + 90; // advance past addresses

  // ── TABLE ───────────────────────────────────────────────────
  cY += 16;

  // Column right-edge positions (right-align numbers; left-align description)
  const COL_DESC_X    = ML;          // description starts here
  const COL_DESC_END  = ML + 215;    // description ends here
  const COL_QTY_R     = COL_DESC_END + 42;   // qty right edge
  const COL_PRICE_R   = COL_QTY_R + 78;      // unit price right edge
  const COL_TAX_R     = COL_PRICE_R + 44;    // tax right edge
  const COL_AMT_R     = ML + CW;             // amount right edge = 550

  const ROW_H = 22;
  const THEAD_H = 24;

  // Table header
  page.drawRectangle({ x: ML - 4, y: YY(cY + THEAD_H), width: CW + 8, height: THEAD_H, color: TC });
  const thY = cY + 9;
  const drawTH = (label: string, rightX: number, leftX?: number) => {
    if (leftX !== undefined) {
      page.drawText(label, { x: leftX, y: YY(thY), size: 7.5, font: fontB, color: WHITE });
    } else {
      page.drawText(label, { x: rightX - tw(label, 7.5, fontB), y: YY(thY), size: 7.5, font: fontB, color: WHITE });
    }
  };
  drawTH("DESCRIPTION", 0, COL_DESC_X);
  drawTH("QTY",         COL_QTY_R);
  drawTH("UNIT PRICE",  COL_PRICE_R);
  drawTH("TAX",         COL_TAX_R);
  drawTH("AMOUNT",      COL_AMT_R);
  cY += THEAD_H;

  // Table rows
  items.forEach((item, idx) => {
    const rowBg = idx % 2 === 1;
    if (rowBg) page.drawRectangle({ x: ML - 4, y: YY(cY + ROW_H), width: CW + 8, height: ROW_H, color: LGRAY });

    const ry = cY + 14;
    const lineTotal = item.quantity * item.unitPrice * (1 + item.taxRate / 100);

    page.drawText(trunc(item.description || "Item", 38), { x: COL_DESC_X, y: YY(ry), size: 8.5, font: fontR, color: BLACK });

    const qty   = String(item.quantity ?? 1);
    const price = fmt(item.unitPrice ?? 0);
    const tax   = `${item.taxRate ?? 0}%`;
    const amt   = fmt(lineTotal);

    page.drawText(qty,   { x: COL_QTY_R   - tw(qty, 8.5, fontR),   y: YY(ry), size: 8.5, font: fontR, color: BLACK });
    page.drawText(price, { x: COL_PRICE_R - tw(price, 8.5, fontR), y: YY(ry), size: 8.5, font: fontR, color: BLACK });
    page.drawText(tax,   { x: COL_TAX_R   - tw(tax, 8.5, fontR),   y: YY(ry), size: 8.5, font: fontR, color: GRAY });
    page.drawText(amt,   { x: COL_AMT_R   - tw(amt, 8.5, fontB),   y: YY(ry), size: 8.5, font: fontB, color: BLACK });

    // Row bottom line
    page.drawLine({ start: { x: ML - 4, y: YY(cY + ROW_H) }, end: { x: ML + CW + 4, y: YY(cY + ROW_H) }, thickness: 0.4, color: MID });
    cY += ROW_H;
  });

  cY += 14;

  // ── TOTALS BLOCK (right-aligned) ──────────────────────────────
  const totLabelX = ML + CW * 0.52;
  const totValR   = ML + CW;

  const drawTotalRow = (label: string, value: string, bold = false, highlight = false) => {
    if (highlight) {
      page.drawRectangle({ x: totLabelX - 8, y: YY(cY + 18), width: CW * 0.48 + 8, height: 18, color: TC });
    }
    const f = bold ? fontB : fontR;
    const c = highlight ? WHITE : bold ? BLACK : GRAY;
    page.drawText(label, { x: totLabelX, y: YY(cY + 4), size: bold ? 9.5 : 8.5, font: f, color: c });
    page.drawText(value, { x: totValR - tw(value, bold ? 9.5 : 8.5, f), y: YY(cY + 4), size: bold ? 9.5 : 8.5, font: f, color: c });
    cY += 20;
  };

  drawTotalRow("Subtotal", fmt(subtotal));
  if (taxTotal > 0) drawTotalRow("Tax", fmt(taxTotal));
  if (discAmt > 0)  drawTotalRow("Discount", `- ${fmt(discAmt)}`);
  // Separator line
  page.drawLine({ start: { x: totLabelX - 8, y: YY(cY) }, end: { x: totValR, y: YY(cY) }, thickness: 0.8, color: MID });
  cY += 6;
  drawTotalRow("TOTAL", fmt(total), true, true);

  cY += 18;

  // ── NOTES ────────────────────────────────────────────────────
  if (data.notes || data.paymentTerms) {
    page.drawLine({ start: { x: ML, y: YY(cY) }, end: { x: ML + CW, y: YY(cY) }, thickness: 0.5, color: LGRAY });
    cY += 12;
    if (data.notes) {
      page.drawText("NOTES", { x: ML, y: YY(cY), size: 7.5, font: fontB, color: TC });
      cY += 12;
      const noteLines = trunc(data.notes, 300).match(/.{1,90}/g) ?? [];
      for (const line of noteLines.slice(0, 4)) {
        page.drawText(line, { x: ML, y: YY(cY), size: 8.5, font: fontR, color: GRAY });
        cY += 12;
      }
    }
    if (data.paymentTerms) {
      cY += 4;
      page.drawText("Payment Terms: ", { x: ML, y: YY(cY), size: 8.5, font: fontB, color: BLACK });
      page.drawText(data.paymentTerms, { x: ML + tw("Payment Terms: ", 8.5, fontB), y: YY(cY), size: 8.5, font: fontR, color: GRAY });
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────
  const footerTxt = "Thank you for your business.";
  page.drawText(footerTxt, { x: (PW - tw(footerTxt, 8, fontR)) / 2, y: YY(PH - 25), size: 8, font: fontR, color: MID });

  const slug = (data.invoiceNumber || "invoice").replace(/[^a-zA-Z0-9\-_]/g, "_");
  const out  = path.join(outputDir, `invoice-${slug}.pdf`);
  await fs.writeFile(out, await pdfDoc.save());
  return out;
}

function parseRange(range: string, total: number): number[] {
  const pages: number[] = [];
  for (const part of range.split(",")) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = Math.max(1, parseInt(startStr ?? "1", 10));
      const end = Math.min(total, parseInt(endStr ?? String(total), 10));
      for (let i = start; i <= end; i++) pages.push(i);
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n) && n >= 1 && n <= total) pages.push(n);
    }
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}
