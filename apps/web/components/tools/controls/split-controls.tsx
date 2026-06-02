"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SplitControlsProps {
  onChange: (ranges: string[]) => void;
}

export function SplitControls({ onChange }: SplitControlsProps) {
  const [value, setValue] = useState("1-3, 4-6");

  return (
    <div className="space-y-2">
      <Label>Split Ranges</Label>
      <Input
        placeholder="e.g. 1-3, 4-6, 7"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
        className="w-64"
      />
      <p className="text-xs text-muted-foreground">
        Each comma-separated value becomes a separate output file.
      </p>
    </div>
  );
}
