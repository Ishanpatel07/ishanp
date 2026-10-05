"use client";

import { useState } from "react";

/* ============================================================
   RotateGate
   On phone-sized screens held in portrait, the card is replaced
   by a quiet "turn your phone" message: the layout is a wide
   business card, and squeezing it into a tall, narrow viewport
   either shrinks the type below readable size or breaks the
   four-corner composition the design depends on.

   Which view shows is decided in CSS (a media query in
   globals.css toggles this element against .card-flip-stage),
   not a JS orientation check, so the correct view is there on
   first paint with no hydration flash and it still works with
   JS off.

   The escape hatch is the one JS part: someone with rotation
   lock on physically can't turn the page sideways, so "View
   anyway" sets a class on <html> that overrides the gate. The
   link is rendered unconditionally (it's inside an element the
   media query already hides elsewhere), so it costs nothing on
   desktop and is still present if JS fails to load, just inert.
   ============================================================ */
export function RotateGate() {
  const [dismissed, setDismissed] = useState(false);

  function viewAnyway() {
    document.documentElement.classList.add("rotate-gate-dismissed");
    setDismissed(true);
  }

  return (
    <div className="rotate-gate" hidden={dismissed || undefined}>
      <p className="rotate-gate-mark small-caps deboss">IP</p>
      <p className="rotate-gate-text small-caps">Please turn your phone sideways</p>
      <p className="rotate-gate-sub">This card is laid out to be read in landscape.</p>
      <button type="button" className="rotate-gate-anyway card-link" onClick={viewAnyway}>
        View anyway
      </button>
    </div>
  );
}
