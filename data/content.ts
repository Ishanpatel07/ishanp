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

// Split into parts because "Progsu" is a link: the line can't be a single
// string if part of it has to render as an anchor.
export const focusLine = {
  before: "CFO @ ",
  linkLabel: "Progsu",
  linkHref: "https://progsu.com",
  after: "",
};

// AI security appears once here, explicitly framed as a long-term goal
// ("long term"), not present-tense work or expertise, per the user's
// standing correction.
export const introText =
  "I study Information Systems with a concentration in cybersecurity at Georgia State. This summer I built computer vision tools and got ML models running on Raspberry Pis as an AI/ML intern. I'm also CFO of PROGSU, our programming club, and I run the budget for Hacklanta. Long term, I want to work on AI security: how models fail, and how to make them harder to break.";

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
