import { useState } from "react";
import { Link, useParams, Navigate } from "react-router";
import { moduleById, moduleMarkdown } from "../../content";
import { splitModuleMarkdown } from "./splitModuleMarkdown";
import { useSettings } from "../../state/settings";
import Markdown from "../../components/Markdown";
import VocabChecklist from "./VocabChecklist";
import SentenceList from "./SentenceList";

function HangulSection({ md }: { md: string }) {
  const hangulDone = useSettings((s) => s.hangulDone);
  const [open, setOpen] = useState(!hangulDone);

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-line bg-panel">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm font-bold">Part 1 — Hangul (the alphabet)</div>
          <div className="mt-0.5 text-xs text-muted">
            {open
              ? "Tap to collapse"
              : hangulDone
                ? "Marked as already known — tap to review anytime"
                : "Tap to expand"}
          </div>
        </div>
        <span
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-4">
          <Markdown md={md} />
        </div>
      )}
    </div>
  );
}

export default function ModulePage() {
  const { moduleId } = useParams();
  const module = moduleId ? moduleById.get(moduleId) : undefined;
  if (!module) return <Navigate to="/learn" replace />;

  const raw = moduleMarkdown[module.contentMd];
  const segments = raw ? splitModuleMarkdown(raw) : [];

  return (
    <div>
      <Link
        to="/learn"
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← Modules
      </Link>
      {segments.map((seg, i) => {
        switch (seg.kind) {
          case "md":
            return <Markdown key={i} md={seg.md} />;
          case "hangul":
            return <HangulSection key={i} md={seg.md} />;
          case "vocab":
            return <VocabChecklist key={i} module={module} />;
          case "sentences":
            return <SentenceList key={i} module={module} />;
        }
      })}
    </div>
  );
}
