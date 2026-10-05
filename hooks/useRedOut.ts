"use client";

import { useState } from "react";

/* ============================================================
   useRedOut
   3 clicks on the corner trigger toggles the full-screen red
   overlay. The next click after activation resets it. Click
   count and active state are kept in one object, updated through
   a single functional setState call, so rapid, synchronously-
   dispatched clicks in the same event batch each still see the
   latest count rather than reading a stale value captured before
   the batch started.
   ============================================================ */
export function useRedOut() {
  const [state, setState] = useState({ active: false, clicks: 0 });

  function trigger() {
    setState((prev) => {
      if (prev.active) {
        return { active: false, clicks: 0 };
      }
      const next = prev.clicks + 1;
      if (next >= 3) {
        return { active: true, clicks: 0 };
      }
      return { active: false, clicks: next };
    });
  }

  return { active: state.active, trigger };
}
