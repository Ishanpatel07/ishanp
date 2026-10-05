"use client";

import { createContext, useContext } from "react";
import { useRedOut } from "@/hooks/useRedOut";
import { RedOut } from "@/components/RedOut";

/* ============================================================
   EasterEggProvider
   Single mount point for all easter-egg state (currently just
   the red-out toggle). Renders the overlay itself, once, so
   there's no duplicate DOM regardless of how many components
   read from this context.
   ============================================================ */

interface EasterEggContextValue {
  redOut: ReturnType<typeof useRedOut>;
}

const EasterEggContext = createContext<EasterEggContextValue | null>(null);

export function useEasterEggs() {
  const ctx = useContext(EasterEggContext);
  if (!ctx) throw new Error("useEasterEggs must be used inside EasterEggProvider");
  return ctx;
}

export function EasterEggProvider({ children }: { children: React.ReactNode }) {
  const redOut = useRedOut();

  return (
    <EasterEggContext.Provider value={{ redOut }}>
      {children}
      {redOut.active && <RedOut />}
    </EasterEggContext.Provider>
  );
}
