import { useKoreanTTS } from "../audio/useKoreanTTS";

/** Speaker button that reads Korean text aloud. Renders nothing when audio
 *  is off or no Korean voice exists — absence is the designed degraded state. */
export default function AudioButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const { status, enabled, speak } = useKoreanTTS();
  if (!enabled || status !== "ready") return null;

  return (
    <button
      aria-label={`Play ${text}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-line hover:text-ink ${className}`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
