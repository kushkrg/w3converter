"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface UnlockControlsProps {
  onChange: (password: string) => void;
}

export function UnlockControls({ onChange }: UnlockControlsProps) {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <Label>PDF Password</Label>
      <Input
        type="password"
        placeholder="Enter the current password"
        value={value}
        onChange={(e) => { setValue(e.target.value); onChange(e.target.value); }}
        className="w-64"
      />
    </div>
  );
}
