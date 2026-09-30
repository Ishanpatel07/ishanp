import { CardFlip } from "@/components/CardFlip";
import { EasterEggProvider } from "@/components/EasterEggProvider";

/* ============================================================
   PAGE
   Stage 1: the card front and back only. Everything below the
   first screen (About, Projects, Experience, Skills, Contact,
   footer) is Stage 2 scope and doesn't exist yet.

   EasterEggProvider wraps the whole page exactly once, at this
   top level: it owns all easter-egg state and renders the
   ink-spatter overlay itself, so no other component needs to.
   ============================================================ */
export default function Home() {
  return (
    <EasterEggProvider>
      <main>
        <CardFlip />
      </main>
    </EasterEggProvider>
  );
}
