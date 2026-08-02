import React, { useState } from "react";

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

const EXAMPLES = [
  "I miss my friend",
  "수고하셨습니다",
  "Have you eaten?",
  "I'm going home now",
  "눈치가 빨라요",
  "This soup hits the spot",
];

export default function CuriosityTranslator() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const translate = async (text) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const prompt = `You are the translation engine inside a word-first Korean learning app. The learner knows Hangul and basic particles. Given the input below (either English or Korean), respond with ONLY a JSON object — no markdown fences, no preamble — with these fields:

{
  "direction": "en-to-ko" or "ko-to-en",
  "korean": "the Korean sentence in polite -요 form (Hangul)",
  "romanization": "romanization of the Korean",
  "natural_english": "natural English meaning",
  "gloss": [
    {"chunk": "Korean word/chunk in Hangul", "gloss": "English-in-Korean-order gloss, writing particles as suffixes like 'store-to' or 'water-[obj]'", "role": "subject|object|place|verb|other"}
  ],
  "particles": [
    {"particle": "the particle in Hangul", "job": "one short sentence on what it does here"}
  ],
  "literal_gap": "If the literal word-for-word meaning differs from the real meaning (e.g. idioms, cultural formulas, exist-style 'have'), explain the gap in 1-2 sentences. If it maps directly, use an empty string.",
  "cultural_note": "1-2 sentences of cultural/usage context if genuinely relevant, else empty string"
}

The gloss array must follow Korean word order. Keep every field concise. Input: "${query}"`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const textOut = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const clean = textOut.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setError("Couldn't get a breakdown for that — try rephrasing or a shorter phrase.");
    } finally {
      setLoading(false);
    }
  };

  const roleColor = (r) =>
    r === "subject" ? C.teal : r === "object" ? C.clay : r === "place" ? C.gold : C.ink;

  const Section = ({ label, children }) => (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: C.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );

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
            한국어 · Curiosity translator
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
            Ask It Anything
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
            Type English or Korean. You get more than a translation — the Korean-order
            gloss, what each particle is doing, and where the literal meaning and the
            real meaning part ways.
          </p>
        </div>

        {/* Input */}
        <div
          style={{
            display: "flex",
            gap: 8,
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            padding: 6,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && translate()}
            placeholder="e.g. “I miss my friend” or 수고하셨습니다"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: UFONT,
              fontSize: 15,
              color: C.ink,
              padding: "10px 10px",
            }}
          />
          <button
            onClick={() => translate()}
            disabled={loading || !input.trim()}
            style={{
              padding: "0 18px",
              borderRadius: 10,
              border: "none",
              background: loading || !input.trim() ? "rgba(44,110,99,0.35)" : C.teal,
              color: "#fff",
              fontFamily: UFONT,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || !input.trim() ? "default" : "pointer",
            }}
          >
            {loading ? "…" : "Break it down"}
          </button>
        </div>

        {/* Example chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setInput(ex);
                translate(ex);
              }}
              style={{
                fontFamily: /[가-힣]/.test(ex) ? KFONT : UFONT,
                fontSize: 12.5,
                padding: "6px 11px",
                borderRadius: 999,
                border: `1px solid ${C.line}`,
                background: "transparent",
                color: C.muted,
                cursor: "pointer",
              }}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div
            style={{
              marginTop: 22,
              textAlign: "center",
              color: C.muted,
              fontSize: 13.5,
            }}
          >
            Consulting the language brain…
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${C.clay}`,
              color: C.clay,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              marginTop: 18,
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 20,
              padding: "20px 20px 22px",
            }}
          >
            {/* Korean */}
            <div style={{ fontFamily: KFONT, fontSize: 28, fontWeight: 600, lineHeight: 1.35 }}>
              {result.korean}
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>
              {result.romanization}
            </div>

            {/* Natural English */}
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>
              “{result.natural_english}”
            </div>

            {/* Korean-order gloss */}
            {Array.isArray(result.gloss) && result.gloss.length > 0 && (
              <Section label="English, in Korean order">
                <div>
                  {result.gloss.map((g, i) => (
                    <span
                      key={i}
                      title={g.chunk}
                      style={{
                        display: "inline-block",
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: roleColor(g.role),
                        border: `1.5px solid ${roleColor(g.role)}`,
                        borderRadius: 10,
                        padding: "4px 10px",
                        margin: "3px 4px 3px 0",
                        background: C.paper,
                      }}
                    >
                      {g.gloss}
                      <span
                        style={{
                          fontFamily: KFONT,
                          fontWeight: 400,
                          color: C.muted,
                          fontSize: 12,
                          marginLeft: 7,
                        }}
                      >
                        {g.chunk}
                      </span>
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Particles */}
            {Array.isArray(result.particles) && result.particles.length > 0 && (
              <Section label="What the particles are doing">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.particles.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                      <span
                        style={{
                          fontFamily: KFONT,
                          fontSize: 16,
                          fontWeight: 700,
                          color: C.teal,
                          flexShrink: 0,
                          minWidth: 34,
                        }}
                      >
                        {p.particle}
                      </span>
                      <span style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
                        {p.job}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Literal gap */}
            {result.literal_gap && (
              <Section label="Literal vs. real">
                <div
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: C.ink,
                    borderLeft: `3px solid ${C.clay}`,
                    paddingLeft: 12,
                  }}
                >
                  {result.literal_gap}
                </div>
              </Section>
            )}

            {/* Cultural note */}
            {result.cultural_note && (
              <Section label="Cultural note">
                <div
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: C.ink,
                    borderLeft: `3px solid ${C.gold}`,
                    paddingLeft: 12,
                  }}
                >
                  {result.cultural_note}
                </div>
              </Section>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <p
            style={{
              fontSize: 12,
              color: C.muted,
              textAlign: "center",
              marginTop: 26,
              lineHeight: 1.6,
            }}
          >
            The lessons give you the patterns — this is where your curiosity
            fills in everything else.
          </p>
        )}
      </div>
    </div>
  );
}
