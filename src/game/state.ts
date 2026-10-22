import { BOARD_SIZE, LOCKED_GROUPS, START_GENERATORS } from '../content/board';
import { STORAGE_CAPACITY } from '../content/orders';

export const SCHEMA_VERSION = 4;

export interface ItemInstance {
  uid: number;
  itemId: string;
}

export type CellContent =
  | ({ kind: 'item' } & ItemInstance)
  | { kind: 'generator'; generatorId: string };

/** Положение на поле или на складе. */
export type Loc = { area: 'board'; index: number } | { area: 'storage'; index: number };

export interface LastSale {
  item: ItemInstance;
  from: Loc;
  price: number;
}

export interface GameState {
  schemaVersion: number;
  /** Содержимое клеток по индексу row * cols + col. */
  cells: (CellContent | null)[];
  /** Индексы закрытых клеток. */
  locked: number[];
  /** Ячейки склада; длина массива — текущая вместимость. */
  storage: (ItemInstance | null)[];
  money: number;
  nextUid: number;
  completedOrders: string[];
  completedProjects: string[];
  /** Последняя продажа; отменяется до следующего игрового действия. */
  lastSale: LastSale | null;
  /** Просмотренные или пропущенные сюжетные сцены. */
  seenDialogs: string[];
  /** Входящее хранилище: полученные генераторы, ожидающие места на поле. */
  incoming: string[];
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
    storage: new Array(STORAGE_CAPACITY).fill(null),
    money: 0,
    nextUid: 1,
    completedOrders: [],
    completedProjects: [],
    lastSale: null,
    seenDialogs: [],
    incoming: [],
  };
}
