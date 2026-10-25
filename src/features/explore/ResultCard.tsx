import { saveTranslation } from "../../db/repo";
import AudioButton from "../../components/AudioButton";
import Rom from "../../components/Rom";
import type { Role, TranslationResult } from "../../types";

const ROLE_TEXT: Record<Role, string> = {
  subject: "text-teal border-teal",
  object: "text-clay border-clay",
  place: "text-gold border-gold",
  verb: "text-ink border-ink",
  other: "text-ink border-line",
};

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-[10px] tracking-[0.15em] text-muted uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

export default function ResultCard({
  result,
  onSaved,
  savedId,
}: {
  result: TranslationResult;
  onSaved: (id: number) => void;
  savedId: number | null;
}) {
  const hasGap = result.literal_gap.trim().length > 0;

  return (
    <div className="mt-4 rounded-panel bg-card shadow-panel px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 font-korean text-[26px] leading-snug font-semibold">
            {result.korean}
            <AudioButton text={result.korean} />
          </div>
          <Rom text={result.romanization} className="mt-0.5 block" />
        </div>
        <button
          onClick={async () => {
            if (savedId !== null) return;
            const id = await saveTranslation(result);
            onSaved(Number(id));
          }}
          disabled={savedId !== null}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-opacity ${
            savedId !== null
              ? "border border-jade text-jade"
              : "bg-teal text-on-accent hover:opacity-90"
          }`}
        >
          {savedId !== null ? "Saved ✓" : "Save to deck"}
        </button>
      </div>

      <div className="mt-3 text-[15.5px] font-semibold">
        “{result.natural_english}”
      </div>

      {result.gloss.length > 0 && (
        <Section label="English, in Korean order">
          <div className="flex flex-wrap gap-1.5">
            {result.gloss.map((g, i) => (
              <span
                key={i}
                title={g.chunk}
                className={`inline-flex items-baseline gap-1.5 rounded-lg border-[1.5px] bg-paper px-2.5 py-1 text-sm font-semibold ${ROLE_TEXT[g.role]}`}
              >
                {g.gloss}
                <span className="font-korean text-xs font-normal text-muted">
                  {g.chunk}
                </span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {result.particles.length > 0 && (
        <Section label="What the particles are doing">
          <div className="flex flex-col gap-1.5">
            {result.particles.map((p, i) => (
              <div key={i} className="flex items-baseline gap-2.5">
                <span className="min-w-9 shrink-0 font-korean text-[15px] font-bold text-teal">
                  {p.particle}
                </span>
                <span className="text-[13px] leading-relaxed text-muted">
                  {p.job}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {hasGap && (
        <Section label="Literal vs. real">
          <div className="border-l-[3px] border-clay pl-3 text-[13.5px] leading-relaxed">
            {result.literal_gap}
          </div>
        </Section>
      )}

      {result.cultural_note.trim().length > 0 && (
        <Section label="Cultural note">
          <div className="border-l-[3px] border-gold pl-3 text-[13.5px] leading-relaxed">
            {result.cultural_note}
          </div>
        </Section>
      )}

      {savedId !== null && hasGap && (
        <p className="mt-4 text-center text-[11.5px] text-muted">
          Saved — and because it has a literal-vs-real gap, it's now in the Gap
          deck and the review schedule.
        </p>
      )}
    </div>
  );
}

