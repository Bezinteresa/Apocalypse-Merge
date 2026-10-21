import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnFromGenerator } from '../game/rules';
import { createInitialState, type GameState } from '../game/state';
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
  const r = spawnFromGenerator(createInitialState(), START_GENERATORS[0].cell);
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
    store.save(createInitialState());
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

  it('refuses saves from a newer schema', async () => {
    const b = new MemoryBackend();
    b.data[SAVE_KEY] = { ...createInitialState(), schemaVersion: 99 };
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

  it('keeps the previous saved state as backup copy', async () => {
    const b = new MemoryBackend();
    const store = new SaveStore(b, 0);
    const first = createInitialState();
    const second = progressed();
    store.save(first);
    await vi.advanceTimersByTimeAsync(10);
    store.save(second);
    await vi.advanceTimersByTimeAsync(10);
    expect(b.data[SAVE_KEY]).toEqual(second);
    expect(b.data[PREV_KEY]).toEqual(first);
  });
});
