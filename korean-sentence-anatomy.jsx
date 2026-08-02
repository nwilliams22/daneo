import React, { useState, useMemo } from "react";

const C = {
  paper: "#E7E4DA",
  panel: "#F3F1EA",
  ink: "#23262C",
  muted: "#8A8578",
  teal: "#2C6E63",
  clay: "#B4573D",
  gold: "#8A6D2F",
  line: "rgba(35,38,44,0.10)",
};

const UFONT = "'Inter','Helvetica Neue',Arial,sans-serif";
const KFONT =
  "'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic','Nanum Gothic',sans-serif";

// Roles: subject (teal), object (clay), place (gold), verb (ink)
const ROLE = {
  subject: { color: C.teal, label: "subject" },
  object: { color: C.clay, label: "object" },
  place: { color: C.gold, label: "place" },
  verb: { color: C.ink, label: "verb" },
};

// Each sentence: chunks aligned across three layers.
// en = natural English (order may differ), gloss/ko follow Korean order.
// Every chunk has an id so tapping highlights across layers.
const SENTENCES = [
  {
    id: "store",
    en: [
      { t: "I", role: "subject", id: "s" },
      { t: "go", role: "verb", id: "v" },
      { t: "to the store", role: "place", id: "p" },
    ],
    gloss: [
      { t: "I-[as for]", role: "subject", id: "s" },
      { t: "store-to", role: "place", id: "p" },
      { t: "go", role: "verb", id: "v" },
    ],
    ko: [
      { t: "저는", role: "subject", id: "s" },
      { t: "가게에", role: "place", id: "p" },
      { t: "가요", role: "verb", id: "v" },
    ],
    note:
      "The subject stays first — it's the VERB that moves to the end. And 'to' isn't a separate word in front; it's the particle 에 glued onto the back of 가게 (store).",
  },
  {
    id: "water",
    en: [
      { t: "I", role: "subject", id: "s" },
      { t: "drink", role: "verb", id: "v" },
      { t: "water", role: "object", id: "o" },
    ],
    gloss: [
      { t: "I-[as for]", role: "subject", id: "s" },
      { t: "water-[obj]", role: "object", id: "o" },
      { t: "drink", role: "verb", id: "v" },
    ],
    ko: [
      { t: "저는", role: "subject", id: "s" },
      { t: "물을", role: "object", id: "o" },
      { t: "마셔요", role: "verb", id: "v" },
    ],
    note:
      "Subject–Object–Verb: 'I water drink.' The 을 on 물 is a tag that says 'this is the thing being acted on' — which is why Korean can shuffle words and still make sense.",
  },
  {
    id: "friend-coffee",
    en: [
      { t: "My friend", role: "subject", id: "s" },
      { t: "likes", role: "verb", id: "v" },
      { t: "coffee", role: "object", id: "o" },
    ],
    gloss: [
      { t: "friend-[subj]", role: "subject", id: "s" },
      { t: "coffee-[obj]", role: "object", id: "o" },
      { t: "likes", role: "verb", id: "v" },
    ],
    ko: [
      { t: "친구가", role: "subject", id: "s" },
      { t: "커피를", role: "object", id: "o" },
      { t: "좋아해요", role: "verb", id: "v" },
    ],
    note:
      "Same skeleton with a different subject: 가 marks 친구 as the do-er, 를 marks 커피 as the thing liked, verb caps it off.",
  },
  {
    id: "school-study",
    en: [
      { t: "I", role: "subject", id: "s" },
      { t: "study", role: "verb", id: "v" },
      { t: "Korean", role: "object", id: "o" },
      { t: "at school", role: "place", id: "p" },
    ],
    gloss: [
      { t: "I-[as for]", role: "subject", id: "s" },
      { t: "school-at", role: "place", id: "p" },
      { t: "Korean-[obj]", role: "object", id: "o" },
      { t: "study", role: "verb", id: "v" },
    ],
    ko: [
      { t: "저는", role: "subject", id: "s" },
      { t: "학교에서", role: "place", id: "p" },
      { t: "한국어를", role: "object", id: "o" },
      { t: "공부해요", role: "verb", id: "v" },
    ],
    note:
      "Four pieces now: subject, then place, then object, then verb. 에서 (not just 에) marks where an action happens. Typical order is S–Place–O–V, but the particles do the real work.",
  },
  {
    id: "no-time",
    en: [
      { t: "I", role: "subject", id: "s" },
      { t: "don't have", role: "verb", id: "v" },
      { t: "time", role: "object", id: "o" },
    ],
    gloss: [
      { t: "time-[subj]", role: "object", id: "o" },
      { t: "not-exist", role: "verb", id: "v" },
      { t: "(for me)", role: "subject", id: "s" },
    ],
    ko: [
      { t: "시간이", role: "object", id: "o" },
      { t: "없어요", role: "verb", id: "v" },
      { t: "", role: "subject", id: "s" },
    ],
    note:
      "A structure with no English twin: Korean says 'time not-exists' rather than 'I don't have time.' The owner (me) is simply understood and dropped — Korean omits anything obvious from context.",
  },
  {
    id: "friend-home",
    en: [
      { t: "My friend", role: "subject", id: "s" },
      { t: "comes", role: "verb", id: "v" },
      { t: "to my house", role: "place", id: "p" },
    ],
    gloss: [
      { t: "friend-[subj]", role: "subject", id: "s" },
      { t: "house-to", role: "place", id: "p" },
      { t: "comes", role: "verb", id: "v" },
    ],
    ko: [
      { t: "친구가", role: "subject", id: "s" },
      { t: "집에", role: "place", id: "p" },
      { t: "와요", role: "verb", id: "v" },
    ],
    note:
      "Same pattern as 'I go to the store' — swap the pieces, keep the skeleton. This is why learning the frame once pays off forever.",
  },
];

const shuffle = (a) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

export default function SentenceAnatomy() {
  const [si, setSi] = useState(0);
  const [hl, setHl] = useState(null); // highlighted chunk id
  const [mode, setMode] = useState("study"); // study | arrange
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(false);

  const s = SENTENCES[si];
  const answer = useMemo(
    () => s.gloss.filter((c) => c.t && !c.t.startsWith("(")),
    [s]
  );
  const [bank, setBank] = useState(() => shuffle(answer));

  const resetArrange = (sentence) => {
    const ans = sentence.gloss.filter((c) => c.t && !c.t.startsWith("("));
    setBank(shuffle(ans));
    setPlaced([]);
    setChecked(false);
  };

  const goTo = (i) => {
    setSi(i);
    setHl(null);
    resetArrange(SENTENCES[i]);
  };

  const chunkStyle = (c, layer) => {
    const active = hl === c.id;
    const role = ROLE[c.role];
    return {
      display: "inline-block",
      fontFamily: layer === "ko" ? KFONT : UFONT,
      fontSize: layer === "ko" ? 26 : layer === "gloss" ? 17 : 16,
      fontWeight: c.role === "verb" ? 700 : 500,
      color: role.color,
      background: active ? "rgba(35,38,44,0.07)" : "transparent",
      border: `1.5px solid ${active ? role.color : "transparent"}`,
      borderRadius: 10,
      padding: layer === "ko" ? "4px 10px" : "3px 9px",
      margin: "2px 3px",
      cursor: "pointer",
      transition: "all .12s ease",
      lineHeight: 1.4,
    };
  };

  const Layer = ({ label, chunks, layer }) => (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: C.muted,
          marginBottom: 4,
          paddingLeft: 4,
        }}
      >
        {label}
      </div>
      <div>
        {chunks
          .filter((c) => c.t)
          .map((c, i) => (
            <span
              key={i}
              style={chunkStyle(c, layer)}
              onClick={() => setHl(hl === c.id ? null : c.id)}
            >
              {c.t}
            </span>
          ))}
      </div>
    </div>
  );

  // ----- arrange mode logic -----
  const place = (chunk) => {
    if (checked) return;
    setBank((b) => b.filter((x) => x !== chunk));
    setPlaced((p) => [...p, chunk]);
  };
  const unplace = (chunk) => {
    if (checked) return;
    setPlaced((p) => p.filter((x) => x !== chunk));
    setBank((b) => [...b, chunk]);
  };
  const isCorrect =
    placed.length === answer.length &&
    placed.every((c, i) => c.t === answer[i].t);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        color: C.ink,
        fontFamily: UFONT,
        padding: "28px 16px 48px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 500 }}>
        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: 6,
            }}
          >
            한국어 · Sentence anatomy
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
            How Korean Orders a Sentence
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
            English → English in Korean order → Korean. Tap any piece to trace it
            through all three layers. Every word is from Module 1.
          </p>
        </div>

        {/* Sentence picker */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
          {SENTENCES.map((x, i) => (
            <button
              key={x.id}
              onClick={() => goTo(i)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                border: `1px solid ${si === i ? C.ink : C.line}`,
                background: si === i ? C.ink : "transparent",
                color: si === i ? C.paper : C.muted,
                fontFamily: UFONT,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s ease",
              }}
            >
              {i + 1}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 3,
              background: C.panel,
              borderRadius: 10,
              border: `1px solid ${C.line}`,
            }}
          >
            {["study", "arrange"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  resetArrange(s);
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: UFONT,
                  fontSize: 12.5,
                  fontWeight: 600,
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
        </div>

        {/* Card */}
        <div
          style={{
            background: C.panel,
            borderRadius: 20,
            border: `1px solid ${C.line}`,
            padding: "22px 20px",
          }}
        >
          {mode === "study" ? (
            <div>
              <Layer label="Natural English" chunks={s.en} layer="en" />
              <div
                style={{
                  textAlign: "center",
                  color: C.muted,
                  fontSize: 15,
                  margin: "2px 0 8px",
                }}
              >
                ↓ rearrange, attach particles
              </div>
              <Layer label="English, Korean order" chunks={s.gloss} layer="gloss" />
              <div
                style={{
                  textAlign: "center",
                  color: C.muted,
                  fontSize: 15,
                  margin: "2px 0 8px",
                }}
              >
                ↓ swap in the Korean words
              </div>
              <Layer label="Korean" chunks={s.ko} layer="ko" />

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: `1px solid ${C.line}`,
                  fontSize: 13.5,
                  color: C.muted,
                  lineHeight: 1.6,
                }}
              >
                {s.note}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 15, marginBottom: 4 }}>
                {s.en.map((c, i) => (
                  <span key={i} style={{ fontWeight: 600 }}>
                    {c.t}
                    {i < s.en.length - 1 ? " " : ""}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
                Arrange the pieces in Korean order.
              </div>

              {/* Answer slots */}
              <div
                style={{
                  minHeight: 52,
                  borderRadius: 12,
                  border: `1.5px dashed ${
                    checked ? (isCorrect ? C.teal : C.clay) : C.line
                  }`,
                  padding: "8px 8px",
                  marginBottom: 12,
                  background: C.paper,
                }}
              >
                {placed.map((c, i) => (
                  <span
                    key={i}
                    onClick={() => unplace(c)}
                    style={{
                      display: "inline-block",
                      fontSize: 15.5,
                      fontWeight: 600,
                      color: ROLE[c.role].color,
                      border: `1.5px solid ${ROLE[c.role].color}`,
                      borderRadius: 10,
                      padding: "6px 12px",
                      margin: 3,
                      cursor: "pointer",
                      background: C.panel,
                    }}
                  >
                    {c.t}
                  </span>
                ))}
              </div>

              {/* Bank */}
              <div style={{ marginBottom: 14 }}>
                {bank.map((c, i) => (
                  <span
                    key={i}
                    onClick={() => place(c)}
                    style={{
                      display: "inline-block",
                      fontSize: 15.5,
                      fontWeight: 600,
                      color: C.ink,
                      border: `1px solid ${C.line}`,
                      borderRadius: 10,
                      padding: "6px 12px",
                      margin: 3,
                      cursor: "pointer",
                      background: C.paper,
                    }}
                  >
                    {c.t}
                  </span>
                ))}
                {bank.length === 0 && placed.length === 0 && (
                  <span style={{ fontSize: 13, color: C.muted }}>Nothing to place.</span>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => resetArrange(s)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
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
                  Reset
                </button>
                <button
                  onClick={() => setChecked(true)}
                  disabled={placed.length !== answer.length}
                  style={{
                    flex: 2,
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    background:
                      placed.length === answer.length ? C.teal : "rgba(44,110,99,0.35)",
                    color: "#fff",
                    fontFamily: UFONT,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: placed.length === answer.length ? "pointer" : "default",
                  }}
                >
                  Check order
                </button>
              </div>

              {checked && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: isCorrect ? C.teal : C.clay,
                    fontWeight: 600,
                  }}
                >
                  {isCorrect ? (
                    <>
                      Correct — in Korean:{" "}
                      <span style={{ fontFamily: KFONT, fontSize: 17, color: C.ink }}>
                        {s.ko.map((c) => c.t).join(" ")}
                      </span>
                    </>
                  ) : (
                    <>
                      Not quite. Korean order:{" "}
                      <span style={{ color: C.ink }}>
                        {answer.map((c) => c.t).join(" · ")}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role legend */}
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            marginTop: 14,
            flexWrap: "wrap",
          }}
        >
          {Object.values(ROLE).map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: r.color,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 11.5, color: C.muted }}>{r.label}</span>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.55,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          The pattern to internalize: <b style={{ color: C.ink }}>subject first, verb last,</b>{" "}
          and the little words ('to', 'at') ride on the <i>back</i> of nouns as particles.
        </p>
      </div>
    </div>
  );
}
