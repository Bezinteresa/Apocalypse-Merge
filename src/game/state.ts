import { BOARD_SIZE, LOCKED_GROUPS, START_GENERATORS } from '../content/board';

export const SCHEMA_VERSION = 1;

export type CellContent =
  | { kind: 'item'; uid: number; itemId: string }
  | { kind: 'generator'; generatorId: string };

export interface GameState {
  schemaVersion: number;
  /** Содержимое клеток по индексу row * cols + col. */
  cells: (CellContent | null)[];
  /** Индексы закрытых клеток. */
  locked: number[];
  money: number;
  nextUid: number;
}

export function createInitialState(): GameState {
  const cells: (CellContent | null)[] = new Array(BOARD_SIZE).fill(null);
  for (const g of START_GENERATORS) {
    cells[g.cell] = { kind: 'generator', generatorId: g.generatorId };
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    cells,
    locked: LOCKED_GROUPS.flatMap((g) => g.cells),
    money: 0,
    nextUid: 1,
  };
}
