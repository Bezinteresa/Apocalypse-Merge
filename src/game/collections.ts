import { CHEST_SOURCES, CHESTS, DROP_TABLE_VERSION, LEGENDARY_PITY, RARITIES, RARITY, SETS, cardsOf, getCard, validateChest, type Rarity } from '../content/collections';
import { addEnergy } from './energy';
import type { GameState } from './state';

// Правила альбома: сундуки → осколки конкретных карт → сборка → набор.
// Случайность — детерминированный генератор, состояние которого хранится в сохранении:
// результат открытия фиксируется вместе со списанием сундука, перезапуск его не меняет.

export interface SetProgress {
  /** Осколки карты: от 0 до порога сборки; лишнее сразу уходит в жетоны. */
  shards: Record<string, number>;
  assembled: string[];
  /** Выдачи этого набора подряд без легендарного осколка. */
  pity: number;
  rewardClaimed: boolean;
}

export interface Draw {
  cardId: string;
  rarity: Rarity;
  /** Осколок пришёлся на уже набранную карту и превратился в жетоны. */
  excess: boolean;
  tokens: number;
  guaranteed: boolean;
}

export interface ChestResult {
  chestId: string;
  setId: string;
  tableVersion: number;
  draws: Draw[];
}

export type OpenResult = { ok: true; state: GameState; result: ChestResult } | { ok: false; reason: 'no_chest' | 'bad_config' };
export type CardActionResult = { ok: true; state: GameState } | { ok: false; reason: 'not_ready' | 'already' | 'no_tokens' | 'complete' };

export function emptySetProgress(): SetProgress {
  return { shards: {}, assembled: [], pity: 0, rewardClaimed: false };
}

export function initialCollections(): Record<string, SetProgress> {
  return Object.fromEntries(SETS.map((s) => [s.id, emptySetProgress()]));
}

/** mulberry32: следующее значение в [0, 1) и новое состояние. */
export function nextRandom(seed: number): [number, number] {
  const s = (seed + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

function cloneProgress(p: SetProgress): SetProgress {
  return { shards: { ...p.shards }, assembled: p.assembled.slice(), pity: p.pity, rewardClaimed: p.rewardClaimed };
}

function withSet(state: GameState, setId: string, progress: SetProgress): GameState {
  return { ...state, collections: { ...state.collections, [setId]: progress } };
}

/** Сундук за заказ или проект (CHEST_SOURCES). */
export function grantChestFor(state: GameState, sourceId: string): GameState {
  const chestId = CHEST_SOURCES[sourceId];
  return chestId ? { ...state, chests: [...state.chests, chestId] } : state;
}

export function cardShards(state: GameState, cardId: string): number {
  return state.collections[getCard(cardId).setId]?.shards[cardId] ?? 0;
}

export function isAssembled(state: GameState, cardId: string): boolean {
  return state.collections[getCard(cardId).setId]?.assembled.includes(cardId) ?? false;
}

/** Карта набрала порог (собрана или готова к сборке). */
export function isCardFull(state: GameState, cardId: string): boolean {
  return isAssembled(state, cardId) || cardShards(state, cardId) >= RARITY[getCard(cardId).rarity].threshold;
}

/** Открыть сундук: выдачи по порядку, гарант пересчитывается после каждой. */
export function openChest(state: GameState, index: number, setId: string = SETS[0].id): OpenResult {
  const chestId = state.chests[index];
  if (!chestId) return { ok: false, reason: 'no_chest' };
  const chest = CHESTS[chestId];
  if (!chest || validateChest(chest, setId)) return { ok: false, reason: 'bad_config' };

  let rng = state.rng;
  const progress = cloneProgress(state.collections[setId] ?? emptySetProgress());
  let tokens = state.tokens;
  const draws: Draw[] = [];
  const pool = cardsOf(setId);

  for (let i = 0; i < chest.draws; i++) {
    const guaranteed = progress.pity >= LEGENDARY_PITY;
    let rarity: Rarity = 'legendary';
    if (!guaranteed) {
      let roll: number;
      [roll, rng] = nextRandom(rng);
      let acc = 0;
      rarity = RARITIES[RARITIES.length - 1];
      for (const r of RARITIES) {
        acc += chest.odds[r];
        if (roll * 100 < acc) {
          rarity = r;
          break;
        }
      }
    }
    const candidates = pool.filter((c) => c.rarity === rarity);
    let pick: number;
    [pick, rng] = nextRandom(rng);
    const card = candidates[Math.floor(pick * candidates.length)];

    progress.pity = rarity === 'legendary' ? 0 : progress.pity + 1;
    const threshold = RARITY[rarity].threshold;
    const have = progress.shards[card.id] ?? 0;
    const full = progress.assembled.includes(card.id) || have >= threshold;
    if (full) {
      tokens += RARITY[rarity].excessTokens;
    } else {
      progress.shards[card.id] = have + 1;
    }
    draws.push({ cardId: card.id, rarity, excess: full, tokens: full ? RARITY[rarity].excessTokens : 0, guaranteed });
  }

  const result: ChestResult = { chestId, setId, tableVersion: DROP_TABLE_VERSION, draws };
  const chests = state.chests.slice();
  chests.splice(index, 1);
  const next = { ...withSet(state, setId, progress), chests, tokens, rng, lastChest: result };
  return { ok: true, state: next, result };
}

/** Собрать карту, набравшую порог. Карта остаётся в альбоме навсегда. */
export function assembleCard(state: GameState, cardId: string): CardActionResult {
  const card = getCard(cardId);
  if (isAssembled(state, cardId)) return { ok: false, reason: 'already' };
  if (cardShards(state, cardId) < RARITY[card.rarity].threshold) return { ok: false, reason: 'not_ready' };
  const progress = cloneProgress(state.collections[card.setId]);
  progress.assembled.push(cardId);
  return { ok: true, state: withSet(state, card.setId, progress) };
}

/** Купить один осколок выбранной незавершённой карты за жетоны. Гарант не меняется. */
export function buyShard(state: GameState, cardId: string): CardActionResult {
  const card = getCard(cardId);
  if (isCardFull(state, cardId)) return { ok: false, reason: 'complete' };
  const price = RARITY[card.rarity].shardPrice;
  if (state.tokens < price) return { ok: false, reason: 'no_tokens' };
  const progress = cloneProgress(state.collections[card.setId] ?? emptySetProgress());
  progress.shards[cardId] = (progress.shards[cardId] ?? 0) + 1;
  return { ok: true, state: { ...withSet(state, card.setId, progress), tokens: state.tokens - price } };
}

export function isSetComplete(state: GameState, setId: string): boolean {
  const assembled = state.collections[setId]?.assembled ?? [];
  return cardsOf(setId).every((c) => assembled.includes(c.id));
}

/** Однократная награда за полный набор. */
export function claimSetReward(state: GameState, setId: string): CardActionResult {
  const set = SETS.find((s) => s.id === setId);
  const progress = state.collections[setId];
  if (!set || !progress || !isSetComplete(state, setId)) return { ok: false, reason: 'not_ready' };
  if (progress.rewardClaimed) return { ok: false, reason: 'already' };
  const claimed = withSet(state, setId, { ...cloneProgress(progress), rewardClaimed: true });
  return { ok: true, state: addEnergy({ ...claimed, money: claimed.money + set.reward.money }, set.reward.energy) };
}
