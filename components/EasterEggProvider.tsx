"use client";

import { createContext, useContext } from "react";
import { useBloodSplatter } from "@/hooks/useBloodSplatter";
import { BloodSplatter } from "@/components/BloodSplatter";

/* ============================================================
   EasterEggProvider
   Single mount point for all easter-egg state (currently just
   the blood-splatter toggle). Renders the overlay itself, once,
   so there's no duplicate DOM regardless of how many components
   read from this context.
   ============================================================ */

interface EasterEggContextValue {
  bloodSplatter: ReturnType<typeof useBloodSplatter>;
}

const EasterEggContext = createContext<EasterEggContextValue | null>(null);

export function useEasterEggs() {
  const ctx = useContext(EasterEggContext);
  if (!ctx) throw new Error("useEasterEggs must be used inside EasterEggProvider");
  return ctx;
}

export function EasterEggProvider({ children }: { children: React.ReactNode }) {
  const bloodSplatter = useBloodSplatter();

  return (
    <EasterEggContext.Provider value={{ bloodSplatter }}>
      {children}
      {bloodSplatter.active && <BloodSplatter seed={bloodSplatter.seed} />}
    </EasterEggContext.Provider>
  );
}
