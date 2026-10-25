interface Props {
  eyebrow: string; // e.g. "한글 · Confusables"
  title: string;
  blurb?: string;
}

export default function PageHeader({ eyebrow, title, blurb }: Props) {
  return (
    /* Dancheong is the editorial direction: the title carries the page, in the
       serif display face, with the eyebrow as a quiet label above it. */
    <div className="mb-6">
      <div className="mb-2 text-[10px] tracking-[0.26em] text-muted uppercase">
        {eyebrow}
      </div>
      <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.012em]">
        {title}
      </h1>
      {blurb && (
        <p className="mt-2 max-w-prose text-[13.5px] leading-relaxed text-muted">
          {blurb}
        </p>
      )}
    </div>
  );
}
