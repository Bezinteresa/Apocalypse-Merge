// Определения контента по docs/CONTENT_CATALOG.md. ID постоянные: на них ссылаются сохранения, заказы и проекты.

export type ChainId = 'T' | 'M' | 'P' | 'E';
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
};

export function getItem(id: string): ItemDef {
  const def = ITEMS[id];
  if (!def) throw new Error(`Unknown item id: ${id}`);
  return def;
}
