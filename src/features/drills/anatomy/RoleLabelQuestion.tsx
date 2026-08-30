import { useMemo, useState } from "react";
import type { Sentence } from "../../../types";
import {
  CORE_ROLES,
  gradeRoleLabels,
  hasDroppedSubject,
  roleTargets,
  type CoreRole,
  type RoleGrade,
} from "../../../lib/roleLabel";
import { sentenceEnglish } from "../../../lib/distractors";
import AudioButton from "../../../components/AudioButton";
import Rom from "../../../components/Rom";
import { NextButton } from "../engine/questions";
import { useDrillKeys } from "../engine/useDrillKeys";
import { ROLE_COLOR } from "./roles";

// The sentence-roles question (2026-08-29): the Korean sentence in plain
// tiles, the learner tags each piece subject / object / place / verb, and
// the check reveals the anatomy colours plus the sentence note. Shared by
// the anatomy drill's Label mode and the daily review queue.

const ROLE_KEY: Record<CoreRole, 1 | 2 | 3 | 4> = {
  subject: 1,
  object: 2,
  place: 3,
  verb: 4,
};

export default function RoleLabelQuestion({
  sentence,
  nextLabel,
  onAnswer,
  onNext,
}: {
  sentence: Sentence;
  nextLabel?: string;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  const targets = useMemo(() => roleTargets(sentence), [sentence]);
  const chunks = targets.map((t) => t.chunk);
  const [labels, setLabels] = useState<Map<string, CoreRole>>(new Map());
  const [selected, setSelected] = useState<string | null>(
    chunks[0]?.id ?? null,
  );
  const [grade, setGrade] = useState<RoleGrade | null>(null);
  const checked = grade !== null;

  const koText = chunks.map((c) => c.t).join(" ");

  const selectNext = () => {
    if (checked || chunks.length === 0) return;
    const i = chunks.findIndex((c) => c.id === selected);
    setSelected(chunks[(i + 1) % chunks.length]!.id);
  };

  const assign = (role: CoreRole) => {
    if (checked || selected === null) return;
    setLabels((prev) => {
      const next = new Map(prev);
      if (next.get(selected) === role) next.delete(selected);
      else next.set(selected, role);
      return next;
    });
    selectNext();
  };

  const clear = () => {
    if (checked || selected === null) return;
    setLabels((prev) => {
      if (!prev.has(selected)) return prev;
      const next = new Map(prev);
      next.delete(selected);
      return next;
    });
  };

  const check = () => {
    if (checked || labels.size === 0) return;
    const g = gradeRoleLabels(sentence, labels);
    setGrade(g);
    setSelected(null);
    onAnswer(g.correct);
  };

  useDrillKeys({
    onNumber: !checked ? (n) => assign(CORE_ROLES[n - 1]!) : undefined,
    onSpace: !checked ? selectNext : undefined,
    onBackspace: !checked ? clear : undefined,
    onEnter: checked ? onNext : labels.size > 0 ? check : undefined,
  });

  const gradedById = new Map(grade?.chunks.map((c) => [c.chunk.id, c]) ?? []);
  const dropped = hasDroppedSubject(sentence);
  const visibleSubject = chunks.some((c) => c.role === "subject");

  return (
    <div>
      <div className="text-center">
        <div className="text-[11px] tracking-[0.2em] text-muted uppercase">
          Label the parts
        </div>
        <div className="mt-1.5 text-[12.5px] text-muted">
          Tap a piece, then its role. Leave time words, adverbs, and linking
          clauses alone.{" "}
          <span className="text-[11px]">
            (Space next piece · 1–4 role · Backspace clear · Enter check)
          </span>
        </div>
      </div>

      {/* Sentence tiles */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {chunks.map((c) => {
          const given = labels.get(c.id);
          const g = gradedById.get(c.id);
          const isSel = selected === c.id;
          let border = "border-line";
          if (g) border = g.ok ? "border-teal" : "border-clay";
          else if (isSel) border = "border-ink";
          else if (given) border = ROLE_COLOR[given].border;
          const revealColor = g ? ROLE_COLOR[g.expected] : null;
          return (
            <button
              key={c.id}
              onClick={() => !checked && setSelected(c.id)}
              disabled={checked}
              className={`flex flex-col items-center rounded-xl border-[1.5px] bg-paper px-3 py-2 transition-colors ${border} ${
                isSel ? "bg-ink/5" : ""
              }`}
            >
              <span
                className={`font-korean text-2xl leading-tight ${
                  revealColor
                    ? `${revealColor.text} ${g!.expected === "verb" ? "font-bold" : ""}`
                    : "text-ink"
                }`}
              >
                {c.t}
              </span>
              <span className="mt-1 min-h-4 text-[10.5px] font-semibold tracking-wide uppercase">
                {g ? (
                  g.ok ? (
                    <span className={revealColor!.text}>
                      {g.expected === "other" ? "—" : g.expected}
                    </span>
                  ) : (
                    <span className="text-clay">
                      {g.given ?? "blank"}{" "}
                      <span className="text-muted normal-case">→</span>{" "}
                      <span className={revealColor!.text}>
                        {g.expected === "other" ? "not a part" : g.expected}
                      </span>
                    </span>
                  )
                ) : given ? (
                  <span className={ROLE_COLOR[given].text}>{given}</span>
                ) : (
                  <span className="text-muted/60">·</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Role buttons */}
      {!checked && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {CORE_ROLES.map((role) => {
            const color = ROLE_COLOR[role];
            const active = selected !== null && labels.get(selected) === role;
            return (
              <button
                key={role}
                onClick={() => assign(role)}
                disabled={selected === null}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? `${color.border} bg-ink/5 ${color.text}`
                    : "border-line text-ink hover:border-muted"
                } ${selected === null ? "opacity-50" : ""}`}
              >
                <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                {role}
                <span className="text-[10px] font-normal text-muted">
                  {ROLE_KEY[role]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!checked ? (
        <button
          onClick={check}
          disabled={labels.size === 0}
          className={`mt-3.5 w-full rounded-xl py-3 text-sm font-bold text-on-accent transition-opacity ${
            labels.size > 0 ? "bg-teal hover:opacity-90" : "bg-teal/35"
          }`}
        >
          Check labels <span className="font-normal opacity-70">(Enter)</span>
        </button>
      ) : (
        <div className="mt-3.5 border-t border-line pt-3">
          <div
            className={`text-[13.5px] font-semibold ${
              grade.correct ? "text-teal" : "text-clay"
            }`}
          >
            {grade.correct ? "Every part found." : "Not quite — see the pieces above."}
          </div>
          {dropped && !visibleSubject && (
            <div className="mt-1 text-[13px] text-muted">
              <b className="text-subject">Subject:</b> not stated — Korean
              drops it when context already says who.
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-1 text-[13px]">
            <span className="text-ink">{sentenceEnglish(sentence)}</span>
            <AudioButton text={koText} />
          </div>
          {sentence.rom && <Rom text={sentence.rom} className="mt-0.5 block" />}
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            {sentence.note}
          </p>
          <NextButton onClick={onNext} label={nextLabel} />
        </div>
      )}
    </div>
  );
}
