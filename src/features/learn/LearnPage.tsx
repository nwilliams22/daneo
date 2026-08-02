import PageHeader from "../../components/PageHeader";

export default function LearnPage() {
  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Learn"
        title="Modules"
        blurb="Words first, then the glue, then sentences built only from words you know."
      />
      <div className="rounded-2xl border border-line bg-panel p-5 text-sm text-muted">
        Module list arrives in Phase 1 (content port).
      </div>
    </div>
  );
}
