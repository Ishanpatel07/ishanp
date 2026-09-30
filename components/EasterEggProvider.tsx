"use client";

import { createContext, useContext } from "react";
import { useInkSpatter } from "@/hooks/useInkSpatter";
import { InkSpatter } from "@/components/InkSpatter";

/* ============================================================
   EasterEggProvider
   Single mount point for all easter-egg state (currently just
   the ink-spatter toggle). Renders the ink-spatter overlay
   itself, once, so there's no duplicate DOM regardless of how
   many components read from this context.
   ============================================================ */

interface EasterEggContextValue {
  inkSpatter: ReturnType<typeof useInkSpatter>;
}

const EasterEggContext = createContext<EasterEggContextValue | null>(null);

export function useEasterEggs() {
  const ctx = useContext(EasterEggContext);
  if (!ctx) throw new Error("useEasterEggs must be used inside EasterEggProvider");
  return ctx;
}

export function EasterEggProvider({ children }: { children: React.ReactNode }) {
  const inkSpatter = useInkSpatter();

  return (
    <EasterEggContext.Provider value={{ inkSpatter }}>
      {children}
      {inkSpatter.active && <InkSpatter seed={inkSpatter.seed} />}
    </EasterEggContext.Provider>
  );
}
