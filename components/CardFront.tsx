"use client";

import { RefObject } from "react";
import { person, focusLine, cardFrontLinks } from "@/data/content";

/* ============================================================
   CardFront
   The classic four-part card layout at viewport scale: email top
   left, university top right, name and focus line dead center,
   link row on the bottom edge, with "Turn over" as a quiet
   affordance just above it. ("Scroll" was removed: there's
   nothing to scroll to yet below the fold, and it read as a
   broken promise. It comes back once Stage 2's sections exist.)
   Exactly 100svh (small viewport height, so mobile browser
   chrome doesn't clip it) with generous margins from every edge.

   `inert` is set natively when this face isn't showing: unlike
   aria-hidden alone, native inert also removes the face from tab
   order and pointer events, so a keyboard user tabbing through
   the page never lands on a link that's currently invisible.
   ============================================================ */

export function CardFront({
  flipButtonRef,
  onFlip,
  inert,
}: {
  flipButtonRef: RefObject<HTMLButtonElement | null>;
  onFlip: () => void;
  inert: boolean;
}) {
  return (
    <div className="card-panel" inert={inert || undefined}>
      <div className="card-corner card-corner-tl">
        <a href={`mailto:${person.email}`} className="card-link">
          {person.email}
        </a>
      </div>

      <p className="card-corner-note">Inspired by American Psycho</p>

      <div className="card-corner card-corner-tr">
        <div className="small-caps deboss card-corner-tr-text">
          <div>{person.university}</div>
          <div>{person.major}</div>
        </div>
      </div>

      <div className="card-center">
        <h1 className="small-caps deboss card-name">{person.name}</h1>
        <p className="small-caps deboss card-focus-line">{focusLine}</p>
      </div>

      <div className="card-bottom">
        <nav className="card-link-row" aria-label="Primary links">
          {cardFrontLinks.map((link, i) => (
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
            Turn over
          </button>
        </div>
      </div>
    </div>
  );
}
