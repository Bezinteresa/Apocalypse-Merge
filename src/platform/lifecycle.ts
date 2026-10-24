import { bridge } from './platform';

// Единый контроллер паузы и звука. Хранит независимые причины паузы, чтобы один обработчик
// (например, возврат фокуса) не снимал паузу, выставленную площадкой или рекламой.

export type PauseReason = 'platform' | 'hidden' | 'blur' | 'ad' | 'modal';

type Listener = (state: { paused: boolean; audioAllowed: boolean }) => void;

const reasons = new Set<PauseReason>();
let platformAudioEnabled = true;
let started = false;
const listeners = new Set<Listener>();

function emit(): void {
  const state = { paused: reasons.size > 0, audioAllowed: platformAudioEnabled && reasons.size === 0 };
  for (const l of listeners) l(state);
}

export function setPauseReason(reason: PauseReason, active: boolean): void {
  const had = reasons.has(reason);
  if (active === had) return;
  if (active) reasons.add(reason);
  else reasons.delete(reason);
  emit();
}

export function isPaused(): boolean {
  return reasons.size > 0;
}

/** Можно ли сейчас звучать: площадка разрешает звук и нет ни одной причины паузы. */
export function isAudioAllowed(): boolean {
  return platformAudioEnabled && reasons.size === 0;
}

export function onLifecycleChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Подписки создаются один раз за запуск; начальные значения площадки применяются сразу, без ожидания событий. */
export function startLifecycle(): void {
  if (started) return;
  started = true;

  platformAudioEnabled = bridge.platform.isAudioEnabled !== false;
  if (bridge.platform.isPaused) reasons.add('platform');
  if (document.visibilityState === 'hidden') reasons.add('hidden');

  bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED, (paused: unknown) => setPauseReason('platform', paused === true));
  bridge.platform.on(bridge.EVENT_NAME.AUDIO_STATE_CHANGED, (enabled: unknown) => {
    platformAudioEnabled = enabled !== false;
    emit();
  });

  document.addEventListener('visibilitychange', () => setPauseReason('hidden', document.visibilityState === 'hidden'));
  window.addEventListener('pagehide', () => setPauseReason('hidden', true));
  window.addEventListener('pageshow', () => setPauseReason('hidden', document.visibilityState === 'hidden'));
  window.addEventListener('blur', () => setPauseReason('blur', true));
  window.addEventListener('focus', () => setPauseReason('blur', false));

  emit();
}
