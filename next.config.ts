import type { NextConfig } from "next";

// This site is a single static page: no external API calls, no third-party
// scripts, no remote images, no forms. The CSP below is scoped to exactly
// what it loads: self-hosted fonts, an inline SVG data: URI for the paper
// grain texture, and Next.js's own framework scripts/styles.
//
// Nonce vs 'unsafe-inline': Next.js's nonce-based CSP (see its own docs)
// requires every page to render dynamically on each request, which turns
// off static generation and CDN caching site-wide. This page has zero
// per-request state, so that cost buys nothing here. 'unsafe-inline' for
// script-src and style-src is the tradeoff: it weakens the CSP's ability to
// block an injected inline script if an XSS bug ever existed elsewhere on
// this domain, in exchange for keeping the page fully static and
// edge-cacheable. Given the page has no user input, no forms, and no
// dynamic data, that risk is low and the performance/cost win is real.
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  // Refuses to let any other site load this page in a frame or iframe,
  // which is the standard defense against clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // Stops the browser from guessing a file's type from its content, so it
  // can't be tricked into treating a file as a script or stylesheet when it
  // isn't served as one.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Tells every browser that visits to only ever use HTTPS for this domain
  // for the next two years, including subdomains, so no request can be
  // silently downgraded to plain HTTP.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Controls how much of this page's URL is sent along when a visitor
  // clicks a link elsewhere: full URL on this same site, origin only when
  // leaving it, matching what a privacy-conscious visitor would expect.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Explicitly turns off the camera, microphone, and location APIs for
  // this page, none of which it uses, so a compromised script couldn't
  // request them even if it tried.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // The policy above: restricts every kind of content this page can load
  // to this same origin, with the two narrow, explained exceptions for
  // inline scripts/styles and the data: URI grain texture.
  { key: "Content-Security-Policy", value: cspHeader },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
