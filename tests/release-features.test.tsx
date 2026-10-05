import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { build } from "vite";

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", speak: vi.fn(), stop: vi.fn() }),
}));

// Simulate a previously saved discovery, including an existing gap card.
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => [{ id: 1, savedAt: 1, result: {
    korean: "물", romanization: "mul", natural_english: "water",
    literal_gap: "Saved gap", gloss: [], particles: [], cultural_note: "",
  } }],
}));
vi.mock("../src/state/settings", () => ({
  useSettings: (select?: (state: object) => unknown) => {
    const state = { onboardingDone: true, romanizationVisible: true, theme: "light", speechRate: 0.9 };
    return select ? select(state) : state;
  },
}));

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("release AI entry points", () => {
  it("exposes no translator, tutor route or model controls, but keeps Explore discoveries and settings", async () => {
    vi.stubEnv("DEV", false);
    const { default: App } = await import("../src/App");
    const render = (path: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    const explore = render("/explore");
    expect(explore).toContain("The AI translator and tutor are not in this release.");
    expect(explore).toContain("Discovered");
    expect(explore).toContain("water");
    expect(explore).toContain("gap deck");
    for (const path of ["/explore", "/tutor", "/settings"]) {
      const html = render(path);
      expect(html).not.toContain('href="/tutor"');
      expect(html).not.toContain("Break it down");
      expect(html).not.toContain("tutor-question");
      expect(html).not.toContain("Translator engine");
      expect(html).not.toContain("Download model");
    }
    const settings = render("/settings");
    expect(settings).toContain("Romanization");
    expect(settings).toContain("Export");
    expect(settings).toContain("Import");
  });

  it("retains the tutor navigation in development", async () => {
    vi.stubEnv("DEV", true);
    const { default: AppShell } = await import("../src/components/AppShell");
    const html = renderToStaticMarkup(<MemoryRouter><AppShell>Content</AppShell></MemoryRouter>);
    expect(html).toContain('href="/tutor"');
    expect(html).toContain("Ask Daneo");
  });

  it("omits AI surfaces and transports from the production bundle, keeping non-AI features", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = await build({ logLevel: "silent", build: { write: false } });
    if (!("output" in result)) throw new Error("Expected one application build");
    const chunks = result.output.filter((item) => item.type === "chunk");
    const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules)).join("\n");
    for (const excluded of ["TranslatorPage.tsx", "TutorPage.tsx", "ModelPanel.tsx", "local-api.ts", "local-tutor.ts", "model-download.ts", "/explore/api.ts"]) {
      expect(modules).not.toContain(excluded);
    }
    for (const retained of ["SavedDeck.tsx", "ModulePage.tsx", "ConfusablesDrill.tsx", "CrossFontReader.tsx", "AnatomyDrill.tsx", "GapDrill.tsx", "TypingDrill.tsx", "ReviewSession.tsx", "DashboardPage.tsx", "ExportImport.tsx"]) {
      expect(modules).toContain(retained);
    }
    const code = chunks.map((chunk) => chunk.code).join("\n");
    for (const command of ["translate_local", "ask_tutor_local", "download_model", "tutor-question"]) {
      expect(code).not.toContain(command);
    }
  }, 60_000);
});
