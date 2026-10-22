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
export const generatorSprite = (generatorId: string) => `generators/${generatorId}.png`;
export const portraitSprite = (visitorId: string) => `portraits/${visitorId}.png`;
export const chestSprite = (chestId: string) => `chests/${chestId}.png`;
export const cardSprite = (cardId: string) => `cards/${cardId}.webp`;
/** Сцена магазина после последнего завершённого проекта; shop_00 — до первого. */
export const shopSprite = (lastProjectId: string | null) => `shop/shop_${lastProjectId ?? '00'}.webp`;
export const uiSprite = (name: string) => `ui/${name}.png`;
