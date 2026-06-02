"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface JobStatusData {
  status: "queued" | "processing" | "ready" | "failed" | "error";
  downloadUrl?: string;
  error?: string;
}

interface JobStatusProps {
  jobId: string;
  toolId?: string;
  onReset: () => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
}

interface PdfPreviewProps {
  url: string;
}

function PdfPreview({ url }: PdfPreviewProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function renderPreview() {
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) return;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const pdf = await pdfjsLib.getDocument(url).promise;
        const numPages = pdf.numPages;
        const urls: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          if (!active) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.85 }); // perfectly high res
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            urls.push(canvas.toDataURL("image/jpeg", 0.9));
          }
        }

        if (active) {
          setPages(urls);
        }
      } catch (err) {
        console.error("Failed to render PDF preview:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    renderPreview();
    return () => {
      active = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs border rounded-2xl p-8 flex flex-col items-center justify-center min-h-64 shadow-xs">
        <Loader2 className="h-6 w-6 text-primary animate-spin mb-3" />
        <p className="text-xs text-muted-foreground">Loading invoice preview...</p>
      </div>
    );
  }

  if (pages.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto bg-muted/20 border rounded-2xl p-4.5 shadow-sm space-y-4 max-h-[440px] overflow-y-auto">
      {pages.map((src, idx) => (
        <div key={idx} className="relative border rounded-xl overflow-hidden shadow-xs bg-white">
          <img src={src} alt={`Page ${idx + 1}`} className="w-full h-auto object-contain select-none pointer-events-none" />
          <div className="absolute bottom-3 right-3 bg-black/65 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs select-none">
            Page {idx + 1} of {pages.length}
          </div>
        </div>
      ))}
    </div>
  );
}

export function JobStatus({ jobId, toolId, onReset }: JobStatusProps) {
  const [data, setData] = useState<JobStatusData>({ status: "queued" });
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    let sse: EventSource | null = null;

    const connect = () => {
      sse = new EventSource(`/api/jobs/${jobId}/stream`);

      sse.onmessage = (e: MessageEvent) => {
        const payload = JSON.parse(e.data as string) as JobStatusData;
        setData(payload);
        if (payload.status === "processing") setProgress(55);
        if (payload.status === "ready") setProgress(100);
        if (payload.status === "ready" || payload.status === "failed" || payload.status === "error") {
          sse?.close();
        }
      };

      sse.onerror = () => {
        sse?.close();
        setData((prev) =>
          prev.status === "ready" ? prev : { status: "error", error: "Connection lost" }
        );
      };
    };

    connect();
    return () => sse?.close();
  }, [jobId]);

  if (data.status === "queued" || data.status === "processing") {
    return (
      <div className="rounded-2xl border bg-muted/20 p-10 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          {data.status === "queued"
            ? <Clock className="h-8 w-8 text-primary" />
            : <Loader2 className="h-8 w-8 text-primary animate-spin" />
          }
        </div>
        <div>
          <p className="font-semibold text-base">
            {data.status === "queued" ? "Queued" : "Processing your file…"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {data.status === "queued" ? "Waiting for a worker to pick up your job" : "This usually takes just a few seconds"}
          </p>
        </div>
        <Progress value={progress} className="max-w-xs mx-auto h-2 rounded-full" />
      </div>
    );
  }

  if (data.status === "ready" && data.downloadUrl) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-10 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <p className="font-bold text-lg text-emerald-800">Your file is ready!</p>
          <p className="text-sm text-emerald-700/70 mt-1">Processed successfully — download before it expires in 1 hour</p>
        </div>

        {/* Dynamic visual PDF preview for the Invoice Generator */}
        {toolId === "invoice-pdf" && data.downloadUrl && (
          <div className="py-2">
            <PdfPreview url={data.downloadUrl} />
          </div>
        )}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            render={<a href={data.downloadUrl} download />}
            nativeButton={false}
            size="lg"
            className="rounded-xl shadow-sm shadow-primary/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            size="lg"
            className="rounded-xl border-emerald-200 hover:bg-emerald-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Process another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-10 text-center space-y-5">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <p className="font-bold text-base text-destructive">Processing failed</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          {data.error ?? "Something went wrong. Please try again."}
        </p>
      </div>
      <Button variant="outline" onClick={onReset} size="lg" className="rounded-xl">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
