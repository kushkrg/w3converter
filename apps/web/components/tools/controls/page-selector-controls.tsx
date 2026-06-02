"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PageSelectorControlsProps {
  onChange: (pages: number[]) => void;
}

export function PageSelectorControls({ onChange }: PageSelectorControlsProps) {
  const [value, setValue] = useState("");

  function parse(raw: string): number[] {
    const pages: number[] = [];
    for (const part of raw.split(",")) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [s, e] = trimmed.split("-").map(Number);
        if (s && e) for (let i = s; i <= e; i++) pages.push(i);
      } else {
        const n = parseInt(trimmed, 10);
        if (!isNaN(n)) pages.push(n);
      }
    }
    return [...new Set(pages)].sort((a, b) => a - b);
  }

  return (
    <div className="space-y-2">
      <Label>Page Numbers</Label>
      <Input
        placeholder="e.g. 1, 3, 5-8"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(parse(e.target.value));
        }}
        className="w-64"
      />
      <p className="text-xs text-muted-foreground">
        Enter page numbers separated by commas. Use dash for ranges (e.g. 2-5).
      </p>
    </div>
  );
}
