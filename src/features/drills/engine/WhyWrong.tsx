import type { ReactNode } from "react";

interface Side {
  title: ReactNode;
  body?: ReactNode;
}

function SidePanel({
  tone,
  eyebrow,
  title,
  body,
}: Side & { tone: "clay" | "teal"; eyebrow: string }) {
  return (
    <div
      className={`rounded-lg border-l-[3px] bg-paper px-3 py-2 ${
        tone === "clay" ? "border-l-clay" : "border-l-teal"
      }`}
    >
      <div
        className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${
          tone === "clay" ? "text-clay" : "text-teal"
        }`}
      >
        {eyebrow}
      </div>
      <div className="mt-0.5 text-[13.5px] font-semibold">{title}</div>
      {body && (
        <div className="mt-0.5 text-[13px] leading-relaxed text-muted">
          {body}
        </div>
      )}
    </div>
  );
}

/** "Why was I wrong" panel (TASKS.md 2026-08-02, Nick): a wrong pick explains
 *  BOTH sides — what the option you chose actually is, then why the real
 *  answer fits. Quiz surfaces fill in the per-kind content. */
export default function WhyWrong({
  picked,
  answer,
}: {
  picked: Side;
  answer: Side;
}) {
  return (
    <div className="space-y-2">
      <SidePanel tone="clay" eyebrow="You picked" {...picked} />
      <SidePanel tone="teal" eyebrow="The answer" {...answer} />
    </div>
  );
}
