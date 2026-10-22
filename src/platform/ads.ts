// Единый рекламный сервис поверх bridge.advertisement (JS Bridge 2.x).
// showRewarded/showInterstitial ничего не обещают: результат приходит событиями *_STATE_CHANGED.
// Правила: один запрос в работе; награда — только по состоянию `rewarded`; игра на паузе от запроса
// до `closed`/`failed`; ограниченное ожидание не превращается в вечную паузу; поздние события
// старого запроса игнорируются.

export type AdState = 'loading' | 'opened' | 'closed' | 'rewarded' | 'failed';

export interface AdAdapter {
  readonly isRewardedSupported: boolean;
  readonly isInterstitialSupported: boolean;
  showRewarded(placement: string): void;
  showInterstitial(placement: string): void;
  onRewardedState(cb: (state: AdState) => void): void;
  onInterstitialState(cb: (state: AdState) => void): void;
}

export type RewardedOutcome = 'rewarded' | 'not_rewarded' | 'unavailable' | 'busy';
export type InterstitialOutcome = 'shown' | 'skipped' | 'unavailable' | 'busy';

/** Без события «открыто» за это время запрос считается неудавшимся. */
export const AD_OPEN_TIMEOUT_MS = 15_000;
/** Предел ожидания открытой рекламы, чтобы игра не осталась на паузе навсегда. */
export const AD_MAX_DURATION_MS = 120_000;
/** После `closed` ещё ждём запоздавшее `rewarded` от того же запроса. */
export const REWARD_GRACE_MS = 500;

interface Pending {
  kind: 'rewarded' | 'interstitial';
  opened: boolean;
  rewarded: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  finish: (opened: boolean, rewarded: boolean) => void;
}

export class AdService {
  private pending: Pending | null = null;

  constructor(
    private adapter: AdAdapter,
    /** Пауза игры на время рекламы (причина 'ad' в контроллере жизненного цикла). */
    private setAdPause: (active: boolean) => void,
    /** Награда выдаётся сразу по `rewarded`, до закрытия рекламы; игра при этом остаётся на паузе. */
    private onReward: () => void,
  ) {
    adapter.onRewardedState((s) => this.handle('rewarded', s));
    adapter.onInterstitialState((s) => this.handle('interstitial', s));
  }

  get busy(): boolean {
    return this.pending !== null;
  }

  get isRewardedSupported(): boolean {
    return this.adapter.isRewardedSupported;
  }

  showRewarded(placement: string): Promise<RewardedOutcome> {
    if (!this.adapter.isRewardedSupported) return Promise.resolve('unavailable');
    if (this.pending) return Promise.resolve('busy');
    return new Promise((resolve) => {
      this.start('rewarded', (_opened, rewarded) => resolve(rewarded ? 'rewarded' : 'not_rewarded'));
      this.call(() => this.adapter.showRewarded(placement));
    });
  }

  showInterstitial(placement: string): Promise<InterstitialOutcome> {
    if (!this.adapter.isInterstitialSupported) return Promise.resolve('unavailable');
    if (this.pending) return Promise.resolve('busy');
    return new Promise((resolve) => {
      this.start('interstitial', (opened) => resolve(opened ? 'shown' : 'skipped'));
      this.call(() => this.adapter.showInterstitial(placement));
    });
  }

  private start(kind: Pending['kind'], finish: Pending['finish']): void {
    this.pending = { kind, opened: false, rewarded: false, timer: null, finish };
    this.setAdPause(true);
    this.arm(AD_OPEN_TIMEOUT_MS);
  }

  /** Выброс исключения SDK завершает запрос как неудавшийся, а не оставляет игру на паузе. */
  private call(fn: () => void): void {
    try {
      fn();
    } catch (e) {
      console.warn('ad request threw', e);
      this.end();
    }
  }

  private arm(ms: number): void {
    const p = this.pending;
    if (!p) return;
    if (p.timer) clearTimeout(p.timer);
    p.timer = setTimeout(() => {
      if (this.pending === p) this.end();
    }, ms);
  }

  private handle(kind: Pending['kind'], state: AdState): void {
    const p = this.pending;
    if (!p || p.kind !== kind) return; // событие без нашего запроса или от старого запроса
    if (state === 'opened') {
      p.opened = true;
      this.arm(AD_MAX_DURATION_MS);
    } else if (state === 'rewarded') {
      if (!p.rewarded) {
        p.rewarded = true;
        this.onReward();
      }
    } else if (state === 'closed') {
      if (kind === 'rewarded' && !p.rewarded) this.arm(REWARD_GRACE_MS);
      else this.end();
    } else if (state === 'failed') {
      this.end();
    }
  }

  private end(): void {
    const p = this.pending;
    if (!p) return;
    if (p.timer) clearTimeout(p.timer);
    this.pending = null;
    this.setAdPause(false);
    p.finish(p.opened, p.rewarded);
  }
}

/**
 * Имитация рекламы для локальной проверки (только localhost, параметр ?fakeads=1 или ?fakeads=cancel).
 * Порядок событий как у адаптера Яндекса в Bridge 2.3.1: opened → rewarded → closed.
 */
export function createFakeAdAdapter(mode: 'ok' | 'cancel', delayMs = 1500): AdAdapter {
  let rewardedCb: (s: AdState) => void = () => {};
  let interstitialCb: (s: AdState) => void = () => {};
  const overlay = (text: string) => {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;inset:0;z-index:200;background:#000d;color:#fff;display:flex;align-items:center;justify-content:center;font:20px sans-serif';
    document.body.appendChild(el);
    return el;
  };
  return {
    isRewardedSupported: true,
    isInterstitialSupported: true,
    showRewarded(placement) {
      rewardedCb('loading');
      const el = overlay(`FAKE REWARDED AD · ${placement}`);
      setTimeout(() => rewardedCb('opened'), 100);
      setTimeout(() => {
        if (mode === 'ok') rewardedCb('rewarded');
        el.remove();
        rewardedCb('closed');
      }, delayMs);
    },
    showInterstitial(placement) {
      interstitialCb('loading');
      const el = overlay(`FAKE INTERSTITIAL · ${placement}`);
      setTimeout(() => interstitialCb('opened'), 100);
      setTimeout(() => {
        el.remove();
        interstitialCb('closed');
      }, delayMs);
    },
    onRewardedState: (cb) => (rewardedCb = cb),
    onInterstitialState: (cb) => (interstitialCb = cb),
  };
}
