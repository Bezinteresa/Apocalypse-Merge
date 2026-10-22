import { describe, expect, it } from 'vitest';
import { CARDS, CHESTS, LEGENDARY_PITY, RARITY, SETS, cardsOf, validateChest, type Rarity } from '../content/collections';
import { assembleCard, buyShard, claimSetReward, isCardFull, isSetComplete, openChest } from './collections';
import { createInitialState, type GameState } from './state';

const SET = SETS[0].id;

function withChests(state: GameState, n: number, chestId = 'CH_WORN'): GameState {
  return { ...state, chests: new Array(n).fill(chestId) };
}

function open(state: GameState): GameState {
  const r = openChest(state, 0);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

function fullShards(): Record<string, number> {
  return Object.fromEntries(CARDS.map((c) => [c.id, RARITY[c.rarity].threshold]));
}

describe('collection config', () => {
  it('has a 9-card test set with 4/3/1/1 rarities and valid chest tables', () => {
    const cards = cardsOf(SET);
    const count = (r: Rarity) => cards.filter((c) => c.rarity === r).length;
    expect([count('common'), count('rare'), count('epic'), count('legendary')]).toEqual([4, 3, 1, 1]);
    for (const chest of Object.values(CHESTS)) expect(validateChest(chest, SET)).toBeNull();
    expect(validateChest({ ...CHESTS.CH_WORN, odds: { common: 60, rare: 28, epic: 10, legendary: 3 } }, SET)).toMatch(/sum/);
  });
});

describe('opening chests', () => {
  it('is deterministic for the saved seed and removes the chest', () => {
    const s = withChests(createInitialState(42), 2);
    const a = openChest(s, 0);
    const b = openChest(s, 0);
    expect(a).toEqual(b);
    if (!a.ok) return;
    expect(a.state.chests).toHaveLength(1);
    expect(a.result.draws).toHaveLength(3);
    expect(a.state.lastChest).toEqual(a.result);
    expect(a.state.rng).not.toBe(s.rng);
    const shards = Object.values(a.state.collections[SET].shards).reduce((x, y) => x + y, 0);
    expect(shards + a.result.draws.filter((d) => d.excess).length).toBe(3);
    expect(openChest({ ...s, chests: [] }, 0)).toEqual({ ok: false, reason: 'no_chest' });
  });

  it('turns shards of full cards into tokens by rarity', () => {
    const base = createInitialState(7);
    const s = withChests({ ...base, collections: { [SET]: { ...base.collections[SET], shards: fullShards() } } }, 1, 'CH_ARCHIVE');
    const r = openChest(s, 0);
    if (!r.ok) throw new Error();
    expect(r.result.draws.every((d) => d.excess)).toBe(true);
    const expected = r.result.draws.reduce((sum, d) => sum + RARITY[d.rarity].excessTokens, 0);
    expect(r.state.tokens).toBe(expected);
    expect(r.state.collections[SET].shards).toEqual(fullShards());
  });

  it('guarantees a legendary on the 50th draw without one and resets the counter', () => {
    const base = createInitialState(1);
    const s = withChests({ ...base, collections: { [SET]: { ...base.collections[SET], pity: LEGENDARY_PITY } } }, 1);
    const r = openChest(s, 0);
    if (!r.ok) throw new Error();
    expect(r.result.draws[0]).toMatchObject({ rarity: 'legendary', guaranteed: true, cardId: 'C_POWER_SCHEME' });
    expect(r.state.collections[SET].pity).toBeLessThan(3);
  });

  it('never goes more than 49 draws without a legendary over a long run', () => {
    let s = withChests(createInitialState(123), 2000);
    let streak = 0;
    let maxStreak = 0;
    for (let i = 0; i < 2000; i++) {
      const r = openChest(s, 0);
      if (!r.ok) throw new Error();
      s = r.state;
      for (const d of r.result.draws) {
        streak = d.rarity === 'legendary' ? 0 : streak + 1;
        maxStreak = Math.max(maxStreak, streak);
      }
    }
    expect(maxStreak).toBeLessThanOrEqual(LEGENDARY_PITY);
  });

  it('matches the worn chest odds per draw within tolerance', () => {
    let s = withChests(createInitialState(99), 4000);
    const counts: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (let i = 0; i < 4000; i++) {
      const r = openChest(s, 0);
      if (!r.ok) throw new Error();
      s = r.state;
      for (const d of r.result.draws) if (!d.guaranteed) counts[d.rarity] += 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(counts.common / total).toBeCloseTo(0.6, 1);
    expect(counts.rare / total).toBeCloseTo(0.28, 1);
    expect(counts.epic / total).toBeCloseTo(0.1, 1);
    expect(Math.abs(counts.legendary / total - 0.02)).toBeLessThan(0.01);
  });
});

describe('cards, exchange and set reward', () => {
  it('assembles a card once after reaching the threshold', () => {
    const base = createInitialState(5);
    const s = { ...base, collections: { [SET]: { ...base.collections[SET], shards: { C_POSTCARD: 2 } } } };
    expect(assembleCard(s, 'C_POSTCARD')).toEqual({ ok: false, reason: 'not_ready' });
    const ready = { ...s, collections: { [SET]: { ...s.collections[SET], shards: { C_POSTCARD: 3 } } } };
    const r = assembleCard(ready, 'C_POSTCARD');
    if (!r.ok) throw new Error();
    expect(r.state.collections[SET].assembled).toEqual(['C_POSTCARD']);
    expect(assembleCard(r.state, 'C_POSTCARD')).toEqual({ ok: false, reason: 'already' });
  });

  it('buys a chosen shard for tokens, not for a full card, without touching the pity counter', () => {
    const base = createInitialState(5);
    const s = { ...base, tokens: 25, collections: { [SET]: { ...base.collections[SET], pity: 17 } } };
    expect(buyShard({ ...s, tokens: 5 }, 'C_POSTCARD')).toEqual({ ok: false, reason: 'no_tokens' });
    const r = buyShard(s, 'C_METRO_MAP');
    if (!r.ok) throw new Error();
    expect(r.state.tokens).toBe(5);
    expect(r.state.collections[SET].shards.C_METRO_MAP).toBe(1);
    expect(r.state.collections[SET].pity).toBe(17);
    const full = { ...s, collections: { [SET]: { ...s.collections[SET], shards: { C_POSTCARD: 3 } } } };
    expect(isCardFull(full, 'C_POSTCARD')).toBe(true);
    expect(buyShard(full, 'C_POSTCARD')).toEqual({ ok: false, reason: 'complete' });
  });

  it('gives the set reward once after all cards are assembled', () => {
    const base = createInitialState(5);
    let s: GameState = { ...base, collections: { [SET]: { ...base.collections[SET], shards: fullShards() } } };
    expect(claimSetReward(s, SET)).toEqual({ ok: false, reason: 'not_ready' });
    for (const c of cardsOf(SET)) {
      const r = assembleCard(s, c.id);
      if (!r.ok) throw new Error();
      s = r.state;
    }
    expect(isSetComplete(s, SET)).toBe(true);
    const r = claimSetReward(s, SET);
    if (!r.ok) throw new Error();
    expect(r.state.money).toBe(s.money + SETS[0].reward.money);
    expect(r.state.energy).toBe(s.energy + SETS[0].reward.energy);
    expect(claimSetReward(r.state, SET)).toEqual({ ok: false, reason: 'already' });
  });
});

describe('collection pacing (model)', () => {
  /** Сколько потёртых сундуков нужно, чтобы собрать весь набор; с обменом жетонов или без. */
  function chestsToComplete(seed: number, exchange: boolean): number {
    let s: GameState = createInitialState(seed);
    for (let n = 1; n <= 5000; n++) {
      s = open(withChests(s, 1));
      if (exchange) {
        for (const c of cardsOf(SET)) {
          for (;;) {
            const r = buyShard(s, c.id);
            if (!r.ok) break;
            s = r.state;
          }
        }
      }
      if (cardsOf(SET).every((c) => isCardFull(s, c.id))) return n;
    }
    return Infinity;
  }

  it('reports median and slow cases for the test set', () => {
    const stats = (exchange: boolean) => {
      const runs = Array.from({ length: 400 }, (_, i) => chestsToComplete(1000 + i, exchange)).sort((a, b) => a - b);
      return { median: runs[200], p90: runs[360], max: runs[399] };
    };
    const withEx = stats(true);
    const without = stats(false);
    console.log('worn chests to complete S_OLD_WORLD — with exchange:', withEx, 'without:', without);
    expect(withEx.median).toBeLessThanOrEqual(without.median);
    expect(without.max).toBeLessThan(Infinity);
  });
});
