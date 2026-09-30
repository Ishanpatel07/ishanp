/* ============================================================
   CONTENT

   Every fact, link, and piece of copy on the site lives here, so
   future edits never require touching a component. Stage 1 only
   populates what the card front/back need; Stage 2 fills in
   everything below the fold.
   ============================================================ */

export const person = {
  name: "Ishan Patel",
  email: "Ishan.patel2807@gmail.com",
  university: "Georgia State University",
  major: "Computer Information Systems",
};

// Stage 2 will present 3 options for each of these; a value is needed now
// so Stage 1 has real text to lay out and measure against, not lorem ipsum.
// Marked as a placeholder pick, not a final decision.
export const focusLine = "Computer vision and edge ML, heading into AI security.";

export const currentlyLine = "Running finance for Hacklanta II (Oct 9-11).";

// Stage 2 will present 3 intro options; this is a placeholder for Stage 1's
// layout only.
export const introText =
  "I build computer vision and edge ML systems that run on real hardware. I'm heading toward AI security: how models fail, how they're attacked, and how to make them robust. Alongside that, I run finance for a 1,000-plus person hackathon.";

export const cardFrontLinks = [
  { label: "Resume", href: "/Ishan_Patel_Resume.pdf" },
  { label: "GitHub", href: "https://github.com/Ishanpatel07" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ishanpatel09/" },
  { label: "Coffee Chat", href: "https://calendly.com/ishan-patel2807/30min" },
  { label: "ishanp.me", href: "https://ishanp.me" },
];

export const cardBackLinks = [
  { label: "Email", href: `mailto:${person.email}` },
  { label: "Resume", href: "/Ishan_Patel_Resume.pdf" },
  { label: "Coffee Chat", href: "https://calendly.com/ishan-patel2807/30min" },
];
