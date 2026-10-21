import { BOARD_COLS, BOARD_SIZE } from '../content/board';
import { GENERATORS, ITEMS, getItem } from '../content/items';
import type { CellContent, GameState } from './state';

// Правила поля. Функции не меняют входное состояние и возвращают новое вместе с результатом,
// чтобы отображение и сохранение работали с уже принятым состоянием.

export type SpawnResult =
  | { ok: true; state: GameState; cell: number; itemId: string }
  | { ok: false; reason: 'not_generator' | 'board_full' };

export type MoveResult =
  | { ok: true; state: GameState; action: 'move' | 'swap' | 'merge'; to: number; itemId?: string }
  | { ok: false; reason: 'same_cell' | 'empty_source' | 'locked' | 'out_of_bounds' };

function clone(state: GameState): GameState {
  return { ...state, cells: state.cells.slice(), locked: state.locked.slice() };
}

function inBounds(cell: number): boolean {
  return Number.isInteger(cell) && cell >= 0 && cell < BOARD_SIZE;
}

export function isLocked(state: GameState, cell: number): boolean {
  return state.locked.includes(cell);
}

/** Ближайшая к источнику свободная открытая клетка; при равном расстоянии — меньший индекс. */
export function findFreeCellNear(state: GameState, origin: number): number | null {
  const ox = origin % BOARD_COLS;
  const oy = Math.floor(origin / BOARD_COLS);
  let best: number | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (state.cells[i] !== null || isLocked(state, i)) continue;
    const dx = Math.abs((i % BOARD_COLS) - ox);
    const dy = Math.abs(Math.floor(i / BOARD_COLS) - oy);
    const dist = Math.max(dx, dy) * 10 + dx + dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/** Нажатие на генератор: выдача первого уровня в свободную клетку. Без места ничего не расходуется. */
export function spawnFromGenerator(state: GameState, generatorCell: number): SpawnResult {
  const content = inBounds(generatorCell) ? state.cells[generatorCell] : null;
  if (!content || content.kind !== 'generator') return { ok: false, reason: 'not_generator' };
  const target = findFreeCellNear(state, generatorCell);
  if (target === null) return { ok: false, reason: 'board_full' };
  const itemId = GENERATORS[content.generatorId].output;
  const next = clone(state);
  next.cells[target] = { kind: 'item', uid: next.nextUid, itemId };
  next.nextUid += 1;
  return { ok: true, state: next, cell: target, itemId };
}

export function canMerge(a: CellContent | null, b: CellContent | null): boolean {
  if (!a || !b || a.kind !== 'item' || b.kind !== 'item') return false;
  return a.itemId === b.itemId && getItem(a.itemId).nextId !== null;
}

/**
 * Перенос содержимого клетки from в клетку to:
 * пустая — перемещение, такой же предмет не максимального уровня — объединение, иное — обмен.
 */
export function moveContent(state: GameState, from: number, to: number): MoveResult {
  if (!inBounds(from) || !inBounds(to)) return { ok: false, reason: 'out_of_bounds' };
  if (from === to) return { ok: false, reason: 'same_cell' };
  const source = state.cells[from];
  if (!source) return { ok: false, reason: 'empty_source' };
  if (isLocked(state, to) || isLocked(state, from)) return { ok: false, reason: 'locked' };

  const target = state.cells[to];
  const next = clone(state);

  if (canMerge(source, target)) {
    const nextId = getItem((source as { itemId: string }).itemId).nextId!;
    next.cells[from] = null;
    next.cells[to] = { kind: 'item', uid: next.nextUid, itemId: nextId };
    next.nextUid += 1;
    return { ok: true, state: next, action: 'merge', to, itemId: nextId };
  }

  next.cells[to] = source;
  next.cells[from] = target;
  return { ok: true, state: next, action: target ? 'swap' : 'move', to };
}

/** Проверка загруженного состояния: структура, известные ID, уникальные uid. */
export function validateState(raw: unknown): raw is GameState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Partial<GameState>;
  if (typeof s.schemaVersion !== 'number') return false;
  if (!Array.isArray(s.cells) || s.cells.length !== BOARD_SIZE) return false;
  if (!Array.isArray(s.locked) || !s.locked.every((c) => inBounds(c))) return false;
  if (typeof s.money !== 'number' || !Number.isFinite(s.money) || s.money < 0) return false;
  if (typeof s.nextUid !== 'number' || !Number.isInteger(s.nextUid) || s.nextUid < 1) return false;
  const uids = new Set<number>();
  for (const c of s.cells) {
    if (c === null) continue;
    if (c.kind === 'item') {
      if (!ITEMS[c.itemId] || !Number.isInteger(c.uid) || c.uid >= s.nextUid || uids.has(c.uid)) return false;
      uids.add(c.uid);
    } else if (c.kind === 'generator') {
      if (!GENERATORS[c.generatorId]) return false;
    } else {
      return false;
    }
  }
  return true;
}
