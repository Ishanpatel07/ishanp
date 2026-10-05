"use client";

import { useEffect, useMemo, useState } from "react";

/* ============================================================
   BloodSplatter

   Procedural SVG blood splatter (Option A from an earlier round:
   no external images to source or license, full control over
   seeded randomness and text-safe-zones). This is a rebuild of
   an earlier, cruder version: the previous blobs were drawn as
   straight-line polygons smoothed only by an SVG filter, which
   read as faceted and plasticky. This version builds genuinely
   smooth closed curves (Catmull-Rom-derived cubic beziers through
   irregular jittered vertices) so the edges read as soft, wet,
   organic shapes even before any filter is applied, with the
   feTurbulence/feDisplacementMap filter layered on top for a bit
   of extra roughness rather than doing all the work alone.

   Visual model, closer to a real reference than the last pass:
   - Each splat is TWO overlapping layers: a slightly larger, more
     transparent "wet bloom" halo underneath, and a smaller, darker
     "clotted core" on top, off-center from the halo (impacts don't
     deposit most of their mass dead-center). This dual-layer
     approach is what makes it read as liquid with depth rather
     than a single flat tinted shape.
   - Color ramps from near-black maroon at the densest point through
     a mid oxblood to a brighter arterial red at the thin trailing
     edges, via a multi-stop radial gradient per splat (real blood
     is darkest where it pools thick, brightest where it's thinnest).
   - A small, tight specular highlight sits on each large splat's
     wet bloom, offset toward the upper-left (consistent light
     direction across all splats, like one overhead light source),
     not centered, so it reads as reflected light on a liquid
     surface, not a painted-on gloss sticker.
   - Satellite droplets shrink and elongate with distance from the
     splat's own impact angle, tails pointing away from that splat.
   - Cast-off streaks are tapered polygons with droplets breaking
     off along their length, kept clear of all text safe-zones by a
     retrying generator (segment-vs-rectangle intersection test).
   - 2-3 of the larger splats get a drip: a tapering path ending in
     a rounded bead, revealed top-down over 1.5s on activation.
     Reduced motion shows the final state instantly.
   - multiply blend mode plus a tight feathered underlay so it reads
     as soaked into the card stock, not pasted on top.
   ============================================================ */

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

// Text regions to keep clear of cast-off streaks (percent of viewport).
const SAFE_ZONES = [
  { x1: 22, y1: 32, x2: 78, y2: 64 }, // name + focus line
  { x1: 28, y1: 78, x2: 72, y2: 92 }, // link row
  { x1: 2, y1: 7, x2: 36, y2: 19 }, // email, top-left
  { x1: 64, y1: 5, x2: 98, y2: 21 }, // university + major, top-right
];

function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: { x1: number; y1: number; x2: number; y2: number }
): boolean {
  const inside = (x: number, y: number) => x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2;
  if (inside(x1, y1) || inside(x2, y2)) return true;
  function cross(ox: number, oy: number, px: number, py: number, qx: number, qy: number) {
    return (px - ox) * (qy - oy) - (py - oy) * (qx - ox);
  }
  function segmentsIntersect(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
    dx: number,
    dy: number
  ) {
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

function pointInAnySafeZone(x: number, y: number): boolean {
  return SAFE_ZONES.some((z) => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2);
}

/** Smooth closed blob outline: irregular jittered vertices connected by
 * Catmull-Rom-to-bezier curves, so the edge is organically wobbly without
 * any straight facets, then a few sharp outward spikes are added at random
 * vertices to break the silhouette the way real spatter does (splashes
 * aren't just lumpy circles, they throw points). */
function buildBlobPath(rng: () => number, cx: number, cy: number, baseR: number): string {
  const vertexCount = 14 + Math.floor(rng() * 6);
  const pts: { x: number; y: number }[] = [];
  const spikeIndices = new Set<number>();
  const spikeCount = 2 + Math.floor(rng() * 3);
  while (spikeIndices.size < spikeCount) {
    spikeIndices.add(Math.floor(rng() * vertexCount));
  }
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    const isSpike = spikeIndices.has(i);
    const wobble = 0.72 + rng() * 0.42;
    const r = isSpike ? baseR * (1.25 + rng() * 0.35) : baseR * wobble;
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.94 });
  }

  function catmullToBezier(p: { x: number; y: number }[]) {
    const n = p.length;
    let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)} `;
    for (let i = 0; i < n; i++) {
      const p0 = p[(i - 1 + n) % n];
      const p1 = p[i];
      const p2 = p[(i + 1) % n];
      const p3 = p[(i + 2) % n];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
    }
    return d + "Z";
  }

  return catmullToBezier(pts);
}

interface Droplet {
  x: number;
  y: number;
  r: number;
  elongation: number;
  angle: number;
}

interface Splat {
  id: string;
  cx: number;
  cy: number;
  haloR: number;
  haloPath: string;
  corePath: string;
  coreOffsetX: number;
  coreOffsetY: number;
  rotation: number;
  droplets: Droplet[];
  impactAngle: number;
  hasSpecular: boolean;
  specularX: number;
  specularY: number;
  hasDrip: boolean;
  dripPath: string;
  dripBeadX: number;
  dripBeadY: number;
  dripBeadR: number;
  filterSeed: number;
}

interface Streak {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  droplets: { t: number; offset: number; r: number }[];
}

// Anchor points sit clear of every SAFE_ZONES rectangle, with enough
// margin that a splat's halo at its largest radius (haloR up to ~7, which
// after the dual-layer render plus bleed reads as roughly 8-9 viewBox
// units of visible footprint) still doesn't reach into protected text.
const ANCHORS = [
  { x: 10, y: 30, maxReach: 7 },
  { x: 90, y: 30, maxReach: 7 },
  { x: 7, y: 70, maxReach: 7 },
  { x: 93, y: 70, maxReach: 7 },
  { x: 10, y: 49, maxReach: 5 },
  { x: 90, y: 49, maxReach: 5 },
];

function buildSplats(seed: number): Splat[] {
  const rng = mulberry32(seed * 2654435761 + 1);
  const count = 3 + Math.floor(rng() * 2);
  const splats: Splat[] = [];

  for (let i = 0; i < count; i++) {
    const anchor = ANCHORS[i % ANCHORS.length];
    const haloR = 3.2 + rng() * anchor.maxReach * 0.42;
    const coreR = haloR * (0.46 + rng() * 0.14);

    // Jitter the anchor, but never let the splat's own footprint (halo
    // radius plus a small margin) reach into a safe zone: if a jittered
    // position would overlap one, fall back to the anchor's exact
    // position, which was placed with enough clearance at every
    // anchor's own maxReach to never overlap on its own.
    let cx = anchor.x + (rng() - 0.5) * 3;
    let cy = anchor.y + (rng() - 0.5) * 3;
    const margin = haloR + 1.2;
    const wouldOverlap = SAFE_ZONES.some(
      (z) => cx + margin >= z.x1 && cx - margin <= z.x2 && cy + margin >= z.y1 && cy - margin <= z.y2
    );
    if (wouldOverlap) {
      cx = anchor.x;
      cy = anchor.y;
    }
    const impactAngle = rng() * Math.PI * 2;

    // Core sits offset from halo center, toward the direction the impact
    // "came from" (opposite the spray direction), the way real pooled
    // mass isn't centered in its own halo.
    const coreOffsetX = -Math.cos(impactAngle) * haloR * 0.22;
    const coreOffsetY = -Math.sin(impactAngle) * haloR * 0.22;

    const haloRng = mulberry32(Math.floor((cx + 1) * 7919) ^ Math.floor((cy + 1) * 104729) ^ seed);
    const coreRng = mulberry32(Math.floor((cx + 1) * 15485863) ^ Math.floor((cy + 1) * 32452867) ^ seed);

    const haloPath = buildBlobPath(haloRng, 0, 0, haloR * 11);
    const corePath = buildBlobPath(coreRng, 0, 0, coreR * 11);

    const dropletCount = 14 + Math.floor(rng() * 16);
    const droplets: Droplet[] = [];
    for (let d = 0; d < dropletCount; d++) {
      const spread = (rng() - 0.5) * Math.PI * 1.1;
      const angle = impactAngle + spread;
      const distFrac = 0.3 + rng() * 1.5;
      const dist = haloR * (0.9 + distFrac);
      const dx = cx + Math.cos(angle) * dist;
      const dy = cy + Math.sin(angle) * dist * 0.85;
      if (dx < 1 || dx > 99 || dy < 1 || dy > 99) continue;
      if (pointInAnySafeZone(dx, dy)) continue;
      const r = Math.max(0.12, 0.85 - distFrac * 0.42) * (0.6 + rng() * 0.7);
      const elongation = 1 + distFrac * 1.8;
      droplets.push({ x: dx, y: dy, r, elongation, angle });
    }

    const hasSpecular = haloR > 5.5 && rng() > 0.25;
    const specAngle = -2.3 + (rng() - 0.5) * 0.5; // consistent upper-left light direction
    const specDist = haloR * 0.28;
    const specularX = Math.cos(specAngle) * specDist;
    const specularY = Math.sin(specAngle) * specDist;

    const hasDrip = i < 3 && rng() > 0.35;
    let dripPath = "";
    let dripBeadX = 0;
    let dripBeadY = 0;
    let dripBeadR = 0;
    if (hasDrip) {
      const dripStartX = (rng() - 0.5) * haloR * 0.6;
      const dripLen = haloR * (1.6 + rng() * 1.4);
      const sway = (rng() - 0.5) * haloR * 0.35;
      const w0 = haloR * 0.16;
      const w1 = haloR * 0.05;
      dripPath =
        `M ${(dripStartX - w0 / 2).toFixed(2)} 0 ` +
        `C ${(dripStartX - w0 / 2).toFixed(2)} ${(dripLen * 0.4).toFixed(2)}, ${(dripStartX + sway - w1 / 2).toFixed(2)} ${(dripLen * 0.7).toFixed(2)}, ${(dripStartX + sway - w1 / 2).toFixed(2)} ${dripLen.toFixed(2)} ` +
        `L ${(dripStartX + sway + w1 / 2).toFixed(2)} ${dripLen.toFixed(2)} ` +
        `C ${(dripStartX + sway + w1 / 2).toFixed(2)} ${(dripLen * 0.7).toFixed(2)}, ${(dripStartX + w0 / 2).toFixed(2)} ${(dripLen * 0.4).toFixed(2)}, ${(dripStartX + w0 / 2).toFixed(2)} 0 Z`;
      dripBeadX = dripStartX + sway;
      dripBeadY = dripLen;
      dripBeadR = w1 * 0.95;
    }

    splats.push({
      id: `s${i}`,
      cx,
      cy,
      haloR,
      haloPath,
      corePath,
      coreOffsetX,
      coreOffsetY,
      rotation: rng() * 360,
      droplets,
      impactAngle,
      hasSpecular,
      specularX,
      specularY,
      hasDrip,
      dripPath,
      dripBeadX,
      dripBeadY,
      dripBeadR,
      filterSeed: Math.floor(rng() * 1000),
    });
  }
  return splats;
}

function buildStreaks(seed: number): Streak[] {
  const rng = mulberry32(seed * 1597334677 + 17);
  const count = 1 + Math.floor(rng() * 3);
  const streaks: Streak[] = [];
  for (let s = 0; s < count; s++) {
    const startAnchor = ANCHORS[Math.floor(rng() * ANCHORS.length)];
    let x1 = startAnchor.x;
    let y1 = startAnchor.y;
    let x2 = x1;
    let y2 = y1;
    let found = false;
    for (let attempt = 0; attempt < 14; attempt++) {
      const angle = rng() * Math.PI * 2;
      const length = 14 + rng() * 22;
      const candX2 = x1 + Math.cos(angle) * length;
      const candY2 = y1 + Math.sin(angle) * length * 0.7;
      if (!segmentIntersectsAnySafeZone(x1, y1, candX2, candY2)) {
        x2 = candX2;
        y2 = candY2;
        found = true;
        break;
      }
    }
    if (!found) continue;
    const dropletCount = 3 + Math.floor(rng() * 4);
    const droplets = Array.from({ length: dropletCount }, () => ({
      t: rng(),
      offset: (rng() - 0.5) * 3,
      r: 0.28 + rng() * 0.45,
    }));
    streaks.push({ x1, y1, x2, y2, width: 0.45 + rng() * 0.4, droplets });
  }
  return streaks;
}

export function BloodSplatter({ seed }: { seed: number }) {
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
    <div className="blood-layer" aria-hidden="true">
      <svg
        className="blood-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {splats.map((s) => (
            <radialGradient key={`grad-${s.id}`} id={`blood-grad-${s.id}`} cx="42%" cy="40%" r="75%">
              <stop offset="0%" stopColor="#1a0000" />
              <stop offset="28%" stopColor="#350202" />
              <stop offset="58%" stopColor="#550505" />
              <stop offset="82%" stopColor="#6e0909" />
              <stop offset="100%" stopColor="#7d1210" />
            </radialGradient>
          ))}
          <radialGradient id="blood-core-grad" cx="45%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#140000" />
            <stop offset="55%" stopColor="#2a0000" />
            <stop offset="100%" stopColor="#400303" />
          </radialGradient>

          {splats.map((s) => (
            <filter key={`f-${s.id}`} id={`blood-organic-${s.id}`} x="-60%" y="-60%" width="220%" height="220%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.09 0.11"
                numOctaves="2"
                seed={s.filterSeed}
                result="noise"
              />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
              <feGaussianBlur stdDeviation="0.18" />
            </filter>
          ))}

          <filter id="blood-bleed" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>

          <filter id="blood-sheen" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" result="blurAlpha" />
            <feSpecularLighting
              in="blurAlpha"
              surfaceScale="1.8"
              specularConstant="0.85"
              specularExponent="14"
              lightingColor="#ffdede"
              result="spec"
            >
              <fePointLight x="35" y="25" z="24" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specClipped" />
            <feComponentTransfer in="specClipped" result="specFaded">
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="specFaded" />
            </feMerge>
          </filter>
        </defs>

        {/* Bleed: a soft, tight feathered underlay beneath every splat so
            the edge reads as absorbed into the paper fiber. */}
        <g style={{ mixBlendMode: "multiply" }} filter="url(#blood-bleed)" opacity={0.5}>
          {splats.map((s) => (
            <circle key={`bleed-${s.id}`} cx={s.cx} cy={s.cy} r={s.haloR * 0.92} fill="#550505" />
          ))}
        </g>

        {splats.map((s) => (
          <g key={s.id} style={{ mixBlendMode: "multiply" }}>
            {/* Wet halo: larger, more transparent, organic edge */}
            <g transform={`translate(${s.cx} ${s.cy}) rotate(${s.rotation}) scale(0.0909)`}>
              <path
                d={s.haloPath}
                fill={`url(#blood-grad-${s.id})`}
                opacity={0.92}
                filter={`url(#blood-organic-${s.id})`}
              />
            </g>
            {/* Clotted core: smaller, darker, offset, filtered with specular sheen */}
            <g
              transform={`translate(${s.cx + s.coreOffsetX} ${s.cy + s.coreOffsetY}) rotate(${-s.rotation * 0.6}) scale(0.0909)`}
            >
              <path
                d={s.corePath}
                fill="url(#blood-core-grad)"
                opacity={0.93}
                filter={s.hasSpecular ? "url(#blood-sheen)" : `url(#blood-organic-${s.id})`}
              />
            </g>
            {/* Satellite droplets, elongated with distance, tails away from impact */}
            {s.droplets.map((d, i) => (
              <ellipse
                key={i}
                cx={d.x}
                cy={d.y}
                rx={d.r}
                ry={d.r * d.elongation}
                fill={i % 3 === 0 ? "#2f0202" : "#4e0707"}
                opacity={0.85}
                transform={`rotate(${(d.angle * 180) / Math.PI + 90} ${d.x} ${d.y})`}
              />
            ))}
            {/* Drip, revealed top-down on activation */}
            {s.hasDrip && (
              <g
                transform={`translate(${s.cx + s.coreOffsetX} ${s.cy + s.haloR * 0.3})`}
                className={reducedMotion ? "blood-drip-static" : "blood-drip-animated"}
              >
                <path d={s.dripPath} fill="#51070a" opacity={0.9} />
                <circle
                  cx={s.dripBeadX}
                  cy={s.dripBeadY}
                  r={Math.max(0.35, s.dripBeadR)}
                  fill="#51070a"
                  opacity={0.92}
                />
              </g>
            )}
          </g>
        ))}

        {/* Cast-off streaks: tapered polygons, droplets breaking off along length */}
        {streaks.map((st, i) => {
          const dx = st.x2 - st.x1;
          const dy = st.y2 - st.y1;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const wStart = st.width * 1.7;
          const wEnd = st.width * 0.12;
          const p1x = st.x1 + nx * wStart;
          const p1y = st.y1 + ny * wStart;
          const p2x = st.x1 - nx * wStart;
          const p2y = st.y1 - ny * wStart;
          const p3x = st.x2 - nx * wEnd;
          const p3y = st.y2 - ny * wEnd;
          const p4x = st.x2 + nx * wEnd;
          const p4y = st.y2 + ny * wEnd;
          return (
            <g key={i} style={{ mixBlendMode: "multiply" }} opacity={0.88}>
              <polygon
                points={`${p1x.toFixed(2)},${p1y.toFixed(2)} ${p2x.toFixed(2)},${p2y.toFixed(2)} ${p3x.toFixed(2)},${p3y.toFixed(2)} ${p4x.toFixed(2)},${p4y.toFixed(2)}`}
                fill="#420404"
              />
              {st.droplets.map((d, j) => {
                const dxp = st.x1 + dx * d.t + nx * d.offset;
                const dyp = st.y1 + dy * d.t + ny * d.offset;
                return <circle key={j} cx={dxp} cy={dyp} r={d.r} fill="#420404" />;
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
