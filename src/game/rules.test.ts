import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, LOCKED_GROUPS, START_GENERATORS } from '../content/board';
import { GENERATORS, ITEMS, getItem } from '../content/items';
import { ORDERS, PROJECTS } from '../content/orders';
import { findFreeCellNear, moveContent, spawnFromGenerator, validateState } from './rules';
import { createInitialState, type GameState } from './state';

const TOOL_CELL = START_GENERATORS.find((g) => g.generatorId === 'G_TOOL')!.cell;
const MATERIAL_CELL = START_GENERATORS.find((g) => g.generatorId === 'G_MATERIAL')!.cell;

function withItem(state: GameState, cell: number, itemId: string): GameState {
  const cells = state.cells.slice();
  cells[cell] = { kind: 'item', uid: state.nextUid, itemId };
  return { ...state, cells, nextUid: state.nextUid + 1 };
}

describe('content', () => {
  it('has 22 items with valid, acyclic chains', () => {
    expect(Object.keys(ITEMS)).toHaveLength(22);
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
  it('matches catalog: 12 locked, 2 generators, 49 free cells', () => {
    const s = createInitialState();
    expect(s.locked).toHaveLength(12);
    expect(new Set(s.locked).size).toBe(12);
    expect(s.cells.filter((c) => c?.kind === 'generator')).toHaveLength(2);
    const free = s.cells.filter((c, i) => c === null && !s.locked.includes(i)).length;
    expect(free).toBe(49);
    expect(s.money).toBe(0);
    expect(validateState(s)).toBe(true);
  });
});

describe('spawnFromGenerator', () => {
  it('places first level next to the generator', () => {
    const r = spawnFromGenerator(createInitialState(), TOOL_CELL);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itemId).toBe('T01');
    expect(r.state.cells[r.cell]).toMatchObject({ kind: 'item', itemId: 'T01' });
    expect(Math.abs(r.cell - TOOL_CELL)).toBeLessThanOrEqual(8);
  });

  it('rejects a non-generator cell', () => {
    expect(spawnFromGenerator(createInitialState(), 0)).toEqual({ ok: false, reason: 'not_generator' });
  });

  it('refuses on full board without changing state and never fills locked cells', () => {
    let s = createInitialState();
    for (let i = 0; i < 49; i++) {
      const r = spawnFromGenerator(s, i % 2 ? TOOL_CELL : MATERIAL_CELL);
      expect(r.ok).toBe(true);
      if (r.ok) s = r.state;
    }
    for (const c of s.locked) expect(s.cells[c]).toBeNull();
    const before = JSON.stringify(s);
    expect(spawnFromGenerator(s, TOOL_CELL)).toEqual({ ok: false, reason: 'board_full' });
    expect(JSON.stringify(s)).toBe(before);
    expect(findFreeCellNear(s, TOOL_CELL)).toBeNull();
  });
});

describe('moveContent', () => {
  it('moves to an empty cell', () => {
    const s = withItem(createInitialState(), 0, 'T01');
    const r = moveContent(s, 0, 1);
    expect(r.ok && r.action).toBe('move');
    if (!r.ok) return;
    expect(r.state.cells[0]).toBeNull();
    expect(r.state.cells[1]).toMatchObject({ itemId: 'T01' });
    expect(s.cells[0]).not.toBeNull(); // input untouched
  });

  it('merges two equal items into the next level at the target', () => {
    const s = withItem(withItem(createInitialState(), 0, 'M01'), 1, 'M01');
    const r = moveContent(s, 0, 1);
    expect(r.ok && r.action).toBe('merge');
    if (!r.ok) return;
    expect(r.state.cells[0]).toBeNull();
    expect(r.state.cells[1]).toMatchObject({ kind: 'item', itemId: 'M02' });
    expect(r.state.cells.filter((c) => c?.kind === 'item')).toHaveLength(1);
  });

  it('swaps different items, different levels and max levels', () => {
    for (const [a, b] of [['T01', 'M01'], ['T01', 'T02'], ['M05', 'M05'], ['T06', 'T06']]) {
      const s = withItem(withItem(createInitialState(), 0, a), 1, b);
      const r = moveContent(s, 0, 1);
      expect(r.ok && r.action).toBe('swap');
      if (!r.ok) return;
      expect(r.state.cells[0]).toMatchObject({ itemId: b });
      expect(r.state.cells[1]).toMatchObject({ itemId: a });
    }
  });

  it('swaps an item with a generator without destroying either', () => {
    const s = withItem(createInitialState(), 0, 'T01');
    const r = moveContent(s, 0, TOOL_CELL);
    expect(r.ok && r.action).toBe('swap');
    if (!r.ok) return;
    expect(r.state.cells[0]).toMatchObject({ kind: 'generator', generatorId: 'G_TOOL' });
    expect(r.state.cells[TOOL_CELL]).toMatchObject({ itemId: 'T01' });
  });

  it('rejects locked targets, empty sources and same cell', () => {
    const lockedCell = LOCKED_GROUPS[0].cells[0];
    const s = withItem(createInitialState(), 0, 'T01');
    expect(moveContent(s, 0, lockedCell)).toEqual({ ok: false, reason: 'locked' });
    expect(moveContent(s, 2, 3)).toEqual({ ok: false, reason: 'empty_source' });
    expect(moveContent(s, 0, 0)).toEqual({ ok: false, reason: 'same_cell' });
    expect(moveContent(s, 0, BOARD_SIZE)).toEqual({ ok: false, reason: 'out_of_bounds' });
  });

  it('reaches max level T06 from 32 spawns', () => {
    let s = createInitialState();
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

describe('validateState', () => {
  it('rejects corrupted saves', () => {
    const s = createInitialState();
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
