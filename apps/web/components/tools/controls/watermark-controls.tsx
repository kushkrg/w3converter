"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Upload, X, Type, Image as ImageIcon, ArrowUpRight, Info } from "lucide-react";

export type WatermarkMode = "text" | "logo" | "diagonal";
export type WatermarkPlacement = "center" | "tile";

export interface WatermarkParams {
  type: WatermarkMode;
  // text / diagonal
  text?: string;
  fontSize?: number;
  color?: string;
  // logo
  logoSizePct?: number;
  // common
  opacity?: number;
  placement?: WatermarkPlacement;
  repeat?: boolean; // diagonal only
}

interface WatermarkControlsProps {
  onChange: (params: WatermarkParams) => void;
  onLogoFile: (file: File | null) => void;
}

const PRESET_TEXTS = ["CONFIDENTIAL", "DRAFT", "SAMPLE", "COPY", "VOID"];
const PRESET_COLORS = [
  { label: "Gray",    hex: "#9ca3af" },
  { label: "Red",     hex: "#ef4444" },
  { label: "Blue",    hex: "#3b82f6" },
  { label: "Black",   hex: "#111827" },
  { label: "Orange",  hex: "#f97316" },
];

function RangeRow({
  label,
  min,
  max,
  step = 1,
  value,
  unit,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-border cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function ColorRow({
  color,
  onChange,
}: {
  color: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Color</Label>
      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.label}
            onClick={() => onChange(c.hex)}
            className={cn(
              "w-6 h-6 rounded-full border-2 transition-all",
              color === c.hex ? "border-foreground scale-110" : "border-transparent hover:border-muted-foreground/40"
            )}
            style={{ backgroundColor: c.hex }}
          />
        ))}
        {/* Custom color picker */}
        <label className="relative w-6 h-6 rounded-full border-2 border-dashed border-border cursor-pointer hover:border-muted-foreground/60 transition-colors overflow-hidden" title="Custom color">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: !PRESET_COLORS.some(c => c.hex === color) ? color : "transparent" }}
          />
          {PRESET_COLORS.some(c => c.hex === color) && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">+</span>
          )}
        </label>
      </div>
    </div>
  );
}

function PlacementRow({
  value,
  onChange,
}: {
  value: WatermarkPlacement;
  onChange: (v: WatermarkPlacement) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Position</Label>
      <div className="flex gap-2">
        {(["center", "tile"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors",
              value === p
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            {p === "center" ? "Center" : "Tiled"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WatermarkControls({ onChange, onLogoFile }: WatermarkControlsProps) {
  const [mode, setMode] = useState<WatermarkMode>("text");

  // text / diagonal state
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#9ca3af");
  const [opacity, setOpacity] = useState(30);
  const [placement, setPlacement] = useState<WatermarkPlacement>("center");

  // diagonal extras
  const [repeat, setRepeat] = useState(true);
  const [diagFontSize, setDiagFontSize] = useState(64);
  const [diagOpacity, setDiagOpacity] = useState(20);
  const [diagColor, setDiagColor] = useState("#9ca3af");
  const [diagText, setDiagText] = useState("CONFIDENTIAL");

  // logo state
  const [logoFile, setLogoFileState] = useState<File | null>(null);
  const [logoSizePct, setLogoSizePct] = useState(30);
  const [logoOpacity, setLogoOpacity] = useState(50);
  const [logoPlacement, setLogoPlacement] = useState<WatermarkPlacement>("center");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function emit(overrides: Partial<WatermarkParams> = {}) {
    const base: WatermarkParams =
      mode === "text"
        ? { type: "text", text, fontSize, color, opacity: opacity / 100, placement }
        : mode === "diagonal"
        ? { type: "diagonal", text: diagText, fontSize: diagFontSize, color: diagColor, opacity: diagOpacity / 100, repeat }
        : { type: "logo", logoSizePct, opacity: logoOpacity / 100, placement: logoPlacement };
    onChange({ ...base, ...overrides });
  }

  function switchMode(m: WatermarkMode) {
    setMode(m);
    // emit with new mode immediately
    if (m === "text") onChange({ type: "text", text, fontSize, color, opacity: opacity / 100, placement });
    else if (m === "diagonal") onChange({ type: "diagonal", text: diagText, fontSize: diagFontSize, color: diagColor, opacity: diagOpacity / 100, repeat });
    else onChange({ type: "logo", logoSizePct, opacity: logoOpacity / 100, placement: logoPlacement });
  }

  const TABS = [
    { id: "text" as WatermarkMode,     icon: Type,       label: "Text" },
    { id: "logo" as WatermarkMode,     icon: ImageIcon,  label: "Logo / Image" },
    { id: "diagonal" as WatermarkMode, icon: ArrowUpRight, label: "Diagonal" },
  ];

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="flex rounded-xl border border-border overflow-hidden w-full">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchMode(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
              mode === id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TEXT ────────────────────────────────────────────── */}
      {mode === "text" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Watermark text</Label>
            <Input
              value={text}
              onChange={(e) => { setText(e.target.value); emit({ text: e.target.value }); }}
              placeholder="e.g. CONFIDENTIAL"
              className="font-mono uppercase tracking-widest"
            />
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PRESET_TEXTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setText(t); emit({ text: t }); }}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                    text === t
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <RangeRow label="Font size" min={16} max={120} value={fontSize} unit="px"
            onChange={(v) => { setFontSize(v); emit({ fontSize: v }); }} />
          <ColorRow color={color}
            onChange={(h) => { setColor(h); emit({ color: h }); }} />
          <RangeRow label="Opacity" min={5} max={100} value={opacity} unit="%"
            onChange={(v) => { setOpacity(v); emit({ opacity: v / 100 }); }} />
          <PlacementRow value={placement}
            onChange={(p) => { setPlacement(p); emit({ placement: p }); }} />
        </div>
      )}

      {/* ── LOGO ────────────────────────────────────────────── */}
      {mode === "logo" && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div>
            <Label className="text-xs mb-1.5 block">Logo file (PNG, JPG, SVG)</Label>
            {logoFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm font-medium truncate">{logoFile.name}</span>
                <button
                  type="button"
                  onClick={() => { setLogoFileState(null); onLogoFile(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors py-6 flex flex-col items-center gap-2 text-muted-foreground"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-4.5 w-4.5" />
                </div>
                <span className="text-sm font-medium">Click to upload logo</span>
                <span className="text-xs">PNG, JPG, JPEG supported</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setLogoFileState(f);
                onLogoFile(f);
                emit();
              }}
            />
          </div>

          <RangeRow label="Logo size (% of page width)" min={5} max={80} value={logoSizePct} unit="%"
            onChange={(v) => { setLogoSizePct(v); emit({ logoSizePct: v }); }} />
          <RangeRow label="Opacity" min={5} max={100} value={logoOpacity} unit="%"
            onChange={(v) => { setLogoOpacity(v); emit({ opacity: v / 100 }); }} />
          <PlacementRow value={logoPlacement}
            onChange={(p) => { setLogoPlacement(p); emit({ placement: p }); }} />
        </div>
      )}

      {/* ── DIAGONAL ────────────────────────────────────────── */}
      {mode === "diagonal" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Text is placed at a 45° angle across each page for maximum visibility.</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Watermark text</Label>
            <Input
              value={diagText}
              onChange={(e) => { setDiagText(e.target.value); emit({ text: e.target.value }); }}
              placeholder="e.g. DRAFT"
              className="font-mono uppercase tracking-widest"
            />
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PRESET_TEXTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setDiagText(t); emit({ text: t }); }}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                    diagText === t
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <RangeRow label="Font size" min={24} max={150} value={diagFontSize} unit="px"
            onChange={(v) => { setDiagFontSize(v); emit({ fontSize: v }); }} />
          <ColorRow color={diagColor}
            onChange={(h) => { setDiagColor(h); emit({ color: h }); }} />
          <RangeRow label="Opacity" min={5} max={60} value={diagOpacity} unit="%"
            onChange={(v) => { setDiagOpacity(v); emit({ opacity: v / 100 }); }} />

          <div className="space-y-1.5">
            <Label className="text-xs">Repeat</Label>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => { setRepeat(v); emit({ repeat: v }); }}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                    repeat === v
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  {v ? "Tiled (repeat)" : "Single (center)"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
