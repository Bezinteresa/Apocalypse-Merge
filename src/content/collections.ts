import type { LangText } from './items';

// Коллекционный альбом (GAME_DESIGN, раздел 21; PROTOTYPE_PLAN, этап 11).
// Все числа — стартовые предложения для функционального теста, не утверждённый баланс.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export interface RarityDef {
  name: LangText;
  color: string;
  /** Осколков для сборки карты. */
  threshold: number;
  /** Жетонов архива за лишний осколок. */
  excessTokens: number;
  /** Цена одного выбранного осколка в жетонах. */
  shardPrice: number;
}

export const RARITY: Record<Rarity, RarityDef> = {
  common: { name: { ru: 'Обычная', en: 'Common' }, color: '#9aa39a', threshold: 3, excessTokens: 1, shardPrice: 10 },
  rare: { name: { ru: 'Редкая', en: 'Rare' }, color: '#5aa0e0', threshold: 4, excessTokens: 2, shardPrice: 20 },
  epic: { name: { ru: 'Эпическая', en: 'Epic' }, color: '#b072e0', threshold: 5, excessTokens: 5, shardPrice: 50 },
  legendary: { name: { ru: 'Легендарная', en: 'Legendary' }, color: '#e0a040', threshold: 6, excessTokens: 10, shardPrice: 100 },
};

export interface CardDef {
  id: string;
  setId: string;
  rarity: Rarity;
  name: LangText;
  /** Запись о мире — награда за сборку карты. */
  lore: LangText;
}

export interface CollectionSetDef {
  id: string;
  name: LangText;
  /** Однократная награда за полный набор. */
  reward: { money: number; energy: number };
}

export interface ChestDef {
  id: string;
  name: LangText;
  draws: number;
  /** Вероятность редкости на одну выдачу, в процентах; сумма 100. */
  odds: Record<Rarity, number>;
}

/** Версия таблиц выпадения; фиксируется в результате открытия. */
export const DROP_TABLE_VERSION = 1;

/** Гарант: если столько выдач подряд в наборе не дали легендарный осколок, следующая даёт его. */
export const LEGENDARY_PITY = 49;

export const SETS: CollectionSetDef[] = [{ id: 'S_OLD_WORLD', name: { ru: 'Старый мир', en: 'The Old World' }, reward: { money: 50, energy: 50 } }];

export const CARDS: CardDef[] = [
  { id: 'C_POSTCARD', setId: 'S_OLD_WORLD', rarity: 'common', name: { ru: 'Довоенная открытка', en: 'Pre-war postcard' }, lore: { ru: '«С праздником!» — подпись выцвела, но город на картинке ещё целый.', en: '"Happy holidays!" — the ink faded, but the city in the picture is still whole.' } },
  { id: 'C_TRAM_TICKET', setId: 'S_OLD_WORLD', rarity: 'common', name: { ru: 'Трамвайный билет', en: 'Tram ticket' }, lore: { ru: 'Маршрут №7 шёл через перекрёсток. Рельсы до сих пор видно под пылью.', en: 'Route 7 ran through the crossroads. The rails still show under the dust.' } },
  { id: 'C_TIN_TOY', setId: 'S_OLD_WORLD', rarity: 'common', name: { ru: 'Жестяная игрушка', en: 'Tin toy' }, lore: { ru: 'Заводной ключик ещё крутится. Дети квартала спорят, чья она.', en: 'The wind-up key still turns. The local kids argue whose it is.' } },
  { id: 'C_SEEDS', setId: 'S_OLD_WORLD', rarity: 'common', name: { ru: 'Пачка семян', en: 'Seed packet' }, lore: { ru: '«Томаты ранние». Ника говорит, некоторые семена всхожи и сейчас.', en: '"Early tomatoes". Nika says some seeds still sprout.' } },
  { id: 'C_METRO_MAP', setId: 'S_OLD_WORLD', rarity: 'rare', name: { ru: 'Схема метро', en: 'Metro map' }, lore: { ru: 'Станция под перекрёстком отмечена, но без названия.', en: 'A station under the crossroads is marked, but has no name.' } },
  { id: 'C_RADIO', setId: 'S_OLD_WORLD', rarity: 'rare', name: { ru: 'Радиоприёмник «Волна»', en: '"Wave" radio receiver' }, lore: { ru: 'Шкала настроена на частоту, которой нет в справочниках.', en: 'The dial is set to a frequency missing from every directory.' } },
  { id: 'C_PHOTO_ALBUM', setId: 'S_OLD_WORLD', rarity: 'rare', name: { ru: 'Семейный фотоальбом', en: 'Family photo album' }, lore: { ru: 'На последнем снимке — этот самый магазин, с людьми у прилавка.', en: 'The last photo shows this very shop, with people at the counter.' } },
  { id: 'C_ARCHIVE_KEY', setId: 'S_OLD_WORLD', rarity: 'epic', name: { ru: 'Ключ от архива', en: 'Archive key' }, lore: { ru: 'Бирка: «Служебн. ур. −1». Ни одна дверь наверху к нему не подходит.', en: 'Tag: "Service lvl −1". No door upstairs fits it.' } },
  { id: 'C_POWER_SCHEME', setId: 'S_OLD_WORLD', rarity: 'legendary', name: { ru: 'Схема линии питания', en: 'Power line scheme' }, lore: { ru: 'Та самая линия, которую нашла Марта. Она уходит под землю.', en: 'The very line Marta found. It goes underground.' } },
];

export const CHESTS: Record<string, ChestDef> = {
  CH_WORN: { id: 'CH_WORN', name: { ru: 'Потёртый сундук', en: 'Worn chest' }, draws: 3, odds: { common: 60, rare: 28, epic: 10, legendary: 2 } },
  CH_TRADER: { id: 'CH_TRADER', name: { ru: 'Сундук торговца', en: "Trader's chest" }, draws: 5, odds: { common: 40, rare: 40, epic: 16, legendary: 4 } },
  CH_ARCHIVE: { id: 'CH_ARCHIVE', name: { ru: 'Архивный сундук', en: 'Archive chest' }, draws: 8, odds: { common: 15, rare: 45, epic: 30, legendary: 10 } },
};

/**
 * Источники сундуков: каждый проект и каждый третий заказ обеих глав дают потёртый сундук.
 * Сундуки торговца и архивный определены, но выдаются только из отладки до проверки открытия.
 */
export const CHEST_SOURCES: Record<string, string> = {
  R01: 'CH_WORN',
  R02: 'CH_WORN',
  R03: 'CH_WORN',
  R04: 'CH_WORN',
  R05: 'CH_WORN',
  R06: 'CH_WORN',
  R07: 'CH_WORN',
  R08: 'CH_WORN',
  O03: 'CH_WORN',
  O06: 'CH_WORN',
  O09: 'CH_WORN',
  O12: 'CH_WORN',
  O15: 'CH_WORN',
  O18: 'CH_WORN',
  // глава 2
  R09: 'CH_WORN',
  R10: 'CH_WORN',
  R11: 'CH_WORN',
  R12: 'CH_WORN',
  R13: 'CH_WORN',
  O21: 'CH_WORN',
  O24: 'CH_WORN',
  O27: 'CH_WORN',
  O30: 'CH_WORN',
  // глава 3
  R14: 'CH_WORN',
  R15: 'CH_WORN',
  R16: 'CH_WORN',
  R17: 'CH_WORN',
  R18: 'CH_WORN',
  O33: 'CH_WORN',
  O36: 'CH_WORN',
  O39: 'CH_WORN',
  O42: 'CH_WORN',
  O45: 'CH_WORN',
  // глава 4
  R19: 'CH_WORN',
  R20: 'CH_WORN',
  R21: 'CH_WORN',
  R22: 'CH_WORN',
  R23: 'CH_WORN',
  O48: 'CH_WORN',
  O51: 'CH_WORN',
  O54: 'CH_WORN',
  O57: 'CH_WORN',
  O60: 'CH_WORN',
};

export function getCard(id: string): CardDef {
  const card = CARDS.find((c) => c.id === id);
  if (!card) throw new Error(`Unknown card id: ${id}`);
  return card;
}

export function cardsOf(setId: string): CardDef[] {
  return CARDS.filter((c) => c.setId === setId);
}

/** Конфигурация отклоняется, если сумма вероятностей не 100 или у редкости с шансом нет карт. */
export function validateChest(chest: ChestDef, setId: string): string | null {
  const sum = RARITIES.reduce((s, r) => s + chest.odds[r], 0);
  if (Math.abs(sum - 100) > 1e-9) return `${chest.id}: odds sum ${sum}`;
  for (const r of RARITIES) {
    if (chest.odds[r] > 0 && !cardsOf(setId).some((c) => c.rarity === r)) return `${chest.id}: empty pool for ${r} in ${setId}`;
  }
  return null;
}
