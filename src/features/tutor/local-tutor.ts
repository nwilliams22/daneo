import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { z } from "zod";
import { safeTutorReply, type TutorContext, type TutorReply, tutorPrompt } from "./tutor";

const errorSchema = z.object({ code: z.string(), message: z.string() });

export async function askLocalTutor(
  requestId: string,
  question: string,
  context: TutorContext,
  signal: AbortSignal,
  onProgress: (state: string) => void,
): Promise<TutorReply> {
  if (!("__TAURI_INTERNALS__" in window)) {
    throw new Error("Ask Daneo needs the desktop app and a verified local model.");
  }
  const unlisten = await listen<{ requestId: string; state: string }>(
    "local-translation-progress",
    ({ payload }) => {
      if (payload.requestId !== requestId) return;
      if (signal.aborted) void invoke("cancel_local", { requestId }).catch(() => {});
      else onProgress(payload.state);
    },
  );
  const cancel = () => { void invoke("cancel_local", { requestId }).catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    if (signal.aborted) throw new Error("Cancelled.");
    const raw = await invoke<unknown>("ask_tutor_local", {
      requestId,
      input: tutorPrompt(question, context),
    });
    if (signal.aborted) throw new Error("Cancelled.");
    if (typeof raw !== "object" || raw === null) throw new Error("Invalid tutor response.");
    if ("ok" in raw && raw.ok === false && "error" in raw) {
      const error = errorSchema.safeParse(raw.error);
      throw new Error(error.success ? error.data.message : "Local tutor unavailable.");
    }
    const reply = "result" in raw ? safeTutorReply(raw.result, context.known, new Set(context.examples.map((sentence) => sentence.id))) : null;
    if (!reply) throw new Error("The reply could not be safely shown. Please try again.");
    return reply;
  } finally {
    signal.removeEventListener("abort", cancel);
    unlisten();
  }
}
