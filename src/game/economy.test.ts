import { openBoard } from './testUtils';
import { describe, expect, it } from 'vitest';
import { START_GENERATORS } from '../content/board';
import { GENERATORS, GENERATOR_ACTIVE_LEVEL, GENERATOR_MAX_LEVEL, GENERATOR_ODDS, getItem, parseGeneratorToken } from '../content/items';
import { ORDERS, PROJECTS } from '../content/orders';
import { ENERGY_START } from './energy';
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
  moveContent,
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

/** Шаги прохождения: заказы, открытые прошлым ремонтом, затем сам ремонт — CONTENT_CATALOG, разделы 6.3 и 10. */
const STEPS: [string[], string][] = [
  [['O01', 'O02'], 'R01'],
  [['O03'], 'R02'],
  [['O04', 'O05'], 'R03'],
  [['O06', 'O07', 'O08'], 'R04'],
  [['O09', 'O10', 'O11'], 'R05'],
  [['O12', 'O13', 'O14'], 'R06'],
  [['O15', 'O16'], 'R07'],
  [['O17', 'O18'], 'R08'],
  // глава 2 (гараж): сначала ворота, потом заказы каждой ступени
  [[], 'R09'],
  [['O19', 'O20', 'O21'], 'R10'],
  [['O22', 'O23', 'O24'], 'R11'],
  [['O25', 'O26', 'O27'], 'R12'],
  [['O28', 'O29', 'O30'], 'R13'],
];
const CHAPTER_2 = ['R09', 'R10', 'R11', 'R12', 'R13'];

const project = (id: string) => PROJECTS.find((p) => p.id === id)!;
const stepItems = ([orders, proj]: [string[], string]) => [...orders.flatMap((id) => ORDERS.find((o) => o.id === id)!.requires), ...project(proj).requires];
const chainCrate = (chain: string) => Object.keys(GENERATORS).find((g) => GENERATORS[g].output.startsWith(chain))!;

/** Средняя «базовая ценность» одной выдачи ящика: предмет уровня k стоит 2^(k−1) предметов первого уровня. */
const spawnValue = (level: number) => GENERATOR_ODDS[level].reduce((sum, chance, i) => sum + (chance / 100) * 2 ** i, 0);

/** Лучший уровень ящика каждой цепочки после ремонтов: игрок объединяет одинаковые ящики, как подсказывает игра. */
function crateLevels(done: string[]): Record<string, number> {
  const crates: Record<string, number[]> = {};
  const add = (token: string) => {
    const { generatorId, level } = parseGeneratorToken(token);
    (crates[generatorId] ??= []).push(level);
  };
  // после обучения стартовые ящики рабочие; ящик в коробке не считаем — его находят не сразу
  START_GENERATORS.forEach((g) => add(`${g.generatorId}:${GENERATOR_ACTIVE_LEVEL}`));
  for (const id of done) {
    const p = project(id);
    if (p.generatorReward) add(p.generatorReward);
    if (p.generatorUpgrade) add(p.generatorUpgrade);
  }
  const best: Record<string, number> = {};
  for (const [id, levels] of Object.entries(crates)) {
    for (let l = 1; l < GENERATOR_MAX_LEVEL; l++) {
      while (levels.filter((x) => x === l).length >= 2) {
        levels.splice(levels.indexOf(l), 1);
        levels.splice(levels.indexOf(l), 1, l + 1);
      }
    }
    best[id] = Math.max(...levels);
  }
  return best;
}

/** Ожидаемое число выдач на каждую ступень с учётом уровней ящиков к её началу. */
function expectedCurve(): { project: string; spawns: number }[] {
  const done: string[] = [];
  return STEPS.map((step) => {
    const levels = crateLevels(done);
    const spawns = stepItems(step).reduce((sum, req) => {
      const def = getItem(req.itemId);
      return sum + (req.count * 2 ** (def.level - 1)) / spawnValue(levels[chainCrate(def.chain)]);
    }, 0);
    done.push(step[1]);
    return { project: step[1], spawns };
  });
}

const chapterSum = (curve: { project: string; spawns: number }[], second: boolean) =>
  curve.filter((c) => CHAPTER_2.includes(c.project) === second).reduce((a, c) => a + c.spawns, 0);

/** Изготовить предмет: выдачи из лучшего ящика цепочки и объединение пар этой цепочки ниже нужного уровня. */
function craft(state: GameState, itemId: string, stats: { spawns: number }): GameState {
  const def = getItem(itemId);
  let s = state;
  for (;;) {
    if (s.cells.some((c) => c?.kind === 'item' && c.itemId === itemId)) return s;
    const lower = s.cells.flatMap((c, i) => (c?.kind === 'item' && c.itemId.startsWith(def.chain) && getItem(c.itemId).level < def.level ? [{ i, id: c.itemId }] : []));
    const a = lower.find((x) => lower.some((y) => y.i !== x.i && y.id === x.id));
    if (a) {
      const b = lower.find((y) => y.i !== a.i && y.id === a.id)!;
      const m = moveItem(s, board(b.i), board(a.i));
      if (!m.ok) throw new Error(m.reason);
      s = m.state;
      continue;
    }
    let gen = -1;
    let best = 0;
    s.cells.forEach((c, i) => {
      if (c?.kind === 'generator' && GENERATORS[c.generatorId].output.startsWith(def.chain) && c.level > best) [gen, best] = [i, c.level];
    });
    const r = spawnFromGenerator(s, gen);
    if (!r.ok) throw new Error(r.reason);
    s = r.state;
    stats.spawns++;
  }
}

/** Объединить одинаковые ящики на поле — так поступает игрок по подсказке «Объедините одинаковые ящики». */
function mergeCrates(state: GameState): GameState {
  let s = state;
  for (;;) {
    const gens = s.cells.flatMap((c, i) => (c?.kind === 'generator' && c.level < GENERATOR_MAX_LEVEL ? [{ i, c }] : []));
    const same = (x: (typeof gens)[number], y: (typeof gens)[number]) => y.i !== x.i && y.c.generatorId === x.c.generatorId && y.c.level === x.c.level;
    const a = gens.find((x) => gens.some((y) => same(x, y)));
    if (!a) return s;
    const m = moveContent(s, gens.find((y) => same(a, y))!.i, a.i);
    if (!m.ok) throw new Error(m.reason);
    s = m.state;
  }
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
    const stats = { spawns: 0 };
    const spawns = [0, 0];
    const run = (r: { ok: true; state: GameState } | { ok: false; reason: string }) => {
      if (!r.ok) throw new Error(r.reason);
      s = r.state;
    };
    const deliver = (id: string) => {
      for (const req of ORDERS.find((o) => o.id === id)!.requires) s = craft(s, req.itemId, stats);
      run(deliverOrder(s, id));
    };
    const repair = (id: string) => {
      for (const req of project(id).requires) s = craft(s, req.itemId, stats);
      run(completeProject(s, id));
      s = mergeCrates(s);
    };
    // деньги после каждого ремонта — CONTENT_CATALOG, разделы 6.3 и 10
    const money: Record<string, number> = { R01: 24, R02: 24, R03: 64, R04: 100, R05: 186, R06: 231, R07: 276, R08: 326, R09: 226, R10: 241, R11: 241, R12: 261, R13: 311 };
    for (const step of STEPS) {
      const before = stats.spawns;
      step[0].forEach(deliver);
      repair(step[1]);
      spawns[CHAPTER_2.includes(step[1]) ? 1 : 0] += stats.spawns - before;
      expect(s.money, step[1]).toBe(money[step[1]]);
      if (step[1] === 'R08') {
        expect(s.energy).toBe(ENERGY_START + 3 * 50 - spawns[0]);
        expect(isChapterComplete(s)).toBe(false);
        expect(currentProject(s)?.id).toBe('R09');
      }
    }
    // выдачи этого прохождения (сид 1) близки к модели ожидаемых значений
    const curve = expectedCurve();
    for (const ch of [0, 1]) {
      const model = chapterSum(curve, ch === 1);
      expect(Math.abs(spawns[ch] - model) / model, `chapter ${ch + 1}: ${spawns[ch]} vs ${model.toFixed(0)}`).toBeLessThan(0.2);
    }
    // энергии хватает без восстановления и рекламы: 100 + 3 × 50 на первую главу, 4 × 70 на вторую
    expect(s.energy).toBe(ENERGY_START + 3 * 50 + 4 * 70 - stats.spawns);
    expect(s.energy).toBeGreaterThan(0);
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

describe('difficulty curve', () => {
  // ожидаемые выдачи на ступень (заказы + ремонт) с учётом уровней ящиков — CONTENT_CATALOG, раздел 10
  const curve = expectedCurve();
  const at = (id: string) => curve.find((c) => c.project === id)!.spawns;

  it('chapter 2 asks for level 5 in every repair and grows step by step to the finale', () => {
    for (const id of CHAPTER_2) expect(Math.max(...project(id).requires.map((r) => getItem(r.itemId).level)), id).toBe(5);
    // ворота гаража — передышка после «Перекрёстка», дальше каждая ступень заметно тяжелее прошлой
    expect(at('R09')).toBeLessThan(at('R08'));
    for (let i = 1; i < CHAPTER_2.length; i++) expect(at(CHAPTER_2[i]), CHAPTER_2[i]).toBeGreaterThan(at(CHAPTER_2[i - 1]) * 1.2);
    expect(at('R11')).toBeGreaterThan(at('R08'));
    expect(Math.max(...curve.map((c) => c.spawns))).toBe(at('R13'));
  });

  it('matches the catalog totals and leaves an energy reserve in both chapters', () => {
    const [ch1, ch2] = [chapterSum(curve, false), chapterSum(curve, true)];
    expect(Math.round(ch1)).toBe(197);
    expect(Math.round(ch2)).toBe(293);
    const energy = (second: boolean) => PROJECTS.filter((p) => CHAPTER_2.includes(p.id) === second).reduce((a, p) => a + p.energyReward, 0);
    expect(ENERGY_START + energy(false) - ch1).toBeGreaterThan(0.1 * ch1);
    expect(ENERGY_START + energy(false) + energy(true) - ch1 - ch2).toBeGreaterThan(0.1 * ch2);
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
