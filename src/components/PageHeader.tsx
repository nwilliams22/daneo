interface Props {
  eyebrow: string; // e.g. "한글 · Confusables"
  title: string;
  blurb?: string;
}

export default function PageHeader({ eyebrow, title, blurb }: Props) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 text-[11px] tracking-[0.25em] text-muted uppercase">
        {eyebrow}
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {blurb && (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
          {blurb}
        </p>
      )}
    </div>
  );
}
