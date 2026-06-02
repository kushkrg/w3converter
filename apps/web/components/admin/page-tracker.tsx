"use client";

import { useEffect, useRef } from "react";
import { trackPageView } from "@/app/admin/track-pageview";

export function PageTracker({ toolId }: { toolId: string }) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void trackPageView(toolId);
  }, [toolId]);
  return null;
}
