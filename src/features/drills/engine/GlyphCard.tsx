/** The 원고지-style practice square with crosshair guides. `faceClass`
 *  swaps the Korean font (cross-font difficulty); defaults to Gothic. */
export default function GlyphCard({
  glyph,
  onClick,
  faceClass = "font-korean",
}: {
  glyph: string;
  onClick?: () => void;
  faceClass?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative mx-auto mb-5 flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-line bg-paper ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="absolute inset-y-2.5 left-1/2 w-px bg-grid" />
      <div className="absolute inset-x-2.5 top-1/2 h-px bg-grid" />
      <span className={`${faceClass} text-8xl leading-none font-medium select-none`}>
        {glyph}
      </span>
    </div>
  );
}
