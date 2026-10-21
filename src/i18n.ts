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
  ordersSoon: { ru: 'Заказы жителей появятся на следующем этапе прототипа', en: 'Resident orders arrive in the next prototype stage' },
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
