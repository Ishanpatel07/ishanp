import { CardFlip } from "@/components/CardFlip";

/* ============================================================
   PAGE
   Stage 1: the card front and back only. Everything below the
   first screen (About, Projects, Experience, Skills, Contact,
   footer) is Stage 2 scope and doesn't exist yet.
   ============================================================ */
export default function Home() {
  return (
    <main>
      <CardFlip />
    </main>
  );
}
