// Определения контента по docs/CONTENT_CATALOG.md. ID постоянные: на них ссылаются сохранения, заказы и проекты.

export type ChainId = 'T' | 'M' | 'P' | 'E' | 'A' | 'F';
export type LangText = { ru: string; en: string };

export interface ItemDef {
  id: string;
  chain: ChainId;
  level: number;
  name: LangText;
  nextId: string | null;
  sellPrice: number;
}

export interface GeneratorDef {
  id: string;
  name: LangText;
  output: string;
}

export interface ChainDef {
  id: ChainId;
  name: LangText;
  color: string;
}

export const CHAINS: Record<ChainId, ChainDef> = {
  T: { id: 'T', name: { ru: 'Инструменты', en: 'Tools' }, color: '#c98a3a' },
  M: { id: 'M', name: { ru: 'Материалы', en: 'Materials' }, color: '#7f8c96' },
  P: { id: 'P', name: { ru: 'Припасы', en: 'Provisions' }, color: '#6f9a4a' },
  E: { id: 'E', name: { ru: 'Электрика', en: 'Electrics' }, color: '#d1b832' },
  A: { id: 'A', name: { ru: 'Автодетали', en: 'Car parts' }, color: '#b5533c' },
  F: { id: 'F', name: { ru: 'Трубы и фильтры', en: 'Pipes and filters' }, color: '#3f9fc4' },
};

const CHAIN_NAMES: Record<ChainId, LangText[]> = {
  T: [
    { ru: 'Отвёртка', en: 'Screwdriver' },
    { ru: 'Пассатижи', en: 'Pliers' },
    { ru: 'Гаечный ключ', en: 'Wrench' },
    { ru: 'Молоток', en: 'Hammer' },
    { ru: 'Набор инструментов', en: 'Tool set' },
    { ru: 'Ремонтный комплект мастера', en: "Master's repair kit" },
  ],
  M: [
    { ru: 'Металлолом', en: 'Scrap metal' },
    { ru: 'Подготовленные детали', en: 'Prepared parts' },
    { ru: 'Листовой металл', en: 'Sheet metal' },
    { ru: 'Усиленный каркас', en: 'Reinforced frame' },
    { ru: 'Строительный комплект', en: 'Construction kit' },
  ],
  P: [
    { ru: 'Банка консервов', en: 'Canned food' },
    { ru: 'Пара консервов', en: 'Two cans' },
    { ru: 'Упакованный обед', en: 'Packed lunch' },
    { ru: 'Сухой паёк', en: 'Field ration' },
    { ru: 'Экспедиционный запас', en: 'Expedition supply' },
  ],
  E: [
    { ru: 'Отрезок провода', en: 'Piece of wire' },
    { ru: 'Моток проводов', en: 'Wire coil' },
    { ru: 'Комплект разъёмов', en: 'Connector set' },
    { ru: 'Ремонтная плата', en: 'Repair board' },
    { ru: 'Блок питания', en: 'Power unit' },
    { ru: 'Панель управления', en: 'Control panel' },
  ],
  // глава 2 (гараж): CONTENT_CATALOG, раздел 8 — «крепёж → ремонтный узел → узел трансмиссии → агрегат → комплект ремонта машины»
  A: [
    { ru: 'Автокрепёж', en: 'Car fasteners' },
    { ru: 'Ремонтный узел', en: 'Repair assembly' },
    { ru: 'Узел трансмиссии', en: 'Transmission unit' },
    { ru: 'Двигатель в сборе', en: 'Engine block' },
    { ru: 'Комплект ремонта машины', en: 'Vehicle repair kit' },
  ],
  // глава 3 (технический этаж убежища): CONTENT_CATALOG, раздел 10а — «обрезок трубы → муфта → вентиль → фильтр → блок очистки»
  F: [
    { ru: 'Обрезок трубы', en: 'Pipe offcut' },
    { ru: 'Муфта', en: 'Pipe coupling' },
    { ru: 'Вентиль', en: 'Valve' },
    { ru: 'Фильтр', en: 'Filter' },
    { ru: 'Блок очистки', en: 'Purifier unit' },
  ],
};

/** Цена продажи по уровню, раздел 7 каталога. */
const SELL_PRICE = [1, 2, 4, 8, 16, 32];

function itemId(chain: ChainId, level: number): string {
  return `${chain}${String(level).padStart(2, '0')}`;
}

function buildItems(): Record<string, ItemDef> {
  const items: Record<string, ItemDef> = {};
  for (const chain of Object.keys(CHAIN_NAMES) as ChainId[]) {
    const names = CHAIN_NAMES[chain];
    names.forEach((name, i) => {
      const level = i + 1;
      items[itemId(chain, level)] = {
        id: itemId(chain, level),
        chain,
        level,
        name,
        nextId: level < names.length ? itemId(chain, level + 1) : null,
        sellPrice: SELL_PRICE[i],
      };
    });
  }
  return items;
}

export const ITEMS: Record<string, ItemDef> = buildItems();

export const GENERATORS: Record<string, GeneratorDef> = {
  G_TOOL: { id: 'G_TOOL', name: { ru: 'Ящик инструментов', en: 'Toolbox' }, output: 'T01' },
  G_MATERIAL: { id: 'G_MATERIAL', name: { ru: 'Контейнер со стройматериалами', en: 'Materials container' }, output: 'M01' },
  G_PROVISION: { id: 'G_PROVISION', name: { ru: 'Ящик припасов', en: 'Provision crate' }, output: 'P01' },
  G_ELECTRIC: { id: 'G_ELECTRIC', name: { ru: 'Стол радиодеталей', en: 'Radio parts bench' }, output: 'E01' },
  G_AUTO: { id: 'G_AUTO', name: { ru: 'Гаражный стеллаж', en: 'Garage parts rack' }, output: 'A01' },
  G_PIPE: { id: 'G_PIPE', name: { ru: 'Трубный стеллаж', en: 'Pipe rack' }, output: 'F01' },
};

/**
 * Уровни генераторов (решение пользователя от 23.10.2026, по образцу «Отеля Мечты» и Merge Mansion):
 * генератор — сам цепочка мерджа. Уровни 1–3 — детали, они ничего не выдают; с 4-го ящик работает.
 * Чем выше уровень, тем шире выдача по уровням своей цепочки, но первый уровень всегда самый частый.
 * Проценты — предложение для теста.
 */
export const GENERATOR_MAX_LEVEL = 6;
export const GENERATOR_ACTIVE_LEVEL = 4;
/** Шанс уровня предмета (1, 2, 3 …) на одну выдачу, в процентах, по уровню генератора. */
export const GENERATOR_ODDS: Record<number, number[]> = {
  4: [100],
  5: [80, 20],
  6: [65, 25, 10],
};

export function generatorDrops(generatorId: string, level: number): { itemId: string; chance: number }[] {
  const odds = GENERATOR_ODDS[level] ?? [];
  const chain = getItem(GENERATORS[generatorId].output).chain;
  return odds.map((chance, i) => ({ itemId: `${chain}${String(i + 1).padStart(2, '0')}`, chance }));
}

/** Запись генератора в наградах и входящем хранилище: «G_TOOL» (4-й уровень) или «G_TOOL:5». */
export function parseGeneratorToken(token: string): { generatorId: string; level: number } {
  const [generatorId, level] = token.split(':');
  return { generatorId, level: level ? Number(level) : GENERATOR_ACTIVE_LEVEL };
}

export function generatorLevelName(generatorId: string, level: number): LangText {
  const name = GENERATORS[generatorId].name;
  if (level < GENERATOR_ACTIVE_LEVEL) return { ru: `Детали: ${name.ru} (${level}/${GENERATOR_ACTIVE_LEVEL - 1})`, en: `Parts: ${name.en} (${level}/${GENERATOR_ACTIVE_LEVEL - 1})` };
  return name;
}

export function getItem(id: string): ItemDef {
  const def = ITEMS[id];
  if (!def) throw new Error(`Unknown item id: ${id}`);
  return def;
}
