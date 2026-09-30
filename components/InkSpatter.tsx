"use client";

import { useEffect, useMemo, useState } from "react";

/* ============================================================
   InkSpatter

   Procedural SVG blood splatter (Option A from the user's spec,
   chosen over pre-made PNG textures): no external assets to
   source or license, extends the existing SVG-based approach
   already in place, gives full control over seeded randomness
   and over keeping clear of the name/focus-line/link-row text,
   and SVG filters composite cheaply compared to decoding and
   transforming multiple raster images on a phone.

   Built to the user's real-blood-behavior spec:
   - Impact splats: irregular jagged blobs (randomized closed
     path, distorted further by feTurbulence/feDisplacementMap),
     darkest near-black maroon at the core fading to a lighter
     red at the edges (radial gradient), with a soft specular
     highlight on the largest splats (feSpecularLighting).
   - Satellite droplets: many small drops per splat, shrinking
     and thinning out with distance from the impact point;
     distant drops are elongated with a tail pointing away from
     the impact center, consistently per splat.
   - Cast-off streaks: a couple of thin tapering flung lines with
     droplets breaking off along their length.
   - Drips: 2-3 of the larger splats grow a thin drip ending in a
     rounded bead, animated sliding down over ~1.5s; instant
     (final state, no animation) under reduced motion.
   - Paper interaction: multiply blend mode plus a faint feathered
     edge (feGaussianBlur underlay) so it reads as soaked into
     the stock, not pasted on top of it.

   All randomness is derived from `seed` (deterministically, via
   a small seeded PRNG below), so the pattern is different every
   time the egg activates but stable for that activation's
   lifetime, not re-randomized on every render/re-render.

   Layout safety: every splat's center is drawn only from a set of
   pre-vetted anchor points that sit in the empty margins of the
   card (never over the name, focus line, or link row), each with
   a max reach radius, so no amount of random jitter can grow a
   splat over the readable text. pointer-events: none on the
   whole layer keeps every link fully clickable regardless.
   ============================================================ */

// ---- Seeded PRNG (mulberry32): deterministic, fast, no dependency. ----
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Anchor points in percentage-of-viewport coordinates, chosen to sit in the
// card's empty margins (top corners area, side gutters, lower-mid area away
// from the link row) so splats never grow over the name/focus-line/links.
const ANCHORS = [
  { x: 14, y: 16, maxReach: 9 },
  { x: 86, y: 20, maxReach: 8 },
  { x: 10, y: 78, maxReach: 8 },
  { x: 90, y: 72, maxReach: 9 },
  { x: 15, y: 48, maxReach: 6 },
  { x: 85, y: 48, maxReach: 6 },
];

// Rectangular no-go zones (percentage-of-viewport coordinates), each with
// margin around a piece of real text: the center block (name, focus line),
// the link row, and both top corners (email; university + major). Splats
// only ever grow from ANCHORS (already placed outside all of these by
// design), but streaks travel in an arbitrary direction and length, so
// every streak's line segment is tested against every zone here and
// re-rolled if it would cross any of them. This is the actual mechanism
// that enforces "never covers the name, the focus line, or the link row
// enough to hurt readability" for streaks, not just splats. An earlier pass
// only excluded the center block and missed the top corners, which a
// screenshot caught: fixed by listing every text region explicitly instead
// of one box.
const SAFE_ZONES = [
  { x1: 24, y1: 34, x2: 76, y2: 62 }, // name + focus line
  { x1: 30, y1: 78, x2: 70, y2: 92 }, // link row
  { x1: 2, y1: 8, x2: 34, y2: 18 }, // email, top-left
  { x1: 66, y1: 6, x2: 98, y2: 20 }, // university + major, top-right
];

function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: { x1: number; y1: number; x2: number; y2: number }
): boolean {
  // If either endpoint is inside the rect, that's an intersection.
  const inside = (x: number, y: number) => x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2;
  if (inside(x1, y1) || inside(x2, y2)) return true;

  // Check the segment against each of the rect's 4 edges.
  function segmentsIntersect(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
    function cross(ox: number, oy: number, px: number, py: number, qx: number, qy: number) {
      return (px - ox) * (qy - oy) - (py - oy) * (qx - ox);
    }
    const d1 = cross(cx, cy, dx, dy, ax, ay);
    const d2 = cross(cx, cy, dx, dy, bx, by);
    const d3 = cross(ax, ay, bx, by, cx, cy);
    const d4 = cross(ax, ay, bx, by, dx, dy);
    return d1 * d2 < 0 && d3 * d4 < 0;
  }

  const { x1: rx1, y1: ry1, x2: rx2, y2: ry2 } = rect;
  return (
    segmentsIntersect(x1, y1, x2, y2, rx1, ry1, rx2, ry1) ||
    segmentsIntersect(x1, y1, x2, y2, rx2, ry1, rx2, ry2) ||
    segmentsIntersect(x1, y1, x2, y2, rx2, ry2, rx1, ry2) ||
    segmentsIntersect(x1, y1, x2, y2, rx1, ry2, rx1, ry1)
  );
}

function segmentIntersectsAnySafeZone(x1: number, y1: number, x2: number, y2: number): boolean {
  return SAFE_ZONES.some((zone) => segmentIntersectsRect(x1, y1, x2, y2, zone));
}

interface Splat {
  id: number;
  cx: number;
  cy: number;
  scale: number;
  rotation: number;
  pathD: string;
  hasDrip: boolean;
  dripAngle: number;
  hasSpecular: boolean;
  filterSeed: number;
  droplets: { x: number; y: number; rx: number; ry: number; rotate: number }[];
}

interface Streak {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  droplets: { t: number; offset: number; r: number }[];
}

function buildIrregularBlobPath(rng: () => number, baseR: number): string {
  // A closed path around a circle of radius baseR, with each vertex's
  // radius jittered and an inward/outward jag alternated in, so the
  // outline reads as lumpy and spiked rather than a smooth circle/oval.
  const points = 10 + Math.floor(rng() * 5);
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const jag = i % 3 === 0 ? 1.5 + rng() * 0.9 : 0.55 + rng() * 0.35;
    const r = baseR * jag;
    coords.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  let d = `M ${coords[0][0].toFixed(2)} ${coords[0][1].toFixed(2)} `;
  for (let i = 1; i <= coords.length; i++) {
    const [x, y] = coords[i % coords.length];
    const [px, py] = coords[i - 1];
    // Slightly bulge the midpoint of each edge outward/inward at random so
    // edges aren't perfectly straight either.
    const mx = (px + x) / 2 + (rng() - 0.5) * baseR * 0.25;
    const my = (py + y) / 2 + (rng() - 0.5) * baseR * 0.25;
    d += `Q ${mx.toFixed(2)} ${my.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d + "Z";
}

function buildSplats(seed: number): Splat[] {
  const rng = mulberry32(seed * 2654435761);
  const count = 3 + Math.floor(rng() * 2); // 3-4 impact splats
  const anchors = [...ANCHORS].sort(() => rng() - 0.5).slice(0, count);

  return anchors.map((anchor, i) => {
    const baseR = anchor.maxReach * (0.45 + rng() * 0.35);
    const pathD = buildIrregularBlobPath(rng, baseR * 3.2); // path units, scaled down via `scale`
    const impactAngle = rng() * Math.PI * 2; // "away from impact" direction for this splat's droplets

    const dropletCount = 10 + Math.floor(rng() * 10);
    const droplets = Array.from({ length: dropletCount }, (_, j) => {
      const distFrac = (j + 1) / dropletCount; // 0..1, farther drops later in the list
      const dist = anchor.maxReach * (0.6 + distFrac * 1.8);
      const spread = (rng() - 0.5) * Math.PI * 0.9; // droplets fan out around the impact angle
      const angle = impactAngle + spread;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist * 0.75; // slightly flatten vertically, like real spatter
      const size = Math.max(0.15, 0.55 - distFrac * 0.4) * (0.7 + rng() * 0.6);
      // Distant drops elongate along the direction of travel (away from impact).
      const elongation = 1 + distFrac * 2.2;
      return {
        x,
        y,
        rx: size * elongation,
        ry: size,
        rotate: (angle * 180) / Math.PI,
      };
    });

    return {
      id: i,
      cx: anchor.x,
      cy: anchor.y,
      scale: baseR / 10,
      rotation: rng() * 360,
      pathD,
      hasDrip: i < 3 && rng() > 0.35,
      dripAngle: 90 + (rng() - 0.5) * 20, // mostly downward, slight random lean
      hasSpecular: baseR > anchor.maxReach * 0.6,
      filterSeed: Math.floor(rng() * 1000),
      droplets,
    };
  });
}

function buildStreaks(seed: number): Streak[] {
  const rng = mulberry32(seed * 1597334677 + 17);
  const count = 1 + Math.floor(rng() * 3); // 1-3 cast-off streaks
  const streaks: Streak[] = [];

  for (let s = 0; s < count; s++) {
    const startAnchor = ANCHORS[Math.floor(rng() * ANCHORS.length)];
    let x1 = startAnchor.x;
    let y1 = startAnchor.y;
    let x2 = x1;
    let y2 = y1;
    let found = false;

    // Re-roll direction/length up to 12 times until the segment clears the
    // safe zone around the name/focus-line/link row. This is what actually
    // enforces the "never hurts readability" rule for streaks (unlike
    // splats, which are already bounded by ANCHORS + maxReach alone).
    for (let attempt = 0; attempt < 12; attempt++) {
      const angle = rng() * Math.PI * 2;
      const length = 16 + rng() * 20;
      const candX2 = x1 + Math.cos(angle) * length;
      const candY2 = y1 + Math.sin(angle) * length * 0.7;
      if (!segmentIntersectsAnySafeZone(x1, y1, candX2, candY2)) {
        x2 = candX2;
        y2 = candY2;
        found = true;
        break;
      }
    }
    if (!found) continue; // skip this streak entirely rather than risk crossing text

    const dropletCount = 3 + Math.floor(rng() * 4);
    const droplets = Array.from({ length: dropletCount }, () => ({
      t: rng(),
      offset: (rng() - 0.5) * 3,
      r: 0.3 + rng() * 0.5,
    }));
    streaks.push({ x1, y1, x2, y2, width: 0.5 + rng() * 0.4, droplets });
  }

  return streaks;
}

export function InkSpatter({ seed }: { seed: number }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    function onChange(e: MediaQueryListEvent) {
      setReducedMotion(e.matches);
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const splats = useMemo(() => buildSplats(seed), [seed]);
  const streaks = useMemo(() => buildStreaks(seed), [seed]);

  return (
    <div className="ink-spatter-layer" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ink-spatter-svg">
        <defs>
          <radialGradient id="ink-core-gradient" cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#3d0000" />
            <stop offset="55%" stopColor="#6b0000" />
            <stop offset="100%" stopColor="#8a0303" />
          </radialGradient>

          {splats.map((s) => (
            <filter key={s.id} id={`ink-organic-${s.id}`} x="-60%" y="-60%" width="220%" height="220%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.09 0.12"
                numOctaves={2}
                seed={s.filterSeed}
                result="noise"
              />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={7} xChannelSelector="R" yChannelSelector="G" />
              <feGaussianBlur stdDeviation="0.4" result="softened" />
              <feMerge>
                <feMergeNode in="softened" />
                <feMergeNode in="softened" />
              </feMerge>
            </filter>
          ))}

          <filter id="ink-bleed" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>

          <filter id="ink-wet-sheen" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feSpecularLighting
              in="blur"
              surfaceScale={2.2}
              specularConstant={0.75}
              specularExponent={14}
              lightingColor="#ffe8e8"
              result="specOut"
            >
              <fePointLight x="40" y="20" z="30" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specClipped" />
            <feComposite in="SourceGraphic" in2="specClipped" operator="arithmetic" k1={0} k2={1} k3={0.55} k4={0} />
          </filter>
        </defs>

        <g style={{ mixBlendMode: "multiply" }}>
          {/* Faint feathered bleed underneath every splat, so the ink reads
              as soaked into the paper rather than sitting on top of it.
              Sized close to the blob itself (not much larger), so it reads
              as an absorbed edge rather than a soft halo/drop-shadow. */}
          {splats.map((s) => (
            <circle
              key={`bleed-${s.id}`}
              cx={s.cx}
              cy={s.cy}
              r={s.scale * 3.6}
              fill="#6b0000"
              opacity={0.14}
              filter="url(#ink-bleed)"
            />
          ))}

          {splats.map((s) => (
            <g key={s.id} transform={`translate(${s.cx} ${s.cy}) rotate(${s.rotation})`}>
              {/* Main irregular blob, organic-edged via the turbulence filter,
                  darkest at the core via the radial gradient, with an
                  optional wet specular highlight on larger splats. */}
              <g filter={`url(#ink-organic-${s.id})`}>
                <path
                  d={s.pathD}
                  transform={`scale(${s.scale / 10})`}
                  fill="url(#ink-core-gradient)"
                  {...(s.hasSpecular ? { filter: "url(#ink-wet-sheen)" } : {})}
                />
              </g>

              {/* Satellite droplets: shrink and elongate with distance,
                  tails pointing away from this splat's impact direction. */}
              {s.droplets.map((d, j) => (
                <ellipse
                  key={j}
                  cx={d.x}
                  cy={d.y}
                  rx={d.rx}
                  ry={d.ry}
                  fill="#6b0000"
                  opacity={0.85}
                  transform={`rotate(${d.rotate} ${d.x} ${d.y})`}
                />
              ))}

              {/* Drip: a tapering line from the blob's lower edge down to a
                  rounded bead, animated sliding down under normal motion,
                  shown at its final resting position under reduced motion. */}
              {s.hasDrip && (
                <g
                  className={reducedMotion ? "ink-drip ink-drip-static" : "ink-drip ink-drip-animated"}
                  style={{ transformOrigin: `0px ${s.scale * 2}px` }}
                >
                  <path
                    d={`M 0 ${s.scale * 2} Q ${s.scale * 0.4} ${s.scale * 5} 0 ${s.scale * 8}`}
                    stroke="#6b0000"
                    strokeWidth={s.scale * 0.7}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(${s.dripAngle - 90})`}
                  />
                  <circle
                    cx={0}
                    cy={s.scale * 8}
                    r={s.scale * 0.9}
                    fill="#6b0000"
                    transform={`rotate(${s.dripAngle - 90})`}
                  />
                </g>
              )}
            </g>
          ))}

          {/* Cast-off streaks: a real tapering shape (wide at the impact
              end, narrowing to a point), not a constant-width line, with
              droplets breaking off along its length. */}
          {streaks.map((st, i) => {
            const dx = st.x2 - st.x1;
            const dy = st.y2 - st.y1;
            const len = Math.hypot(dx, dy) || 1;
            // Perpendicular unit vector, used to offset the two long edges
            // of the tapered polygon on either side of the centerline.
            const px = -dy / len;
            const py = dx / len;
            const wStart = st.width * 1.6;
            const wEnd = st.width * 0.15;
            const points = [
              [st.x1 + px * wStart, st.y1 + py * wStart],
              [st.x2 + px * wEnd, st.y2 + py * wEnd],
              [st.x2 - px * wEnd, st.y2 - py * wEnd],
              [st.x1 - px * wStart, st.y1 - py * wStart],
            ]
              .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
              .join(" ");
            return (
              <g key={i}>
                <polygon points={points} fill="#6b0000" opacity={0.8} />
                {st.droplets.map((d, j) => {
                  const x = st.x1 + dx * d.t + d.offset;
                  const y = st.y1 + dy * d.t + d.offset * 0.5;
                  return <circle key={j} cx={x} cy={y} r={d.r} fill="#6b0000" opacity={0.75} />;
                })}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
