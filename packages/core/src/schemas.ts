import { z } from "zod";

export const JobStatus = z.enum(["queued", "processing", "ready", "failed", "expired"]);
export type JobStatus = z.infer<typeof JobStatus>;

export const CompressQuality = z.enum(["low", "medium", "high"]);
export type CompressQuality = z.infer<typeof CompressQuality>;

export const RotateAngle = z.union([z.literal(90), z.literal(180), z.literal(270)]);
export type RotateAngle = z.infer<typeof RotateAngle>;

export const CompressParamsSchema = z.object({
  quality: CompressQuality.default("medium"),
});

export const MergeParamsSchema = z.object({
  order: z.array(z.string()).min(2),
});

export const SplitParamsSchema = z.object({
  ranges: z.array(z.string()).min(1),
});

export const RotateParamsSchema = z.object({
  angle: RotateAngle,
  pages: z.array(z.number().int().positive()).optional(),
});

export const DeletePagesParamsSchema = z.object({
  pages: z.array(z.number().int().positive()).min(1),
});

export const ExtractPagesParamsSchema = z.object({
  pages: z.array(z.number().int().positive()).min(1),
});

export const ProtectParamsSchema = z.object({
  userPassword: z.string().min(1).max(128),
  ownerPassword: z.string().min(1).max(128).optional(),
  allowPrinting: z.boolean().default(true),
  allowCopying: z.boolean().default(false),
});

export const UnlockParamsSchema = z.object({
  password: z.string().min(1).max(128),
});

export const ImageToPdfParamsSchema = z.object({
  order: z.array(z.string()).optional(),
});

export const PdfToImageParamsSchema = z.object({
  format: z.enum(["jpg", "png", "bmp", "tiff"]),
  dpi: z.number().int().min(72).max(600).default(150),
  asZip: z.boolean().default(false),
});

export const MAX_FILE_SIZE_FREE = 100 * 1024 * 1024; // 100 MB
export const MAX_FILE_SIZE_PRO = 500 * 1024 * 1024; // 500 MB
export const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour
