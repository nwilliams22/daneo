/* BAD-281 design-option mockups — the markup, shared by all three directions.
 *
 * One sheet = three screens side by side: Today (the proposed landing page),
 * Learn (the 164-module list, restructured so it stops scrolling forever), and
 * one drill (confusables quiz, mid-answer). Append `?dark` to the URL for the
 * dark-mode sheet.
 *
 * The numbers are a plausible learner state, not live data: 214 words learned,
 * through Module 5, 23 reviews due, Module 5's test failed at 62%. Module
 * titles, word glosses and the ㅘ note are copied out of src/content/.
 */

const DIRECTIONS = {
  hanji: {
    name: "A · <span>한지</span> Hanji",
    tagline:
      "The current look, cleaned up. Lighter paper, deeper green, and the boxes replaced by thin lines and space.",
    swatches: [
      ["Paper", "#f8f5ed", "#1b1a17"],
      ["Panel", "#efeade", "#24231e"],
      ["Ink", "#1f2227", "#e8e4d8"],
      ["Pine", "#1f6b5c", "#5fb3a1"],
      ["Clay", "#a8492f", "#dd8a66"],
      ["Gold", "#8a6d2f", "#c2a360"],
    ],
  },
  slate: {
    name: "B · Slate",
    tagline:
      "A cool, modern tool. Grey-blue page, soft filled panels with no outlines at all, bigger numbers, one blue accent.",
    swatches: [
      ["Page", "#f3f4f7", "#14161a"],
      ["Panel", "#ffffff", "#1d2026"],
      ["Ink", "#161a21", "#e7eaf0"],
      ["Blue", "#2f58d8", "#7e9bff"],
      ["Rose", "#c0392f", "#f08a7c"],
    ],
  },
  dancheong: {
    name: "C · <span>단청</span> Dancheong",
    tagline:
      "Like a printed book. Almost no panels, serif Korean headings, lots of white space, one strong red accent.",
    swatches: [
      ["Paper", "#fbf9f4", "#131210"],
      ["Ink", "#141414", "#f0ece3"],
      ["Vermilion", "#bc3a26", "#e8705a"],
      ["Jade", "#1c5b55", "#4fa89c"],
      ["Gold", "#8a6a24", "#c9a452"],
      ["Rule", "#d8d2c4", "#33302a"],
    ],
  },
};

/* ------------------------------- Today ------------------------------- */

const today = `
<header class="appbar">
  <div class="brand"><span class="brand-ko">단어</span><span class="brand-latin">Daneo</span></div>
  <nav class="nav">
    <span class="nav-item is-active">Today</span>
    <span class="nav-item">Learn</span>
    <span class="nav-item">Drill</span>
    <span class="nav-item">Review</span>
    <span class="nav-item">Stats</span>
    <span class="nav-item">Explore</span>
    <span class="nav-item">Settings</span>
  </nav>
</header>
<main class="main">
  <div class="head">
    <div class="eyebrow"><span class="ko">오늘</span> · Sunday, 25 October</div>
    <h1 class="title">Here is your plan for today</h1>
    <p class="blurb">Three things waiting — about 18 minutes if you do all of them.</p>
  </div>

  <div class="hero">
    <div class="hero-left">
      <div class="hero-num">23</div>
      <div>
        <div class="hero-l1">words and letters due for review</div>
        <div class="hero-l2">About 6 minutes · the oldest has waited 3 days</div>
      </div>
    </div>
    <span class="btn btn-primary">Start review</span>
  </div>

  <div class="section">
    <div class="section-label">Next up</div>
    <ul class="rows">
      <li class="row is-current">
        <div>
          <div class="row-kicker">Continue · Module 6</div>
          <div class="row-title">Places, Positions, and Finding Your Way</div>
          <div class="row-meta">
            <span class="meter"><i style="width:63%"></i></span>
            <span class="row-stat">24 of 38 words</span>
          </div>
        </div>
        <span class="btn btn-ghost">Continue</span>
      </li>
      <li class="row">
        <div>
          <div class="row-kicker">Test waiting · Module 5</div>
          <div class="row-title">Counting Things and Telling Time</div>
          <div class="row-meta">
            <span class="tag is-warn">best 62%</span>
            <span class="row-stat">80% passes</span>
          </div>
        </div>
        <span class="btn btn-ghost">Take it again</span>
      </li>
    </ul>
  </div>

  <div class="section">
    <div class="section-label is-warn">What Module 5's test caught</div>
    <div class="chips">
      <span class="chip"><b>가게</b><span>store</span></span>
      <span class="chip"><b>시간</b><span>time</span></span>
      <span class="chip"><b>지금</b><span>now</span></span>
      <span class="chip"><b>어제</b><span>yesterday</span></span>
      <span class="chip"><b>앞</b><span>front</span></span>
    </div>
    <span class="link">Practice these 5 →</span>
  </div>

  <div class="strip">
    <div>
      <div class="stat-num">7</div>
      <div class="stat-label">day streak</div>
    </div>
    <div>
      <div class="stat-num">214</div>
      <div class="stat-label">words learned</div>
    </div>
    <div>
      <div class="stat-num">84%</div>
      <div class="stat-label">drill accuracy</div>
    </div>
    <div class="week">
      <span class="dot is-on"></span><span class="dot is-on"></span>
      <span class="dot is-on"></span><span class="dot"></span>
      <span class="dot is-on"></span><span class="dot is-on"></span>
      <span class="dot is-today"></span>
    </div>
  </div>
</main>`;

/* -------------------------------- Learn ------------------------------- */

const LEARN_ROWS = [
  { n: "6", title: "Places, Positions, and Finding Your Way", pct: 63, stat: "24/38", state: "current" },
  { n: "7", title: "Describing Things and Feelings", pct: 0, stat: "0/40", state: "next" },
  { n: "8", title: "Routines and the Future", pct: 0, stat: "0/39", state: "next" },
  { n: "읽기", title: "Why Korean Sounds Different Than It Reads", reading: true, state: "reading" },
  { n: "9", title: "Requests, Offers, and Shopping", pct: 0, stat: "0/38", state: "next" },
  { n: "10", title: "Can, Must, and Because", pct: 0, stat: "0/36", state: "next" },
  { n: "11", title: "Weather and the Four Seasons", pct: 0, stat: "0/38", state: "next" },
];

const learnRow = (r) => {
  const end =
    r.state === "current"
      ? `<span class="tag is-warn">test due</span>`
      : r.reading
        ? `<span class="row-stat">read</span>`
        : "";
  return `
  <li class="lrow ${r.state === "current" ? "is-current" : ""}">
    <span class="lrow-n ${r.reading ? "is-reading" : ""}">${r.n}</span>
    <span class="lrow-title">${r.title}</span>
    <span>${r.reading ? "" : `<span class="meter"><i style="width:${r.pct}%"></i></span>`}</span>
    <span class="lrow-stat">${r.stat ?? ""}</span>
    <span class="lrow-end">${end}</span>
  </li>`;
};

const learn = `
<header class="appbar">
  <div class="brand"><span class="brand-ko">단어</span><span class="brand-latin">Daneo</span></div>
  <nav class="nav">
    <span class="nav-item">Today</span>
    <span class="nav-item is-active">Learn</span>
    <span class="nav-item">Drill</span>
    <span class="nav-item">Review</span>
    <span class="nav-item">Stats</span>
    <span class="nav-item">Explore</span>
    <span class="nav-item">Settings</span>
  </nav>
</header>
<main class="main">
  <div class="head">
    <div class="eyebrow"><span class="ko">한국어</span> · Learn</div>
    <h1 class="title">Modules</h1>
    <p class="blurb">Words first, then the glue, then sentences built only from words you know.</p>
  </div>

  <div class="toolbar">
    <div class="search"><span class="search-icon">⌕</span>Search 164 modules, readings and words…</div>
    <span class="btn btn-ghost btn-sm">Jump to current</span>
  </div>

  <div class="pinned">
    <div>
      <div class="row-kicker">Where you left off</div>
      <div class="row-title">Module 6 · Places, Positions, and Finding Your Way</div>
      <div class="row-meta">
        <span class="meter"><i style="width:63%"></i></span>
        <span class="row-stat">24 of 38 words</span>
      </div>
    </div>
    <span class="btn btn-primary btn-sm">Continue</span>
  </div>

  <div class="segmented">
    <span class="seg is-active">Ring 1 · 39</span>
    <span class="seg">Ring 2 · 84</span>
    <span class="seg">Ring 3 · 41</span>
  </div>

  <div class="fold">
    <span class="caret">▸</span>
    <span class="fold-title">Modules 1–5 and 2 readings — finished</span>
    <span class="fold-right"><span class="tick">✓</span> 7 items · 176 words</span>
  </div>

  <div class="band-label">
    <b>Where you are</b><span>Ring 1 · Beginner — the grammar engine and your first ~1,000 words</span>
  </div>
  <ul class="lrows">${LEARN_ROWS.map(learnRow).join("")}</ul>

  <div class="fold" style="margin-top:14px">
    <span class="caret">▸</span>
    <span class="fold-title">Modules 12–30, 4 readings and 3 appendices</span>
    <span class="fold-right">25 items · not started</span>
  </div>
  <div class="fold">
    <span class="caret">▸</span>
    <span class="fold-title">Ring 2 · Intermediate</span>
    <span class="fold-right">84 modules · opens after Ring 1</span>
  </div>
  <div class="fold">
    <span class="caret">▸</span>
    <span class="fold-title">Ring 3 · Advanced</span>
    <span class="fold-right">41 modules · opens after Ring 2</span>
  </div>

  <p class="foot">38 of 164 done. Nothing is hidden — every fold opens, and search reaches
  any module, reading or word by name.</p>
</main>`;

/* -------------------------------- Drill ------------------------------- */

const drill = `
<header class="appbar">
  <div class="brand"><span class="brand-ko">단어</span><span class="brand-latin">Daneo</span></div>
  <nav class="nav">
    <span class="nav-item">Today</span>
    <span class="nav-item">Learn</span>
    <span class="nav-item is-active">Drill</span>
    <span class="nav-item">Review</span>
    <span class="nav-item">Stats</span>
    <span class="nav-item">Explore</span>
    <span class="nav-item">Settings</span>
  </nav>
</header>
<main class="main">
  <span class="back">← Drills</span>
  <div class="head">
    <div class="eyebrow"><span class="ko">한글</span> · Confusables</div>
    <h1 class="title">Which sound is this?</h1>
    <p class="blurb">Wrong answers come from the same look-alike family, never at random.</p>
  </div>

  <div class="controls">
    <div class="segmented is-sm">
      <span class="seg">Everything</span>
      <span class="seg is-active">Compound vowels</span>
      <span class="seg">Look-alikes</span>
      <span class="seg">Tense</span>
    </div>
    <span class="toggle"><span class="track"><i></i></span> Mixed fonts</span>
  </div>

  <div class="drill-card">
    <div class="glyph"><b>ㅘ</b></div>
    <div class="options">
      <span class="opt is-right">wa</span>
      <span class="opt is-dim">wo</span>
      <span class="opt is-dim">wae</span>
      <span class="opt is-dim">we</span>
    </div>
    <div class="why"><b>ㅘ</b> is <b>ㅗ</b> + <b>ㅏ</b>. Don't flip it with <b>ㅝ</b> (wo).</div>
    <p class="hint">Answer with <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span><span class="kbd">4</span>,
    next card with <span class="kbd">↵</span> — same keys as now.</p>
  </div>

  <div class="drill-foot">
    <span><b>14</b>/17 correct · 82%</span>
    <span class="reset">Reset</span>
  </div>

  <div class="missed">
    <div class="section-label is-warn">Review these</div>
    <div class="chips">
      <span class="chip"><b>ㅙ</b><span>wae</span></span>
      <span class="chip"><b>ㅞ</b><span>we</span></span>
      <span class="chip"><b>ㄸ</b><span>tt</span></span>
    </div>
  </div>
</main>`;

/* ------------------------------- assembly ----------------------------- */

const SCREENS = [
  {
    label: "Today — the new landing page",
    html: today,
    note: `<b>New.</b> Opening the app lands here instead of the module list. It answers one
      question — what do I do now — with the review queue first, then the module to continue
      with, the test you still owe, and the words that test caught.`,
  },
  {
    label: "Learn — 164 modules without the endless scroll",
    html: learn,
    note: `<b>Same content, four screens shorter.</b> One line per module instead of a tall card,
      finished work folded into one row, future rings folded too, where-you-left-off pinned at the
      top, and a search box. Today this page is a flat column of 164 cards.`,
  },
  {
    label: "Drill — the confusables quiz, mid-answer",
    html: drill,
    note: `<b>Unchanged in behavior.</b> Same keyboard answers, same same-family wrong answers,
      same "why wrong" note. Only the surfaces and colors move.`,
  },
];

function render() {
  const dirKey = document.body.dataset.dir;
  const dir = DIRECTIONS[dirKey];
  const dark = location.search.includes("dark");
  if (dark) document.documentElement.classList.add("dark");

  const swatches = dir.swatches
    .map(
      ([name, light, darkHex]) =>
        `<div class="swatch" style="background:${dark ? darkHex : light}"><b>${name}</b></div>`,
    )
    .join("");

  document.body.innerHTML = `
  <div class="sheet-head">
    <div>
      <div class="sheet-id">BAD-281 · Direction</div>
      <h1 class="sheet-name">${dir.name}</h1>
      <p class="sheet-tag">${dir.tagline}</p>
    </div>
    <div>
      <div class="sheet-mode">${dark ? "Dark mode" : "Light mode"}</div>
      <div class="swatches">${swatches}</div>
    </div>
  </div>
  <div class="sheet">
    ${SCREENS.map(
      (s, i) => `
    <section class="screen">
      <div class="screen-label"><span class="screen-num">${i + 1}</span> ${s.label}</div>
      <div class="frame">${s.html}</div>
      <p class="screen-note">${s.note}</p>
    </section>`,
    ).join("")}
  </div>`;
}

render();
