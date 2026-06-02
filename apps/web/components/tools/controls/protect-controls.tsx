"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ProtectParams {
  userPassword: string;
  ownerPassword?: string;
  allowPrinting: boolean;
  allowCopying: boolean;
}

interface ProtectControlsProps {
  onChange: (params: ProtectParams) => void;
}

export function ProtectControls({ onChange }: ProtectControlsProps) {
  const [params, setParams] = useState<ProtectParams>({
    userPassword: "",
    allowPrinting: true,
    allowCopying: false,
  });

  const update = (patch: Partial<ProtectParams>) => {
    const next = { ...params, ...patch };
    setParams(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>User Password</Label>
        <Input
          type="password"
          placeholder="Password to open the file"
          value={params.userPassword}
          onChange={(e) => update({ userPassword: e.target.value })}
          className="w-64"
        />
      </div>
      <div className="space-y-2">
        <Label>Owner Password (optional)</Label>
        <Input
          type="password"
          placeholder="Password for full permissions"
          value={params.ownerPassword ?? ""}
          onChange={(e) => update({ ownerPassword: e.target.value })}
          className="w-64"
        />
      </div>
      <div className="space-y-2">
        <Label>Permissions</Label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={params.allowPrinting}
            onCheckedChange={(v) => update({ allowPrinting: !!v })}
          />
          Allow printing
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={params.allowCopying}
            onCheckedChange={(v) => update({ allowCopying: !!v })}
          />
          Allow copying text
        </label>
      </div>
    </div>
  );
}
