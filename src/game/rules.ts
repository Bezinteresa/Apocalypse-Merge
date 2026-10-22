import { BOARD_COLS, BOARD_SIZE, LOCKED_GROUPS, cellIndex } from '../content/board';
import { GENERATORS, ITEMS, getItem, type ChainId } from '../content/items';
import { ORDERS, PROJECTS, getOrder, getProject, type OrderDef, type ProjectDef, type Requirement } from '../content/orders';
import type { CellContent, GameState, ItemInstance, Loc } from './state';
import { addEnergy, hasEnergyForSpawn, regenerate, spendSpawnEnergy } from './energy';
import { grantChestFor } from './collections';
import { CARDS, CHESTS, SETS } from '../content/collections';

// Правила игры. Функции не меняют входное состояние и возвращают новое вместе с результатом,
// чтобы отображение и сохранение работали с уже принятым состоянием.
// Каждое действие игрока, кроме отмены продажи, сбрасывает возможность отменить продажу.

export type SpawnResult =
  | { ok: true; state: GameState; cell: number; itemId: string }
  | { ok: false; reason: 'not_generator' | 'board_full' | 'no_energy' };

export type MoveResult =
  | { ok: true; state: GameState; action: 'move' | 'swap' | 'merge'; to: Loc; itemId?: string }
  | { ok: false; reason: 'same_cell' | 'empty_source' | 'locked' | 'out_of_bounds' | 'generator_to_storage' };

export type SellResult =
  | { ok: true; state: GameState; price: number }
  | { ok: false; reason: 'empty' | 'generator' | 'locked' | 'out_of_bounds' };

export type UndoResult = { ok: true; state: GameState; loc: Loc } | { ok: false; reason: 'nothing_to_undo' | 'occupied' | 'no_money' };

export type DeliverResult =
  | { ok: true; state: GameState; reward: number }
  | { ok: false; reason: 'unknown' | 'unavailable' | 'missing_items' };

export type ProjectResult =
  | { ok: true; state: GameState; project: ProjectDef; unlockedCells: number[]; placedCell: number | null }
  | { ok: false; reason: 'unknown' | 'not_current' | 'no_money' | 'missing_items' | 'generator_missing' };

export type PlaceResult = { ok: true; state: GameState; cell: number; generatorId: string } | { ok: false; reason: 'empty' | 'board_full' };

function clone(state: GameState): GameState {
  return {
    ...state,
    cells: state.cells.slice(),
    locked: state.locked.slice(),
    storage: state.storage.slice(),
    completedOrders: state.completedOrders.slice(),
    completedProjects: state.completedProjects.slice(),
    seenDialogs: state.seenDialogs.slice(),
    incoming: state.incoming.slice(),
    lastSale: null,
  };
}

function inBounds(cell: number): boolean {
  return Number.isInteger(cell) && cell >= 0 && cell < BOARD_SIZE;
}

function locValid(state: GameState, loc: Loc): boolean {
  if (loc.area === 'board') return inBounds(loc.index);
  return Number.isInteger(loc.index) && loc.index >= 0 && loc.index < state.storage.length;
}

function sameLoc(a: Loc, b: Loc): boolean {
  return a.area === b.area && a.index === b.index;
}

export const board = (index: number): Loc => ({ area: 'board', index });
export const slot = (index: number): Loc => ({ area: 'storage', index });

export function isLocked(state: GameState, cell: number): boolean {
  return state.locked.includes(cell);
}

export function getAt(state: GameState, loc: Loc): CellContent | null {
  if (loc.area === 'board') return state.cells[loc.index] ?? null;
  const item = state.storage[loc.index];
  return item ? { kind: 'item', ...item } : null;
}

function setAt(state: GameState, loc: Loc, content: CellContent | null): void {
  if (loc.area === 'board') {
    state.cells[loc.index] = content;
    return;
  }
  if (content && content.kind !== 'item') throw new Error('Generator cannot be stored');
  state.storage[loc.index] = content ? { uid: content.uid, itemId: content.itemId } : null;
}

/** Ближайшая к источнику свободная открытая клетка; при равном расстоянии — меньший индекс. */
export function findFreeCellNear(state: GameState, origin: number): number | null {
  const ox = origin % BOARD_COLS;
  const oy = Math.floor(origin / BOARD_COLS);
  let best: number | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (state.cells[i] !== null || isLocked(state, i)) continue;
    const dx = Math.abs((i % BOARD_COLS) - ox);
    const dy = Math.abs(Math.floor(i / BOARD_COLS) - oy);
    const dist = Math.max(dx, dy) * 10 + dx + dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/** Нажатие на генератор: выдача первого уровня в свободную клетку. Без места ничего не расходуется. */
export function spawnFromGenerator(state: GameState, generatorCell: number, now: number = Date.now()): SpawnResult {
  const content = inBounds(generatorCell) ? state.cells[generatorCell] : null;
  if (!content || content.kind !== 'generator') return { ok: false, reason: 'not_generator' };
  // место проверяется до энергии: на заполненном поле выдача ничего не тратит
  const target = findFreeCellNear(state, generatorCell);
  if (target === null) return { ok: false, reason: 'board_full' };
  const charged = regenerate(state, now);
  if (!hasEnergyForSpawn(charged)) return { ok: false, reason: 'no_energy' };
  const itemId = GENERATORS[content.generatorId].output;
  const next = clone(spendSpawnEnergy(charged));
  next.cells[target] = { kind: 'item', uid: next.nextUid, itemId };
  next.nextUid += 1;
  return { ok: true, state: next, cell: target, itemId };
}

export function canMerge(a: CellContent | null, b: CellContent | null): boolean {
  if (!a || !b || a.kind !== 'item' || b.kind !== 'item') return false;
  return a.itemId === b.itemId && getItem(a.itemId).nextId !== null;
}

/**
 * Перенос между клетками поля и ячейками склада:
 * пусто — перемещение, такой же предмет не максимального уровня — объединение, иное — обмен.
 * Генераторы на склад не попадают.
 */
export function moveItem(state: GameState, from: Loc, to: Loc): MoveResult {
  if (!locValid(state, from) || !locValid(state, to)) return { ok: false, reason: 'out_of_bounds' };
  if (sameLoc(from, to)) return { ok: false, reason: 'same_cell' };
  const source = getAt(state, from);
  if (!source) return { ok: false, reason: 'empty_source' };
  if ((from.area === 'board' && isLocked(state, from.index)) || (to.area === 'board' && isLocked(state, to.index))) {
    return { ok: false, reason: 'locked' };
  }
  const target = getAt(state, to);

  if (canMerge(source, target)) {
    const nextId = getItem((source as ItemInstance).itemId).nextId!;
    const next = clone(state);
    setAt(next, from, null);
    setAt(next, to, { kind: 'item', uid: next.nextUid, itemId: nextId });
    next.nextUid += 1;
    return { ok: true, state: next, action: 'merge', to, itemId: nextId };
  }

  const movesGeneratorToStorage = (to.area === 'storage' && source.kind === 'generator') || (from.area === 'storage' && target?.kind === 'generator');
  if (movesGeneratorToStorage) return { ok: false, reason: 'generator_to_storage' };

  const next = clone(state);
  setAt(next, to, source);
  setAt(next, from, target);
  return { ok: true, state: next, action: target ? 'swap' : 'move', to };
}

/** Перенос внутри поля. */
export function moveContent(state: GameState, from: number, to: number): MoveResult {
  return moveItem(state, board(from), board(to));
}

/** Продажа обычного предмета по цене уровня. Генераторы не продаются. */
export function sellItem(state: GameState, loc: Loc): SellResult {
  if (!locValid(state, loc)) return { ok: false, reason: 'out_of_bounds' };
  if (loc.area === 'board' && isLocked(state, loc.index)) return { ok: false, reason: 'locked' };
  const content = getAt(state, loc);
  if (!content) return { ok: false, reason: 'empty' };
  if (content.kind !== 'item') return { ok: false, reason: 'generator' };
  const price = getItem(content.itemId).sellPrice;
  const next = clone(state);
  setAt(next, loc, null);
  next.money += price;
  next.lastSale = { item: { uid: content.uid, itemId: content.itemId }, from: loc, price };
  return { ok: true, state: next, price };
}

/** Отмена последней продажи: вещь возвращается на исходное место, выручка списывается. */
export function undoSale(state: GameState): UndoResult {
  const sale = state.lastSale;
  if (!sale) return { ok: false, reason: 'nothing_to_undo' };
  if (getAt(state, sale.from)) return { ok: false, reason: 'occupied' };
  if (state.money < sale.price) return { ok: false, reason: 'no_money' };
  const next = clone(state);
  setAt(next, sale.from, { kind: 'item', ...sale.item });
  next.money -= sale.price;
  return { ok: true, state: next, loc: sale.from };
}

// ---------- Заказы и проекты ----------

export function isChainAvailable(state: GameState, chain: ChainId): boolean {
  return state.cells.some((c) => c?.kind === 'generator' && getItem(GENERATORS[c.generatorId].output).chain === chain);
}

function isProjectDone(state: GameState, id: string | null): boolean {
  return id === null || state.completedProjects.includes(id);
}

/** Обучение: до сдачи первого заказа виден только O01, ремонт R01 — после него (CONTENT_CATALOG, раздел 5). */
export function isTutorialGateOpen(state: GameState): boolean {
  return state.completedOrders.includes(TUTORIAL_FIRST_ORDER);
}

const TUTORIAL_FIRST_ORDER = 'O01';

/** Доступные незавершённые заказы по возрастанию ID, не более трёх. */
export function availableOrders(state: GameState): OrderDef[] {
  if (!isTutorialGateOpen(state)) return ORDERS.filter((o) => o.id === TUTORIAL_FIRST_ORDER);
  return ORDERS.filter(
    (o) =>
      !state.completedOrders.includes(o.id) &&
      isProjectDone(state, o.after) &&
      o.requires.every((req) => isChainAvailable(state, getItem(req.itemId).chain)),
  ).slice(0, 3);
}

/** Ближайший незавершённый проект; null — доступный срез пройден. */
export function currentProject(state: GameState): ProjectDef | null {
  if (!isTutorialGateOpen(state)) return null;
  return PROJECTS.find((p) => !state.completedProjects.includes(p.id)) ?? null;
}

/** Глава завершена после последнего проекта; оставшиеся заказы можно выполнить и после этого. */
export function isChapterComplete(state: GameState): boolean {
  return state.completedProjects.length === PROJECTS.length;
}

export function areAllOrdersDone(state: GameState): boolean {
  return state.completedOrders.length === ORDERS.length;
}

function hasGeneratorOnBoard(state: GameState, generatorId: string): boolean {
  return state.cells.some((c) => c?.kind === 'generator' && c.generatorId === generatorId);
}

/** Точка, от которой ищется место для полученного генератора: центр поля. */
const INCOMING_ORIGIN = cellIndex(3, 4);

/** Разместить первый генератор из входящего хранилища в свободную клетку. Без места он остаётся ждать. */
export function placeIncoming(state: GameState): PlaceResult {
  const generatorId = state.incoming[0];
  if (!generatorId) return { ok: false, reason: 'empty' };
  const cell = findFreeCellNear(state, INCOMING_ORIGIN);
  if (cell === null) return { ok: false, reason: 'board_full' };
  const next = clone(state);
  next.incoming.shift();
  next.cells[cell] = { kind: 'generator', generatorId };
  return { ok: true, state: next, cell, generatorId };
}

export function countItem(state: GameState, itemId: string): number {
  const onBoard = state.cells.filter((c, i) => c?.kind === 'item' && c.itemId === itemId && !isLocked(state, i)).length;
  return onBoard + state.storage.filter((s) => s?.itemId === itemId).length;
}

/** Экземпляры для требований: сначала поле (по индексу), затем склад. null — чего-то не хватает. */
export function findSources(state: GameState, requires: Requirement[]): Loc[] | null {
  const used: Loc[] = [];
  for (const req of requires) {
    let need = req.count;
    for (let i = 0; i < state.cells.length && need > 0; i++) {
      const c = state.cells[i];
      if (c?.kind === 'item' && c.itemId === req.itemId && !isLocked(state, i)) {
        used.push(board(i));
        need -= 1;
      }
    }
    for (let i = 0; i < state.storage.length && need > 0; i++) {
      if (state.storage[i]?.itemId === req.itemId) {
        used.push(slot(i));
        need -= 1;
      }
    }
    if (need > 0) return null;
  }
  return used;
}

export function canDeliver(state: GameState, order: OrderDef): boolean {
  return findSources(state, order.requires) !== null;
}

/** Сдача заказа: предметы списываются и деньги начисляются одной операцией; повтор невозможен. */
export function deliverOrder(state: GameState, orderId: string): DeliverResult {
  if (!ORDERS.some((o) => o.id === orderId)) return { ok: false, reason: 'unknown' };
  const order = getOrder(orderId);
  if (!availableOrders(state).some((o) => o.id === orderId)) return { ok: false, reason: 'unavailable' };
  const sources = findSources(state, order.requires);
  if (!sources) return { ok: false, reason: 'missing_items' };
  const next = clone(state);
  for (const loc of sources) setAt(next, loc, null);
  next.money += order.reward;
  next.completedOrders.push(order.id);
  return { ok: true, state: grantChestFor(next, order.id), reward: order.reward };
}

export function canCompleteProject(state: GameState, project: ProjectDef): boolean {
  if (project.requiresGenerator && !hasGeneratorOnBoard(state, project.requiresGenerator)) return false;
  return state.money >= project.cost && findSources(state, project.requires) !== null;
}

/** Завершение проекта: списание предметов и денег, открытия и награды — одна операция. */
export function completeProject(state: GameState, projectId: string): ProjectResult {
  if (!PROJECTS.some((p) => p.id === projectId)) return { ok: false, reason: 'unknown' };
  const project = getProject(projectId);
  if (currentProject(state)?.id !== projectId) return { ok: false, reason: 'not_current' };
  if (project.requiresGenerator && !hasGeneratorOnBoard(state, project.requiresGenerator)) return { ok: false, reason: 'generator_missing' };
  if (state.money < project.cost) return { ok: false, reason: 'no_money' };
  const sources = findSources(state, project.requires);
  if (!sources) return { ok: false, reason: 'missing_items' };

  const next = clone(state);
  for (const loc of sources) setAt(next, loc, null);
  next.money -= project.cost;
  next.completedProjects.push(project.id);
  const unlockedCells = LOCKED_GROUPS.filter((g) => g.unlockedBy === project.id).flatMap((g) => g.cells);
  next.locked = next.locked.filter((c) => !unlockedCells.includes(c));
  if (project.storageCapacity && project.storageCapacity > next.storage.length) {
    next.storage = next.storage.concat(new Array(project.storageCapacity - next.storage.length).fill(null));
  }
  let placedCell: number | null = null;
  let result = grantChestFor(addEnergy(next, project.energyReward), project.id);
  if (project.generatorReward) {
    result.incoming.push(project.generatorReward);
    const placed = placeIncoming(result);
    if (placed.ok) {
      result = placed.state;
      placedCell = placed.cell;
    }
  }
  return { ok: true, state: result, project, unlockedCells, placedCell };
}

// ---------- Где получить ----------

export type ItemSource =
  | { status: 'on_board'; generatorId: string; cell: number }
  | { status: 'incoming'; generatorId: string }
  | { status: 'locked'; generatorId: string; unlockProject: string | null };

/** Откуда берётся предмет: генератор его цепочки и состояние этого генератора. */
export function whereToGet(state: GameState, itemId: string): ItemSource {
  const chain = getItem(itemId).chain;
  const generatorId = Object.values(GENERATORS).find((g) => getItem(g.output).chain === chain)!.id;
  const cell = state.cells.findIndex((c) => c?.kind === 'generator' && c.generatorId === generatorId);
  if (cell >= 0) return { status: 'on_board', generatorId, cell };
  if (state.incoming.includes(generatorId)) return { status: 'incoming', generatorId };
  return { status: 'locked', generatorId, unlockProject: PROJECTS.find((p) => p.generatorReward === generatorId)?.id ?? null };
}

/** Предметы на поле той же цепочки ниже нужного уровня: из них собирается требуемый. */
export function ingredientCells(state: GameState, itemId: string): number[] {
  const def = getItem(itemId);
  const out: number[] = [];
  state.cells.forEach((c, i) => {
    if (c?.kind !== 'item') return;
    const d = getItem(c.itemId);
    if (d.chain === def.chain && d.level <= def.level) out.push(i);
  });
  return out;
}

// ---------- Проверка сохранения ----------

function validItem(raw: unknown, nextUid: number, uids: Set<number>): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const it = raw as ItemInstance;
  if (!ITEMS[it.itemId] || !Number.isInteger(it.uid) || it.uid < 1 || it.uid >= nextUid || uids.has(it.uid)) return false;
  uids.add(it.uid);
  return true;
}

function validLoc(raw: unknown, storageLength: number): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const loc = raw as Loc;
  if (loc.area === 'board') return inBounds(loc.index);
  return loc.area === 'storage' && Number.isInteger(loc.index) && loc.index >= 0 && loc.index < storageLength;
}

function validCollections(s: Partial<GameState>): boolean {
  if (typeof s.tokens !== 'number' || !Number.isFinite(s.tokens) || s.tokens < 0) return false;
  if (typeof s.rng !== 'number' || !Number.isInteger(s.rng) || s.rng < 0) return false;
  if (!Array.isArray(s.chests) || !s.chests.every((c) => !!CHESTS[c])) return false;
  if (!s.collections || typeof s.collections !== 'object') return false;
  for (const set of SETS) {
    const p = s.collections[set.id];
    if (!p || typeof p.pity !== 'number' || typeof p.rewardClaimed !== 'boolean' || !Array.isArray(p.assembled)) return false;
    if (!Object.keys(p.shards ?? {}).every((id) => CARDS.some((c) => c.id === id && c.setId === set.id))) return false;
    if (!p.assembled.every((id) => CARDS.some((c) => c.id === id && c.setId === set.id))) return false;
  }
  return s.lastChest === null || (typeof s.lastChest === 'object' && Array.isArray(s.lastChest?.draws));
}

/** Проверка загруженного состояния: структура, известные ID, уникальные uid. */
export function validateState(raw: unknown): raw is GameState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Partial<GameState>;
  if (typeof s.schemaVersion !== 'number') return false;
  if (!Array.isArray(s.cells) || s.cells.length !== BOARD_SIZE) return false;
  if (!Array.isArray(s.locked) || !s.locked.every((c) => inBounds(c))) return false;
  if (!Array.isArray(s.storage) || s.storage.length < 1 || s.storage.length > 50) return false;
  if (typeof s.money !== 'number' || !Number.isFinite(s.money) || s.money < 0) return false;
  if (typeof s.nextUid !== 'number' || !Number.isInteger(s.nextUid) || s.nextUid < 1) return false;
  if (!Array.isArray(s.completedOrders) || !s.completedOrders.every((id) => ORDERS.some((o) => o.id === id))) return false;
  if (!Array.isArray(s.completedProjects) || !s.completedProjects.every((id) => PROJECTS.some((p) => p.id === id))) return false;
  if (!Array.isArray(s.seenDialogs) || !s.seenDialogs.every((id) => typeof id === 'string')) return false;
  if (!Array.isArray(s.incoming) || !s.incoming.every((id) => !!GENERATORS[id])) return false;
  if (typeof s.energy !== 'number' || !Number.isFinite(s.energy) || s.energy < 0) return false;
  if (typeof s.energyUpdatedAt !== 'number' || !Number.isFinite(s.energyUpdatedAt)) return false;
  if (typeof s.energyUnlimited !== 'boolean') return false;
  if (!validCollections(s)) return false;
  const uids = new Set<number>();
  for (const c of s.cells) {
    if (c === null) continue;
    if (c.kind === 'item') {
      if (!validItem(c, s.nextUid, uids)) return false;
    } else if (c.kind === 'generator') {
      if (!GENERATORS[c.generatorId]) return false;
    } else {
      return false;
    }
  }
  for (const it of s.storage) {
    if (it !== null && !validItem(it, s.nextUid, uids)) return false;
  }
  if (s.lastSale !== null) {
    const sale = s.lastSale;
    if (!sale || !validItem(sale.item, s.nextUid, new Set(uids)) || !validLoc(sale.from, s.storage.length)) return false;
    if (typeof sale.price !== 'number' || sale.price < 0) return false;
  }
  return true;
}
