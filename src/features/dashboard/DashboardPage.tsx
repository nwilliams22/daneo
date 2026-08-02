import PageHeader from "../../components/PageHeader";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Stats"
        title="Progress"
        blurb="Words learned, drill accuracy, and your weakest items."
      />
      <div className="rounded-2xl border border-line bg-panel p-5 text-sm text-muted">
        The dashboard arrives in Phase 7.
      </div>
    </div>
  );
}
