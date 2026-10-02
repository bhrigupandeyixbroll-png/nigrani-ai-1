"use client";

import { Eye, Orbit } from "lucide-react";

export function NigraniBrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`nigrani-brand-mark ${compact ? "compact" : ""}`} aria-label="NIGRANI AI watchful eye mark" role="img">
      <span className="brand-orbit orbit-a" />
      <span className="brand-orbit orbit-b" />
      <span className="brand-tricolor" />
      <span className="brand-lens"><Eye size={compact ? 15 : 23} strokeWidth={1.7} /></span>
      <span className="brand-chakra"><Orbit size={compact ? 11 : 16} strokeWidth={1.5} /></span>
      <span className="brand-script">नि</span>
    </div>
  );
}
