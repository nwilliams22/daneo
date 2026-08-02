import { Link } from "react-router";
import PageHeader from "../../components/PageHeader";

const DRILLS: {
  to: string;
  ko: string;
  title: string;
  blurb: string;
  available: boolean;
}[] = [
  {
    to: "/drill/confusables",
    ko: "ㅘ",
    title: "Confusables",
    blurb: "Look-alike letters drilled as contrasts — flashcards and quiz.",
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
    to: "/drill/gap",
    ko: "정",
    title: "Literal vs. Real",
    blurb: "Where word-for-word translation misleads you.",
    available: true,
  },
  {
    to: "/drill/typing",
    ko: "한",
    title: "Typing",
    blurb: "Type Korean on the real 2-beolsik layout — no OS setup needed.",
    available: false,
  },
];

export default function DrillHubPage() {
  return (
    <div>
      <PageHeader
        eyebrow="한글 · Drill"
        title="Drills"
        blurb="Five ways to make the letters, structures, and gaps stick."
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
