import type { LangText } from './content/items';

// Язык берётся из bridge.platform.language сразу после initialize(). Переведены ru и en;
// английский — резервный (требование Playgama), русскоязычные регионы получают ru.

export type Lang = 'ru' | 'en';

const RU_FAMILY = new Set(['ru', 'be', 'kk', 'uk', 'uz']);

let current: Lang = 'en';

export function normalizeLanguage(code: string | null | undefined): Lang {
  const base = (code ?? '').toLowerCase().split(/[-_]/)[0];
  return RU_FAMILY.has(base) ? 'ru' : 'en';
}

export function setLanguage(lang: Lang): void {
  current = lang;
  document.documentElement.lang = lang;
}

export function lang(): Lang {
  return current;
}

const STRINGS = {
  title: { ru: 'Apocalypse Merge', en: 'Apocalypse Merge' },
  loading: { ru: 'Загрузка…', en: 'Loading…' },
  money: { ru: 'Монеты', en: 'Coins' },
  level: { ru: 'Уровень', en: 'Level' },
  next: { ru: 'Далее', en: 'Next' },
  maxLevel: { ru: 'Максимальный уровень', en: 'Max level' },
  generatorHint: { ru: 'Нажмите, чтобы получить', en: 'Tap to get' },
  hintIdle: { ru: 'Нажмите на ящик, чтобы достать предмет. Перетащите одинаковые предметы друг на друга.', en: 'Tap a crate to get an item. Drag identical items onto each other.' },
  boardFull: { ru: 'Нет свободных клеток. Объедините предметы.', en: 'No free cells. Merge some items.' },
  locked: { ru: 'Клетка пока закрыта', en: 'This cell is locked for now' },
  noOrders: { ru: 'Новых заказов пока нет', en: 'No new orders yet' },
  deliver: { ru: 'Сдать', en: 'Deliver' },
  delivered: { ru: 'Заказ выполнен', en: 'Order delivered' },
  missingItems: { ru: 'Не хватает предметов', en: 'Missing items' },
  storageLabel: { ru: 'Склад', en: 'Storage' },
  generatorToStorage: { ru: 'Генератор нельзя убрать на склад', en: 'Generators cannot be stored' },
  sell: { ru: 'Продать', en: 'Sell' },
  sellConfirm: { ru: 'Точно продать?', en: 'Sell for sure?' },
  sold: { ru: 'Продано', en: 'Sold' },
  undoSale: { ru: 'Вернуть', en: 'Undo' },
  shop: { ru: 'Магазин', en: 'Shop' },
  field: { ru: 'Поле', en: 'Board' },
  project: { ru: 'Ремонт', en: 'Repair' },
  restore: { ru: 'Восстановить', en: 'Restore' },
  projectReady: { ru: 'Можно восстановить!', en: 'Ready to restore!' },
  noMoney: { ru: 'Не хватает монет', en: 'Not enough coins' },
  done: { ru: 'Готово', en: 'Done' },
  notYet: { ru: 'Позже', en: 'Later' },
  close: { ru: 'Закрыть', en: 'Close' },
  restored: { ru: 'Восстановлено', en: 'Restored' },
  sliceDone: { ru: 'Пробный срез пройден. Ящик припасов и Ника появятся в следующей версии прототипа.', en: 'Test slice complete. The provision crate and Nika arrive in the next prototype version.' },
  neededFor: { ru: 'Нужно', en: 'Needed for' },
  initError: { ru: 'Не удалось подключиться к игровой платформе.', en: 'Could not connect to the game platform.' },
  loadError: { ru: 'Не удалось загрузить сохранение. Прогресс не будет перезаписан.', en: 'Could not load your save. Your progress will not be overwritten.' },
  retry: { ru: 'Повторить', en: 'Retry' },
  recovered: { ru: 'Сохранение было повреждено, восстановлена предыдущая копия.', en: 'Save was damaged; the previous copy was restored.' },
  resetRecovered: { ru: 'Сохранение повреждено, начата новая игра.', en: 'Save was damaged; a new game was started.' },
  paused: { ru: 'Пауза', en: 'Paused' },
} satisfies Record<string, LangText>;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey): string {
  return STRINGS[key][current];
}

export function tx(text: LangText): string {
  return text[current];
}
