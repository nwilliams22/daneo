import React, { useState, useMemo } from "react";

// ---- Palette (inline styles for exact control) ----
const C = {
  paper: "#E7E4DA",
  panel: "#F3F1EA",
  ink: "#23262C",
  muted: "#8A8578",
  teal: "#2C6E63",
  clay: "#B4573D",
  line: "rgba(35,38,44,0.10)",
  gridline: "rgba(35,38,44,0.09)",
};

const KFONT =
  "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic','Nanum Gothic',sans-serif";
const UFONT = "'Inter','Helvetica Neue',Arial,sans-serif";

// ---- Data: confusable characters grouped by what they're mixed up with ----
const CHARS = [
  // Compound vowels
  { c: "ㅘ", r: "wa", g: "compound", n: "ㅗ + ㅏ. Don't flip it with ㅝ (wo)." },
  { c: "ㅝ", r: "wo", g: "compound", n: "ㅜ + ㅓ. The mirror of ㅘ (wa)." },
  { c: "ㅙ", r: "wae", g: "compound", n: "ㅗ + ㅐ. Sounds like ㅚ and ㅞ — all ≈ 'we'." },
  { c: "ㅞ", r: "we", g: "compound", n: "ㅜ + ㅔ. Same sound as ㅙ / ㅚ." },
  { c: "ㅚ", r: "oe", g: "compound", n: "ㅗ + ㅣ. Modern sound ≈ 'we', not 'oh-eh'." },
  { c: "ㅟ", r: "wi", g: "compound", n: "ㅜ + ㅣ. 'wee'. Pairs with ㅚ." },
  { c: "ㅢ", r: "ui", g: "compound", n: "ㅡ + ㅣ. The only flat-then-tall one." },
  // Look-alike vowels
  { c: "ㅏ", r: "a", g: "vowel", n: "One stroke, right side. Add a stroke → ㅑ (ya)." },
  { c: "ㅑ", r: "ya", g: "vowel", n: "Two strokes = the 'y' version of ㅏ (a)." },
  { c: "ㅓ", r: "eo", g: "vowel", n: "Stroke on the left. Add a stroke → ㅕ (yeo)." },
  { c: "ㅕ", r: "yeo", g: "vowel", n: "The 'y' version of ㅓ (eo)." },
  { c: "ㅗ", r: "o", g: "vowel", n: "Stroke points up. ㅛ (yo) adds a stroke." },
  { c: "ㅛ", r: "yo", g: "vowel", n: "The 'y' version of ㅗ (o)." },
  { c: "ㅜ", r: "u", g: "vowel", n: "Stroke points down. ㅠ (yu) adds a stroke." },
  { c: "ㅠ", r: "yu", g: "vowel", n: "The 'y' version of ㅜ (u)." },
  { c: "ㅐ", r: "ae", g: "vowel", n: "ㅏ + ㅣ. Nearly identical in sound to ㅔ (e)." },
  { c: "ㅔ", r: "e", g: "vowel", n: "ㅓ + ㅣ. Sound has merged with ㅐ (ae)." },
  { c: "ㅡ", r: "eu", g: "vowel", n: "Flat line only. Not ㅜ (u), which has a downstroke." },
  // Look-alike consonants
  { c: "ㅁ", r: "m", g: "consonant", n: "Closed box. ㅂ (b) opens at the top." },
  { c: "ㅂ", r: "b", g: "consonant", n: "Uprights with an open top. Not ㅁ (m)." },
  { c: "ㄴ", r: "n", g: "consonant", n: "An 'L' shape. Add a top line → ㄷ (d)." },
  { c: "ㄷ", r: "d", g: "consonant", n: "Bracket ⊏. ㅌ (t) adds a bar; ㄹ zigzags." },
  { c: "ㅌ", r: "t", g: "consonant", n: "ㄷ with a middle bar = aspirated." },
  { c: "ㄹ", r: "r / l", g: "consonant", n: "The zigzag. Not ㄷ (d) or ㅌ (t)." },
  { c: "ㅅ", r: "s", g: "consonant", n: "Base shape. ㅈ adds a roof; ㅊ adds more." },
  { c: "ㅈ", r: "j", g: "consonant", n: "ㅅ with a roof. ㅊ (ch) adds one more stroke." },
  { c: "ㅊ", r: "ch", g: "consonant", n: "ㅈ plus a top stroke = aspirated." },
  { c: "ㅇ", r: "ng / silent", g: "consonant", n: "Plain circle (silent up front). ㅎ has a hat." },
  { c: "ㅎ", r: "h", g: "consonant", n: "Circle with a hat on top. Not ㅇ." },
  { c: "ㄱ", r: "g", g: "consonant", n: "Corner shape. ㅋ (k) adds a middle stroke." },
  { c: "ㅋ", r: "k", g: "consonant", n: "ㄱ with a middle stroke = aspirated." },
  // Aspirated & tense
  { c: "ㅍ", r: "p", g: "tense", n: "Aspirated ㅂ. Table shape — not ㅁ / ㅂ." },
  { c: "ㄲ", r: "kk", g: "tense", n: "Doubled ㄱ = tense, tight sound." },
  { c: "ㄸ", r: "tt", g: "tense", n: "Doubled ㄷ = tense." },
  { c: "ㅃ", r: "pp", g: "tense", n: "Doubled ㅂ = tense." },
  { c: "ㅆ", r: "ss", g: "tense", n: "Doubled ㅅ = tense." },
  { c: "ㅉ", r: "jj", g: "tense", n: "Doubled ㅈ = tense." },
];

const SETS = [
  { key: "all", label: "Everything" },
  { key: "compound", label: "Compound vowels" },
  { key: "vowel", label: "Look-alike vowels" },
  { key: "consonant", label: "Look-alike consonants" },
  { key: "tense", label: "Aspirated & tense" },
];

const shuffle = (a) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

export default function HangulDrill() {
  const [setKey, setSetKey] = useState("compound");
  const [mode, setMode] = useState("flashcard"); // flashcard | quiz
  const [order, setOrder] = useState(() => shuffle(CHARS.filter((x) => x.g === "compound")));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState(null);
  const [seen, setSeen] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState({}); // char -> rom

  const pool = useMemo(
    () => (setKey === "all" ? CHARS : CHARS.filter((x) => x.g === setKey)),
    [setKey]
  );

  const current = order[idx] || order[0];

  const options = useMemo(() => {
    if (!current) return [];
    const sameGroup = pool.filter((x) => x.c !== current.c);
    const distractPool = shuffle(sameGroup.length >= 3 ? sameGroup : CHARS.filter((x) => x.c !== current.c));
    const distractors = [];
    const usedRom = new Set([current.r]);
    for (const d of distractPool) {
      if (usedRom.has(d.r)) continue;
      usedRom.add(d.r);
      distractors.push(d);
      if (distractors.length === 3) break;
    }
    return shuffle([current, ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode, pool, idx]);

  const rebuild = (nextSet, nextMode) => {
    const p = nextSet === "all" ? CHARS : CHARS.filter((x) => x.g === nextSet);
    setOrder(shuffle(p));
    setIdx(0);
    setRevealed(false);
    setPicked(null);
    setSeen(0);
    setCorrect(0);
    setMissed({});
    setSetKey(nextSet);
    if (nextMode) setMode(nextMode);
  };

  const advance = () => {
    setRevealed(false);
    setPicked(null);
    setIdx((i) => (i + 1) % order.length);
  };

  const markFlash = (got) => {
    setSeen((s) => s + 1);
    if (got) setCorrect((c) => c + 1);
    else setMissed((m) => ({ ...m, [current.c]: current.r }));
    advance();
  };

  const pickQuiz = (opt) => {
    if (picked) return;
    setPicked(opt);
    setSeen((s) => s + 1);
    if (opt.c === current.c) {
      setCorrect((c) => c + 1);
      setTimeout(advance, 650);
    } else {
      setMissed((m) => ({ ...m, [current.c]: current.r }));
      setTimeout(advance, 1300);
    }
  };

  const pct = seen ? Math.round((correct / seen) * 100) : 0;
  const missedList = Object.entries(missed);

  const chip = (active) => ({
    fontFamily: UFONT,
    fontSize: 13,
    letterSpacing: 0.2,
    padding: "7px 13px",
    borderRadius: 999,
    cursor: "pointer",
    border: `1px solid ${active ? C.ink : C.line}`,
    background: active ? C.ink : "transparent",
    color: active ? C.paper : C.muted,
    transition: "all .15s ease",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        color: C.ink,
        fontFamily: UFONT,
        padding: "28px 18px 48px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: 6,
            }}
          >
            한글 · Confusables
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
            Look-alike Drill
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
            Train the distinctions, not just the letters. Each reveal shows what it gets
            mistaken for.
          </p>
        </div>

        {/* Set selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {SETS.map((s) => (
            <button key={s.key} style={chip(setKey === s.key)} onClick={() => rebuild(s.key)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: C.panel,
            borderRadius: 12,
            marginBottom: 18,
            border: `1px solid ${C.line}`,
          }}
        >
          {["flashcard", "quiz"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setRevealed(false);
                setPicked(null);
              }}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontFamily: UFONT,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 0.2,
                textTransform: "capitalize",
                background: mode === m ? C.ink : "transparent",
                color: mode === m ? C.paper : C.muted,
                transition: "all .15s ease",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Card */}
        <div
          style={{
            background: C.panel,
            borderRadius: 20,
            border: `1px solid ${C.line}`,
            padding: "26px 22px",
            boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
          }}
        >
          {/* Practice-grid square (원고지 nod) */}
          <div
            onClick={() => mode === "flashcard" && setRevealed(true)}
            style={{
              position: "relative",
              width: 172,
              height: 172,
              margin: "4px auto 20px",
              borderRadius: 14,
              background: C.paper,
              border: `1px solid ${C.line}`,
              cursor: mode === "flashcard" && !revealed ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* crosshair guides */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 10,
                bottom: 10,
                width: 1,
                background: C.gridline,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 10,
                right: 10,
                height: 1,
                background: C.gridline,
              }}
            />
            <span
              style={{
                fontFamily: KFONT,
                fontSize: 96,
                lineHeight: 1,
                fontWeight: 500,
                color: C.ink,
                userSelect: "none",
              }}
            >
              {current?.c}
            </span>
          </div>

          {/* FLASHCARD body */}
          {mode === "flashcard" && (
            <div>
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  style={{
                    width: "100%",
                    padding: "13px 0",
                    borderRadius: 12,
                    border: `1px solid ${C.line}`,
                    background: "transparent",
                    color: C.muted,
                    fontFamily: UFONT,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Tap to reveal
                </button>
              ) : (
                <div>
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
                      {current.r}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        color: C.muted,
                        lineHeight: 1.5,
                        maxWidth: 320,
                        margin: "8px auto 0",
                      }}
                    >
                      {current.n}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                      onClick={() => markFlash(false)}
                      style={{
                        flex: 1,
                        padding: "13px 0",
                        borderRadius: 12,
                        border: `1px solid ${C.clay}`,
                        background: "transparent",
                        color: C.clay,
                        fontFamily: UFONT,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Missed it
                    </button>
                    <button
                      onClick={() => markFlash(true)}
                      style={{
                        flex: 1,
                        padding: "13px 0",
                        borderRadius: 12,
                        border: "none",
                        background: C.teal,
                        color: "#fff",
                        fontFamily: UFONT,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Got it
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUIZ body */}
          {mode === "quiz" && (
            <div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: C.muted,
                  marginBottom: 12,
                }}
              >
                Which sound is this?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {options.map((o) => {
                  const isPicked = picked && picked.c === o.c;
                  const isAnswer = o.c === current.c;
                  let bg = "transparent",
                    bd = C.line,
                    col = C.ink;
                  if (picked) {
                    if (isAnswer) {
                      bg = C.teal;
                      bd = C.teal;
                      col = "#fff";
                    } else if (isPicked) {
                      bg = C.clay;
                      bd = C.clay;
                      col = "#fff";
                    } else {
                      col = C.muted;
                    }
                  }
                  return (
                    <button
                      key={o.c}
                      onClick={() => pickQuiz(o)}
                      disabled={!!picked}
                      style={{
                        padding: "15px 0",
                        borderRadius: 12,
                        border: `1px solid ${bd}`,
                        background: bg,
                        color: col,
                        fontFamily: UFONT,
                        fontSize: 17,
                        fontWeight: 600,
                        cursor: picked ? "default" : "pointer",
                        transition: "all .12s ease",
                      }}
                    >
                      {o.r}
                    </button>
                  );
                })}
              </div>
              {picked && picked.c !== current.c && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    color: C.muted,
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  {current.c} is <b style={{ color: C.ink }}>{current.r}</b> — {current.n}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            padding: "0 4px",
          }}
        >
          <div style={{ fontSize: 13, color: C.muted }}>
            <b style={{ color: C.ink }}>{correct}</b>/{seen} correct
            {seen > 0 && <span style={{ color: C.muted }}> · {pct}%</span>}
          </div>
          <button
            onClick={() => rebuild(setKey)}
            style={{
              background: "transparent",
              border: "none",
              color: C.muted,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: UFONT,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Reset
          </button>
        </div>

        {/* Missed review */}
        {missedList.length > 0 && (
          <div
            style={{
              marginTop: 18,
              padding: "14px 16px",
              background: C.panel,
              borderRadius: 14,
              border: `1px solid ${C.line}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: C.clay,
                marginBottom: 10,
              }}
            >
              Review these
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {missedList.map(([c, r]) => (
                <div
                  key={c}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    padding: "6px 11px",
                    borderRadius: 9,
                    background: C.paper,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <span style={{ fontFamily: KFONT, fontSize: 20, color: C.ink }}>{c}</span>
                  <span style={{ fontSize: 12.5, color: C.muted }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
