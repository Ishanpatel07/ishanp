import type { Metadata } from "next";
import { Cormorant_Garamond, Cormorant_SC } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font (downloaded at build time, served same-origin),
// so this satisfies the CSP's font-src 'self' with no extra directive.
// Cormorant SC is a distinct font family Google Fonts ships specifically as
// small-caps glyphs, not CSS-faked scaled uppercase: using it for every
// small-caps element (name, section titles, labels, links) is how "true
// small caps" is verified, not asserted. Cormorant Garamond (its companion
// family, same type design) carries the regular-weight body text.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const cormorantSC = Cormorant_SC({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant-sc",
  display: "swap",
});

// Stage 1 placeholder. Final title/description (2 options each) are chosen
// with the user in Stage 2 and land in data/content.ts.
export const metadata: Metadata = {
  title: "Ishan Patel",
  description: "Computer vision and edge ML engineer heading into AI security.",
  metadataBase: new URL("https://ishanp.me"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${cormorantSC.variable} h-full`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
