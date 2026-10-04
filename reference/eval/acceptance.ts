// Bundled only for the opt-in native acceptance example, never the application.
import { invoke } from '@tauri-apps/api/core';
import { localTranslator } from '../../src/features/explore/local-api';
import fixture from './v0-translation-set.json';

async function run() {
  const sequence = [
    { ...fixture.items[0], requestId: 'cold-' + fixture.items[0].id },
    ...[1, 2, 3].flatMap(round => fixture.items.map(item => ({ ...item, requestId: `warm-${round}-${item.id}` }))),
  ];
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
  const outcome = await localTranslator.translate({ requestId, input: fixture.items[0].input }, event => {
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
