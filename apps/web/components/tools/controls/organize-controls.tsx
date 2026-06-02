"use client";

import { useEffect, useState } from "react";
import { GripVertical, Trash2, RotateCw, RefreshCw, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageItem {
  id: string;
  originalPageNumber: number;
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270 degrees
}

interface OrganizeControlsProps {
  file: File;
  onChange: (order: number[]) => void;
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

export function OrganizeControls({ file, onChange }: OrganizeControlsProps) {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderingProgress, setRenderingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);
        setRenderingProgress(0);

        // 1. Dynamically load PDF.js from secure CDN
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("PDF.js library failed to load");
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        // 2. Read array buffer and parse PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        const items: PageItem[] = [];
        for (let i = 1; i <= numPages; i++) {
          if (!active) return;
          const page = await pdf.getPage(i);
          
          // Render at lower scale for preview size to optimize memory & performance
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            items.push({
              id: `page-${i}-${Date.now()}`,
              originalPageNumber: i,
              dataUrl,
              rotation: 0,
            });
            setRenderingProgress(Math.round((i / numPages) * 100));
          }
        }

        if (active) {
          setPages(items);
          onChange(items.map((p) => p.originalPageNumber));
        }
      } catch (err: any) {
        console.error("PDF preview rendering error:", err);
        setError("Unable to render page previews. You can still process and organize the file normally.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPdf();
    return () => {
      active = false;
    };
  }, [file]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // For smooth visual dragging in Firefox
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPages = [...pages];
    const [draggedItem] = newPages.splice(draggedIndex, 1);
    newPages.splice(index, 0, draggedItem);

    setPages(newPages);
    setDraggedIndex(null);
    onChange(newPages.map((p) => p.originalPageNumber));
  };

  const handleDelete = (index: number) => {
    const newPages = pages.filter((_, idx) => idx !== index);
    setPages(newPages);
    onChange(newPages.map((p) => p.originalPageNumber));
  };

  const handleRotate = (index: number) => {
    const newPages = [...pages];
    newPages[index].rotation = (newPages[index].rotation + 90) % 360;
    setPages(newPages);
  };

  const handleReset = () => {
    const sorted = [...pages].sort((a, b) => a.originalPageNumber - b.originalPageNumber);
    // Reset all rotations
    sorted.forEach((p) => (p.rotation = 0));
    setPages(sorted);
    onChange(sorted.map((p) => p.originalPageNumber));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 flex flex-col items-center justify-center min-h-64 text-center">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="font-semibold text-sm">Rendering PDF Page Previews...</p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
          Reading document structure and preparing visual thumbnails ({renderingProgress}%)
        </p>
        <div className="w-48 bg-muted-foreground/10 rounded-full h-1.5 mt-4 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${renderingProgress}%` }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/30 dark:border-red-950/20 dark:bg-red-950/5 p-6 flex items-start gap-3.5">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-red-900 dark:text-red-400">Rendering Offline</h4>
          <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1 max-w-md leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3.5">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Organize & Arrange Pages
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag cards to reorder, hover to rotate or delete unwanted pages
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="rounded-lg text-xs"
        >
          Reset Order
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {pages.map((page, index) => {
          const isDragging = draggedIndex === index;
          return (
            <div
              key={page.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative group bg-white/50 dark:bg-slate-900/40 backdrop-blur-xs border rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center cursor-grab active:cursor-grabbing select-none ${
                isDragging
                  ? "border-primary border-dashed opacity-45 scale-95"
                  : "border-border/60 hover:-translate-y-0.5"
              }`}
            >
              {/* Overlay controls */}
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button
                  type="button"
                  onClick={() => handleRotate(index)}
                  className="bg-background/80 hover:bg-background border border-border text-foreground rounded-lg p-1.5 shadow-xs transition-colors hover:text-primary"
                  title="Rotate Page"
                >
                  <RotateCw className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 shadow-xs transition-colors"
                  title="Delete Page"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Drag Handle Indicator */}
              <div className="absolute top-2.5 left-2.5 text-muted-foreground/30 group-hover:text-muted-foreground/75 transition-colors">
                <GripVertical className="h-3.5 w-3.5" />
              </div>

              {/* Preview image with rotation */}
              <div className="w-full aspect-[3/4] flex items-center justify-center overflow-hidden bg-muted/30 rounded-xl border border-muted mt-5">
                <img
                  src={page.dataUrl}
                  alt={`Page ${page.originalPageNumber}`}
                  className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-200"
                  style={{ transform: `rotate(${page.rotation}deg)` }}
                />
              </div>

              {/* Page Number Label */}
              <div className="mt-3 flex items-center justify-between w-full px-1 text-xs">
                <span className="font-bold text-foreground">Page {index + 1}</span>
                <span className="text-muted-foreground font-medium text-[10px] bg-muted px-1.5 py-0.5 rounded-md">
                  Orig: {page.originalPageNumber}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
