import type { Metadata, Viewport } from "next";
import { Vollkorn, Vollkorn_SC } from "next/font/google";
import "./globals.css";
import { RotateGate } from "@/components/RotateGate";

// Self-hosted via next/font (downloaded at build time, served same-origin),
// so this satisfies the CSP's font-src 'self' with no extra directive.
// Vollkorn SC is a distinct font family Google Fonts ships specifically as
// small-caps glyphs, not CSS-faked scaled uppercase: using it for every
// small-caps element (name, section titles, labels, links) is how "true
// small caps" is verified, not asserted. Vollkorn (its companion family,
// same type design, higher-contrast slab-leaning serif) carries body text.
const vollkorn = Vollkorn({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-vollkorn",
  display: "swap",
});

const vollkornSC = Vollkorn_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-vollkorn-sc",
  display: "swap",
});

// Stage 1 placeholder. Final title/description (2 options each) are chosen
// with the user in Stage 2 and land in data/content.ts.
export const metadata: Metadata = {
  title: "Ishan Patel",
  description: "Computer vision and edge ML engineer heading into AI security.",
  metadataBase: new URL("https://ishanp.me"),
};

// Without this, mobile browsers render at a ~980px virtual width and scale
// the whole page down, which would shrink the card's type well below a
// readable size on a phone.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${vollkorn.variable} ${vollkornSC.variable} h-full`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full">
        <div className="paper-watermark" aria-hidden="true">
          <span className="wm-one">IP</span>
          <span className="wm-two">IP</span>
        </div>
        <RotateGate />
        {children}
      </body>
    </html>
  );
}
