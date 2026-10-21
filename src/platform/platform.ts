import bridge from '@playgama/bridge';

// Единственная точка работы с Bridge. Bridge сам инициализирует SDK площадки (у Яндекса — YaGames.init),
// второй init поверх адаптера не делаем.

let gameReadySent = false;
let gameplayActive = false;

export function isLocalDev(): boolean {
  return import.meta.env.DEV || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
}

export async function initPlatform(): Promise<void> {
  if (bridge.isInitialized) return;
  await bridge.initialize();
}

export function platformId(): string {
  return bridge.platform.id;
}

export function platformLanguage(): string {
  return bridge.platform.language ?? '';
}

/** Game Ready: один раз за запуск, после того как UI готов к вводу. */
export function sendGameReady(): void {
  if (gameReadySent) return;
  gameReadySent = true;
  void bridge.platform.sendMessage('game_ready').catch((e: unknown) => console.warn('game_ready failed', e));
}

/** Сообщает площадке о реальном начале/остановке игрового процесса; повторы одинакового состояния не отправляются. */
export function setGameplayActive(active: boolean): void {
  if (!gameReadySent || active === gameplayActive) return;
  gameplayActive = active;
  const message = active ? 'gameplay_started' : 'gameplay_stopped';
  void bridge.platform.sendMessage(message).catch((e: unknown) => console.warn(`${message} failed`, e));
}

export { bridge };
