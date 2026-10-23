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
  /** Генератор для улучшения: «G_TOOL:4» — ещё один ящик, который объединяется с имеющимся. */
  generatorUpgrade?: string;
  /** Генератор, который должен стоять на поле, чтобы проект можно было завершить. */
  requiresGenerator?: string;
  /** Новая вместимость склада после проекта. */
  storageCapacity?: number;
  /** Расчистка горы мусора: промежуточная задача между ремонтами, только за монеты (решение пользователя от 23.10.2026). */
  kind?: 'rubble';
}

export const VISITORS: Record<string, VisitorDef> = {
  LEV: { id: 'LEV', name: { ru: 'Лев', en: 'Lev' } },
  NIKA: { id: 'NIKA', name: { ru: 'Ника', en: 'Nika' } },
  MARTA: { id: 'MARTA', name: { ru: 'Марта', en: 'Marta' } },
  SAVVA: { id: 'SAVVA', name: { ru: 'Савва', en: 'Savva' } },
  TIKHON: { id: 'TIKHON', name: { ru: 'Тихон', en: 'Tikhon' } },
  /** Не посетитель: голос в радиоэфире финальной сцены. */
  RADIO: { id: 'RADIO', name: { ru: 'Радио', en: 'Radio' } },
};

/** Сколько заказов показывается одновременно (решение пользователя от 23.10.2026: 5 вместо 3, ряд карточек листается). */
export const MAX_ACTIVE_ORDERS = 5;

/** Склад закрыт до ремонта склада R04 (решение пользователя от 23.10.2026, по образцу «Отеля Мечты»). */
export const STORAGE_START = 0;
/** Мест после R04. */
export const STORAGE_CAPACITY = 6;
/** Мест после R08. */
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
  { id: 'O19', visitor: 'MARTA', text: { ru: 'Перебрать старый мотоцикл', en: 'Overhaul an old motorbike' }, requires: [r('A02')], reward: 25, after: 'R09' },
  { id: 'O20', visitor: 'MARTA', text: { ru: 'Собрать ремонтный набор для гаража', en: 'Put together a garage repair set' }, requires: [r('A02'), r('T04')], reward: 40, after: 'R09' },
  { id: 'O21', visitor: 'LEV', text: { ru: 'Укрепить тележку для дальних рейсов', en: 'Reinforce a cart for long runs' }, requires: [r('M05'), r('A02')], reward: 60, after: 'R09' },
  { id: 'O22', visitor: 'SAVVA', text: { ru: 'Запасная трансмиссия в дорогу', en: 'Spare transmission for the road' }, requires: [r('A03')], reward: 30, after: 'R10' },
  { id: 'O23', visitor: 'NIKA', text: { ru: 'Паёк и запчасти для санитарной машины', en: 'Rations and parts for the ambulance' }, requires: [r('P04'), r('A03')], reward: 55, after: 'R10' },
  { id: 'O24', visitor: 'SAVVA', text: { ru: 'Проводка для фар фургона', en: 'Wiring for the van headlights' }, requires: [r('A03'), r('E04')], reward: 55, after: 'R10' },
  { id: 'O25', visitor: 'MARTA', text: { ru: 'Двигатель для генератора квартала', en: 'An engine for the district generator' }, requires: [r('A04')], reward: 45, after: 'R11' },
  { id: 'O26', visitor: 'SAVVA', text: { ru: 'Двигатель и паёк для разведчиков каравана', en: 'An engine and rations for the caravan scouts' }, requires: [r('P04'), r('A04')], reward: 70, after: 'R11' },
  { id: 'O27', visitor: 'LEV', text: { ru: 'Починить ворота на объездной', en: 'Fix the bypass gate' }, requires: [r('T05'), r('A04')], reward: 85, after: 'R11' },
  { id: 'O28', visitor: 'SAVVA', text: { ru: 'Ремонтный комплект и проводка в дальний рейс', en: 'A repair kit and wiring for the long run' }, requires: [r('A05'), r('E04')], reward: 95, after: 'R12' },
  { id: 'O29', visitor: 'NIKA', text: { ru: 'Аптечный груз для каравана', en: 'Medical cargo for the caravan' }, requires: [r('P05'), r('E04')], reward: 95, after: 'R12' },
  { id: 'O30', visitor: 'SAVVA', text: { ru: 'Первая поставка каравана', en: 'The first caravan delivery' }, requires: [r('A05'), r('M05')], reward: 110, after: 'R12' },
  // глава 3: технический этаж убежища (PROTOTYPE_PLAN, этап 8)
  { id: 'O31', visitor: 'MARTA', text: { ru: 'Фонари для спуска', en: 'Lamps for the descent' }, requires: [r('E05')], reward: 70, after: 'R13' },
  { id: 'O32', visitor: 'LEV', text: { ru: 'Крепления для лестницы вниз', en: 'Brackets for the ladder down' }, requires: [r('M05'), r('T04')], reward: 80, after: 'R13' },
  { id: 'O33', visitor: 'SAVVA', text: { ru: 'Груз для нижнего этажа', en: 'Cargo for the lower level' }, requires: [r('A05'), r('P04')], reward: 100, after: 'R13' },
  { id: 'O34', visitor: 'TIKHON', text: { ru: 'Вентиль для бойлерной', en: 'A valve for the boiler room' }, requires: [r('F04')], reward: 45, after: 'R14' },
  { id: 'O35', visitor: 'TIKHON', text: { ru: 'Подтянуть трубы в щитовой', en: 'Tighten the pipes in the switch room' }, requires: [r('F04'), r('T05')], reward: 90, after: 'R14' },
  { id: 'O36', visitor: 'NIKA', text: { ru: 'Чистая вода для медпункта', en: 'Clean water for the aid post' }, requires: [r('P05'), r('F04')], reward: 105, after: 'R14' },
  { id: 'O37', visitor: 'TIKHON', text: { ru: 'Сменить фильтр в отстойнике', en: 'Replace the settling tank filter' }, requires: [r('F05'), r('T04')], reward: 100, after: 'R15' },
  { id: 'O38', visitor: 'MARTA', text: { ru: 'Насос для колодца квартала', en: 'A pump for the district well' }, requires: [r('F04'), r('E05')], reward: 105, after: 'R15' },
  { id: 'O39', visitor: 'SAVVA', text: { ru: 'Запас труб в рейс', en: 'Spare pipes for the run' }, requires: [r('A05'), r('F04')], reward: 105, after: 'R15' },
  { id: 'O40', visitor: 'TIKHON', text: { ru: 'Проверить линию фильтров', en: 'Check the filter line' }, requires: [r('F05'), r('E05')], reward: 130, after: 'R16' },
  { id: 'O41', visitor: 'NIKA', text: { ru: 'Вода для пункта помощи', en: 'Water for the aid post' }, requires: [r('P05'), r('F05')], reward: 130, after: 'R16' },
  { id: 'O42', visitor: 'LEV', text: { ru: 'Починить водовод квартала', en: 'Fix the district water main' }, requires: [r('T05'), r('M05'), r('F04')], reward: 130, after: 'R16' },
  { id: 'O43', visitor: 'TIKHON', text: { ru: 'Заслонки для вентшахты', en: 'Dampers for the air shaft' }, requires: [r('F05'), r('A05')], reward: 130, after: 'R17' },
  { id: 'O44', visitor: 'MARTA', text: { ru: 'Мотор для вентилятора', en: 'A motor for the fan' }, requires: [r('E05'), r('F05'), r('T05')], reward: 180, after: 'R17' },
  { id: 'O45', visitor: 'SAVVA', text: { ru: 'Припасы для дальнего рейса', en: 'Supplies for a long run' }, requires: [r('A05'), r('P05'), r('M05')], reward: 180, after: 'R17' },
];

export const PROJECTS: ProjectDef[] = [
  { id: 'R01', name: { ru: 'Расчистить и закрепить вход', en: 'Clear and secure the entrance' }, result: { ru: 'Завал убран, проход безопасен', en: 'Rubble cleared, the way in is safe' }, requires: [r('M02')], cost: 10, energyReward: 0, generatorReward: null },
  { id: 'C01', kind: 'rubble', name: { ru: 'Разобрать завал у прилавка', en: 'Clear the rubble by the counter' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 10, energyReward: 0, generatorReward: null },
  { id: 'R02', name: { ru: 'Восстановить прилавок', en: 'Restore the counter' }, result: { ru: 'Появился рабочий прилавок', en: 'A working counter' }, requires: [r('T02'), r('M03')], cost: 25, energyReward: 50, generatorReward: null , generatorUpgrade: 'G_TOOL:4' },
  { id: 'R03', name: { ru: 'Установить полку припасов', en: 'Install the supply shelf' }, result: { ru: 'На полке появились запасы; получен ящик припасов, приходит Ника', en: 'Supplies on the shelf; provision crate received, Nika arrives' }, requires: [r('T03'), r('M03')], cost: 35, energyReward: 0, generatorReward: 'G_PROVISION' },
  { id: 'C02', kind: 'rubble', name: { ru: 'Вынести хлам со склада', en: 'Haul the junk out of the storeroom' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 20, energyReward: 0, generatorReward: null },
  { id: 'R04', name: { ru: 'Привести в порядок склад', en: 'Tidy up the storeroom' }, result: { ru: 'Ящики и стеллажи; открыт склад на 6 мест', en: 'Crates and racks; storage opens with 6 slots' }, requires: [r('T03'), r('M04')], cost: 50, energyReward: 50, generatorReward: null, storageCapacity: STORAGE_CAPACITY, requiresGenerator: 'G_PROVISION' , generatorUpgrade: 'G_MATERIAL:4' },
  { id: 'C03', kind: 'rubble', name: { ru: 'Расчистить угол мастерской', en: 'Clear the workshop corner' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 30, energyReward: 0, generatorReward: null },
  { id: 'R05', name: { ru: 'Оборудовать мастерскую', en: 'Equip the workshop' }, result: { ru: 'Верстак и место ремонта; получен стол радиодеталей, приходит Марта', en: 'Workbench and repair spot; radio parts bench received, Marta arrives' }, requires: [r('T04'), r('M04')], cost: 70, energyReward: 0, generatorReward: 'G_ELECTRIC' },
  { id: 'R06', name: { ru: 'Вернуть электричество', en: 'Bring back the power' }, result: { ru: 'Загорелись лампы', en: 'Lamps are on' }, requires: [r('E04'), r('T03')], cost: 70, energyReward: 50, generatorReward: null, requiresGenerator: 'G_ELECTRIC' , generatorUpgrade: 'G_TOOL:5' },
  { id: 'C04', kind: 'rubble', name: { ru: 'Убрать мусорную кучу во дворе', en: 'Clear the junk heap in the yard' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 30, energyReward: 0, generatorReward: null },
  { id: 'R07', name: { ru: 'Запустить точку чистой воды', en: 'Start the clean water point' }, result: { ru: 'Бак, насос и место выдачи воды', en: 'Tank, pump and water tap' }, requires: [r('P03'), r('E03')], cost: 50, energyReward: 0, generatorReward: null , generatorUpgrade: 'G_PROVISION:4' },
  { id: 'R08', name: { ru: 'Открыть «Перекрёсток»', en: 'Open the "Crossroads"' }, result: { ru: 'Светится вывеска, во дворе посетители; склад 6 → 10', en: 'The sign is lit and visitors fill the yard; storage 6 → 10' }, requires: [r('P04'), r('M04'), r('E04')], cost: 100, energyReward: 0, generatorReward: null, storageCapacity: STORAGE_CAPACITY_EXPANDED , generatorUpgrade: 'G_MATERIAL:5' },
  { id: 'C05', kind: 'rubble', name: { ru: 'Разгрести гору хлама у ворот гаража', en: 'Dig through the junk pile at the garage door' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 40, energyReward: 0, generatorReward: null },
  // глава 2: гараж (PROTOTYPE_PLAN, этап 7)
  { id: 'R09', name: { ru: 'Открыть ворота гаража', en: 'Open the garage door' }, result: { ru: 'Ворота подняты; получен гаражный стеллаж', en: 'The door is up; garage parts rack received' }, requires: [r('T05'), r('M04')], cost: 100, energyReward: 70, generatorReward: 'G_AUTO' },
  { id: 'R10', name: { ru: 'Расчистить смотровую яму', en: 'Clear the inspection pit' }, result: { ru: 'Яма укреплена; приезжает водитель каравана Савва', en: 'The pit is reinforced; caravan driver Savva arrives' }, requires: [r('A03'), r('M05')], cost: 110, energyReward: 70, generatorReward: null, requiresGenerator: 'G_AUTO' , generatorUpgrade: 'G_ELECTRIC:4' },
  { id: 'C06', kind: 'rubble', name: { ru: 'Вывезти обломки из гаража', en: 'Haul the debris out of the garage' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 50, energyReward: 0, generatorReward: null },
  { id: 'R11', name: { ru: 'Поставить подъёмник', en: 'Install the car lift' }, result: { ru: 'Подъёмник работает', en: 'The lift works' }, requires: [r('A04'), r('E05'), r('T05')], cost: 140, energyReward: 70, generatorReward: null },
  { id: 'R12', name: { ru: 'Починить фургон каравана', en: 'Repair the caravan van' }, result: { ru: 'Фургон на ходу — караван готов к первому рейсу', en: 'The van runs — the caravan is ready for its first run' }, requires: [r('A05'), r('P05'), r('M05')], cost: 180, energyReward: 70, generatorReward: null , generatorUpgrade: 'G_AUTO:4' },
  { id: 'C07', kind: 'rubble', name: { ru: 'Разобрать завал над люком', en: 'Clear the debris over the hatch' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 60, energyReward: 0, generatorReward: null },
  { id: 'R13', name: { ru: 'Расчистить служебный спуск', en: 'Clear the service descent' }, result: { ru: 'Под гаражом открылся люк вниз', en: 'A hatch leading down opened under the garage' }, requires: [r('M05'), r('T05'), r('E05'), r('A04')], cost: 250, energyReward: 100, generatorReward: null },
  // глава 3: технический этаж убежища (PROTOTYPE_PLAN, этап 8)
  { id: 'R14', name: { ru: 'Осветить коридор убежища', en: 'Light the shelter corridor' }, result: { ru: 'Коридор освещён; найден трубный стеллаж, внизу ждёт инженер Тихон', en: 'The corridor is lit; a pipe rack found, engineer Tikhon waits below' }, requires: [r('E05'), r('M05')], cost: 230, energyReward: 150, generatorReward: 'G_PIPE' },
  { id: 'C08', kind: 'rubble', name: { ru: 'Разобрать обвалившийся стеллаж', en: 'Clear the collapsed rack' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 60, energyReward: 0, generatorReward: null },
  { id: 'R15', name: { ru: 'Запустить резервный генератор', en: 'Start the backup generator' }, result: { ru: 'Генератор гудит — у убежища своё питание', en: 'The generator hums — the shelter has its own power' }, requires: [r('E05'), r('A05'), r('F05')], cost: 200, energyReward: 150, generatorReward: null, requiresGenerator: 'G_PIPE' },
  { id: 'R16', name: { ru: 'Собрать насосную станцию', en: 'Build the pump station' }, result: { ru: 'Насосы качают воду из скважины', en: 'The pumps draw water from the well' }, requires: [r('F05'), r('P05'), r('M05'), r('T05')], cost: 250, energyReward: 150, generatorReward: null, generatorUpgrade: 'G_PIPE:4' },
  { id: 'C09', kind: 'rubble', name: { ru: 'Вычерпать ил из отстойника', en: 'Scoop the silt out of the settling tank' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 70, energyReward: 0, generatorReward: null },
  { id: 'R17', name: { ru: 'Запустить фильтры воды', en: 'Start the water filters' }, result: { ru: 'Из крана течёт чистая вода', en: 'Clean water runs from the tap' }, requires: [r('F05'), r('E05'), r('A05'), r('M05')], cost: 320, energyReward: 150, generatorReward: null },
  { id: 'C10', kind: 'rubble', name: { ru: 'Расчистить вентиляционную шахту', en: 'Clear the air shaft' }, result: { ru: 'Мусор вывезен', en: 'The junk is gone' }, requires: [], cost: 80, energyReward: 0, generatorReward: null },
  { id: 'R18', name: { ru: 'Включить вентиляцию', en: 'Turn on the ventilation' }, result: { ru: 'Свежий воздух — технический этаж ожил', en: 'Fresh air — the technical level is alive' }, requires: [r('F05'), r('E05'), r('T05'), r('M05'), r('A05')], cost: 400, energyReward: 0, generatorReward: null },
];

/** Главы: последний проект главы завершает её. */
export const CHAPTERS: { id: number; lastProject: string }[] = [
  { id: 1, lastProject: 'R08' },
  { id: 2, lastProject: 'R13' },
  { id: 3, lastProject: 'R18' },
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
