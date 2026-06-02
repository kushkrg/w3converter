"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PenLine, Type, ImageIcon, Trash2, Undo2, Upload, X, MapPin, User } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const INK_COLORS = [
  { label: "Black",  hex: "#1a1a1a" },
  { label: "Navy",   hex: "#1e3a5f" },
  { label: "Indigo", hex: "#3730a3" },
  { label: "Forest", hex: "#14532d" },
  { label: "Ruby",   hex: "#7f1d1d" },
];

const SCRIPT_FONTS = [
  { id: "dancing", name: "Dancing Script", css: "'Dancing Script', cursive" },
  { id: "caveat",  name: "Caveat",         css: "'Caveat', cursive" },
  { id: "great",   name: "Great Vibes",    css: "'Great Vibes', cursive" },
  { id: "pacifico",name: "Pacifico",       css: "'Pacifico', cursive" },
];

const H_POSITIONS = [
  { id: "left",   label: "Left",   xPct: 5  },
  { id: "center", label: "Center", xPct: 30 },
  { id: "right",  label: "Right",  xPct: 58 },
];

const SIZES = [
  { id: "sm", label: "S", widthPct: 20 },
  { id: "md", label: "M", widthPct: 32 },
  { id: "lg", label: "L", widthPct: 45 },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SignatureParams {
  page: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  signerName: string;
  includeDate: boolean;
  signerDate: string;
  showLine: boolean;
}

interface SignatureControlsProps {
  onChange: (p: SignatureParams) => void;
  onSignatureFile: (f: File | null) => void;
}

interface Stroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SignatureControls({ onChange, onSignatureFile }: SignatureControlsProps) {
  // Stable refs for callbacks — avoids infinite loops when parent creates new
  // inline functions on every render (which would otherwise trigger useEffects
  // whose dep arrays include these callbacks).
  const onChangeRef        = useRef(onChange);
  const onSignatureFileRef = useRef(onSignatureFile);
  useEffect(() => { onChangeRef.current        = onChange;        });
  useEffect(() => { onSignatureFileRef.current = onSignatureFile; });

  const [tab, setTab] = useState<"draw" | "type" | "upload">("draw");

  // Draw state
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const isDrawingRef   = useRef(false);
  const strokesRef     = useRef<Stroke[]>([]);
  const currStrokeRef  = useRef<Array<{ x: number; y: number }>>([]);
  const [inkColor,  setInkColor]  = useState(INK_COLORS[0]!.hex);
  const [penWidth,  setPenWidth]  = useState(2.5);
  const [hasDrawing, setHasDrawing] = useState(false);

  // Type state
  const [typedText,     setTypedText]     = useState("");
  const [selectedFont,  setSelectedFont]  = useState(SCRIPT_FONTS[0]!.id);
  const [typedColor,    setTypedColor]    = useState(INK_COLORS[0]!.hex);

  // Upload state
  const [uploadedFile,  setUploadedFile]  = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Placement state
  const [page,   setPage]   = useState(1);
  const [hPos,   setHPos]   = useState("right");
  const [yPct,   setYPct]   = useState(75);
  const [sizeId, setSizeId] = useState("md");

  // Signer details
  const [signerName,   setSignerName]   = useState("");
  const [includeDate,  setIncludeDate]  = useState(true);
  const [signerDate,   setSignerDate]   = useState(new Date().toISOString().slice(0, 10));
  const [showLine,     setShowLine]     = useState(true);

  // Load Google Fonts once for the Type tab preview
  useEffect(() => {
    const id = "signature-script-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id   = id;
      link.rel  = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Caveat:wght@600&family=Great+Vibes&family=Pacifico&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Emit placement / signer params whenever they change.
  // onChange is intentionally excluded from deps — we call it via ref so that
  // a new inline function from the parent never triggers this effect.
  const emitParams = useCallback(() => {
    const h = H_POSITIONS.find((p) => p.id === hPos) ?? H_POSITIONS[2]!;
    const s = SIZES.find((p) => p.id === sizeId) ?? SIZES[1]!;
    onChangeRef.current({ page, xPct: h.xPct, yPct, widthPct: s.widthPct, signerName, includeDate, signerDate, showLine });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hPos, yPct, sizeId, signerName, includeDate, signerDate, showLine]);

  useEffect(() => { emitParams(); }, [emitParams]);

  // Reset signature when switching tabs
  useEffect(() => {
    onSignatureFileRef.current(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    strokesRef.current = [];
    currStrokeRef.current = [];
    setHasDrawing(false);
    setTypedText("");
    setUploadedFile(null);
    setUploadPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Canvas drawing ──────────────────────────────────────────────────────────

  function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }

  function applyCtx(ctx: CanvasRenderingContext2D, color: string, width: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = width;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    currStrokeRef.current = [pt];
    const ctx = canvasRef.current!.getContext("2d")!;
    applyCtx(ctx, inkColor, penWidth * 2);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    const pt     = getCanvasPoint(e);
    const stroke = currStrokeRef.current;
    stroke.push(pt);

    applyCtx(ctx, inkColor, penWidth * 2);

    if (stroke.length < 3) {
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      return;
    }

    // Smooth via midpoint quadratic bezier
    const prev = stroke[stroke.length - 2]!;
    const mid  = { x: (prev.x + pt.x) / 2, y: (prev.y + pt.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
    ctx.stroke();
  }

  function onPointerUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    strokesRef.current.push({ points: [...currStrokeRef.current], color: inkColor, width: penWidth });
    currStrokeRef.current = [];
    setHasDrawing(true);
    exportDrawing();
  }

  function redrawStrokes() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) {
      if (!stroke.points.length) continue;
      applyCtx(ctx, stroke.color, stroke.width * 2);
      ctx.beginPath();
      ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p1  = stroke.points[i - 1]!;
        const p2  = stroke.points[i]!;
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
      }
      ctx.stroke();
    }
  }

  function undoStroke() {
    if (!strokesRef.current.length) return;
    strokesRef.current.pop();
    redrawStrokes();
    if (!strokesRef.current.length) {
      setHasDrawing(false);
      onSignatureFileRef.current(null);
    } else {
      exportDrawing();
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current    = [];
    currStrokeRef.current = [];
    setHasDrawing(false);
    onSignatureFileRef.current(null);
  }

  function exportDrawing() {
    canvasRef.current?.toBlob((blob) => {
      if (blob) onSignatureFileRef.current(new File([blob], "signature.png", { type: "image/png" }));
    }, "image/png");
  }

  // ── Typed signature export ──────────────────────────────────────────────────

  // onSignatureFile is intentionally excluded — we call it via ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const exportTyped = useCallback(async () => {
    if (!typedText.trim()) { onSignatureFileRef.current(null); return; }
    const font     = SCRIPT_FONTS.find((f) => f.id === selectedFont)!;
    const fontSize = 80;
    try { await document.fonts.load(`600 ${fontSize}px ${font.css}`); } catch { /* proceed */ }

    const tmp = document.createElement("canvas");
    const tc  = tmp.getContext("2d")!;
    tc.font   = `600 ${fontSize}px ${font.css}`;
    const metrics = tc.measureText(typedText);
    const PAD = 24;
    tmp.width  = Math.ceil(metrics.width) + PAD * 2;
    tmp.height = Math.ceil(fontSize * 1.35) + PAD;

    const ctx = tmp.getContext("2d")!;
    ctx.clearRect(0, 0, tmp.width, tmp.height);
    ctx.font          = `600 ${fontSize}px ${font.css}`;
    ctx.fillStyle     = typedColor;
    ctx.textBaseline  = "top";
    ctx.fillText(typedText, PAD, PAD * 0.4);

    tmp.toBlob((blob) => {
      if (blob) onSignatureFileRef.current(new File([blob], "signature.png", { type: "image/png" }));
    }, "image/png");
  }, [typedText, selectedFont, typedColor]);

  useEffect(() => {
    if (tab !== "type") return;
    const t = setTimeout(() => { void exportTyped(); }, 350);
    return () => clearTimeout(t);
  }, [tab, typedText, selectedFont, typedColor, exportTyped]);

  // ── Upload handlers ─────────────────────────────────────────────────────────

  function acceptImageFile(file: File) {
    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));
    onSignatureFileRef.current(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptImageFile(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) acceptImageFile(f);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const selectedFontCSS = SCRIPT_FONTS.find((f) => f.id === selectedFont)?.css ?? SCRIPT_FONTS[0]!.css;

  return (
    <div className="space-y-5">

      {/* ── Signature Pad ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">

        {/* Tab bar */}
        <div className="flex border-b border-border bg-muted/20">
          {(["draw", "type", "upload"] as const).map((t) => {
            const Icon = t === "draw" ? PenLine : t === "type" ? Type : ImageIcon;
            const label = t === "draw" ? "Draw" : t === "type" ? "Type" : "Upload";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors flex-1 justify-center",
                  tab === t
                    ? "bg-background text-foreground border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Draw tab ──────────────────────────────────────────────────────── */}
        {tab === "draw" && (
          <div className="p-4 space-y-3">
            {/* Canvas */}
            <div className="relative rounded-lg border-2 border-dashed border-border bg-[#fafaf8] overflow-hidden">
              <canvas
                ref={canvasRef}
                width={880}
                height={300}
                className="w-full h-[150px] block touch-none"
                style={{ cursor: "crosshair" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />
              {!hasDrawing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
                  <PenLine className="h-5 w-5 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground/50">Draw your signature here</p>
                </div>
              )}
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Ink color */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Ink:</span>
                  {INK_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      title={c.label}
                      onClick={() => setInkColor(c.hex)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        inkColor === c.hex ? "border-primary scale-125 shadow-sm" : "border-transparent hover:border-muted-foreground/30"
                      )}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>

                {/* Pen width */}
                <div className="flex gap-1">
                  {([1.5, 2.5, 3.5] as const).map((w, i) => (
                    <button
                      key={w}
                      onClick={() => setPenWidth(w)}
                      title={["Thin", "Medium", "Thick"][i]}
                      className={cn(
                        "w-7 h-7 rounded-md border flex items-center justify-center transition-all",
                        penWidth === w ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div
                        className="rounded-full bg-foreground"
                        style={{ width: 3 + i * 2, height: 3 + i * 2 }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={undoStroke} disabled={!hasDrawing} className="h-7 px-2 text-xs">
                  <Undo2 className="h-3.5 w-3.5 mr-1" /> Undo
                </Button>
                <Button variant="ghost" size="sm" onClick={clearCanvas} disabled={!hasDrawing} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Type tab ──────────────────────────────────────────────────────── */}
        {tab === "type" && (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type your name or initials</Label>
              <Input
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="e.g. John Doe"
                className="text-base h-10"
                autoFocus
              />
            </div>

            {/* Font picker */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Font style</Label>
              <div className="grid grid-cols-2 gap-2">
                {SCRIPT_FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFont(f.id)}
                    className={cn(
                      "px-3 py-3 rounded-lg border text-left transition-all overflow-hidden leading-none",
                      selectedFont === f.id
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border hover:border-primary/40"
                    )}
                    style={{ fontFamily: f.css, fontSize: "1.5rem" }}
                  >
                    {typedText || f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ink color for typed */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Color:</span>
              {INK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => setTypedColor(c.hex)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    typedColor === c.hex ? "border-primary scale-125 shadow-sm" : "border-transparent hover:border-muted-foreground/30"
                  )}
                  style={{ background: c.hex }}
                />
              ))}
            </div>

            {/* Preview */}
            {typedText && (
              <div className="rounded-lg bg-[#fafaf8] border border-border px-5 py-3 flex items-center justify-center min-h-[70px]">
                <span
                  style={{ fontFamily: selectedFontCSS, fontSize: "2.2rem", color: typedColor, lineHeight: 1.2 }}
                >
                  {typedText}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Upload tab ────────────────────────────────────────────────────── */}
        {tab === "upload" && (
          <div className="p-4">
            {uploadPreview ? (
              <div className="space-y-3">
                <div className="relative rounded-lg border border-border bg-[#fafaf8] p-4 flex items-center justify-center min-h-[110px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadPreview} alt="signature" className="max-h-24 max-w-full object-contain" />
                  <button
                    onClick={() => { setUploadedFile(null); setUploadPreview(null); onSignatureFileRef.current(null); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">{uploadedFile?.name}</p>
              </div>
            ) : (
              <div
                className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-10 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="text-sm font-medium">Upload your signature image</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PNG with transparent background works best</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}
      </div>

      {/* ── Placement ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 bg-muted/30 rounded-t-xl">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Placement</h3>
        </div>
        <div className="p-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Page number</Label>
              <Input
                type="number"
                min={1}
                value={page}
                onChange={(e) => setPage(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Signature size</Label>
              <div className="flex gap-1">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSizeId(s.id)}
                    className={cn(
                      "flex-1 h-9 rounded-md border text-sm font-semibold transition-colors",
                      sizeId === s.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Horizontal position</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {H_POSITIONS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHPos(h.id)}
                  className={cn(
                    "py-2 rounded-md border text-sm font-medium transition-colors",
                    hPos === h.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Vertical position</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{yPct}% from top</span>
            </div>
            <input
              type="range"
              min={5}
              max={92}
              value={yPct}
              onChange={(e) => setYPct(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Top</span>
              <span>Bottom</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Signer Details ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 bg-muted/30 rounded-t-xl">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Signer Details</h3>
        </div>
        <div className="p-5 space-y-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name (optional — shown below signature)</Label>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="e.g. Jane Smith, Director"
              className="h-9"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDate}
                onChange={(e) => setIncludeDate(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Include date</span>
            </label>
            {includeDate && (
              <Input
                type="date"
                value={signerDate}
                onChange={(e) => setSignerDate(e.target.value)}
                className="h-8 w-auto text-sm"
              />
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showLine}
              onChange={(e) => setShowLine(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show signature line</span>
          </label>
        </div>
      </div>

    </div>
  );
}
