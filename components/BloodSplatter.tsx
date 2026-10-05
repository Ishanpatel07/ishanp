"use client";

import { useMemo } from "react";

/* ============================================================
   BloodSplatter

   Rebuilt to match a reference image directly: dozens of
   independent droplets scattered across the whole surface, sizes
   ranging from tiny pinpoints to medium blobs, bright saturated
   red, each one its own organic shape. No halo/core pairing, no
   directional spray clusters, no cast-off streaks, no drips: that
   composite "impact splash" model (from an earlier round) doesn't
   match what a scattered rain of droplets actually looks like, so
   it's gone rather than kept alongside this.

   Procedural SVG (not photos): no external assets to source or
   license, full control over seeded randomness and keeping
   droplets off the card's text.
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

// Text regions to keep clear of (percent of viewport).
const SAFE_ZONES = [
  { x1: 20, y1: 30, x2: 80, y2: 66 }, // name + focus line
  { x1: 26, y1: 77, x2: 74, y2: 93 }, // link row
  { x1: 1, y1: 6, x2: 37, y2: 20 }, // email, top-left
  { x1: 63, y1: 4, x2: 99, y2: 22 }, // university + major, top-right
  { x1: 72, y1: 86, x2: 100, y2: 100 }, // "Inspired by American Psycho" corner trigger
];

function pointInAnySafeZone(x: number, y: number, margin: number): boolean {
  return SAFE_ZONES.some((z) => x + margin >= z.x1 && x - margin <= z.x2 && y + margin >= z.y1 && y - margin <= z.y2);
}

/** A small irregular organic blob: a jittered closed curve through
 * Catmull-Rom-derived bezier segments, with a couple of vertices pulled
 * out further to break the outline the way a real droplet's edge does
 * (droplets aren't clean circles, even small ones have a slight tail or
 * lobed edge where they landed and spread). */
function buildDropletPath(rng: () => number, r: number): string {
  const vertexCount = 7 + Math.floor(rng() * 4);
  const pts: { x: number; y: number }[] = [];
  const tailIndex = Math.floor(rng() * vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    const isTail = i === tailIndex;
    const wobble = 0.78 + rng() * 0.4;
    const rad = isTail ? r * (1.3 + rng() * 0.5) : r * wobble;
    pts.push({ x: Math.cos(angle) * rad, y: Math.sin(angle) * rad });
  }
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d + "Z";
}

interface Droplet {
  id: string;
  x: number;
  y: number;
  r: number;
  path: string;
  rotation: number;
  colorIndex: number;
}

const REDS = ["#c01414", "#b01010", "#9c0e0e", "#a81212"];

function buildDroplets(seed: number): Droplet[] {
  const rng = mulberry32(seed * 2654435761 + 1);
  const droplets: Droplet[] = [];
  const target = 55;
  let attempts = 0;
  let id = 0;

  while (droplets.length < target && attempts < target * 6) {
    attempts++;

    // Size distribution weighted toward small: most droplets are tiny
    // pinpoints, a handful are medium blobs, matching the reference's mix.
    const sizeRoll = rng();
    let r: number;
    if (sizeRoll < 0.55) {
      r = 0.25 + rng() * 0.55; // tiny dots
    } else if (sizeRoll < 0.85) {
      r = 0.8 + rng() * 1.1; // small-medium
    } else {
      r = 1.9 + rng() * 2.2; // occasional larger blob
    }

    // Keep the droplet's full footprint (including its longest tail
    // spike, up to ~1.8x r) inside the viewport, not just its center.
    const edgeClear = r * 1.8;
    const x = edgeClear + rng() * (100 - edgeClear * 2);
    const y = edgeClear + rng() * (100 - edgeClear * 2);

    const margin = r + 1.4;
    if (pointInAnySafeZone(x, y, margin)) continue;

    const dropRng = mulberry32(Math.floor(x * 92821) ^ Math.floor(y * 68917) ^ seed ^ id);
    const path = buildDropletPath(dropRng, r);

    droplets.push({
      id: `d${id}`,
      x,
      y,
      r,
      path,
      rotation: rng() * 360,
      colorIndex: Math.floor(rng() * REDS.length),
    });
    id++;
  }
  return droplets;
}

export function BloodSplatter({ seed }: { seed: number }) {
  const droplets = useMemo(() => buildDroplets(seed), [seed]);

  return (
    <div className="blood-layer" aria-hidden="true">
      <svg
        className="blood-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="blood-bleed" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="0.45" />
          </filter>
        </defs>

        {/* Bleed: a soft, tight feathered underlay so each droplet reads as
            slightly absorbed into the paper fiber, not pasted flat on top. */}
        <g style={{ mixBlendMode: "multiply" }} filter="url(#blood-bleed)" opacity={0.35}>
          {droplets.map((d) => (
            <circle key={`bleed-${d.id}`} cx={d.x} cy={d.y} r={d.r * 1.1} fill="#8a0a0a" />
          ))}
        </g>

        {droplets.map((d) => (
          <g
            key={d.id}
            style={{ mixBlendMode: "multiply" }}
            transform={`translate(${d.x} ${d.y}) rotate(${d.rotation})`}
          >
            <path d={d.path} fill={REDS[d.colorIndex]} opacity={0.94} />
          </g>
        ))}
      </svg>
    </div>
  );
}
