import { useState } from "react";
import { Link } from "react-router";
import PageHeader from "../../../components/PageHeader";
import Chip from "../../../components/Chip";
import AudioButton from "../../../components/AudioButton";
import { fontFaces } from "../../../content";
import { FACE_FONT } from "../engine/faceFont";

export default function CrossFontReader() {
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [word, setWord] = useState(fontFaces.words[0]!);

  return (
    <div>
      <Link
        to="/drill"
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← Drills
      </Link>
      <PageHeader
        eyebrow="한글 · One letter, many faces"
        title="Reading Across Fonts"
        blurb="The same letter, shown in three faces. Read across each row until your eye files them as one character."
      />

      {/* Legend: the three faces, each showing 가 */}
      <div className="mb-5 flex gap-2.5">
        {fontFaces.faces.map((f) => (
          <div
            key={f.key}
            className="flex-1 rounded-2xl border border-line bg-panel px-2 py-3 text-center"
          >
            <div className={`${FACE_FONT[f.key]} text-4xl leading-none`}>가</div>
            <div className="mt-2 font-korean text-[12.5px] font-bold">
              {f.ko}
            </div>
            <div className="text-[11px] text-muted">{f.en}</div>
            <div className="mt-1 text-[9.5px] leading-snug text-muted">
              {f.use}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison grid */}
      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="grid grid-cols-[56px_1fr_1fr_1fr] items-center border-b border-line px-1.5 py-2">
          <div />
          {fontFaces.faces.map((f) => (
            <div
              key={f.key}
              className="text-center text-[10px] tracking-wider text-muted uppercase"
            >
              {f.en}
            </div>
          ))}
        </div>
        {fontFaces.letters.map((row) => {
          const open = openRow === row.id;
          return (
            <div key={row.id} className="border-b border-line last:border-b-0">
              <button
                onClick={() => setOpenRow(open ? null : row.id)}
                className={`grid w-full grid-cols-[56px_1fr_1fr_1fr] items-center px-1.5 py-2.5 transition-colors ${
                  open ? "bg-paper" : ""
                }`}
              >
                <div className="text-center text-[12.5px] font-bold text-teal">
                  {row.r}
                </div>
                {fontFaces.faces.map((f) => (
                  <div
                    key={f.key}
                    className={`${FACE_FONT[f.key]} text-center text-[44px] leading-none`}
                  >
                    {row.c}
                  </div>
                ))}
              </button>
              {open && (
                <div className="px-4 pb-3.5 text-[13px] leading-relaxed text-muted">
                  {row.note}
                </div>
              )}
            </div>
          );
        })}
        <div className="px-3 py-2 text-center text-[11px] text-muted">
          Tap a letter for what changes
        </div>
      </div>

      {/* Whole words */}
      <div className="mt-6">
        <div className="mb-2.5 pl-0.5 text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
          Whole words
        </div>
        <div className="mb-3.5 flex flex-wrap gap-2">
          {fontFaces.words.map((w) => (
            <Chip key={w} active={word === w} onClick={() => setWord(w)}>
              <span className="font-korean">{w}</span>
            </Chip>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-panel">
          {fontFaces.faces.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between border-b border-line px-5 py-4 last:border-b-0"
            >
              <span className={`${FACE_FONT[f.key]} text-[32px] leading-tight`}>
                {word}
              </span>
              <span className="ml-3 flex shrink-0 items-center gap-1 text-[11px] text-muted">
                {f.en}
                {f.key === "gothic" && <AudioButton text={word} />}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
        Ready for more? The confusables and gap quizzes have a “Mixed fonts”
        toggle that renders prompts in a random face — Stats tracks your
        accuracy per face.
      </p>
    </div>
  );
}
