"use client";

/* ============================================================
   InkSpatter
   Deep-red spatters overlaid on the front screen, as if flicked
   onto the paper: a few larger irregular blobs with thin drips,
   surrounded by a scatter of fine mist droplets, closer to a
   real splatter than clean geometric circles. Purely visual: no
   text, sound, or hint attached. Fixed per mount (not
   re-randomized every render) so the same pattern appears each
   time the egg is active. Instant under reduced motion (no
   fade-in transition to skip; there isn't one to begin with).
   ============================================================ */

// A handful of main blobs, each with a cluster of small satellite droplets
// and a thin drip tail, positioned and sized by hand to read as irregular
// rather than a grid or a perfectly even scatter.
const BLOBS = [
  { cx: 28, cy: 22, r: 3.8, drip: { dx: -1, dy: 14, width: 1.1 } },
  { cx: 62, cy: 68, r: 3.2, drip: { dx: 2, dy: 11, width: 0.9 } },
  { cx: 78, cy: 30, r: 2.6, drip: { dx: 1, dy: 9, width: 0.7 } },
  { cx: 45, cy: 82, r: 2.2, drip: { dx: -1.5, dy: 8, width: 0.6 } },
];

// Fine mist: many small dots scattered around each blob, sizes and offsets
// fixed at module scope so the pattern is stable across renders.
function mistFor(cx: number, cy: number, seed: number) {
  const dots = [];
  for (let i = 0; i < 14; i++) {
    // Deterministic pseudo-scatter (no Math.random at render time): derive
    // an offset from the index and a per-blob seed so it's fixed, not
    // regenerated on every re-render.
    const angle = (i * 47 + seed * 13) % 360;
    const dist = 4 + ((i * 7 + seed * 5) % 16);
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * dist;
    const dy = Math.sin(rad) * dist * 0.7;
    const size = 0.3 + ((i * 3 + seed) % 5) * 0.15;
    dots.push({ x: cx + dx, y: cy + dy, r: size });
  }
  return dots;
}

export function InkSpatter() {
  return (
    <div className="ink-spatter-layer" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ink-spatter-svg">
        {BLOBS.map((b, i) => (
          <g key={i}>
            {/* Main blob: an irregular blotch built from overlapping circles,
                not a perfect circle. */}
            <circle cx={b.cx} cy={b.cy} r={b.r} className="ink-spatter-blob" />
            <circle cx={b.cx + b.r * 0.5} cy={b.cy - b.r * 0.3} r={b.r * 0.55} className="ink-spatter-blob" />
            <circle cx={b.cx - b.r * 0.4} cy={b.cy + b.r * 0.4} r={b.r * 0.45} className="ink-spatter-blob" />
            {/* Drip tail. */}
            <path
              d={`M ${b.cx} ${b.cy + b.r * 0.7} q ${b.drip.dx} ${b.drip.dy * 0.5} ${b.drip.dx * 1.5} ${b.drip.dy}`}
              className="ink-spatter-drip"
              style={{ strokeWidth: b.drip.width }}
            />
            {/* Fine mist scatter around this blob. */}
            {mistFor(b.cx, b.cy, i).map((d, j) => (
              <circle key={j} cx={d.x} cy={d.y} r={d.r} className="ink-spatter-mist" />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
