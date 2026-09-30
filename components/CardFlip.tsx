"use client";

import { useEffect, useRef, useState } from "react";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";

/* ============================================================
   CardFlip
   Owns the front/back state and the flip mechanics. Both faces
   stay mounted in the DOM at all times (never conditionally
   removed), with aria-hidden toggled on the face not showing, so
   a screen reader can always reach both by moving focus, and
   sighted keyboard/mouse/touch users see the expected animation.

   - Mouse/touch: click "Turn over" / "Turn back".
   - Keyboard: both controls are real <button>s; Enter and Space
     already activate a button natively. After a flip, focus moves
     to the opposite face's own flip control, so a keyboard user
     lands somewhere useful rather than on a now-hidden face.
   - Reduced motion: crossfade (opacity only) instead of the 3D
     rotate, detected via the same matchMedia query the CSS
     backstop uses, so JS and CSS agree.
   ============================================================ */

export function CardFlip() {
  const [showingBack, setShowingBack] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const frontFlipBtnRef = useRef<HTMLButtonElement>(null);
  const backFlipBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    function onChange(e: MediaQueryListEvent) {
      setReducedMotion(e.matches);
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function flipToBack() {
    setShowingBack(true);
    requestAnimationFrame(() => backFlipBtnRef.current?.focus());
  }

  function flipToFront() {
    setShowingBack(false);
    requestAnimationFrame(() => frontFlipBtnRef.current?.focus());
  }

  return (
    <div className="card-flip-stage">
      <div className={`card-flip-inner${showingBack ? " is-flipped" : ""}${reducedMotion ? " is-reduced-motion" : ""}`}>
        <div className="card-face card-face-front" aria-hidden={showingBack}>
          <CardFront flipButtonRef={frontFlipBtnRef} onFlip={flipToBack} inert={showingBack} />
        </div>
        <div className="card-face card-face-back" aria-hidden={!showingBack}>
          <CardBack flipButtonRef={backFlipBtnRef} onFlip={flipToFront} inert={!showingBack} />
        </div>
      </div>
    </div>
  );
}
