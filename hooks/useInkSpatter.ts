"use client";

import { useState } from "react";

/* ============================================================
   useInkSpatter
   3 clicks on the corner trigger toggles the ink-spatter effect
   on the front screen. The next click after activation resets
   it. Click count and active state are kept in one object,
   updated through a single functional setState call, so rapid,
   synchronously-dispatched clicks in the same event batch each
   still see the latest count rather than reading a stale value
   captured before the batch started.
   ============================================================ */
export function useInkSpatter() {
  const [state, setState] = useState({ active: false, clicks: 0 });

  function trigger() {
    setState((prev) => {
      if (prev.active) {
        return { active: false, clicks: 0 };
      }
      const next = prev.clicks + 1;
      return next >= 3 ? { active: true, clicks: 0 } : { active: false, clicks: next };
    });
  }

  return { active: state.active, trigger };
}
