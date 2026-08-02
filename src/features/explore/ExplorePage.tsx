import PageHeader from "../../components/PageHeader";

export default function ExplorePage() {
  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Explore"
        title="Curiosity Translator"
        blurb="Type English or Korean and get the Korean-order gloss, particle jobs, and the literal-vs-real gap."
      />
      <div className="rounded-2xl border border-line bg-panel p-5 text-sm leading-relaxed text-muted">
        The translator arrives in Phase A.3 — it needs a small server to keep
        the API key out of the app. The lessons give you the patterns; this is
        where your curiosity will fill in everything else.
      </div>
    </div>
  );
}
