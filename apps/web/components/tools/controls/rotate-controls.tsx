"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RotateControlsProps {
  onChange: (angle: 90 | 180 | 270) => void;
}

export function RotateControls({ onChange }: RotateControlsProps) {
  const [angle, setAngle] = useState<90 | 180 | 270>(90);

  return (
    <div className="space-y-2">
      <Label>Rotation Angle</Label>
      <Select
        value={String(angle)}
        onValueChange={(v) => {
          const a = Number(v) as 90 | 180 | 270;
          setAngle(a);
          onChange(a);
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="90">90° Clockwise</SelectItem>
          <SelectItem value="180">180°</SelectItem>
          <SelectItem value="270">270° Clockwise</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
