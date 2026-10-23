import { parseLayout, type Fog } from '../content/board';
import { STORAGE_CAPACITY } from '../content/orders';
import { ENERGY_START } from './energy';
import { initialCollections, type ChestResult, type SetProgress } from './collections';
import { emptyAdRewards, type AdRewardState } from './ads';

export const SCHEMA_VERSION = 10;

export interface ItemInstance {
  uid: number;
  itemId: string;
}

export type CellContent =
  | ({ kind: 'item' } & ItemInstance)
  | { kind: 'generator'; generatorId: string; level: number };

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
  /** Туман по клеткам: паутина (предмет виден, освобождается мерджем), коробка (скрыто) или null — открыто. */
  fog: (Fog | null)[];
  /** Предметы, которые игрок уже видел: в окне цепочки остальные показаны как «?». */
  discovered: string[];
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
  /** Входящее хранилище: полученные генераторы («G_TOOL» — 4-й уровень, «G_TOOL:5»), ожидающие места на поле. */
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
  /** Однократные действия для подсказок пальцем (game/hints.ts). */
  flags: string[];
}

export function createInitialState(seed: number = (Math.random() * 2 ** 32) >>> 0): GameState {
  const layout = parseLayout();
  let nextUid = 1;
  const cells: (CellContent | null)[] = layout.map((c) => {
    if (c.generatorId) return { kind: 'generator', generatorId: c.generatorId, level: c.level };
    if (c.itemId) return { kind: 'item', uid: nextUid++, itemId: c.itemId };
    return null;
  });
  const discovered = [...new Set(layout.filter((c) => c.fog === 'web' && c.itemId).map((c) => c.itemId!))];
  return {
    schemaVersion: SCHEMA_VERSION,
    cells,
    fog: layout.map((c) => c.fog),
    discovered,
    storage: new Array(STORAGE_CAPACITY).fill(null),
    money: 0,
    nextUid,
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
    flags: [],
  };
}
