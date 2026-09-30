"use client";

/* ============================================================
   InkSpatter
   Flat, matte, deep-red spatters overlaid on the front screen,
   as if printed onto the paper. 3-5 irregular blob shapes at
   randomized (but fixed per-mount, not re-randomized every
   render) positions, sizes, and rotations. Purely visual: no
   text, sound, or hint attached. Instant under reduced motion
   (no fade-in transition to skip).
   ============================================================ */

interface Spatter {
  top: string;
  left: string;
  size: number;
  rotate: number;
  borderRadius: string;
}

// Fixed at module scope, not regenerated per click, so the same 3-5 spatters
// appear every time the egg is active rather than jumping around.
const SPATTERS: Spatter[] = [
  { top: "18%", left: "22%", size: 46, rotate: 12, borderRadius: "42% 58% 63% 37% / 47% 41% 59% 53%" },
  { top: "62%", left: "14%", size: 30, rotate: -18, borderRadius: "58% 42% 39% 61% / 55% 48% 52% 45%" },
  { top: "30%", left: "78%", size: 38, rotate: 40, borderRadius: "50% 50% 34% 66% / 62% 38% 62% 38%" },
  { top: "72%", left: "70%", size: 52, rotate: -8, borderRadius: "45% 55% 60% 40% / 40% 52% 48% 60%" },
  { top: "45%", left: "48%", size: 22, rotate: 25, borderRadius: "55% 45% 48% 52% / 50% 55% 45% 50%" },
];

export function InkSpatter() {
  return (
    <div className="ink-spatter-layer" aria-hidden="true">
      {SPATTERS.map((s, i) => (
        <div
          key={i}
          className="ink-spatter"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            transform: `rotate(${s.rotate}deg)`,
            borderRadius: s.borderRadius,
          }}
        />
      ))}
    </div>
  );
}
