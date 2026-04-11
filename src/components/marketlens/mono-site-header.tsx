"use client";

import { ReactNode } from "react";
import { Lock } from "lucide-react";

type MonoSiteHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

// Adapted from ui-main dashboard site-header structure.
export function MonoSiteHeader({ title, subtitle, actions }: MonoSiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-wide text-white">{title}</h1>
          {subtitle ? <p className="truncate text-xs text-white/60">{subtitle}</p> : null}
        </div>

        <div className="ml-2 inline-flex items-center gap-1 border border-white/20 bg-white/[0.04] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/80">
          <Lock className="h-3 w-3" />
          Private Simulation
        </div>

        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}

