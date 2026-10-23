import spriteList from 'virtual:sprite-list';

// Картинки из public/sprites (art/generation-prompts.json). Если файла нет, показывается условная заглушка;
// положенный файл с нужным именем подхватывается сам, без правок кода.

const available = new Set<string>(spriteList);

export function hasSprite(file: string): boolean {
  return available.has(file);
}

export function spriteUrl(file: string): string {
  return `${import.meta.env.BASE_URL}sprites/${file}`;
}

/** <img> для слота или null, если картинки ещё нет. */
export function spriteImg(file: string, className = 'sprite'): HTMLImageElement | null {
  if (!available.has(file)) return null;
  const img = document.createElement('img');
  img.className = className;
  img.src = spriteUrl(file);
  img.alt = '';
  img.draggable = false;
  img.decoding = 'async';
  return img;
}

export const itemSprite = (itemId: string) => `items/${itemId}.png`;
/** Генератор по уровню: 4-й (рабочий) — прежний файл `<id>.png`, остальные — `<id>_<уровень>.png`. */
export const generatorSprite = (generatorId: string, level = 4) => (level === 4 ? `generators/${generatorId}.png` : `generators/${generatorId}_${level}.png`);
export const portraitSprite = (visitorId: string) => `portraits/${visitorId}.png`;
export const chestSprite = (chestId: string) => `chests/${chestId}.png`;
export const cardSprite = (cardId: string) => `cards/${cardId}.webp`;
/** Фон здания в разрезе (пустые комнаты без предметов ремонта). */
export const BUILDING_SPRITE = 'shop/building.webp';
/** Место ремонта в сцене магазина: сломанное или починенное состояние. */
export const zoneSprite = (projectId: string, fixed: boolean) => `zones/${projectId}_${fixed ? 'fixed' : 'broken'}.png`;
/** Посетитель в полный рост для сцены магазина; портрет по пояс — для окна диалога. */
export const characterSprite = (visitorId: string) => `characters/${visitorId}.png`;
export const uiSprite = (name: string) => `ui/${name}.png`;
