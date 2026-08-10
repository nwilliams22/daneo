import { useState } from "react";
import { Link, useParams, Navigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { moduleById, moduleMarkdown } from "../../content";
import { splitModuleMarkdown } from "./splitModuleMarkdown";
import { useSettings } from "../../state/settings";
import { PASS_PCT } from "../../lib/moduleTest";
import type { Module } from "../../types";
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

/** End-of-module test card (Nick, 2026-08-10) — vocab modules only. */
function TestCta({ module }: { module: Module }) {
  const result = useLiveQuery(() => db.moduleTests.get(module.id), [module.id]);
  const passed = !!result && result.bestPct >= PASS_PCT;
  return (
    <div className="my-6 rounded-2xl border border-line bg-panel px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold">Module test</div>
          <div className="mt-0.5 text-[13px] text-muted">
            {result ? (
              <>
                Best {result.bestPct}%{passed && " · passed"} ·{" "}
                {result.attempts} attempt{result.attempts === 1 ? "" : "s"}
              </>
            ) : (
              "A fresh sample of this module's words and sentences — misses feed the review queue."
            )}
          </div>
        </div>
        <Link
          to={`/learn/${module.id}/test`}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90 ${
            passed
              ? "border border-teal text-teal"
              : "bg-ink text-paper"
          }`}
        >
          {result ? "Retake" : "Take the test"}
        </Link>
      </div>
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
      {module.wordIds.length > 0 && <TestCta module={module} />}
    </div>
  );
}
