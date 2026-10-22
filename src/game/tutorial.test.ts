import { openBoard } from './testUtils';
import { describe, expect, it } from 'vitest';
import { START_GENERATORS } from '../content/board';
import { completeProject, deliverOrder, moveContent, spawnFromGenerator } from './rules';
import type { GameState } from './state';
import { currentTutorialStep, markDialogSeen, pendingDialog } from './tutorial';

const TOOL = START_GENERATORS[0].cell;
const MAT = START_GENERATORS[1].cell;

function ok<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r as Extract<T, { ok: true }>;
}

function spawn(s: GameState, gen: number): GameState {
  return ok(spawnFromGenerator(s, gen)).state;
}

function mergeFirstPair(s: GameState, itemId: string): GameState {
  const a = s.cells.findIndex((c) => c?.kind === 'item' && c.itemId === itemId);
  const b = s.cells.findIndex((c, i) => i !== a && c?.kind === 'item' && c.itemId === itemId);
  return ok(moveContent(s, a, b)).state;
}

const step = (s: GameState) => currentTutorialStep(s)?.id ?? null;

describe('tutorial', () => {
  it('follows the player actions up to R01', () => {
    let s = openBoard();
    expect(step(s)).toBe('spawn_tools');
    s = spawn(s, TOOL);
    expect(step(s)).toBe('spawn_tools');
    s = spawn(s, TOOL);
    expect(step(s)).toBe('merge_t02');
    s = mergeFirstPair(s, 'T01');
    expect(step(s)).toBe('deliver_o01');
    s = ok(deliverOrder(s, 'O01')).state;
    expect(step(s)).toBe('make_m02');
    s = mergeFirstPair(spawn(spawn(s, MAT), MAT), 'M01');
    expect(step(s)).toBe('restore_r01');
    s = ok(completeProject(s, 'R01')).state;
    expect(step(s)).toBeNull();
  });

  it('does not block a step whose action was done in advance', () => {
    let s = openBoard();
    s = mergeFirstPair(spawn(spawn(s, TOOL), TOOL), 'T01');
    s = mergeFirstPair(spawn(spawn(s, MAT), MAT), 'M01');
    // T02 и M02 уже есть: обучение сразу просит сдать заказ
    expect(step(s)).toBe('deliver_o01');
    s = ok(deliverOrder(s, 'O01')).state;
    expect(step(s)).toBe('restore_r01');
  });

  it('resumes from the same step after a save round-trip', () => {
    const s = spawn(spawn(openBoard(), TOOL), TOOL);
    const reloaded = JSON.parse(JSON.stringify(s)) as GameState;
    expect(step(reloaded)).toBe('merge_t02');
  });
});

describe('dialogs', () => {
  it('shows the intro once and the next scene after O01', () => {
    let s = openBoard();
    expect(pendingDialog(s)?.id).toBe('D_INTRO');
    s = markDialogSeen(s, 'D_INTRO');
    expect(markDialogSeen(s, 'D_INTRO')).toBe(s);
    expect(pendingDialog(s)).toBeNull();
    s = { ...s, completedOrders: ['O01'] };
    expect(pendingDialog(s)?.id).toBe('D_AFTER_O01');
  });
});
