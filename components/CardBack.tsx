"use client";

import { RefObject } from "react";
import { introText, currentlyLine, cardBackLinks } from "@/data/content";

/* ============================================================
   CardBack
   Centered, generous whitespace: the 3-sentence intro, the fixed
   Currently line, three small-caps links, and "Turn back" at the
   bottom. Same paper, same margins as the front.
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
      </div>

      <div className="card-bottom card-bottom-back">
        <button ref={flipButtonRef} type="button" className="card-link card-affordance" onClick={onFlip}>
          Turn back
        </button>
      </div>
    </div>
  );
}
