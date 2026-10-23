import { describe, expect, it } from 'vitest';
import { START_GENERATORS } from '../content/board';
import { currentHint, markFlag } from './hints';
import { moveContent, moveItem, spawnFromGenerator } from './rules';
import { createInitialState, type GameState } from './state';
import { openBoard } from './testUtils';

const TOOL = START_GENERATORS[0].cell;
const MAT = START_GENERATORS[1].cell;

function spawn(s: GameState, cell: number): GameState {
  const r = spawnFromGenerator(s, cell);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

/** Состояние после обучения: R01 сделан, оба стартовых генератора уже использованы. */
function afterTutorial(base: GameState = openBoard()): GameState {
  return { ...base, completedOrders: ['O01'], completedProjects: ['R01'], flags: ['spawn:G_TOOL', 'spawn:G_MATERIAL', 'gen_merged'] };
}

describe('hints', () => {
  it('guides the tutorial: merge the toolbox parts, tap the toolbox, drag one screwdriver onto the other', () => {
    let s = createInitialState(1);
    const first = currentHint(s);
    expect(first).toMatchObject({ id: 'build_toolbox', target: { kind: 'drag', to: TOOL } });
    if (first?.target.kind !== 'drag') return;
    const merged = moveContent(s, first.target.from, TOOL);
    expect(merged.ok && merged.state.cells[TOOL]).toMatchObject({ kind: 'generator', generatorId: 'G_TOOL', level: 4 });
    if (!merged.ok) return;
    s = merged.state;
    expect(currentHint(s)).toMatchObject({ id: 'spawn_tools', target: { kind: 'tap', cell: TOOL } });
    s = spawn(spawn(s, TOOL), TOOL);
    const h = currentHint(s);
    expect(h?.id).toBe('merge_t02');
    expect(h?.target.kind).toBe('drag');
  });

  it('shows the cobweb merge once, until a cell is freed', () => {
    const s = afterTutorial(createInitialState(1));
    const open = 3 * 7 + 1;
    const withM01 = { ...s, cells: s.cells.map((c, i) => (i === open ? { kind: 'item' as const, uid: s.nextUid, itemId: 'M01' } : c)), nextUid: s.nextUid + 1 };
    const h = currentHint(withM01);
    expect(h).toMatchObject({ id: 'web', target: { kind: 'drag', from: open } });
    if (h?.target.kind !== 'drag') return;
    const r = moveContent(withM01, open, h.target.to as number);
    expect(r.ok && r.state.flags).toContain('web_freed');
    if (r.ok) expect(currentHint(r.state)?.id).not.toBe('web');
  });

  it('points at a new generator until something is taken from it', () => {
    let s = afterTutorial();
    s = { ...s, cells: s.cells.map((c, i) => (i === 0 ? { kind: 'generator' as const, generatorId: 'G_PROVISION', level: 4 } : c)) };
    expect(currentHint(s)).toMatchObject({ id: 'new_generator', target: { kind: 'tap', cell: 0 } });
    s = spawn(s, 0);
    expect(currentHint(s)?.id).not.toBe('new_generator');
    expect(currentHint({ ...afterTutorial(), incoming: ['G_ELECTRIC'] })?.id).toBe('incoming');
  });

  it('suggests storage on a crowded board until storage is used', () => {
    let s = afterTutorial();
    for (let i = 0; i < 60; i++) {
      const r = spawnFromGenerator(s, i % 2 ? TOOL : MAT);
      if (!r.ok) break;
      s = r.state;
    }
    // разные предметы, чтобы на поле не было пар для объединения не важно: подсказка смотрит на тесноту
    const h = currentHint(s);
    expect(h).toMatchObject({ id: 'storage', target: { kind: 'drag', to: 'storage' } });
    if (h?.target.kind !== 'drag') return;
    const r = moveItem(s, { area: 'board', index: h.target.from }, { area: 'storage', index: 0 });
    expect(r.ok && r.state.flags).toContain('storage_used');
    if (r.ok) expect(currentHint(r.state)?.id).not.toBe('storage');
  });

  it('opens the album for the first chest and stops after it is opened', () => {
    const s = { ...afterTutorial(), chests: ['CH_WORN'] };
    expect(currentHint(s)?.id).toBe('chest');
    expect(currentHint({ ...s, lastChest: { chestId: 'CH_WORN', setId: 'S_OLD_WORLD', tableVersion: 1, draws: [] } })?.id).not.toBe('chest');
  });

  it('suggests "where to get" for an unknown required item until the chain window is opened', () => {
    const s = { ...afterTutorial(), discovered: ['T01', 'T02', 'M01', 'M02'] };
    // O02 просит M03, которого игрок ещё не видел
    expect(currentHint(s)).toMatchObject({ id: 'where', target: { kind: 'ui', anchor: 'chip', id: 'M03' } });
    expect(currentHint(markFlag(s, 'chain_opened'))).toBeNull();
  });
});
