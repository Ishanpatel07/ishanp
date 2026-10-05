/* ============================================================
   RedOut
   The full-screen red overlay for the easter egg. pointer-events:
   none keeps every link and button beneath it fully clickable;
   it's purely visual.
   ============================================================ */
export function RedOut() {
  return <div className="red-out-layer" aria-hidden="true" />;
}
