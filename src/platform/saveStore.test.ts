import { openBoard } from '../game/testUtils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnFromGenerator } from '../game/rules';
import type { GameState } from '../game/state';
import { START_GENERATORS } from '../content/board';
import { PREV_KEY, SAVE_KEY, SaveFormatError, SaveStore, type StorageBackend } from './saveStore';

class MemoryBackend implements StorageBackend {
  data: Record<string, unknown> = {};
  failGet = false;
  failSet = 0;
  setCalls = 0;
  async get(keys: string[]) {
    if (this.failGet) throw new Error('network');
    return keys.map((k) => this.data[k] ?? null);
  }
  async set(keys: string[], values: unknown[]) {
    this.setCalls += 1;
    if (this.failSet > 0) {
      this.failSet -= 1;
      throw new Error('network');
    }
    keys.forEach((k, i) => (this.data[k] = JSON.parse(JSON.stringify(values[i]))));
  }
}

function progressed(): GameState {
  const r = spawnFromGenerator(openBoard(), START_GENERATORS[0].cell);
  if (!r.ok) throw new Error();
  return r.state;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('SaveStore', () => {
  it('starts a new game when nothing is saved', async () => {
    const r = await new SaveStore(new MemoryBackend()).load();
    expect(r.source).toBe('new');
    expect(r.recovered).toBe(false);
  });

  it('propagates read errors instead of returning a fresh state', async () => {
    const b = new MemoryBackend();
    b.failGet = true;
    await expect(new SaveStore(b).load()).rejects.toThrow('network');
  });

  it('saves with debounce and restores after reload', async () => {
    const b = new MemoryBackend();
    const store = new SaveStore(b, 500);
    const s = progressed();
    store.save(openBoard());
    store.save(s);
    expect(b.setCalls).toBe(0);
    await vi.advanceTimersByTimeAsync(600);
    expect(b.setCalls).toBe(1);
    expect(store.isDirty).toBe(false);
    const loaded = await new SaveStore(b).load();
    expect(loaded.source).toBe('main');
    expect(loaded.state).toEqual(s);
  });

  it('falls back to the previous valid copy when main is corrupted', async () => {
    const b = new MemoryBackend();
    const s = progressed();
    b.data[SAVE_KEY] = '{broken';
    b.data[PREV_KEY] = s;
    const r = await new SaveStore(b).load();
    expect(r.source).toBe('prev');
    expect(r.recovered).toBe(true);
    expect(r.state).toEqual(s);
  });

  it('migrates a v1 save without losing the board', async () => {
    const b = new MemoryBackend();
    const v2 = progressed();
    const { storage: _s, completedOrders: _o, completedProjects: _p, lastSale: _l, seenDialogs: _d, incoming: _i, energy: _e, energyUpdatedAt: _eu, energyUnlimited: _el, collections: _c, tokens: _t, chests: _ch, rng: _r, lastChest: _lc, adRewards: _ad, ...v1 } = { ...v2, schemaVersion: 1 };
    b.data[SAVE_KEY] = v1;
    const r = await new SaveStore(b).load();
    expect(r.source).toBe('main');
    expect(r.state.schemaVersion).toBe(8);
    expect(r.state.incoming).toEqual([]);
    expect(r.state.energy).toBe(100);
    expect(r.state.chests).toEqual([]);
    expect(r.state.seenDialogs).toEqual(['D_INTRO']);
    expect(r.state.cells).toEqual(v2.cells);
    expect(r.state.storage).toHaveLength(6);
    expect(r.state.completedOrders).toEqual([]);
  });

  it('v3 → v4 delivers the R03 generator that the stage 2 slice only announced', async () => {
    const b = new MemoryBackend();
    const { incoming: _i, energy: _e, energyUpdatedAt: _eu, energyUnlimited: _el, collections: _c, tokens: _t, chests: _ch, rng: _r, lastChest: _lc, adRewards: _ad, ...v3 } = { ...openBoard(), schemaVersion: 3, completedOrders: ['O01'], completedProjects: ['R01', 'R02', 'R03'] };
    b.data[SAVE_KEY] = v3;
    const r = await new SaveStore(b).load();
    expect(r.state.schemaVersion).toBe(8);
    expect(r.state.incoming).toEqual(['G_PROVISION']);
    // сундуки задним числом: R01, R02, R03
    expect(r.state.chests).toEqual(['CH_WORN', 'CH_WORN', 'CH_WORN']);
    // стартовые 100 + 50 за уже завершённый R02
    expect(r.state.energy).toBe(150);
  });

  it('refuses saves from a newer schema', async () => {
    const b = new MemoryBackend();
    b.data[SAVE_KEY] = { ...openBoard(), schemaVersion: 99 };
    await expect(new SaveStore(b).load()).rejects.toBeInstanceOf(SaveFormatError);
  });

  it('retries failed writes and keeps the latest state', async () => {
    const b = new MemoryBackend();
    b.failSet = 1;
    const store = new SaveStore(b, 0);
    const s = progressed();
    store.save(s);
    await vi.advanceTimersByTimeAsync(10);
    expect(store.isDirty).toBe(true);
    await vi.advanceTimersByTimeAsync(2100);
    expect(store.isDirty).toBe(false);
    expect(b.data[SAVE_KEY]).toEqual(s);
  });

  it('flush starts writing synchronously, without waiting for a timer', () => {
    const b = new MemoryBackend();
    const store = new SaveStore(b, 800);
    store.save(progressed());
    void store.flush();
    expect(b.setCalls).toBe(1);
  });

  it('writes the attached log in the same call and returns it on load', async () => {
    const b = new MemoryBackend();
    const store = new SaveStore(b, 0);
    store.attachLog(() => ({ version: 1, events: [{ t: 1, e: 'x' }] }));
    store.save(progressed());
    await vi.advanceTimersByTimeAsync(10);
    expect(b.setCalls).toBe(1);
    const loaded = await new SaveStore(b).load();
    expect(loaded.log).toEqual({ version: 1, events: [{ t: 1, e: 'x' }] });
  });

  it('keeps the previous saved state as backup copy', async () => {
    const b = new MemoryBackend();
    const store = new SaveStore(b, 0);
    const first = openBoard();
    const second = progressed();
    store.save(first);
    await vi.advanceTimersByTimeAsync(10);
    store.save(second);
    await vi.advanceTimersByTimeAsync(10);
    expect(b.data[SAVE_KEY]).toEqual(second);
    expect(b.data[PREV_KEY]).toEqual(first);
  });
});
