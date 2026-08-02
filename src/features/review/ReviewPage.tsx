import PageHeader from "../../components/PageHeader";

export default function ReviewPage() {
  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Review"
        title="Review these"
        blurb="Everything you've missed across all drills, in one place."
      />
      <div className="rounded-2xl border border-line bg-panel p-5 text-sm text-muted">
        The unified missed-items area arrives in Phase 7.
      </div>
    </div>
  );
}
