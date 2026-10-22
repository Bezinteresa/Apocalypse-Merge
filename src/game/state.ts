import { BOARD_SIZE, LOCKED_GROUPS, START_GENERATORS } from '../content/board';
import { STORAGE_CAPACITY } from '../content/orders';
import { ENERGY_START } from './energy';
import { initialCollections, type ChestResult, type SetProgress } from './collections';
import { emptyAdRewards, type AdRewardState } from './ads';

export const SCHEMA_VERSION = 7;

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
  /** Текущий запас энергии; может быть выше лимита после наград. */
  energy: number;
  /** Момент, до которого восстановление уже учтено (мс, время устройства). */
  energyUpdatedAt: number;
  /** Режим проверки без лимита: выдача не тратит энергию. Доступен только в отладке. */
  energyUnlimited: boolean;
  /** Прогресс коллекционных наборов по ID набора. */
  collections: Record<string, SetProgress>;
  /** Жетоны архива за лишние осколки. */
  tokens: number;
  /** Неоткрытые сундуки (ID типа сундука). */
  chests: string[];
  /** Состояние генератора случайных чисел для сундуков. */
  rng: number;
  /** Последний результат открытия: показывается после перезапуска так же. */
  lastChest: ChestResult | null;
  /** Лимит наград за рекламу; сохраняется в облаке вместе с прогрессом. */
  adRewards: AdRewardState;
}

export function createInitialState(seed: number = (Math.random() * 2 ** 32) >>> 0): GameState {
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
    energy: ENERGY_START,
    energyUpdatedAt: 0,
    energyUnlimited: false,
    collections: initialCollections(),
    tokens: 0,
    chests: [],
    rng: seed >>> 0,
    lastChest: null,
    adRewards: emptyAdRewards(),
  };
}
