import PageHeader from "../../components/PageHeader";

export default function DrillHubPage() {
  return (
    <div>
      <PageHeader
        eyebrow="한글 · Drill"
        title="Drills"
        blurb="Confusables, cross-font reading, sentence anatomy, literal-vs-real, and typing."
      />
      <div className="rounded-2xl border border-line bg-panel p-5 text-sm text-muted">
        Drills arrive in Phases 4–6.
      </div>
    </div>
  );
}
