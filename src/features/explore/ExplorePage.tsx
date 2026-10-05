import { lazy, Suspense } from "react";
import PageHeader from "../../components/PageHeader";
import SavedDeck from "./SavedDeck";

// Vite replaces DEV at build time. Production never imports the AI surface,
// irrespective of saved settings or the model pin.
const TranslatorPage = import.meta.env.DEV
  ? lazy(() => import("./TranslatorPage"))
  : null;

export default function ExplorePage() {
  if (TranslatorPage) return <Suspense fallback={null}><TranslatorPage /></Suspense>;
  return (
    <div>
      <PageHeader eyebrow="한국어 · Explore" title="Explore"
        blurb="The AI translator and tutor are not in this release." />
      <SavedDeck />
    </div>
  );
}
