export const TOOLS = [
  // PDF Organization
  { id: "merge-pdf", label: "Merge PDF", category: "organize", icon: "merge" },
  { id: "split-pdf", label: "Split PDF", category: "organize", icon: "split" },
  { id: "rotate-pdf", label: "Rotate PDF", category: "organize", icon: "rotate" },
  { id: "delete-pages", label: "Delete Pages", category: "organize", icon: "trash" },
  { id: "organize-pdf", label: "Organize PDF", category: "organize", icon: "layers" },
  { id: "extract-pages", label: "Extract Pages", category: "organize", icon: "scissors" },
  { id: "repair-pdf", label: "Repair PDF", category: "organize", icon: "wrench" },
  // Optimization
  { id: "compress-pdf", label: "Compress PDF", category: "optimize", icon: "compress" },
  { id: "grayscale-pdf", label: "Grayscale PDF", category: "optimize", icon: "palette" },
  { id: "watermark-pdf", label: "Watermark PDF", category: "optimize", icon: "stamp" },
  // Image → PDF
  { id: "jpg-to-pdf", label: "JPG to PDF", category: "convert", icon: "image" },
  { id: "png-to-pdf", label: "PNG to PDF", category: "convert", icon: "image" },
  { id: "bmp-to-pdf", label: "BMP to PDF", category: "convert", icon: "image" },
  { id: "tiff-to-pdf", label: "TIFF to PDF", category: "convert", icon: "image" },
  // PDF → Image
  { id: "pdf-to-jpg", label: "PDF to JPG", category: "convert", icon: "image" },
  { id: "pdf-to-png", label: "PDF to PNG", category: "convert", icon: "image" },
  { id: "pdf-to-bmp", label: "PDF to BMP", category: "convert", icon: "image" },
  { id: "pdf-to-tiff", label: "PDF to TIFF", category: "convert", icon: "image" },
  // Office → PDF
  { id: "word-to-pdf", label: "Word to PDF", category: "convert", icon: "file-text" },
  { id: "pdf-to-word", label: "PDF to Word", category: "convert", icon: "file-text" },
  { id: "ppt-to-pdf", label: "PPT to PDF", category: "convert", icon: "presentation" },
  { id: "pdf-to-ppt", label: "PDF to PPT", category: "convert", icon: "presentation" },
  { id: "excel-to-pdf", label: "Excel to PDF", category: "convert", icon: "table" },
  { id: "txt-to-pdf", label: "TXT to PDF", category: "convert", icon: "file" },
  { id: "pdf-to-txt", label: "PDF to TXT", category: "convert", icon: "file" },
  { id: "pdf-to-zip", label: "PDF to ZIP", category: "convert", icon: "archive" },
  // Security
  { id: "protect-pdf", label: "Protect PDF", category: "security", icon: "lock" },
  { id: "unlock-pdf", label: "Unlock PDF", category: "security", icon: "unlock" },
  { id: "signature-pdf", label: "Sign PDF", category: "security", icon: "pen-line" },
  // Generate
  { id: "invoice-pdf", label: "Invoice Generator", category: "convert", icon: "receipt" },
] as const;

export type ToolId = (typeof TOOLS)[number]["id"];
export type ToolCategory = "organize" | "optimize" | "convert" | "security";

export const TOOL_CATEGORIES: Record<ToolCategory, string> = {
  organize: "PDF Organization",
  optimize: "Optimization",
  convert: "Conversions",
  security: "Security",
};
