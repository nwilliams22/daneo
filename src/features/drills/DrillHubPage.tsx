import { Link } from "react-router";
import PageHeader from "../../components/PageHeader";

// Flashcards/browse and quiz are separate entries by design (TASKS.md
// 2026-08-01, Nick) — study and test are different intents.
const DRILLS: {
  to: string;
  ko: string;
  title: string;
  blurb: string;
  available: boolean;
}[] = [
  {
    to: "/drill/confusables/flashcards",
    ko: "ㅘ",
    title: "Confusables · Flashcards",
    blurb: "Reveal-and-grade-yourself over the look-alike letters.",
    available: true,
  },
  {
    to: "/drill/confusables/quiz",
    ko: "ㅝ",
    title: "Confusables · Quiz",
    blurb: "Four sounds, one letter — distractors from the same group.",
    available: true,
  },
  {
    to: "/drill/fonts",
    ko: "가",
    title: "Cross-Font Reading",
    blurb: "The same letter in Gothic, Myeongjo, and handwriting.",
    available: true,
  },
  {
    to: "/drill/anatomy",
    ko: "요",
    title: "Sentence Anatomy",
    blurb: "Trace chunks across three layers, then arrange the pieces.",
    available: true,
  },
  {
    to: "/drill/anatomy?mode=label",
    ko: "주",
    title: "Sentence Roles",
    blurb: "Find the subject, object, place, and verb — label the pieces yourself.",
    available: true,
  },
  {
    to: "/drill/gap/browse",
    ko: "정",
    title: "Literal vs. Real · Browse",
    blurb: "Read the expressions where word-for-word translation misleads.",
    available: true,
  },
  {
    to: "/drill/gap/quiz",
    ko: "눈",
    title: "Literal vs. Real · Quiz",
    blurb: "You get the literal reading — guess what it actually means.",
    available: true,
  },
  {
    to: "/drill/typing",
    ko: "한",
    title: "Typing",
    blurb: "Type Korean on the real 2-beolsik layout — no OS setup needed.",
    available: true,
  },
];

export default function DrillHubPage() {
  return (
    <div>
      <PageHeader
        eyebrow="한글 · Drill"
        title="Drills"
        blurb="Study modes and quiz modes, each their own door — pick how you want the letters, structures, and gaps to stick."
      />
      <div className="flex flex-col gap-3">
        {DRILLS.map((d) =>
          d.available ? (
            <Link
              key={d.to}
              to={d.to}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-panel px-5 py-4 transition-colors hover:border-teal"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-paper font-korean text-2xl">
                {d.ko}
              </span>
              <div>
                <div className="text-[15px] font-bold">{d.title}</div>
                <div className="mt-0.5 text-[13px] leading-snug text-muted">
                  {d.blurb}
                </div>
              </div>
            </Link>
          ) : (
            <div
              key={d.to}
              className="flex items-center gap-4 rounded-2xl border border-dashed border-line px-5 py-4 opacity-60"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-panel font-korean text-2xl text-muted">
                {d.ko}
              </span>
              <div>
                <div className="text-[15px] font-bold text-muted">
                  {d.title}
                  <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                    soon
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] leading-snug text-muted">
                  {d.blurb}
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
