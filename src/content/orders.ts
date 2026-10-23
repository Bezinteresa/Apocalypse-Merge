import type { LangText } from './items';

// Заказы и проекты первой главы по docs/CONTENT_CATALOG.md, разделы 3–4.

export interface Requirement {
  itemId: string;
  count: number;
}

export interface VisitorDef {
  id: string;
  name: LangText;
}

export interface OrderDef {
  id: string;
  visitor: string;
  text: LangText;
  requires: Requirement[];
  reward: number;
  /** Проект, после которого заказ открывается; null — доступен с начала. */
  after: string | null;
}

export interface ProjectDef {
  id: string;
  name: LangText;
  result: LangText;
  requires: Requirement[];
  cost: number;
  /** Энергия начисляется, когда в игре включена энергия (этап 5). */
  energyReward: number;
  /** Генератор-награда приходит во входящее хранилище. */
  generatorReward: string | null;
  /** Генератор, который должен стоять на поле, чтобы проект можно было завершить. */
  requiresGenerator?: string;
  /** Новая вместимость склада после проекта. */
  storageCapacity?: number;
}

export const VISITORS: Record<string, VisitorDef> = {
  LEV: { id: 'LEV', name: { ru: 'Лев', en: 'Lev' } },
  NIKA: { id: 'NIKA', name: { ru: 'Ника', en: 'Nika' } },
  MARTA: { id: 'MARTA', name: { ru: 'Марта', en: 'Marta' } },
  SAVVA: { id: 'SAVVA', name: { ru: 'Савва', en: 'Savva' } },
  /** Не посетитель: голос в радиоэфире финальной сцены. */
  RADIO: { id: 'RADIO', name: { ru: 'Радио', en: 'Radio' } },
};

export const STORAGE_CAPACITY = 6;
export const STORAGE_CAPACITY_EXPANDED = 10;

const r = (itemId: string, count = 1): Requirement => ({ itemId, count });

export const ORDERS: OrderDef[] = [
  { id: 'O01', visitor: 'LEV', text: { ru: 'Закрепить переносную табличку', en: 'Fix a portable sign' }, requires: [r('T02')], reward: 12, after: null },
  { id: 'O02', visitor: 'LEV', text: { ru: 'Закрыть дыру в ограде', en: 'Patch a hole in the fence' }, requires: [r('M03')], reward: 22, after: null },
  { id: 'O03', visitor: 'LEV', text: { ru: 'Подтянуть крепления тележки', en: 'Tighten the cart mounts' }, requires: [r('T03')], reward: 25, after: 'R01' },
  { id: 'O04', visitor: 'LEV', text: { ru: 'Починить соседский навес', en: "Fix a neighbour's awning" }, requires: [r('T04')], reward: 40, after: 'R02' },
  { id: 'O05', visitor: 'LEV', text: { ru: 'Поставить заплату на ворота', en: 'Patch the gate' }, requires: [r('M03'), r('T02')], reward: 35, after: 'R02' },
  { id: 'O06', visitor: 'NIKA', text: { ru: 'Перекус для дежурных', en: 'Snack for the watch' }, requires: [r('P02')], reward: 18, after: 'R03' },
  { id: 'O07', visitor: 'NIKA', text: { ru: 'Обед для пункта помощи', en: 'Lunch for the aid post' }, requires: [r('P03')], reward: 28, after: 'R03' },
  { id: 'O08', visitor: 'LEV', text: { ru: 'Укрепить проход во двор', en: 'Reinforce the yard passage' }, requires: [r('M04')], reward: 40, after: 'R03' },
  { id: 'O09', visitor: 'LEV', text: { ru: 'Выезд ремонтной бригады', en: 'Repair crew trip' }, requires: [r('T04'), r('P02')], reward: 48, after: 'R04' },
  { id: 'O10', visitor: 'NIKA', text: { ru: 'Паёк для ночного дежурства', en: 'Ration for the night watch' }, requires: [r('P04')], reward: 48, after: 'R04' },
  { id: 'O11', visitor: 'LEV', text: { ru: 'Восстановить опору перехода', en: 'Restore a bridge support' }, requires: [r('M04'), r('T03')], reward: 60, after: 'R04' },
  { id: 'O12', visitor: 'MARTA', text: { ru: 'Заменить старую проводку', en: 'Replace old wiring' }, requires: [r('E02')], reward: 20, after: 'R05' },
  { id: 'O13', visitor: 'MARTA', text: { ru: 'Комплект для выездного ремонта', en: 'Field repair kit' }, requires: [r('E03'), r('P02')], reward: 40, after: 'R05' },
  { id: 'O14', visitor: 'MARTA', text: { ru: 'Оживить переносной светильник', en: 'Revive a portable lamp' }, requires: [r('E04')], reward: 55, after: 'R05' },
  { id: 'O15', visitor: 'MARTA', text: { ru: 'Подключить переговорное устройство', en: 'Connect the intercom' }, requires: [r('E03'), r('T03')], reward: 50, after: 'R06' },
  { id: 'O16', visitor: 'NIKA', text: { ru: 'Оборудовать место дежурного', en: 'Equip the watch post' }, requires: [r('P03'), r('M03')], reward: 45, after: 'R06' },
  { id: 'O17', visitor: 'MARTA', text: { ru: 'Проверить дальнюю линию связи', en: 'Check the long-range line' }, requires: [r('E04'), r('P03')], reward: 70, after: 'R07' },
  { id: 'O18', visitor: 'LEV', text: { ru: 'Подготовить первую общую поставку', en: 'Prepare the first shared supply' }, requires: [r('T04'), r('P04')], reward: 80, after: 'R07' },
  // глава 2: гараж
  { id: 'O19', visitor: 'MARTA', text: { ru: 'Перебрать старый мотоцикл', en: 'Overhaul an old motorbike' }, requires: [r('A02')], reward: 30, after: 'R09' },
  { id: 'O20', visitor: 'MARTA', text: { ru: 'Собрать ремонтный набор для гаража', en: 'Put together a garage repair set' }, requires: [r('A02'), r('T03')], reward: 45, after: 'R09' },
  { id: 'O21', visitor: 'LEV', text: { ru: 'Укрепить тележку для дальних рейсов', en: 'Reinforce a cart for long runs' }, requires: [r('M04'), r('A02')], reward: 55, after: 'R09' },
  { id: 'O22', visitor: 'SAVVA', text: { ru: 'Запасная трансмиссия в дорогу', en: 'Spare transmission for the road' }, requires: [r('A03')], reward: 50, after: 'R10' },
  { id: 'O23', visitor: 'NIKA', text: { ru: 'Паёк и запчасти для санитарной машины', en: 'Rations and parts for the ambulance' }, requires: [r('P04'), r('A02')], reward: 60, after: 'R10' },
  { id: 'O24', visitor: 'SAVVA', text: { ru: 'Проводка для фар фургона', en: 'Wiring for the van headlights' }, requires: [r('A03'), r('E03')], reward: 65, after: 'R10' },
  { id: 'O25', visitor: 'MARTA', text: { ru: 'Двигатель для генератора квартала', en: 'An engine for the district generator' }, requires: [r('A04')], reward: 70, after: 'R11' },
  { id: 'O26', visitor: 'SAVVA', text: { ru: 'Обед для водителей каравана', en: 'Lunch for the caravan drivers' }, requires: [r('A03'), r('P03')], reward: 60, after: 'R11' },
  { id: 'O27', visitor: 'LEV', text: { ru: 'Починить ворота на объездной', en: 'Fix the bypass gate' }, requires: [r('T04'), r('A03')], reward: 75, after: 'R11' },
  { id: 'O28', visitor: 'SAVVA', text: { ru: 'Запасной двигатель с блоком управления', en: 'Spare engine with a control board' }, requires: [r('A04'), r('E04')], reward: 95, after: 'R12' },
  { id: 'O29', visitor: 'NIKA', text: { ru: 'Аптечный груз для каравана', en: 'Medical cargo for the caravan' }, requires: [r('P04'), r('E03')], reward: 70, after: 'R12' },
  { id: 'O30', visitor: 'SAVVA', text: { ru: 'Первая поставка каравана', en: 'The first caravan delivery' }, requires: [r('A04'), r('M04')], reward: 95, after: 'R12' },
];

export const PROJECTS: ProjectDef[] = [
  { id: 'R01', name: { ru: 'Расчистить и закрепить вход', en: 'Clear and secure the entrance' }, result: { ru: 'Завал убран, проход безопасен', en: 'Rubble cleared, the way in is safe' }, requires: [r('M02')], cost: 10, energyReward: 0, generatorReward: null },
  { id: 'R02', name: { ru: 'Восстановить прилавок', en: 'Restore the counter' }, result: { ru: 'Появился рабочий прилавок', en: 'A working counter' }, requires: [r('T02'), r('M03')], cost: 25, energyReward: 50, generatorReward: null },
  { id: 'R03', name: { ru: 'Установить полку припасов', en: 'Install the supply shelf' }, result: { ru: 'На полке появились запасы; получен ящик припасов, приходит Ника', en: 'Supplies on the shelf; provision crate received, Nika arrives' }, requires: [r('T03'), r('M03')], cost: 35, energyReward: 0, generatorReward: 'G_PROVISION' },
  { id: 'R04', name: { ru: 'Привести в порядок склад', en: 'Tidy up the storeroom' }, result: { ru: 'Ящики и стеллажи; склад 6 → 10', en: 'Crates and racks; storage 6 → 10' }, requires: [r('T03'), r('M04')], cost: 50, energyReward: 50, generatorReward: null, storageCapacity: STORAGE_CAPACITY_EXPANDED, requiresGenerator: 'G_PROVISION' },
  { id: 'R05', name: { ru: 'Оборудовать мастерскую', en: 'Equip the workshop' }, result: { ru: 'Верстак и место ремонта; получен стол радиодеталей, приходит Марта', en: 'Workbench and repair spot; radio parts bench received, Marta arrives' }, requires: [r('T04'), r('M04')], cost: 70, energyReward: 0, generatorReward: 'G_ELECTRIC' },
  { id: 'R06', name: { ru: 'Вернуть электричество', en: 'Bring back the power' }, result: { ru: 'Загорелись лампы', en: 'Lamps are on' }, requires: [r('E04'), r('T03')], cost: 70, energyReward: 50, generatorReward: null, requiresGenerator: 'G_ELECTRIC' },
  { id: 'R07', name: { ru: 'Запустить точку чистой воды', en: 'Start the clean water point' }, result: { ru: 'Бак, насос и место выдачи воды', en: 'Tank, pump and water tap' }, requires: [r('P03'), r('E03')], cost: 50, energyReward: 0, generatorReward: null },
  { id: 'R08', name: { ru: 'Открыть «Перекрёсток»', en: 'Open the "Crossroads"' }, result: { ru: 'Светится вывеска, во дворе посетители', en: 'The sign is lit and visitors fill the yard' }, requires: [r('P04'), r('M04'), r('E04')], cost: 100, energyReward: 0, generatorReward: null },
  // глава 2: гараж (PROTOTYPE_PLAN, этап 7)
  { id: 'R09', name: { ru: 'Открыть ворота гаража', en: 'Open the garage door' }, result: { ru: 'Ворота подняты; получен гаражный стеллаж', en: 'The door is up; garage parts rack received' }, requires: [r('T04'), r('M04')], cost: 80, energyReward: 50, generatorReward: 'G_AUTO' },
  { id: 'R10', name: { ru: 'Расчистить смотровую яму', en: 'Clear the inspection pit' }, result: { ru: 'Яма укреплена; приезжает водитель каравана Савва', en: 'The pit is reinforced; caravan driver Savva arrives' }, requires: [r('A02'), r('M04')], cost: 90, energyReward: 50, generatorReward: null, requiresGenerator: 'G_AUTO' },
  { id: 'R11', name: { ru: 'Поставить подъёмник', en: 'Install the car lift' }, result: { ru: 'Подъёмник работает', en: 'The lift works' }, requires: [r('A03'), r('E04'), r('T04')], cost: 110, energyReward: 50, generatorReward: null },
  { id: 'R12', name: { ru: 'Починить фургон каравана', en: 'Repair the caravan van' }, result: { ru: 'Фургон на ходу — караван готов к первому рейсу', en: 'The van runs — the caravan is ready for its first run' }, requires: [r('A04'), r('P04'), r('M04')], cost: 130, energyReward: 50, generatorReward: null },
  { id: 'R13', name: { ru: 'Расчистить служебный спуск', en: 'Clear the service descent' }, result: { ru: 'Под гаражом открылся люк вниз', en: 'A hatch leading down opened under the garage' }, requires: [r('M04'), r('T04'), r('E04')], cost: 150, energyReward: 0, generatorReward: null },
];

/** Главы: последний проект главы завершает её. */
export const CHAPTERS: { id: number; lastProject: string }[] = [
  { id: 1, lastProject: 'R08' },
  { id: 2, lastProject: 'R13' },
];

export function chapterEndedBy(projectId: string): number | null {
  return CHAPTERS.find((c) => c.lastProject === projectId)?.id ?? null;
}

export function getProject(id: string): ProjectDef {
  const def = PROJECTS.find((p) => p.id === id);
  if (!def) throw new Error(`Unknown project id: ${id}`);
  return def;
}

export function getOrder(id: string): OrderDef {
  const def = ORDERS.find((o) => o.id === id);
  if (!def) throw new Error(`Unknown order id: ${id}`);
  return def;
}
