import { addEnergy } from './energy';
import type { GameState } from './state';

// Правила рекламы (docs/PLAYGAMA_INTEGRATION_PROMPT_RU.md, разделы 6–7). Числа — проектное предложение,
// утверждённое пользователем 22.10.2026, а не требование площадки.

/** Награда за просмотр rewarded. */
export const AD_REWARD_ENERGY = 20;
/** Успешных наград до перезарядки; лимит общий для всех кнопок. */
export const AD_REWARD_LIMIT = 3;
export const AD_REWARD_COOLDOWN_MS = 3 * 60 * 60 * 1000;

/** Межстраничная: первая не раньше чем через 180 с после запуска, затем не чаще раза в 120 с. */
export const INTERSTITIAL_FIRST_DELAY_MS = 180_000;
export const INTERSTITIAL_INTERVAL_MS = 120_000;
/** Не в обучении и не на первом ремонте: только после R02. */
export const INTERSTITIAL_MIN_PROJECTS = 2;

export interface AdRewardState {
  /** Успешные награды в текущем цикле. */
  used: number;
  /** До этого момента новые награды недоступны (мс, время устройства); 0 — перезарядки нет. */
  cooldownUntil: number;
}

export function emptyAdRewards(): AdRewardState {
  return { used: 0, cooldownUntil: 0 };
}

/** Состояние лимита на момент now: закончившаяся перезарядка обнуляет счётчик. */
export function adRewardsAt(state: GameState, now: number): AdRewardState {
  const r = state.adRewards;
  if (r.cooldownUntil && now >= r.cooldownUntil) return emptyAdRewards();
  return r;
}

export function canWatchRewardAd(state: GameState, now: number): boolean {
  return adRewardsAt(state, now).used < AD_REWARD_LIMIT;
}

/** Мс до снятия перезарядки; null — перезарядки нет. */
export function adCooldownLeft(state: GameState, now: number): number | null {
  const r = adRewardsAt(state, now);
  return r.cooldownUntil > now ? r.cooldownUntil - now : null;
}

/**
 * Выдать награду за подтверждённый площадкой просмотр. Энергия и расход лимита — одна операция.
 * Отмена и ошибка сюда не попадают и попытку не расходуют.
 */
export function grantAdReward(state: GameState, now: number): GameState | null {
  if (!canWatchRewardAd(state, now)) return null;
  const r = adRewardsAt(state, now);
  const used = r.used + 1;
  const adRewards = { used, cooldownUntil: used >= AD_REWARD_LIMIT ? now + AD_REWARD_COOLDOWN_MS : 0 };
  return { ...addEnergy(state, AD_REWARD_ENERGY), adRewards };
}

/** Можно ли сейчас запросить межстраничную рекламу; время сеанса не сохраняется. */
export function canShowInterstitial(state: GameState, sessionStart: number, lastShownAt: number | null, now: number): boolean {
  if (state.completedProjects.length < INTERSTITIAL_MIN_PROJECTS) return false;
  if (now - sessionStart < INTERSTITIAL_FIRST_DELAY_MS) return false;
  return lastShownAt === null || now - lastShownAt >= INTERSTITIAL_INTERVAL_MS;
}
