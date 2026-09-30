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

// Confirmed with the user: no "AI security" framing in the focus line, since
// that's a direction, not current expertise or a credential held today.
export const focusLine = "Cybersecurity student. Building with ML and computer vision.";

export const currentlyLine = "Running finance for Hacklanta II (Oct 9-11).";

// Stage 2 will present 3 intro options; this is a placeholder for Stage 1's
// layout only. AI security appears once here, explicitly framed as a
// long-term goal ("eventually"), not present-tense work or expertise,
// per the user's correction.
export const introText =
  "I build computer vision and edge ML systems that run on real hardware, and I run finance for a 1,000-plus person hackathon. Eventually, I want to move into AI security: how models fail, how they're attacked, and how to make them robust.";

export const cardFrontLinks = [
  { label: "Resume", href: "/Ishan_Patel_Resume.pdf" },
  { label: "GitHub", href: "https://github.com/Ishanpatel07" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ishanpatel09/" },
  { label: "Coffee Chat", href: "https://calendly.com/ishan-patel2807/30min" },
];

export const cardBackLinks = [
  { label: "Email", href: `mailto:${person.email}` },
  { label: "Resume", href: "/Ishan_Patel_Resume.pdf" },
  { label: "Coffee Chat", href: "https://calendly.com/ishan-patel2807/30min" },
];
