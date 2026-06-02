"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./file-dropzone";
import { JobStatus } from "./job-status";
import type { ToolId } from "@pdf-tools/core/src/tools";
import { CompressControls } from "./controls/compress-controls";
import { RotateControls } from "./controls/rotate-controls";
import { PageSelectorControls } from "./controls/page-selector-controls";
import { SplitControls } from "./controls/split-controls";
import { ProtectControls } from "./controls/protect-controls";
import { UnlockControls } from "./controls/unlock-controls";
import { WatermarkControls } from "./controls/watermark-controls";
import { InvoiceControls } from "./controls/invoice-controls";
import { SignatureControls } from "./controls/signature-controls";
import { OrganizeControls } from "./controls/organize-controls";

const MULTI_INPUT_TOOLS = new Set(["merge-pdf", "jpg-to-pdf", "png-to-pdf", "bmp-to-pdf", "tiff-to-pdf"]);

const ACCEPT_MAP: Partial<Record<string, string>> = {
  "word-to-pdf": ".doc,.docx",
  "ppt-to-pdf": ".ppt,.pptx",
  "excel-to-pdf": ".xls,.xlsx",
  "txt-to-pdf": ".txt",
  "jpg-to-pdf": ".jpg,.jpeg",
  "png-to-pdf": ".png",
  "bmp-to-pdf": ".bmp",
  "tiff-to-pdf": ".tiff,.tif",
};

const PDF_INPUT_TOOLS = new Set([
  "merge-pdf", "split-pdf", "rotate-pdf", "delete-pages", "organize-pdf",
  "extract-pages", "repair-pdf", "compress-pdf", "grayscale-pdf",
  "protect-pdf", "unlock-pdf", "watermark-pdf", "signature-pdf",
  "pdf-to-jpg", "pdf-to-png", "pdf-to-bmp", "pdf-to-tiff",
  "pdf-to-word", "pdf-to-ppt", "pdf-to-txt", "pdf-to-zip",
]);

interface ToolFormProps {
  toolId: ToolId;
  recaptchaSiteKey?: string;
}

export function ToolForm({ toolId, recaptchaSiteKey }: ToolFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [params, setParams] = useState<Record<string, unknown>>(
    toolId === "watermark-pdf" ? { type: "text" } : {}
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isMulti = MULTI_INPUT_TOOLS.has(toolId);
  const accept = ACCEPT_MAP[toolId] ?? (PDF_INPUT_TOOLS.has(toolId) ? ".pdf" : ".pdf");

  const needsLogo = toolId === "watermark-pdf" && params["type"] === "logo";
  const logoMissing = needsLogo && !logoFile;
  const isGenerator = toolId === "invoice-pdf";
  const needsSignature = toolId === "signature-pdf";
  const signatureMissing = needsSignature && !logoFile;

  async function handleSubmit() {
    if (files.length === 0 && !isGenerator) {
      toast.error("Please select a file first.");
      return;
    }
    if (toolId === "merge-pdf" && files.length < 2) {
      toast.error("Please select at least 2 PDF files to merge.");
      return;
    }
    if (logoMissing) {
      toast.error("Please upload a logo image.");
      return;
    }
    if (signatureMissing) {
      toast.error("Please draw, type, or upload your signature.");
      return;
    }

    setLoading(true);
    try {
      let recaptchaToken = "";
      if (recaptchaSiteKey && (window as any).grecaptcha) {
        recaptchaToken = await (window as any).grecaptcha.execute(recaptchaSiteKey, {
          action: `submit_${toolId.replace(/-/g, "_")}`,
        });
      }

      const form = new FormData();
      form.append("tool", toolId);
      form.append("params", JSON.stringify(params));
      form.append("recaptchaToken", recaptchaToken);
      files.forEach((f) => form.append("files", f));
      if (logoFile) form.append("files", logoFile);

      const res = await fetch("/api/jobs", { method: "POST", body: form });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setJobId(data.jobId!);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFiles([]);
    setParams(toolId === "watermark-pdf" ? { type: "text" } : {});
    setLogoFile(null);
    setJobId(null);
    setLoading(false);
  }

  if (jobId) {
    return <JobStatus jobId={jobId} toolId={toolId} onReset={reset} />;
  }

  return (
    <div className="space-y-6">
      {!isGenerator && (
        <FileDropzone
          onFiles={setFiles}
          accept={accept}
          multiple={isMulti}
          disabled={loading}
        />
      )}

      {toolId === "compress-pdf" && (
        <CompressControls
          onChange={(p) => setParams(p as unknown as Record<string, unknown>)}
          fileSizeBytes={files[0]?.size}
        />
      )}
      {toolId === "rotate-pdf" && (
        <RotateControls onChange={(angle) => setParams({ angle })} />
      )}
      {(toolId === "delete-pages" || toolId === "extract-pages") && (
        <PageSelectorControls onChange={(pages) => setParams({ pages })} />
      )}
      {toolId === "split-pdf" && (
        <SplitControls onChange={(ranges) => setParams({ ranges })} />
      )}
      {toolId === "organize-pdf" && files[0] && (
        <OrganizeControls
          file={files[0]}
          onChange={(order) => setParams({ order })}
        />
      )}
      {toolId === "protect-pdf" && (
        <ProtectControls onChange={(p) => setParams(p as unknown as Record<string, unknown>)} />
      )}
      {toolId === "unlock-pdf" && (
        <UnlockControls onChange={(password) => setParams({ password })} />
      )}
      {toolId === "watermark-pdf" && (
        <WatermarkControls
          onChange={(p) => setParams(p as unknown as Record<string, unknown>)}
          onLogoFile={setLogoFile}
        />
      )}
      {toolId === "invoice-pdf" && (
        <InvoiceControls
          onChange={(d) => setParams(d as unknown as Record<string, unknown>)}
          onLogoFile={setLogoFile}
        />
      )}
      {toolId === "signature-pdf" && (
        <SignatureControls
          onChange={(p) => setParams(p as unknown as Record<string, unknown>)}
          onSignatureFile={setLogoFile}
        />
      )}

      <Button
        onClick={handleSubmit}
        disabled={
          loading ||
          (!isGenerator && files.length === 0) ||
          (toolId === "merge-pdf" && files.length < 2) ||
          logoMissing ||
          signatureMissing
        }
        className="w-full sm:w-auto rounded-xl shadow-sm shadow-primary/20"
        size="lg"
      >
        {loading
          ? "Processing…"
          : toolId === "merge-pdf"
          ? `Merge ${files.length < 2 ? "(select ≥2 files)" : `${files.length} PDFs`}`
          : toolId === "watermark-pdf"
          ? "Apply Watermark"
          : toolId === "invoice-pdf"
          ? "Generate Invoice"
          : toolId === "signature-pdf"
          ? "Sign PDF"
          : "Process File"}
      </Button>
    </div>
  );
}
