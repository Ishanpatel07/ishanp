"use client";

import { useState } from "react";

/* ============================================================
   useBloodSplatter
   3 clicks on the corner trigger toggles the blood-splatter
   overlay. The next click after activation resets it. Click
   count and active state are kept in one object, updated through
   a single functional setState call, so rapid, synchronously-
   dispatched clicks in the same event batch each still see the
   latest count rather than reading a stale value captured before
   the batch started.

   `seed` increments on every activation, so each trigger renders
   a different splatter pattern (BloodSplatter derives all its
   randomness from this one number, deterministically, so the
   pattern is stable for the lifetime of one activation but
   different from the last one).
   ============================================================ */
export function useBloodSplatter() {
  const [state, setState] = useState({ active: false, clicks: 0, seed: 1 });

  function trigger() {
    setState((prev) => {
      if (prev.active) {
        return { active: false, clicks: 0, seed: prev.seed };
      }
      const next = prev.clicks + 1;
      if (next >= 3) {
        return { active: true, clicks: 0, seed: prev.seed + 1 };
      }
      return { active: false, clicks: next, seed: prev.seed };
    });
  }

  return { active: state.active, seed: state.seed, trigger };
}
