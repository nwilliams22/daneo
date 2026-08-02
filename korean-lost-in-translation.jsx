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

const CATS = [
  { key: "structure", label: "Grammar mismatches", color: C.teal },
  { key: "phrase", label: "Literal vs. actual", color: C.clay },
  { key: "concept", label: "Untranslatables", color: C.gold },
];

// lit = word-for-word literal translation; real = what it actually means/when used
const ITEMS = [
  // --- Structural mismatches ---
  {
    cat: "structure",
    ko: "있어요 / 없어요",
    rom: "isseoyo / eopseoyo",
    lit: "exists / doesn't exist",
    real: "have / don't have",
    note:
      "Korean has no verb 'to have' for possession in everyday speech. 'I have time' is 시간이 있어요 — 'time exists (for me).' The owner is just understood.",
  },
  {
    cat: "structure",
    ko: "맛있어요",
    rom: "masisseoyo",
    lit: "taste exists",
    real: "it's delicious",
    note:
      "맛 (taste) + 있다 (exists). Its opposite, 맛없어요, is literally 'taste doesn't exist' = it tastes bad. The 'exists' pattern builds many words.",
  },
  {
    cat: "structure",
    ko: "우리 엄마 / 우리 집",
    rom: "uri eomma / uri jip",
    lit: "our mom / our house",
    real: "my mom / my house",
    note:
      "Koreans say 'our' for things tied to a shared group — family, home, country, company — even when speaking only for themselves. Saying 내 엄마 ('my mom') sounds oddly possessive.",
  },
  {
    cat: "structure",
    ko: "배고파요",
    rom: "baegopayo",
    lit: "stomach is hungry",
    real: "I'm hungry",
    note:
      "The body part is the subject: 배 (stomach/belly) + 고프다. No 'I' needed — context supplies it. Same family: 배불러요 ('stomach is full') = I'm full.",
  },
  {
    cat: "structure",
    ko: "머리가 좋아요",
    rom: "meoriga joayo",
    lit: "head is good",
    real: "(someone) is smart",
    note:
      "Qualities are often expressed through body parts: a good head = intelligence. Its cousin 눈이 높다 ('eyes are high') means having picky standards.",
  },
  // --- Literal vs actual phrases ---
  {
    cat: "phrase",
    ko: "밥 먹었어요?",
    rom: "bap meogeosseoyo?",
    lit: "did you eat rice?",
    real: "hi, how are you?",
    note:
      "A warm everyday greeting, historically rooted in times when a full meal wasn't guaranteed. Nobody is actually asking about your meal — answer 네 (yes) and greet back.",
  },
  {
    cat: "phrase",
    ko: "잘 먹겠습니다",
    rom: "jal meokgesseumnida",
    lit: "I will eat well",
    real: "thanks for the meal (before eating)",
    note:
      "Said before a meal to the cook or host — gratitude packaged as a promise. Its bookend, 잘 먹었습니다 ('I ate well'), is said after finishing.",
  },
  {
    cat: "phrase",
    ko: "수고하셨습니다",
    rom: "sugohasyeosseumnida",
    lit: "you underwent hardship",
    real: "good work today / thanks for your effort",
    note:
      "The standard sign-off with coworkers, staff, or anyone who did work — acknowledging effort itself rather than results. English has no everyday equivalent.",
  },
  {
    cat: "phrase",
    ko: "화이팅!",
    rom: "hwaiting!",
    lit: "fighting!",
    real: "you can do it! / good luck!",
    note:
      "Borrowed from English 'fighting' but repurposed as pure encouragement — before exams, interviews, games. Nothing combative about it.",
  },
  {
    cat: "phrase",
    ko: "시원해요",
    rom: "siwonhaeyo",
    lit: "it's cool / refreshing",
    real: "this hits the spot (even about hot soup!)",
    note:
      "Famously said while eating scalding-hot soup or sitting in a hot bath. It describes the refreshed, unblocked feeling — not the temperature.",
  },
  {
    cat: "phrase",
    ko: "어디 가요?",
    rom: "eodi gayo?",
    lit: "where are you going?",
    real: "hey! (casual greeting in passing)",
    note:
      "Between neighbors and acquaintances this is often just a greeting, not an interrogation. A vague answer like 그냥요 ('just...') is completely fine.",
  },
  // --- Untranslatable concepts ---
  {
    cat: "concept",
    ko: "눈치",
    rom: "nunchi",
    lit: "eye-measure",
    real: "the art of reading a room",
    note:
      "The skill of sensing others' moods and the unspoken situation. You can have fast 눈치, lack it (눈치 없다), or 'see 눈치' (눈치를 보다) — anxiously gauging others' reactions.",
  },
  {
    cat: "concept",
    ko: "정",
    rom: "jeong",
    lit: "(no literal parts)",
    real: "deep attachment that grows over time",
    note:
      "The bond that accumulates between people who share time — friends, family, even a grumpy neighbor. You can have 정 for someone you don't especially like. It explains a lot of Korean social life.",
  },
  {
    cat: "concept",
    ko: "답답해요",
    rom: "dapdaphaeyo",
    lit: "it's stuffy / blocked",
    real: "frustrated-suffocated feeling",
    note:
      "The specific feeling of a blocked chest: slow wifi, a friend who won't take advice, a stuck situation, an airless room. Physical and emotional at once — English needs a whole sentence for it.",
  },
  {
    cat: "concept",
    ko: "아쉬워요",
    rom: "aswiwoyo",
    lit: "it's lacking / a shame",
    real: "bittersweet 'I wish it weren't over/so'",
    note:
      "The soft regret when something good ends too soon or almost worked out — leaving a great trip, losing narrowly, a friend moving away. Not sad exactly; wistful.",
  },
  {
    cat: "concept",
    ko: "그냥",
    rom: "geunyang",
    lit: "just / merely",
    real: "no reason / just because",
    note:
      "The universal answer to 'why?' when there is no why. 왜 왔어요? (Why'd you come?) — 그냥. It deflects gently without being rude. Massively common in real speech.",
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

export default function LostInTranslation() {
  const [cat, setCat] = useState("structure");
  const [open, setOpen] = useState(null);
  const [mode, setMode] = useState("browse"); // browse | quiz
  // quiz state
  const [qOrder, setQOrder] = useState(() => shuffle(ITEMS));
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState({ right: 0, seen: 0 });

  const list = useMemo(() => ITEMS.filter((x) => x.cat === cat), [cat]);
  const q = qOrder[qi];

  const options = useMemo(() => {
    if (!q) return [];
    const others = shuffle(ITEMS.filter((x) => x !== q && x.real !== q.real)).slice(0, 3);
    return shuffle([q, ...others]);
  }, [q]);

  const pick = (o) => {
    if (picked) return;
    setPicked(o);
    setScore((s) => ({ right: s.right + (o === q ? 1 : 0), seen: s.seen + 1 }));
  };

  const nextQ = () => {
    setPicked(null);
    setQi((i) => (i + 1) % qOrder.length);
  };

  const catColor = (k) => CATS.find((c) => c.key === k)?.color || C.ink;

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
            한국어 · Lost in translation
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
            What It Says vs. What It Means
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
            Expressions where word-for-word translation misleads you — the gap between
            the literal and the real meaning is the lesson.
          </p>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: C.panel,
            borderRadius: 12,
            marginBottom: 14,
            border: `1px solid ${C.line}`,
          }}
        >
          {["browse", "quiz"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontFamily: UFONT,
                fontSize: 14,
                fontWeight: 600,
                textTransform: "capitalize",
                background: mode === m ? C.ink : "transparent",
                color: mode === m ? C.paper : C.muted,
                transition: "all .15s ease",
              }}
            >
              {m === "quiz" ? "Guess the meaning" : "Browse"}
            </button>
          ))}
        </div>

        {mode === "browse" && (
          <>
            {/* Category chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {CATS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setCat(c.key);
                    setOpen(null);
                  }}
                  style={{
                    fontFamily: UFONT,
                    fontSize: 13,
                    padding: "7px 13px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${cat === c.key ? c.color : C.line}`,
                    background: cat === c.key ? c.color : "transparent",
                    color: cat === c.key ? "#fff" : C.muted,
                    transition: "all .15s ease",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {list.map((item) => {
                const isOpen = open === item.ko;
                const col = catColor(item.cat);
                return (
                  <div
                    key={item.ko}
                    onClick={() => setOpen(isOpen ? null : item.ko)}
                    style={{
                      background: C.panel,
                      border: `1px solid ${C.line}`,
                      borderLeft: `3px solid ${col}`,
                      borderRadius: 14,
                      padding: "14px 16px",
                      cursor: "pointer",
                      transition: "all .15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontFamily: KFONT, fontSize: 21, fontWeight: 600 }}>
                        {item.ko}
                      </span>
                      <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>
                        {item.rom}
                      </span>
                    </div>

                    {/* literal → real */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: C.muted,
                          textDecoration: isOpen ? "line-through" : "none",
                          textDecorationColor: C.clay,
                        }}
                      >
                        “{item.lit}”
                      </span>
                      <span style={{ color: C.muted, fontSize: 13 }}>→</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: col }}>
                        {item.real}
                      </span>
                    </div>

                    {isOpen && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: `1px solid ${C.line}`,
                          fontSize: 13.5,
                          color: C.muted,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 12 }}>
              Tap a card for the story behind it.
            </p>
          </>
        )}

        {mode === "quiz" && q && (
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 20,
              padding: "24px 20px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: KFONT, fontSize: 30, fontWeight: 600 }}>{q.ko}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>{q.rom}</div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 10 }}>
                literally: <i>“{q.lit}”</i>
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 10 }}>
                …but what does it really mean?
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {options.map((o) => {
                let bg = "transparent",
                  bd = C.line,
                  col = C.ink;
                if (picked) {
                  if (o === q) {
                    bg = C.teal;
                    bd = C.teal;
                    col = "#fff";
                  } else if (o === picked) {
                    bg = C.clay;
                    bd = C.clay;
                    col = "#fff";
                  } else {
                    col = C.muted;
                  }
                }
                return (
                  <button
                    key={o.ko}
                    onClick={() => pick(o)}
                    disabled={!!picked}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${bd}`,
                      background: bg,
                      color: col,
                      fontFamily: UFONT,
                      fontSize: 14.5,
                      fontWeight: 600,
                      textAlign: "left",
                      cursor: picked ? "default" : "pointer",
                      transition: "all .12s ease",
                    }}
                  >
                    {o.real}
                  </button>
                );
              })}
            </div>

            {picked && (
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    color: C.muted,
                    lineHeight: 1.6,
                    paddingTop: 12,
                    borderTop: `1px solid ${C.line}`,
                  }}
                >
                  {q.note}
                </div>
                <button
                  onClick={nextQ}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    background: C.ink,
                    color: C.paper,
                    fontFamily: UFONT,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            )}

            <div
              style={{
                marginTop: 14,
                textAlign: "center",
                fontSize: 12.5,
                color: C.muted,
              }}
            >
              <b style={{ color: C.ink }}>{score.right}</b>/{score.seen} correct
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
