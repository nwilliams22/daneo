// Real Explore DOM controls in an isolated native profile, not a mocked UI.
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { db } from '../../src/db/db';
import type { LocalProgress } from '../../src/features/explore/local-api';

localStorage.setItem('daneo-settings', JSON.stringify({ state: { onboardingDone: true, hangulDone: true, theme: 'light', romanizationVisible: true, audioEnabled: false }, version: 0 }));
location.hash = '/explore';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const button = (text: string) => [...document.querySelectorAll('button')].find(el => el.textContent?.trim() === text);
async function until(check: () => unknown, timeout = 180_000) {
  const end = performance.now() + timeout;
  while (!check()) { if (performance.now() > end) throw new Error('UI timeout: ' + document.body.innerText); await delay(25); }
}
async function submit(input: string) {
  await until(() => document.querySelector('input'));
  const field = document.querySelector('input')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, input);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await until(() => button('Break it down') && !button('Break it down')!.disabled);
  button('Break it down')!.click();
}
async function record(value: unknown) { await invoke('record_acceptance', { value }); }
async function run() {
  // Each launch gets its own profile; missing/corrupt model runs exit after the typed error.
  await submit('Hello.');
  await until(() => button('Save to deck') || document.querySelector('[role=alert]'));
  if (document.querySelector('[role=alert]')) {
    const state = await invoke('local_translation_state');
    await record({ requestId: 'typed-error', state, rendered: document.querySelector('[role=alert]')!.textContent });
    await invoke('finish_acceptance'); return;
  }
  await record({ requestId: 'offline-ui-success', rendered: document.body.innerText, savedBefore: await db.savedTranslations.count() });
  button('Save to deck')!.click();
  await until(() => button('Saved ✓'));
  const savedBeforeCancel = await db.savedTranslations.count();
  let firstToken = false;
  const unlisten = await listen<LocalProgress>('local-translation-progress', event => { if (event.payload.outputTokens === 1) firstToken = true; });
  await submit('I drink water');
  await until(() => firstToken && button('Cancel'));
  const start = performance.now();
  button('Cancel')!.click();
  await until(() => !button('Cancel'));
  const cancelUiMs = performance.now() - start;
  await unlisten();
  await submit('Hello.');
  await until(() => button('Save to deck') || document.querySelector('[role=alert]'));
  await record({ requestId: 'ui-cancel-then-success', cancelUiMs,
    successfulNext: !!button('Save to deck'), savedBeforeCancel, savedAfterNext: await db.savedTranslations.count(),
    rendered: document.body.innerText });
  await invoke('finish_acceptance');
}
window.addEventListener('DOMContentLoaded', () => { void run().catch(async error => {
  await record({ requestId: 'harness-error', error: String(error) });
  await invoke('finish_acceptance');
}); }, { once: true });
