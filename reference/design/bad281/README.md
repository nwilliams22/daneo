# BAD-281 — three design directions, as static mockups

Nick's brief (BAD-281, 2026-10-25) asked for **options before implementation**: two or three
distinct visual directions, each shown on the same three screens, in light and dark, described in
plain language so he can pick or mix.

These files are the mockups. **Nothing here ships.** They are hand-written HTML and CSS with no
build step and no React, so they can be changed in seconds while a direction is still being argued
about. Once Nick picks, the chosen palette and surface rules get rebuilt properly as Tailwind theme
tokens in `src/theme/tokens.css` and the real components change — that is step 2 of the ticket.

## The three directions

| | Name | In one line |
| --- | --- | --- |
| **A** | **Hanji** (한지 — mulberry paper) | Today's look, cleaned up: lighter paper, a deeper green, and every bordered card replaced by a warm tint or a hairline. |
| **B** | **Slate** | A cool modern tool: grey-blue page, white panels with no outlines at all and a soft shadow instead, related rows grouped into one panel, bigger numbers, one blue accent. |
| **C** | **Dancheong** (단청 — temple eave painting) | Like a printed book: almost no panels at all, serif Korean, wide margins, and one strong vermilion that only ever marks the next thing to do. |

All three answer "boxy cards are ugly" differently — A with hairlines, B with soft borderless fills,
C with nothing but type and space — and all three carry the same structural fixes, because those
are about layout rather than looks:

- **Today** becomes the landing route: review queue first, then the module to continue, the module
  test still owed, and the words that test caught.
- **Learn** stops being 164 tall cards in one column: one line per module, finished work folded into
  a single row, later rings folded, where-you-left-off pinned at the top, and a search box.
- **The drill** keeps its behaviour exactly — same keyboard answers, same same-family distractors,
  same "why wrong" note. Only surfaces and colours move.

Each keeps the 단어 wordmark, Korean before English, and romanization visually secondary
(PROJECT.md §2 and principle 5).

## Files

| File | What it is |
| --- | --- |
| `mock.css` | Shared structure. Every colour, radius, border and font reads from a custom property. |
| `screens.js` | The markup for all three screens, identical across directions on purpose. |
| `dir-hanji.css`, `dir-slate.css`, `dir-dancheong.css` | One direction each: the token values, plus the handful of rules that give it its surface style. |
| `hanji.html`, `slate.html`, `dancheong.html` | Entry points. Add `?dark` for the dark sheet. |
| `shot.mjs` | Renders all six sheets to PNG. |

## Re-rendering

```bash
node reference/design/bad281/shot.mjs             # all six sheets
node reference/design/bad281/shot.mjs dancheong   # one direction, both modes
```

Output lands in `.visual-pass/bad281/` (gitignored, like every other screenshot run). The script
serves the repo root over loopback so the mockups can use the app's own self-hosted fonts out of
`node_modules`, then drives the same headless Chrome `scripts/visual-pass.mjs` finds. It exits
non-zero on a console error or an empty render.

To look at one in a browser instead:

```bash
python3 -m http.server 8088          # from the repo root
# then open http://localhost:8088/reference/design/bad281/hanji.html?dark
```

## Known mockup-only shortcuts

- The learner state (214 words, 23 reviews due, Module 5 failed at 62%) is plausible, not live.
  Module titles, word glosses and the ㅘ note are copied out of `src/content/`.
- Direction C's Latin serif is whatever the rendering machine has (`Noto Serif` here). Implementing
  C means adding a self-hosted serif to `src/main.tsx`'s font imports — the app never fetches a font
  at runtime.
- The sheets show one state per screen. Empty states, the review session, Explore and Settings are
  not drawn; they follow the chosen direction's tokens.
