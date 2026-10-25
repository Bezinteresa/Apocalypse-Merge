import { getProject } from '../content/orders';
import { describe, expect, it } from 'vitest';
import { START_GENERATORS } from '../content/board';
import { GENERATOR_ODDS, generatorDrops } from '../content/items';
import { completeProject, moveContent, spawnFromGenerator } from './rules';
import type { GameState } from './state';
import { openBoard } from './testUtils';

const TOOL = START_GENERATORS[0].cell;

function withGenerator(s: GameState, cell: number, generatorId: string, level: number): GameState {
  return { ...s, cells: s.cells.map((c, i) => (i === cell ? { kind: 'generator' as const, generatorId, level } : c)) };
}

/** Много выдач подряд: выданный предмет сразу убирается, чтобы поле не заполнилось. */
function sample(s: GameState, cell: number, n: number): Record<string, number> {
  const counts: Record<string, number> = {};
  let st: GameState = { ...s, energyUnlimited: true };
  for (let i = 0; i < n; i++) {
    const r = spawnFromGenerator(st, cell, 0);
    if (!r.ok) throw new Error(r.reason);
    counts[r.itemId] = (counts[r.itemId] ?? 0) + 1;
    st = { ...r.state, cells: r.state.cells.map((c, j) => (j === r.cell ? null : c)) };
  }
  return counts;
}

describe('generator levels', () => {
  it('odds tables add up to 100% and favour the first level', () => {
    for (const odds of Object.values(GENERATOR_ODDS)) {
      expect(odds.reduce((a, b) => a + b, 0)).toBe(100);
      expect(odds[0]).toBe(Math.max(...odds));
    }
    expect(generatorDrops('G_TOOL', 6).map((d) => d.itemId)).toEqual(['T01', 'T02', 'T03']);
  });

  it('parts (levels 1–3) give nothing; two equal parts merge into the next level', () => {
    let s = withGenerator(withGenerator(openBoard(), TOOL, 'G_TOOL', 3), 0, 'G_TOOL', 3);
    expect(spawnFromGenerator(s, TOOL)).toEqual({ ok: false, reason: 'inactive' });
    const r = moveContent(s, 0, TOOL);
    expect(r.ok && r.action).toBe('merge');
    if (!r.ok) return;
    s = r.state;
    expect(s.cells[TOOL]).toEqual({ kind: 'generator', generatorId: 'G_TOOL', level: 4 });
    expect(s.cells[0]).toBeNull();
    expect(spawnFromGenerator(s, TOOL).ok).toBe(true);
  });

  it('different generators, different levels and level 6 do not merge', () => {
    const base = openBoard();
    expect(moveContent(withGenerator(base, 0, 'G_MATERIAL', 4), 0, TOOL).ok && 'swap').toBe('swap');
    const l6 = withGenerator(withGenerator(base, TOOL, 'G_TOOL', 6), 0, 'G_TOOL', 6);
    const r = moveContent(l6, 0, TOOL);
    expect(r.ok && r.action).toBe('swap');
  });

  it('level 4 always gives the first level; level 5 and 6 follow the odds', () => {
    expect(sample(withGenerator(openBoard(), TOOL, 'G_TOOL', 4), TOOL, 200)).toEqual({ T01: 200 });
    const l5 = sample(withGenerator(openBoard(7), TOOL, 'G_TOOL', 5), TOOL, 4000);
    expect(l5.T01 / 4000).toBeCloseTo(0.8, 1);
    expect(l5.T02 / 4000).toBeCloseTo(0.2, 1);
    const l6 = sample(withGenerator(openBoard(9), TOOL, 'G_TOOL', 6), TOOL, 4000);
    expect(l6.T01 / 4000).toBeCloseTo(0.65, 1);
    expect(l6.T03 / 4000).toBeCloseTo(0.1, 1);
  });

  it('drops are reproducible from the saved random state', () => {
    const s = withGenerator(openBoard(3), TOOL, 'G_TOOL', 6);
    expect(spawnFromGenerator(s, TOOL, 0)).toEqual(spawnFromGenerator(s, TOOL, 0));
  });

  it('a repair can bring an extra crate that is placed on the board for merging', () => {
    const s: GameState = {
      ...openBoard(),
      cells: openBoard().cells.map((c, i) => (i === 0 ? { kind: 'item', uid: 1, itemId: 'T02' } : i === 1 ? { kind: 'item', uid: 2, itemId: 'M03' } : c)),
      nextUid: 3,
      // детали R02 сданы заказом Q02, монет ровно на ремонт
      money: getProject('R02').cost,
      completedOrders: ['O01', 'Q02'],
      completedProjects: ['R01', 'C01'],
    };
    const r = completeProject(s, 'R02');
    if (!r.ok) throw new Error(r.reason);
    const tools = r.state.cells.filter((c) => c?.kind === 'generator' && c.generatorId === 'G_TOOL');
    expect(tools).toEqual([
      { kind: 'generator', generatorId: 'G_TOOL', level: 4 },
      { kind: 'generator', generatorId: 'G_TOOL', level: 4 },
    ]);
    expect(r.state.incoming).toEqual([]);
  });
});
