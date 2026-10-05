/* ============================================================
   RotateGate
   On phone-sized screens held in portrait, the card is replaced
   by a quiet "turn your phone" message: the layout is a wide
   business card, and squeezing it into a tall, narrow viewport
   either shrinks the type below readable size or breaks the
   four-corner composition the design depends on.

   Deliberately CSS-only (a media query in globals.css toggles
   this element and .card-flip-stage), not a JS orientation
   check: a JS gate has to wait for hydration, so the wrong view
   would flash on first paint. It also means this still behaves
   correctly with JS disabled.

   Scoped to coarse-pointer, phone-width screens only, so a narrow
   desktop window or a tablet is never gated.
   ============================================================ */
export function RotateGate() {
  return (
    <div className="rotate-gate">
      <p className="rotate-gate-mark small-caps deboss">IP</p>
      <p className="rotate-gate-text small-caps">Please turn your phone sideways</p>
      <p className="rotate-gate-sub">This card is laid out to be read in landscape.</p>
    </div>
  );
}
