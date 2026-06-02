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
  onReset: () => void;
}

export function JobStatus({ jobId, onReset }: JobStatusProps) {
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
