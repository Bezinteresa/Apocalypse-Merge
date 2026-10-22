import { describe, expect, it } from 'vitest';
import { LOCKED_GROUPS, START_GENERATORS } from '../content/board';
import { getItem } from '../content/items';
import {
  availableOrders,
  board,
  completeProject,
  currentProject,
  deliverOrder,
  moveItem,
  sellItem,
  slot,
  spawnFromGenerator,
  undoSale,
  validateState,
} from './rules';
import { createInitialState, type GameState } from './state';

const GEN_CELL = { T: START_GENERATORS[0].cell, M: START_GENERATORS[1].cell } as const;

function put(state: GameState, cell: number, itemId: string): GameState {
  const cells = state.cells.slice();
  cells[cell] = { kind: 'item', uid: state.nextUid, itemId };
  return { ...state, cells, nextUid: state.nextUid + 1 };
}

function putStorage(state: GameState, index: number, itemId: string): GameState {
  const storage = state.storage.slice();
  storage[index] = { uid: state.nextUid, itemId };
  return { ...state, storage, nextUid: state.nextUid + 1 };
}

/** Изготовить предмет с нуля: выдачи из генератора и объединение пар той же цепочки. */
function craft(state: GameState, itemId: string): GameState {
  const def = getItem(itemId);
  let s = state;
  for (let i = 0; i < 2 ** (def.level - 1); i++) {
    const r = spawnFromGenerator(s, GEN_CELL[def.chain as 'T' | 'M']);
    if (!r.ok) throw new Error(r.reason);
    s = r.state;
    for (;;) {
      const idx = s.cells.findIndex(
        (c, a) => c?.kind === 'item' && c.itemId.startsWith(def.chain) && s.cells.some((d, b) => b !== a && d?.kind === 'item' && d.itemId === c.itemId),
      );
      if (idx < 0 || getItem((s.cells[idx] as { itemId: string }).itemId).level >= def.level) break;
      const id = (s.cells[idx] as { itemId: string }).itemId;
      const other = s.cells.findIndex((d, b) => b !== idx && d?.kind === 'item' && d.itemId === id);
      const m = moveItem(s, board(idx), board(other));
      if (!m.ok) throw new Error(m.reason);
      s = m.state;
    }
  }
  return s;
}

describe('storage', () => {
  it('moves items between board and storage and merges inside storage', () => {
    let s = put(put(createInitialState(), 0, 'T01'), 1, 'T01');
    let r = moveItem(s, board(0), slot(0));
    expect(r.ok && r.action).toBe('move');
    if (!r.ok) return;
    s = r.state;
    expect(s.storage[0]).toMatchObject({ itemId: 'T01' });
    r = moveItem(s, board(1), slot(0));
    expect(r.ok && r.action).toBe('merge');
    if (!r.ok) return;
    expect(r.state.storage[0]).toMatchObject({ itemId: 'T02' });
    const back = moveItem(r.state, slot(0), board(5));
    expect(back.ok && back.state.cells[5]).toMatchObject({ itemId: 'T02' });
  });

  it('never puts a generator into storage', () => {
    const s = putStorage(createInitialState(), 0, 'T01');
    expect(moveItem(s, board(GEN_CELL.T), slot(1))).toEqual({ ok: false, reason: 'generator_to_storage' });
    expect(moveItem(s, slot(0), board(GEN_CELL.T))).toEqual({ ok: false, reason: 'generator_to_storage' });
  });
});

describe('selling', () => {
  it('sells an item, undoes the last sale, and blocks generators', () => {
    const s = put(createInitialState(), 3, 'T03');
    const sold = sellItem(s, board(3));
    expect(sold.ok).toBe(true);
    if (!sold.ok) return;
    expect(sold.price).toBe(4);
    expect(sold.state.money).toBe(4);
    expect(sold.state.cells[3]).toBeNull();
    const undone = undoSale(sold.state);
    expect(undone.ok).toBe(true);
    if (!undone.ok) return;
    expect(undone.state.money).toBe(0);
    expect(undone.state.cells[3]).toEqual(s.cells[3]);
    expect(undoSale(undone.state)).toEqual({ ok: false, reason: 'nothing_to_undo' });
    expect(sellItem(s, board(GEN_CELL.T))).toEqual({ ok: false, reason: 'generator' });
  });

  it('loses the undo after the next game action', () => {
    const sold = sellItem(put(createInitialState(), 3, 'T01'), board(3));
    if (!sold.ok) throw new Error();
    const spawned = spawnFromGenerator(sold.state, GEN_CELL.M);
    if (!spawned.ok) throw new Error();
    expect(spawned.state.lastSale).toBeNull();
    expect(undoSale(spawned.state).ok).toBe(false);
  });
});

describe('orders', () => {
  it('shows only O01 before the first delivery, then O02 and R01', () => {
    const s = createInitialState();
    expect(availableOrders(s).map((o) => o.id)).toEqual(['O01']);
    expect(currentProject(s)).toBeNull();
    const after = { ...s, completedOrders: ['O01'] };
    expect(availableOrders(after).map((o) => o.id)).toEqual(['O02']);
    expect(currentProject(after)?.id).toBe('R01');
  });

  it('delivers once, atomically, preferring board items over storage', () => {
    const s = putStorage(put(createInitialState(), 0, 'T02'), 0, 'T02');
    const r = deliverOrder(s, 'O01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.money).toBe(12);
    expect(r.state.cells[0]).toBeNull();
    expect(r.state.storage[0]).toMatchObject({ itemId: 'T02' });
    expect(r.state.completedOrders).toEqual(['O01']);
    expect(deliverOrder(r.state, 'O01')).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('rejects missing items without changing state', () => {
    const s = put(createInitialState(), 0, 'T01');
    const before = JSON.stringify(s);
    expect(deliverOrder(s, 'O01')).toEqual({ ok: false, reason: 'missing_items' });
    expect(deliverOrder(s, 'O03')).toEqual({ ok: false, reason: 'unavailable' });
    expect(deliverOrder(s, 'X99')).toEqual({ ok: false, reason: 'unknown' });
    expect(JSON.stringify(s)).toBe(before);
  });

  it('takes a storage item when the board has none', () => {
    const s = { ...putStorage(createInitialState(), 2, 'M03'), completedOrders: ['O01'] };
    const r = deliverOrder(s, 'O02');
    expect(r.ok && r.state.storage[2]).toBeNull();
  });
});

describe('projects', () => {
  it('requires the current project, money and items', () => {
    let s = { ...put(createInitialState(), 0, 'M02'), completedOrders: ['O01'] };
    expect(completeProject(s, 'R02')).toEqual({ ok: false, reason: 'not_current' });
    expect(completeProject(s, 'R01')).toEqual({ ok: false, reason: 'no_money' });
    s = { ...s, money: 10 };
    const r = completeProject(s, 'R01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.money).toBe(0);
    expect(r.state.cells[0]).toBeNull();
    expect(currentProject(r.state)?.id).toBe('R02');
    expect(completeProject(r.state, 'R01')).toEqual({ ok: false, reason: 'not_current' });
    expect(availableOrders(r.state).map((o) => o.id)).toEqual(['O02', 'O03']);
  });

  it('R02 unlocks its group of cells', () => {
    const s = { ...put(put(createInitialState(), 0, 'T02'), 1, 'M03'), money: 25, completedOrders: ['O01'], completedProjects: ['R01'] };
    const r = completeProject(s, 'R02');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.unlockedCells).toEqual(LOCKED_GROUPS[0].cells);
    expect(r.state.locked).toHaveLength(9);
    for (const c of LOCKED_GROUPS[0].cells) expect(r.state.locked).not.toContain(c);
  });

  it('plays the stage 2 slice with money matching the catalog table', () => {
    let s = createInitialState();
    const step = (fn: (st: GameState) => { ok: boolean; state?: GameState }) => {
      const r = fn(s) as { ok: true; state: GameState } | { ok: false; reason: string };
      if (!r.ok) throw new Error(r.reason);
      s = r.state;
    };
    s = craft(s, 'T02');
    step((x) => deliverOrder(x, 'O01'));
    s = craft(s, 'M03');
    step((x) => deliverOrder(x, 'O02'));
    expect(s.money).toBe(34);
    s = craft(s, 'M02');
    step((x) => completeProject(x, 'R01'));
    expect(s.money).toBe(24);
    s = craft(s, 'T03');
    step((x) => deliverOrder(x, 'O03'));
    s = craft(craft(s, 'T02'), 'M03');
    step((x) => completeProject(x, 'R02'));
    expect(s.money).toBe(24);
    s = craft(s, 'T04');
    step((x) => deliverOrder(x, 'O04'));
    s = craft(craft(s, 'M03'), 'T02');
    step((x) => deliverOrder(x, 'O05'));
    s = craft(craft(s, 'T03'), 'M03');
    step((x) => completeProject(x, 'R03'));
    expect(s.money).toBe(64);
    expect(currentProject(s)).toBeNull();
    expect(availableOrders(s)).toEqual([]);
    expect(validateState(s)).toBe(true);
  });
});
