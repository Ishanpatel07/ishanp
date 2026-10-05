"use client";

import { useMemo } from "react";

/* ============================================================
   BloodSplatter

   Dozens of independent droplets scattered across the whole
   surface, sizes ranging from tiny pinpoints to medium blobs.
   An earlier version of this file jittered every vertex of a
   small polygon loosely, which produced lumpy, warped "stain"
   silhouettes rather than droplets. This version gives each
   droplet a clean, mostly-circular body (tight wobble, more
   vertices) with exactly one tail pulled out in a single random
   direction, the way a real drop still has a tiny bit of momentum
   when it lands, plus a radial gradient per droplet (darker,
   richer core fading to a brighter thin edge) instead of one flat
   fill, and a couple of tiny satellite specks near the larger
   droplets, the way a drop throws a little fine spatter as it
   hits. No halo/core pairing, no directional spray clusters, no
   cast-off streaks, no drips: that composite "impact splash"
   model (from an earlier round) doesn't match a scattered rain of
   droplets, so it stays gone.

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

/** A droplet silhouette close to a real blood drop's actual physics: mostly
 * a clean, near-circular body (high vertex count, tight wobble range so the
 * outline reads as smooth, not lumpy), with ONE small tail pulled out to one
 * side where the drop was still moving when it landed, tapering to a point.
 * This replaces an earlier version that jittered every vertex loosely with
 * few points, which produced a warped, lumpy "stain" silhouette rather than
 * a droplet with a clean body and a single directional tail. */
function buildDropletPath(rng: () => number, r: number): string {
  const vertexCount = 16 + Math.floor(rng() * 6);
  const pts: { x: number; y: number }[] = [];
  const tailAngle = rng() * Math.PI * 2;
  const tailWidth = 0.5 + rng() * 0.35; // radians either side of tailAngle affected

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    let angleDiff = Math.abs(angle - tailAngle);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
    const tailInfluence = Math.max(0, 1 - angleDiff / tailWidth);
    // Tight wobble on the body (reads as smooth, not lumpy), a longer
    // pull only right at the tail's own angle.
    const bodyWobble = 0.93 + rng() * 0.1;
    const tailPull = tailInfluence > 0 ? tailInfluence * tailInfluence * (0.9 + rng() * 0.6) : 0;
    const rad = r * (bodyWobble + tailPull);
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

interface Speck {
  x: number;
  y: number;
  r: number;
}

interface Droplet {
  id: string;
  x: number;
  y: number;
  r: number;
  path: string;
  rotation: number;
  gradientId: string;
  specks: Speck[];
}

// Each entry is [core, mid, edge]: darker, richer at the center where the
// liquid pools thickest, lighter and more translucent-reading at the thin
// outer edge, rather than one flat saturated fill across the whole shape.
const GRADIENT_STOPS: [string, string, string][] = [
  ["#5c0606", "#9c0f0f", "#c21818"],
  ["#4e0505", "#8e0d0d", "#b81414"],
  ["#550505", "#95100f", "#be1616"],
  ["#480404", "#860c0c", "#b11212"],
];

function buildDroplets(seed: number): Droplet[] {
  const rng = mulberry32(seed * 2654435761 + 1);
  const droplets: Droplet[] = [];
  const target = 48;
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

    // Keep the droplet's full footprint (including its tail) inside the
    // viewport, not just its center.
    const edgeClear = r * 1.7;
    const x = edgeClear + rng() * (100 - edgeClear * 2);
    const y = edgeClear + rng() * (100 - edgeClear * 2);

    const margin = r + 1.4;
    if (pointInAnySafeZone(x, y, margin)) continue;

    const dropRng = mulberry32(Math.floor(x * 92821) ^ Math.floor(y * 68917) ^ seed ^ id);
    const path = buildDropletPath(dropRng, r);

    // Larger droplets get a couple of tiny satellite specks nearby, the
    // way a real drop throws a little fine spatter as it lands.
    const specks: Speck[] = [];
    if (r > 1.1) {
      const speckCount = Math.floor(dropRng() * 3);
      for (let sp = 0; sp < speckCount; sp++) {
        const angle = dropRng() * Math.PI * 2;
        const dist = r * (1.3 + dropRng() * 1.4);
        const sx = x + Math.cos(angle) * dist;
        const sy = y + Math.sin(angle) * dist;
        if (sx < 0.5 || sx > 99.5 || sy < 0.5 || sy > 99.5) continue;
        if (pointInAnySafeZone(sx, sy, 0.8)) continue;
        specks.push({ x: sx, y: sy, r: 0.12 + dropRng() * 0.18 });
      }
    }

    droplets.push({
      id: `d${id}`,
      x,
      y,
      r,
      path,
      rotation: rng() * 360,
      gradientId: `blood-grad-${Math.floor(rng() * GRADIENT_STOPS.length)}`,
      specks,
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
          {GRADIENT_STOPS.map(([core, mid, edge], i) => (
            <radialGradient key={`blood-grad-${i}`} id={`blood-grad-${i}`} cx="42%" cy="38%" r="65%">
              <stop offset="0%" stopColor={core} />
              <stop offset="55%" stopColor={mid} />
              <stop offset="100%" stopColor={edge} />
            </radialGradient>
          ))}
        </defs>

        {/* Bleed: a soft, tight feathered underlay so each droplet reads as
            slightly absorbed into the paper fiber, not pasted flat on top. */}
        <g style={{ mixBlendMode: "multiply" }} filter="url(#blood-bleed)" opacity={0.32}>
          {droplets.map((d) => (
            <circle key={`bleed-${d.id}`} cx={d.x} cy={d.y} r={d.r * 1.05} fill="#7a0909" />
          ))}
        </g>

        {droplets.map((d) => (
          <g key={d.id}>
            <g style={{ mixBlendMode: "multiply" }} transform={`translate(${d.x} ${d.y}) rotate(${d.rotation})`}>
              <path d={d.path} fill={`url(#${d.gradientId})`} opacity={0.95} />
            </g>
            {d.specks.length > 0 && (
              <g style={{ mixBlendMode: "multiply" }} opacity={0.85}>
                {d.specks.map((sp, i) => (
                  <circle key={i} cx={sp.x} cy={sp.y} r={sp.r} fill="#8e0d0d" />
                ))}
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
