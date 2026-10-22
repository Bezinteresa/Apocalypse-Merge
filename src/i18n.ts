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
  missingItems: { ru: 'Не хватает:', en: 'Missing:' },
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
  noMoney: { ru: 'Не хватает монет:', en: 'Not enough coins:' },
  done: { ru: 'Готово', en: 'Done' },
  notYet: { ru: 'Позже', en: 'Later' },
  close: { ru: 'Закрыть', en: 'Close' },
  restored: { ru: 'Восстановлено', en: 'Restored' },
  chapterDone: { ru: 'Глава 1 завершена! Следующая глава пока недоступна; оставшиеся заказы можно выполнить.', en: 'Chapter 1 complete! The next chapter is not available yet; remaining orders can still be done.' },
  chapterAllDone: { ru: 'Глава 1 пройдена полностью. Продолжение — в следующей версии.', en: 'Chapter 1 fully complete. More in the next version.' },
  incoming: { ru: 'Разместить', en: 'Place' },
  generatorPlaced: { ru: 'На поле появился', en: 'Placed on the board' },
  generatorWaiting: { ru: 'Ждёт места на поле', en: 'Waiting for space' },
  placeFirst: { ru: 'Сначала разместите на поле:', en: 'Place on the board first:' },
  energy: { ru: 'Энергия: 1 за выдачу, +1 каждые 2 минуты до 100', en: 'Energy: 1 per item, +1 every 2 minutes up to 100' },
  noEnergy: { ru: 'Нет энергии.', en: 'Out of energy.' },
  energyUnlimited: { ru: 'Энергия без лимита (тест)', en: 'Unlimited energy (test)' },
  maxLevelNoMerge: { ru: 'Максимальный уровень — дальше не объединяется', en: 'Max level — cannot merge further' },
  whereToGet: { ru: 'Где получить?', en: 'Where to get?' },
  whereFrom: { ru: 'Где найти', en: 'Source' },
  opensAfter: { ru: 'откроется после', en: 'unlocks after' },
  mergeFrom: { ru: 'Собирается из', en: 'Merged from' },
  showOnBoard: { ru: 'Показать на поле', en: 'Show on board' },
  exportLog: { ru: 'Скачать журнал теста', en: 'Download test log' },
  album: { ru: 'Альбом', en: 'Album' },
  noChests: { ru: 'Сундуков пока нет: их дают ремонты и каждый третий заказ', en: 'No chests yet: repairs and every third order give them' },
  openChest: { ru: 'Открыть', en: 'Open' },
  drawsWord: { ru: 'выдачи', en: 'draws' },
  pityLeft: { ru: 'легенда гарантирована не позже чем через', en: 'legendary guaranteed within' },
  tokens: { ru: 'Жетоны', en: 'Tokens' },
  shard: { ru: 'осколок', en: 'shard' },
  excessShard: { ru: 'лишний осколок →', en: 'extra shard →' },
  assembled: { ru: 'Собрано', en: 'Assembled' },
  assemble: { ru: 'Собрать', en: 'Assemble' },
  cardAssembled: { ru: 'Карта собрана', en: 'Card assembled' },
  readLore: { ru: 'Прочитать', en: 'Read' },
  buyShard: { ru: 'Осколок за', en: 'Shard for' },
  noTokens: { ru: 'Не хватает жетонов:', en: 'Not enough tokens:' },
  claimSetReward: { ru: 'Награда за набор', en: 'Set reward' },
  setRewardHint: { ru: 'За полный набор', en: 'For the full set' },
  setRewardClaimed: { ru: 'Награда за набор получена', en: 'Set reward claimed' },
  setComplete: { ru: 'Набор собран!', en: 'Set complete!' },
  lastChest: { ru: 'Последнее открытие', en: 'Last opened' },
  chestReceived: { ru: 'получен сундук', en: 'chest received' },
  energyTitle: { ru: 'Энергия', en: 'Energy' },
  watchAd: { ru: 'Смотреть рекламу', en: 'Watch an ad' },
  adLeft: { ru: 'Осталось просмотров', en: 'Ads left' },
  adCooldown: { ru: 'Новые просмотры через', en: 'More ads in' },
  adRewarded: { ru: 'Награда получена:', en: 'Reward received:' },
  adNoReward: { ru: 'Реклама не досмотрена — награды нет', en: 'Ad not completed — no reward' },
  adUnavailable: { ru: 'Реклама сейчас недоступна', en: 'Ads are not available now' },
  visitorWaiting: { ru: 'Загляну позже — дел полно!', en: "I'll drop by later — lots to do!" },
  visitorThanks: { ru: 'Спасибо за помощь!', en: 'Thanks for the help!' },
  repairLater: { ru: 'Это место отремонтируем позже.', en: 'We will fix this place later.' },
  repairFirst: { ru: 'Сначала', en: 'First' },
  tutorial: { ru: 'Обучение', en: 'Tutorial' },
  skip: { ru: 'Пропустить', en: 'Skip' },
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
