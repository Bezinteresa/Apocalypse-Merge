import type { GameState } from './state';

// Энергия (GAME_DESIGN, раздел 6.2; CONTENT_CATALOG, раздел 6.2).
// Выдача из генератора стоит 1. Ниже лимита восстанавливается 1 за 120 секунд.
// Награды проектов могут поднять запас выше лимита — излишек не срезается, но и не растёт сам.

export const ENERGY_START = 100;
export const ENERGY_CAP = 100;
export const ENERGY_SPAWN_COST = 1;
export const ENERGY_REGEN_MS = 120_000;

/** Применить восстановление к моменту now. Время, ушедшее назад, ничего не начисляет. */
export function regenerate(state: GameState, now: number): GameState {
  if (now < state.energyUpdatedAt) return { ...state, energyUpdatedAt: now };
  if (state.energy >= ENERGY_CAP) {
    return state.energyUpdatedAt === now ? state : { ...state, energyUpdatedAt: now };
  }
  const ticks = Math.floor((now - state.energyUpdatedAt) / ENERGY_REGEN_MS);
  if (ticks <= 0) return state;
  const energy = Math.min(ENERGY_CAP, state.energy + ticks);
  const energyUpdatedAt = energy >= ENERGY_CAP ? now : state.energyUpdatedAt + ticks * ENERGY_REGEN_MS;
  return { ...state, energy, energyUpdatedAt };
}

/** Миллисекунды до следующей единицы; null — запас не ниже лимита или энергия не ограничена. */
export function msToNextEnergy(state: GameState, now: number): number | null {
  if (state.energyUnlimited) return null;
  const s = regenerate(state, now);
  if (s.energy >= ENERGY_CAP) return null;
  return ENERGY_REGEN_MS - (now - s.energyUpdatedAt);
}

export function hasEnergyForSpawn(state: GameState): boolean {
  return state.energyUnlimited || state.energy >= ENERGY_SPAWN_COST;
}

/** Списание за выдачу; вызывается после восстановления и проверки места на поле. */
export function spendSpawnEnergy(state: GameState): GameState {
  if (state.energyUnlimited) return state;
  return { ...state, energy: state.energy - ENERGY_SPAWN_COST };
}

export function addEnergy(state: GameState, amount: number): GameState {
  return amount > 0 ? { ...state, energy: state.energy + amount } : state;
}

/** Отладка: режим без лимита. */
export function setUnlimited(state: GameState, unlimited: boolean): GameState {
  return { ...state, energyUnlimited: unlimited };
}
