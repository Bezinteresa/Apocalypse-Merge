import { openBoard } from './testUtils';
import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, START_GENERATORS, neighbors } from '../content/board';
import { GENERATORS, ITEMS, getItem } from '../content/items';
import { ORDERS, PROJECTS } from '../content/orders';
import { countItem, findFreeCellNear, moveContent, sellItem, spawnFromGenerator, validateState } from './rules';
import { createInitialState, type GameState } from './state';

const TOOL_CELL = START_GENERATORS.find((g) => g.generatorId === 'G_TOOL')!.cell;
const MATERIAL_CELL = START_GENERATORS.find((g) => g.generatorId === 'G_MATERIAL')!.cell;

function withItem(state: GameState, cell: number, itemId: string): GameState {
  const cells = state.cells.slice();
  cells[cell] = { kind: 'item', uid: state.nextUid, itemId };
  return { ...state, cells, nextUid: state.nextUid + 1 };
}

describe('content', () => {
  it('has 27 items with valid, acyclic chains', () => {
    expect(Object.keys(ITEMS)).toHaveLength(27);
    for (const def of Object.values(ITEMS)) {
      if (def.nextId) {
        const next = ITEMS[def.nextId];
        expect(next.chain).toBe(def.chain);
        expect(next.level).toBe(def.level + 1);
      }
    }
    for (const g of Object.values(GENERATORS)) expect(ITEMS[g.output].level).toBe(1);
  });
});

describe('content reachability', () => {
  // требования достижимы из генераторов, открытых к моменту доступности заказа/проекта
  const chainsAfter = (projectIndex: number) => {
    const gens = START_GENERATORS.map((g) => g.generatorId);
    for (const p of PROJECTS.slice(0, projectIndex)) if (p.generatorReward) gens.push(p.generatorReward);
    return new Set(gens.map((g) => getItem(GENERATORS[g].output).chain));
  };

  it('every order and project needs only opened chains and existing items', () => {
    for (const o of ORDERS) {
      const idx = o.after ? PROJECTS.findIndex((p) => p.id === o.after) + 1 : 0;
      for (const r of o.requires) {
        expect(ITEMS[r.itemId], o.id).toBeDefined();
        expect(chainsAfter(idx).has(getItem(r.itemId).chain), `${o.id} ${r.itemId}`).toBe(true);
        expect(getItem(r.itemId).level, o.id).toBeLessThanOrEqual(4);
      }
    }
    PROJECTS.forEach((p, i) => {
      for (const r of p.requires) expect(chainsAfter(i).has(getItem(r.itemId).chain), `${p.id} ${r.itemId}`).toBe(true);
      if (p.requiresGenerator) expect(PROJECTS.slice(0, i).some((q) => q.generatorReward === p.requiresGenerator), p.id).toBe(true);
    });
  });
});

describe('initial state', () => {
  it('starts with 13 free cells and 2 generators, a ring of 16 cobwebs and 32 boxes', () => {
    const s = createInitialState(1);
    expect(s.cells.filter((c) => c?.kind === 'generator')).toHaveLength(2);
    expect(s.cells.filter((c, i) => c === null && !s.fog[i]).length).toBe(13);
    expect(s.fog.filter((f) => f === 'web')).toHaveLength(16);
    expect(s.fog.filter((f) => f === 'box')).toHaveLength(32);
    expect(s.money).toBe(0);
    expect(validateState(s)).toBe(true);
  });

  it('layout is consistent: cobwebs hold items, no box touches an open cell', () => {
    const s = createInitialState(1);
    s.fog.forEach((f, i) => {
      if (f === 'web') expect(s.cells[i]?.kind, `web ${i}`).toBe('item');
      if (f === 'box') for (const n of neighbors(i)) expect(s.fog[n], `box ${i} next to open ${n}`).not.toBeNull();
      if (s.cells[i]?.kind === 'generator') expect(f).toBeNull();
    });
    // видимые под паутиной предметы считаются найденными, скрытые в коробках — нет
    expect(s.discovered).toContain('T01');
    expect(s.discovered).not.toContain('T06');
  });
});

describe('spawnFromGenerator', () => {
  it('places first level next to the generator', () => {
    const r = spawnFromGenerator(openBoard(), TOOL_CELL);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itemId).toBe('T01');
    expect(r.state.cells[r.cell]).toMatchObject({ kind: 'item', itemId: 'T01' });
    expect(Math.abs(r.cell - TOOL_CELL)).toBeLessThanOrEqual(8);
  });

  it('rejects a non-generator cell', () => {
    expect(spawnFromGenerator(openBoard(), 0)).toEqual({ ok: false, reason: 'not_generator' });
  });

  it('refuses on full board without changing state and never fills locked cells', () => {
    let s = openBoard();
    const free = s.cells.filter((c, i) => c === null && !s.fog[i]).length;
    for (let i = 0; i < free; i++) {
      const r = spawnFromGenerator(s, i % 2 ? TOOL_CELL : MATERIAL_CELL);
      expect(r.ok).toBe(true);
      if (r.ok) s = r.state;
    }

    const before = JSON.stringify(s);
    expect(spawnFromGenerator(s, TOOL_CELL)).toEqual({ ok: false, reason: 'board_full' });
    expect(JSON.stringify(s)).toBe(before);
    expect(findFreeCellNear(s, TOOL_CELL)).toBeNull();
  });
});

describe('moveContent', () => {
  it('moves to an empty cell', () => {
    const s = withItem(openBoard(), 0, 'T01');
    const r = moveContent(s, 0, 1);
    expect(r.ok && r.action).toBe('move');
    if (!r.ok) return;
    expect(r.state.cells[0]).toBeNull();
    expect(r.state.cells[1]).toMatchObject({ itemId: 'T01' });
    expect(s.cells[0]).not.toBeNull(); // input untouched
  });

  it('merges two equal items into the next level at the target', () => {
    const s = withItem(withItem(openBoard(), 0, 'M01'), 1, 'M01');
    const r = moveContent(s, 0, 1);
    expect(r.ok && r.action).toBe('merge');
    if (!r.ok) return;
    expect(r.state.cells[0]).toBeNull();
    expect(r.state.cells[1]).toMatchObject({ kind: 'item', itemId: 'M02' });
    expect(r.state.cells.filter((c) => c?.kind === 'item')).toHaveLength(1);
  });

  it('swaps different items, different levels and max levels', () => {
    for (const [a, b] of [['T01', 'M01'], ['T01', 'T02'], ['M05', 'M05'], ['T06', 'T06']]) {
      const s = withItem(withItem(openBoard(), 0, a), 1, b);
      const r = moveContent(s, 0, 1);
      expect(r.ok && r.action).toBe('swap');
      if (!r.ok) return;
      expect(r.state.cells[0]).toMatchObject({ itemId: b });
      expect(r.state.cells[1]).toMatchObject({ itemId: a });
    }
  });

  it('swaps an item with a generator without destroying either', () => {
    const s = withItem(openBoard(), 0, 'T01');
    const r = moveContent(s, 0, TOOL_CELL);
    expect(r.ok && r.action).toBe('swap');
    if (!r.ok) return;
    expect(r.state.cells[0]).toMatchObject({ kind: 'generator', generatorId: 'G_TOOL' });
    expect(r.state.cells[TOOL_CELL]).toMatchObject({ itemId: 'T01' });
  });

  it('rejects locked targets, empty sources and same cell', () => {
    const lockedCell = 10;
    const s = { ...withItem(openBoard(), 0, 'T01'), fog: openBoard().fog.map((f, i) => (i === lockedCell ? ('box' as const) : f)) };
    expect(moveContent(s, 0, lockedCell)).toEqual({ ok: false, reason: 'locked' });
    expect(moveContent(s, 2, 3)).toEqual({ ok: false, reason: 'empty_source' });
    expect(moveContent(s, 0, 0)).toEqual({ ok: false, reason: 'same_cell' });
    expect(moveContent(s, 0, BOARD_SIZE)).toEqual({ ok: false, reason: 'out_of_bounds' });
  });

  it('reaches max level T06 from 32 spawns', () => {
    let s = openBoard();
    for (let i = 0; i < 32; i++) {
      const r = spawnFromGenerator(s, TOOL_CELL);
      if (!r.ok) throw new Error('spawn failed');
      s = r.state;
      // объединяем, пока на поле есть пара одинаковых предметов
      for (;;) {
        const cells = s.cells.map((c, idx) => ({ c, idx })).filter((x) => x.c?.kind === 'item');
        const pair = cells.find((x) => cells.some((y) => y.idx !== x.idx && (y.c as any).itemId === (x.c as any).itemId && ITEMS[(x.c as any).itemId].nextId));
        if (!pair) break;
        const other = cells.find((y) => y.idx !== pair.idx && (y.c as any).itemId === (pair.c as any).itemId)!;
        const m = moveContent(s, pair.idx, other.idx);
        if (!m.ok) throw new Error('merge failed');
        s = m.state;
      }
    }
    const items = s.cells.filter((c) => c?.kind === 'item');
    expect(items).toEqual([expect.objectContaining({ itemId: 'T06' })]);
    expect(validateState(s)).toBe(true);
  });
});

describe('cobwebs and boxes', () => {
  // реальная раскладка: (1,3) — открытая клетка, (0,3) — паутина с M01, (0,2) — коробка с P01
  const open = 1 * 0 + 3 * 7 + 1;
  const web = 3 * 7 + 0;
  const box = 2 * 7 + 0;

  it('merging the same item onto a cobweb frees the cell and reveals neighbouring boxes', () => {
    const s = withItem(createInitialState(1), open, 'M01');
    expect(s.fog[web]).toBe('web');
    expect(s.fog[box]).toBe('box');
    const r = moveContent(s, open, web);
    expect(r.ok && r.action).toBe('merge');
    if (!r.ok) return;
    expect(r.freed).toBe(true);
    expect(r.state.cells[web]).toMatchObject({ itemId: 'M02' });
    expect(r.state.fog[web]).toBeNull();
    expect(r.state.fog[box]).toBe('web');
    expect(r.state.discovered).toContain('P01');
  });

  it('cobweb items cannot be moved, swapped, sold or used for orders; boxes take nothing', () => {
    const s = withItem(createInitialState(1), open, 'T01');
    expect(moveContent(s, web, open)).toEqual({ ok: false, reason: 'locked' });
    expect(moveContent(s, open, web)).toEqual({ ok: false, reason: 'locked' });
    expect(moveContent(s, open, box)).toEqual({ ok: false, reason: 'locked' });
    expect(sellItem(s, { area: 'board', index: web })).toEqual({ ok: false, reason: 'locked' });
    expect(countItem(s, 'M01')).toBe(0);
  });

  it('an empty box opens at once and reveals further', () => {
    const s = createInitialState(1);
    s.fog = s.fog.slice();
    s.cells = s.cells.slice();
    // (0,1) — пустая коробка над коробкой (0,2): освобождаем (0,2) как паутину
    s.fog[box] = 'web';
    const r = moveContent(withItem(s, open, 'P01'), open, box);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.fog[box]).toBeNull();
    expect(r.state.fog[1 * 7 + 0]).toBeNull(); // пустая коробка открылась сразу
    expect(r.state.fog[0 * 7 + 0]).toBe('web'); // за ней коробка с T03 стала паутиной
  });
});

describe('validateState', () => {
  it('rejects corrupted saves', () => {
    const s = openBoard();
    expect(validateState(null)).toBe(false);
    expect(validateState({ ...s, cells: s.cells.slice(1) })).toBe(false);
    expect(validateState({ ...s, money: -1 })).toBe(false);
    const bad = withItem(s, 0, 'T01');
    bad.cells[0] = { kind: 'item', uid: 1, itemId: 'X99' };
    expect(validateState(bad)).toBe(false);
    const dup = withItem(withItem(s, 0, 'T01'), 1, 'T01');
    (dup.cells[1] as any).uid = (dup.cells[0] as any).uid;
    expect(validateState(dup)).toBe(false);
  });
});
