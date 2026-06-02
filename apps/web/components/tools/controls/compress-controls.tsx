"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

type CompressParams =
  | { mode: "preset"; quality: "low" | "medium" | "high" }
  | { mode: "target"; targetKB: number };

interface CompressControlsProps {
  onChange: (params: CompressParams) => void;
  fileSizeBytes?: number;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

const QUICK_PCTS = [
  { label: "90%", pct: 0.9 },
  { label: "75%", pct: 0.75 },
  { label: "50%", pct: 0.5 },
  { label: "25%", pct: 0.25 },
];

export function CompressControls({ onChange, fileSizeBytes }: CompressControlsProps) {
  const [tab, setTab] = useState<"preset" | "target">("preset");

  // preset mode
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");

  // target mode
  const [targetValue, setTargetValue] = useState("500");
  const [unit, setUnit] = useState<"KB" | "MB">("KB");

  function emitTarget(rawValue: string, u: "KB" | "MB") {
    const num = parseFloat(rawValue);
    if (!isNaN(num) && num > 0) {
      const kb = u === "MB" ? num * 1024 : num;
      onChange({ mode: "target", targetKB: Math.round(kb) });
    }
  }

  function pickPct(pct: number) {
    if (!fileSizeBytes) return;
    const kb = Math.round((fileSizeBytes * pct) / 1024);
    const newVal = kb >= 1024 ? String(+(kb / 1024).toFixed(1)) : String(kb);
    const newUnit: "KB" | "MB" = kb >= 1024 ? "MB" : "KB";
    setTargetValue(newVal);
    setUnit(newUnit);
    onChange({ mode: "target", targetKB: kb });
  }

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        {(["preset", "target"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              if (t === "preset") {
                onChange({ mode: "preset", quality });
              } else {
                emitTarget(targetValue, unit);
              }
            }}
            className={cn(
              "px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {t === "preset" ? "Quality Preset" : "Target Size"}
          </button>
        ))}
      </div>

      {tab === "preset" && (
        <div className="space-y-2">
          <Label>Compression level</Label>
          <Select
            value={quality}
            onValueChange={(v) => {
              const q = v as "low" | "medium" | "high";
              setQuality(q);
              onChange({ mode: "preset", quality: q });
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High quality — slight compression</SelectItem>
              <SelectItem value="medium">Balanced — recommended</SelectItem>
              <SelectItem value="low">Maximum compression — smallest file</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {tab === "target" && (
        <div className="space-y-4">
          {/* Original size reference */}
          {fileSizeBytes != null && (
            <div className="text-sm text-muted-foreground">
              Original file size:{" "}
              <span className="font-semibold text-foreground">{formatSize(fileSizeBytes)}</span>
            </div>
          )}

          {/* Quick percentage buttons */}
          {fileSizeBytes != null && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quick targets</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_PCTS.map(({ label, pct }) => {
                  const kb = Math.round((fileSizeBytes * pct) / 1024);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => pickPct(pct)}
                      className="flex flex-col items-center rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted hover:border-foreground/30 transition-colors min-w-[58px]"
                    >
                      <span className="font-semibold">{label}</span>
                      <span className="text-muted-foreground">{formatSize(kb * 1024)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom size input */}
          <div className="space-y-1.5">
            <Label>Custom target size</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="1"
                value={targetValue}
                onChange={(e) => {
                  setTargetValue(e.target.value);
                  emitTarget(e.target.value, unit);
                }}
                className="w-28"
                placeholder="500"
              />
              <Select
                value={unit}
                onValueChange={(v) => {
                  const u = v as "KB" | "MB";
                  setUnit(u);
                  emitTarget(targetValue, u);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KB">KB</SelectItem>
                  <SelectItem value="MB">MB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              We&apos;ll compress to the best quality that fits within your target.
              Highly-compressed or text-only PDFs may not shrink much further.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
