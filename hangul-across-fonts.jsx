import React, { useState, useEffect } from "react";

const C = {
  paper: "#E7E4DA",
  panel: "#F3F1EA",
  ink: "#23262C",
  muted: "#8A8578",
  teal: "#2C6E63",
  clay: "#B4573D",
  line: "rgba(35,38,44,0.10)",
  grid: "rgba(35,38,44,0.09)",
};

const UFONT = "'Inter','Helvetica Neue',Arial,sans-serif";
// Font stacks: Google first, then OS Korean fonts as fallback.
const F_SANS =
  "'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic','Nanum Gothic',sans-serif";
const F_SERIF =
  "'Noto Serif KR','AppleMyungjo','Batang','Nanum Myeongjo',serif";
const F_HAND = "'Nanum Pen Script','Gaegu',cursive";

const FACES = [
  { key: "sans", font: F_SANS, ko: "고딕", en: "Gothic", use: "apps · screens · signage" },
  { key: "serif", font: F_SERIF, ko: "명조 · 바탕", en: "Myeongjo", use: "books · print · formal" },
  { key: "hand", font: F_HAND, ko: "손글씨", en: "Handwriting", use: "notes · menus · signs" },
];

const ROWS = [
  { c: "ㄱ", r: "g", n: "Sans: a sharp corner. Serif: a beak at the top-right and a tapering leg. By hand: often one curved stroke." },
  { c: "ㅅ", r: "s", n: "Sans: a symmetric tent. Serif: the left stroke grows a beak and leans. By hand: more like a check mark." },
  { c: "ㅈ", r: "j", n: "The top: a flat bar in Gothic, a slanted beaked stroke in Myeongjo, often a separate slash by hand." },
  { c: "ㅊ", r: "ch", n: "The top mark is a short horizontal in Gothic, but a slanted dash or dot in serif and handwriting." },
  { c: "ㅎ", r: "h", n: "The 'hat' is a flat line in Gothic, a slanted stroke or dot in Myeongjo, and often a little loop by hand." },
  { c: "ㅍ", r: "p", n: "Sans: a tidy table. Serif: the two legs taper and pick up beaks at the feet." },
  { c: "ㄹ", r: "r / l", n: "The joints square off in print but round into a single squiggle in handwriting." },
  { c: "ㅌ", r: "t", n: "Stable overall — but serif adds small beaks to the end of each of the three bars." },
];

const WORDS = ["한국어", "감사합니다", "좋아요", "있어요", "커피", "사람"];

export default function HangulAcrossFonts() {
  const [openRow, setOpenRow] = useState(null);
  const [word, setWord] = useState("한국어");

  useEffect(() => {
    const id = "gf-korean";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600&family=Noto+Serif+KR:wght@400;600&family=Nanum+Pen+Script&display=swap";
    document.head.appendChild(link);
  }, []);

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
            한글 · One letter, many faces
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
            Reading Across Fonts
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
            The same letter, shown in three faces. Read across each row until your eye
            files them as one character.
          </p>
        </div>

        {/* Legend: the three faces, each showing 가 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FACES.map((f) => (
            <div
              key={f.key}
              style={{
                flex: 1,
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderRadius: 14,
                padding: "12px 8px 11px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: f.font, fontSize: 40, lineHeight: 1, color: C.ink }}>
                가
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>{f.ko}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{f.en}</div>
              <div style={{ fontSize: 9.5, color: C.muted, marginTop: 5, lineHeight: 1.4 }}>
                {f.use}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison grid */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {/* column header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "58px 1fr 1fr 1fr",
              alignItems: "center",
              padding: "9px 6px",
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <div />
            {FACES.map((f) => (
              <div
                key={f.key}
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: C.muted,
                }}
              >
                {f.en}
              </div>
            ))}
          </div>

          {ROWS.map((row) => {
            const open = openRow === row.c;
            return (
              <div key={row.c} style={{ borderBottom: `1px solid ${C.line}` }}>
                <button
                  onClick={() => setOpenRow(open ? null : row.c)}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "58px 1fr 1fr 1fr",
                    alignItems: "center",
                    padding: "10px 6px",
                    border: "none",
                    background: open ? C.paper : "transparent",
                    cursor: "pointer",
                    transition: "background .15s ease",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.teal }}>
                      {row.r}
                    </div>
                  </div>
                  {FACES.map((f) => (
                    <div
                      key={f.key}
                      style={{
                        textAlign: "center",
                        fontFamily: f.font,
                        fontSize: 44,
                        lineHeight: 1,
                        color: C.ink,
                      }}
                    >
                      {row.c}
                    </div>
                  ))}
                </button>
                {open && (
                  <div
                    style={{
                      padding: "0 16px 14px",
                      fontSize: 13,
                      color: C.muted,
                      lineHeight: 1.55,
                    }}
                  >
                    {row.n}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ padding: "8px 12px", fontSize: 11, color: C.muted, textAlign: "center" }}>
            Tap a letter for what changes
          </div>
        </div>

        {/* Words across fonts */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: 10,
              paddingLeft: 2,
            }}
          >
            Whole words
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {WORDS.map((w) => (
              <button
                key={w}
                onClick={() => setWord(w)}
                style={{
                  fontFamily: F_SANS,
                  fontSize: 15,
                  padding: "7px 13px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: `1px solid ${word === w ? C.ink : C.line}`,
                  background: word === w ? C.ink : "transparent",
                  color: word === w ? C.paper : C.muted,
                  transition: "all .15s ease",
                }}
              >
                {w}
              </button>
            ))}
          </div>
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {FACES.map((f, i) => (
              <div
                key={f.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: i < FACES.length - 1 ? `1px solid ${C.line}` : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: f.font,
                    fontSize: 34,
                    lineHeight: 1.1,
                    color: C.ink,
                  }}
                >
                  {word}
                </span>
                <span style={{ fontSize: 11, color: C.muted, textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  {f.en}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            fontSize: 11,
            color: C.muted,
            lineHeight: 1.5,
            marginTop: 18,
            textAlign: "center",
          }}
        >
          If the three columns look identical, the web fonts didn't load on your device —
          your system may only have one Korean font installed.
        </p>
      </div>
    </div>
  );
}
