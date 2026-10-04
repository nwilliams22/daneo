// Bundled only for the opt-in native acceptance example, never the application.
import { invoke } from '@tauri-apps/api/core';
import { localTranslator } from '../../src/features/explore/local-api';
import v0 from './v0-translation-set.json';
import v1 from './v1-translation-set.json';
import v2 from './v2-translation-set.json';
import development from './dev-translation-set.json';
import v0Raw from './v0-translation-set.json?raw';
import v1Raw from './v1-translation-set.json?raw';
import v2Raw from './v2-translation-set.json?raw';
import developmentRaw from './dev-translation-set.json?raw';
import promptSource from '../../src/lib/translation-prompt.json?raw';

const selectedSet = import.meta.env.VITE_DANEO_EVAL_SET ?? 'v2';
const fixture = selectedSet === 'dev' ? development
  : selectedSet === 'v0' ? v0 : selectedSet === 'v1' ? v1 : v2;
const fixturePath = `reference/eval/${selectedSet}-translation-set.json`;
const fixtureSource = selectedSet === 'dev' ? developmentRaw
  : selectedSet === 'v0' ? v0Raw : selectedSet === 'v1' ? v1Raw : v2Raw;

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function run() {
  // This handshake must succeed before the first translation request/inference.
  await invoke('verify_acceptance_identity', {
    promptSha256: await sha256(promptSource),
    itemSetPath: fixturePath,
    itemSetSha256: await sha256(fixtureSource),
  });
  // Held-out items are queried once. Warmup and timing must use non-held-out inputs.
  const sequence = fixture.items.map(item => ({ ...item, requestId: `heldout-${item.id}` }));
  for (const item of sequence) {
    const start = performance.now();
    const progress: { elapsedMs: number; state: string; outputTokens: number }[] = [];
    const outcome = await localTranslator.translate({ requestId: item.requestId, input: item.input }, event => {
      // Retain transitions and first token; not a per-token IPC storage load.
      if (event.outputTokens <= 1) progress.push({ elapsedMs: performance.now() - start, state: event.state, outputTokens: event.outputTokens });
    });
    await invoke('record_acceptance', { value: { requestId: item.requestId, id: item.id,
      input: item.input, expectedDirection: item.direction, completionMs: performance.now() - start, progress, outcome } });
  }
  const requestId = 'cancel-demo';
  let acknowledgement: Promise<void> | undefined;
  let cancelMs: number | undefined;
  const outcome = await localTranslator.translate({ requestId, input: 'Hello.' }, event => {
    if (event.outputTokens === 1 && !acknowledgement) {
      const start = performance.now();
      acknowledgement = localTranslator.cancel(requestId).then(() => { cancelMs = performance.now() - start; });
    }
  });
  await acknowledgement;
  await invoke('record_acceptance', { value: { requestId, cancelMs, outcome } });
  const next = await localTranslator.translate({ requestId: 'after-cancel', input: '안녕하세요.' });
  await invoke('record_acceptance', { value: { requestId: 'after-cancel', outcome: next } });
  await invoke('finish_acceptance');
}
window.addEventListener('DOMContentLoaded', () => {
  void run().catch(async error => {
    await invoke('record_acceptance', { value: { requestId: 'harness-error', error: String(error) } });
    await invoke('finish_acceptance');
  });
}, { once: true });
