import { Link } from "react-router";
import type { TranslateError } from "./translation-contract";

export default function TranslationError({ error }: { error: TranslateError }) {
  return (
    <div role="alert" className="mt-4 rounded-xl border border-clay px-3.5 py-3 text-[13.5px] leading-relaxed text-clay">
      {error.code === "model-missing" && <strong className="block">Local model absent</strong>}
      {error.message}
      {error.code === "model-missing" && <Link to="/settings" className="mt-1 block underline underline-offset-2">Open Settings to download or manage the local model.</Link>}
    </div>
  );
}
