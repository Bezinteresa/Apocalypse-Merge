import { openBoard } from './testUtils';
import { describe, expect, it } from 'vitest';
import { START_GENERATORS } from '../content/board';
import { GENERATORS, getItem } from '../content/items';
import { ORDERS, PROJECTS } from '../content/orders';
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
  isChapterComplete,
  areAllOrdersDone,
  placeIncoming,
  whereToGet,
  ingredientCells,
} from './rules';
import type { GameState } from './state';

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
    const gen = s.cells.findIndex((c) => c?.kind === 'generator' && GENERATORS[c.generatorId].output.startsWith(def.chain));
    const r = spawnFromGenerator(s, gen);
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
    let s = put(put(openBoard(), 0, 'T01'), 1, 'T01');
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
    const s = putStorage(openBoard(), 0, 'T01');
    expect(moveItem(s, board(GEN_CELL.T), slot(1))).toEqual({ ok: false, reason: 'generator_to_storage' });
    expect(moveItem(s, slot(0), board(GEN_CELL.T))).toEqual({ ok: false, reason: 'generator_to_storage' });
  });
});

describe('selling', () => {
  it('sells an item, undoes the last sale, and blocks generators', () => {
    const s = put(openBoard(), 3, 'T03');
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
    const sold = sellItem(put(openBoard(), 3, 'T01'), board(3));
    if (!sold.ok) throw new Error();
    const spawned = spawnFromGenerator(sold.state, GEN_CELL.M);
    if (!spawned.ok) throw new Error();
    expect(spawned.state.lastSale).toBeNull();
    expect(undoSale(spawned.state).ok).toBe(false);
  });
});

describe('orders', () => {
  it('shows only O01 before the first delivery, then O02 and R01', () => {
    const s = openBoard();
    expect(availableOrders(s).map((o) => o.id)).toEqual(['O01']);
    expect(currentProject(s)).toBeNull();
    const after = { ...s, completedOrders: ['O01'] };
    expect(availableOrders(after).map((o) => o.id)).toEqual(['O02']);
    expect(currentProject(after)?.id).toBe('R01');
  });

  it('delivers once, atomically, preferring board items over storage', () => {
    const s = putStorage(put(openBoard(), 0, 'T02'), 0, 'T02');
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
    const s = put(openBoard(), 0, 'T01');
    const before = JSON.stringify(s);
    expect(deliverOrder(s, 'O01')).toEqual({ ok: false, reason: 'missing_items' });
    expect(deliverOrder(s, 'O03')).toEqual({ ok: false, reason: 'unavailable' });
    expect(deliverOrder(s, 'X99')).toEqual({ ok: false, reason: 'unknown' });
    expect(JSON.stringify(s)).toBe(before);
  });

  it('takes a storage item when the board has none', () => {
    const s = { ...putStorage(openBoard(), 2, 'M03'), completedOrders: ['O01'] };
    const r = deliverOrder(s, 'O02');
    expect(r.ok && r.state.storage[2]).toBeNull();
  });
});

describe('projects', () => {
  it('requires the current project, money and items', () => {
    let s = { ...put(openBoard(), 0, 'M02'), completedOrders: ['O01'] };
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

  it('plays both chapters with money and energy matching the plan', () => {
    let s = openBoard();
    const run = (r: { ok: true; state: GameState } | { ok: false; reason: string }) => {
      if (!r.ok) throw new Error(r.reason);
      s = r.state;
    };
    const order = (id: string) => {
      for (const req of ORDERS.find((o) => o.id === id)!.requires) s = craft(s, req.itemId);
      run(deliverOrder(s, id));
    };
    const project = (id: string) => {
      for (const req of PROJECTS.find((p) => p.id === id)!.requires) s = craft(s, req.itemId);
      run(completeProject(s, id));
    };
    // порядок и суммы — CONTENT_CATALOG, раздел 6.3
    const plan: [string[], string, number][] = [
      [['O01', 'O02'], 'R01', 24],
      [['O03'], 'R02', 24],
      [['O04', 'O05'], 'R03', 64],
      [['O06', 'O07', 'O08'], 'R04', 100],
      [['O09', 'O10', 'O11'], 'R05', 186],
      [['O12', 'O13', 'O14'], 'R06', 231],
      [['O15', 'O16'], 'R07', 276],
      [['O17', 'O18'], 'R08', 326],
      // глава 2 (гараж): сначала ворота, потом заказы каждой ступени — CONTENT_CATALOG, раздел 10
      [[], 'R09', 246],
      [['O19', 'O20', 'O21'], 'R10', 286],
      [['O22', 'O23', 'O24'], 'R11', 351],
      [['O25', 'O26', 'O27'], 'R12', 426],
      [['O28', 'O29', 'O30'], 'R13', 536],
    ];
    for (const [orders, proj, money] of plan) {
      orders.forEach(order);
      project(proj);
      expect(s.money, proj).toBe(money);
      if (proj === 'R08') {
        // каталог 6.2: 100 стартовой + 3 × 50 = 250 энергии покрывают 216 обязательных выдач главы 1 с запасом 34
        expect(s.energy).toBe(34);
        expect(isChapterComplete(s)).toBe(false);
        expect(currentProject(s)?.id).toBe('R09');
      }
    }
    // глава 2: 206 обязательных выдач против 34 + 4 × 50 энергии — запас 28 без восстановления
    expect(s.energy).toBe(28);
    // каждый проект и каждый третий заказ дают потёртый сундук: 13 + 10
    expect(s.chests).toHaveLength(23);
    expect(isChapterComplete(s)).toBe(true);
    expect(areAllOrdersDone(s)).toBe(true);
    expect(currentProject(s)).toBeNull();
    expect(s.storage).toHaveLength(10);
    expect(s.incoming).toEqual([]);
    // пять цепочек — пять видов генераторов; ящики-улучшения из ремонтов стоят рядом, их объединяет игрок
    expect(new Set(s.cells.flatMap((c) => (c?.kind === 'generator' ? [c.generatorId] : []))).size).toBe(5);
    expect(validateState(s)).toBe(true);
  });

  it('R03 places the provision crate; without space it waits in incoming', () => {
    const base = { ...put(put(openBoard(), 0, 'T03'), 1, 'M03'), money: 35, completedOrders: ['O01'], completedProjects: ['R01', 'R02'] };
    const placed = completeProject(base, 'R03');
    expect(placed.ok && placed.placedCell).not.toBeNull();
    if (!placed.ok) return;
    expect(placed.state.incoming).toEqual([]);
    expect(availableOrders(placed.state).map((o) => o.id)).toEqual(['O02', 'O03', 'O04']);

    // заполнить все свободные клетки, оставив T03 и M03 для проекта
    let full = base;
    for (let i = 2; i < full.cells.length; i++) if (full.cells[i] === null && !full.fog[i]) full = put(full, i, 'T06');
    const waiting = completeProject(full, 'R03');
    expect(waiting.ok).toBe(true);
    if (!waiting.ok) return;
    // T03 и M03 списаны — их клетки освободились, генератор занял одну из них
    expect(waiting.state.incoming).toEqual([]);

    let reallyFull = { ...full, cells: full.cells.slice() };
    reallyFull = put(put(reallyFull, 0, 'T06'), 1, 'T06');
    const stuck = placeIncoming({ ...reallyFull, incoming: ['G_PROVISION'] });
    expect(stuck).toEqual({ ok: false, reason: 'board_full' });
  });

  it('R04 requires the provision crate on the board', () => {
    const s = { ...put(put(openBoard(), 0, 'T03'), 1, 'M04'), money: 50, completedOrders: ['O01'], completedProjects: ['R01', 'R02', 'R03'], incoming: ['G_PROVISION'] };
    expect(completeProject(s, 'R04')).toEqual({ ok: false, reason: 'generator_missing' });
    const placed = placeIncoming(s);
    if (!placed.ok) throw new Error();
    const r = completeProject(placed.state, 'R04');
    expect(r.ok && r.state.storage).toHaveLength(10);
  });
});

describe('where to get', () => {
  it('points to the generator on board, in incoming, or the project that unlocks it', () => {
    const s = openBoard();
    expect(whereToGet(s, 'T03')).toEqual({ status: 'on_board', generatorId: 'G_TOOL', cell: GEN_CELL.T });
    expect(whereToGet(s, 'P02')).toEqual({ status: 'locked', generatorId: 'G_PROVISION', unlockProject: 'R03' });
    expect(whereToGet({ ...s, incoming: ['G_ELECTRIC'] }, 'E04')).toEqual({ status: 'incoming', generatorId: 'G_ELECTRIC' });
  });

  it('lists lower items of the same chain as ingredients', () => {
    const s = put(put(put(openBoard(), 0, 'T01'), 1, 'T03'), 2, 'M01');
    expect(ingredientCells(s, 'T02')).toEqual([0]);
    expect(ingredientCells(s, 'T04')).toEqual([0, 1]);
  });
});
