"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, X, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  disabled?: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  onFiles,
  accept = ".pdf",
  multiple = false,
  maxSizeMb = 100,
  disabled = false,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (incoming: File[]): File[] => {
      const maxBytes = maxSizeMb * 1024 * 1024;
      const valid = incoming.filter((f) => {
        if (f.size > maxBytes) {
          setError(`"${f.name}" exceeds the ${maxSizeMb} MB limit.`);
          return false;
        }
        return true;
      });
      return valid;
    },
    [maxSizeMb]
  );

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      setError(null);
      const arr = Array.from(incoming);
      const valid = validate(arr);
      const next = multiple ? [...files, ...valid] : valid.slice(0, 1);
      setFiles(next);
      onFiles(next);
    },
    [files, multiple, onFiles, validate]
  );

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onFiles(next);
  };

  const acceptLabel = accept.split(",").map((a) => a.replace(".", "").toUpperCase()).join(", ");

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer select-none",
          "transition-all duration-200",
          dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className={cn(
          "mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
          dragging ? "bg-primary/10" : "bg-muted",
        )}>
          <UploadCloud className={cn("h-8 w-8 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
        </div>

        <p className="text-base font-semibold mb-1">
          {dragging ? "Release to upload" : `Drop your file${multiple ? "s" : ""} here`}
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          or{" "}
          <span className="text-primary font-medium underline underline-offset-2 decoration-primary/40">
            click to browse
          </span>
        </p>
        <p className="text-xs text-muted-foreground/70">
          {acceptLabel} · Max {maxSizeMb} MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          <X className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-2.5 text-sm group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="flex-1 truncate font-medium">{file.name}</span>
              <span className="text-muted-foreground text-xs tabular-nums shrink-0">{formatBytes(file.size)}</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
          {multiple && !disabled && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors w-full"
            >
              <Plus className="h-4 w-4" />
              Add more files
            </button>
          )}
        </ul>
      )}
    </div>
  );
}
