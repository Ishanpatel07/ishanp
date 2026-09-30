"use client";

import { RefObject } from "react";
import { introText, currentlyLine, cardBackLinks } from "@/data/content";

/* ============================================================
   CardBack
   Centered intro and Currently line in the middle zone. The
   contact link row sits in the same grid row (and therefore the
   same on-screen position) as the front's primary link row, with
   "Turn back" beneath it in the same spot "Turn over" occupies
   on the front. Same paper, same margins as the front.
   ============================================================ */

export function CardBack({
  flipButtonRef,
  onFlip,
  inert,
}: {
  flipButtonRef: RefObject<HTMLButtonElement | null>;
  onFlip: () => void;
  inert: boolean;
}) {
  return (
    <div className="card-panel card-panel-back" inert={inert || undefined}>
      <div className="card-back-content">
        <p className="card-back-intro">{introText}</p>
        <p className="small-caps card-back-currently">{currentlyLine}</p>
      </div>

      <div className="card-bottom card-bottom-back">
        <nav className="card-link-row" aria-label="Contact links">
          {cardBackLinks.map((link, i) => (
            <span key={link.href} className="card-link-row-item">
              {i > 0 && (
                <span className="card-link-row-sep" aria-hidden="true">
                  {"·"}
                </span>
              )}
              <a
                href={link.href}
                className="card-link"
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {link.label}
              </a>
            </span>
          ))}
        </nav>

        <div className="card-affordances">
          <button ref={flipButtonRef} type="button" className="card-link card-affordance" onClick={onFlip}>
            Turn back
          </button>
        </div>
      </div>
    </div>
  );
}
