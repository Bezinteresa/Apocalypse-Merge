import { getItem, type LangText } from '../content/items';
import { RARITY, cardsOf, SETS } from '../content/collections';
import { availableOrders, canMerge, countItem } from './rules';
import { currentTutorialStep } from './tutorial';
import type { GameState } from './state';

// Подсказки пальцем (решение пользователя от 23.10.2026): когда действие для игрока новое,
// палец показывает, куда нажать или что куда перетащить. Подсказка вычисляется из состояния
// и исчезает, как только действие выполнено; выполненные однократные действия хранятся во flags.

/** Однократные действия, которые не выводятся из состояния поля; `spawn:<генератор>` — из генератора уже доставали. */
export type HintFlag = 'web_freed' | 'storage_used' | 'chain_opened' | `spawn:${string}`;

/** Куда показывает палец. Клетки поля задаются индексом, элементы интерфейса — именованными якорями. */
export type HintTarget =
  | { kind: 'tap'; cell: number }
  | { kind: 'drag'; from: number; to: number | 'storage' }
  | { kind: 'ui'; anchor: 'order' | 'project' | 'incoming' | 'album' | 'chest' | 'assemble' | 'chip'; id?: string };

export interface Hint {
  id: string;
  text: LangText;
  target: HintTarget;
}

const openItems = (s: GameState) =>
  s.cells.flatMap((c, i) => (c?.kind === 'item' && !s.fog[i] ? [{ cell: i, itemId: c.itemId }] : []));

const generatorCell = (s: GameState, generatorId: string) => s.cells.findIndex((c) => c?.kind === 'generator' && c.generatorId === generatorId);

/** Пара открытых одинаковых предметов, которые можно объединить. */
function openPair(s: GameState, itemId: string): [number, number] | null {
  const cells = openItems(s).filter((x) => x.itemId === itemId).map((x) => x.cell);
  return cells.length >= 2 ? [cells[0], cells[1]] : null;
}

function tutorialHint(s: GameState): Hint | null {
  const step = currentTutorialStep(s);
  if (!step) return null;
  const tool = generatorCell(s, 'G_TOOL');
  const mat = generatorCell(s, 'G_MATERIAL');
  switch (step.id) {
    case 'spawn_tools':
      return { id: step.id, text: step.hint, target: { kind: 'tap', cell: tool } };
    case 'merge_t02': {
      const pair = openPair(s, 'T01');
      return pair ? { id: step.id, text: step.hint, target: { kind: 'drag', from: pair[0], to: pair[1] } } : { id: step.id, text: step.hint, target: { kind: 'tap', cell: tool } };
    }
    case 'deliver_o01':
      return { id: step.id, text: step.hint, target: { kind: 'ui', anchor: 'order', id: 'O01' } };
    case 'make_m02': {
      const pair = openPair(s, 'M01');
      return pair ? { id: step.id, text: step.hint, target: { kind: 'drag', from: pair[0], to: pair[1] } } : { id: step.id, text: step.hint, target: { kind: 'tap', cell: mat } };
    }
    case 'restore_r01':
      return { id: step.id, text: step.hint, target: { kind: 'ui', anchor: 'project' } };
    default:
      return null;
  }
}

const TEXT = {
  incoming: { ru: 'Новый ящик! Поставьте его на поле', en: 'A new crate! Place it on the board' },
  newGenerator: { ru: 'Нажмите на новый ящик — из него берутся новые предметы', en: 'Tap the new crate — it gives new items' },
  web: { ru: 'Перетащите на такой же предмет под паутиной — клетка освободится', en: 'Drag onto the same item under cobwebs to free the cell' },
  chest: { ru: 'Вы получили сундук! Откройте его в альбоме', en: 'You got a chest! Open it in the album' },
  assemble: { ru: 'Осколков хватает — соберите карту', en: 'Enough shards — assemble the card' },
  storage: { ru: 'Поле тесное — уберите предмет на склад', en: 'The board is crowded — move an item to storage' },
  where: { ru: 'Не знаете, где взять предмет? Нажмите на него', en: "Don't know where to get an item? Tap it" },
} satisfies Record<string, LangText>;

/** Текущая подсказка; null — новых действий для показа нет. Приоритет: обучение, затем по порядку списка. */
export function currentHint(s: GameState): Hint | null {
  const tutorial = tutorialHint(s);
  if (tutorial) return tutorial;
  const flags = s.flags;

  if (s.incoming.length) return { id: 'incoming', text: TEXT.incoming, target: { kind: 'ui', anchor: 'incoming' } };

  // новый генератор на поле, из которого ещё ничего не доставали
  const fresh = s.cells.findIndex((c) => c?.kind === 'generator' && !flags.includes(`spawn:${c.generatorId}`));
  if (fresh >= 0) return { id: 'new_generator', text: TEXT.newGenerator, target: { kind: 'tap', cell: fresh } };

  if (!flags.includes('web_freed')) {
    for (const x of openItems(s)) {
      const web = s.cells.findIndex((c, i) => s.fog[i] === 'web' && canMerge({ kind: 'item', uid: 0, itemId: x.itemId }, c));
      if (web >= 0) return { id: 'web', text: TEXT.web, target: { kind: 'drag', from: x.cell, to: web } };
    }
  }

  if (s.chests.length && !s.lastChest) return { id: 'chest', text: TEXT.chest, target: { kind: 'ui', anchor: 'chest' } };

  const set = SETS[0].id;
  const progress = s.collections[set];
  if (progress && !progress.assembled.length) {
    const ready = cardsOf(set).find((c) => (progress.shards[c.id] ?? 0) >= RARITY[c.rarity].threshold);
    if (ready) return { id: 'assemble', text: TEXT.assemble, target: { kind: 'ui', anchor: 'assemble', id: ready.id } };
  }

  if (!flags.includes('storage_used')) {
    const free = s.cells.filter((c, i) => c === null && !s.fog[i]).length;
    const item = openItems(s)[0];
    if (free <= 2 && item && s.storage.some((x) => x === null)) return { id: 'storage', text: TEXT.storage, target: { kind: 'drag', from: item.cell, to: 'storage' } };
  }

  if (!flags.includes('chain_opened')) {
    for (const o of availableOrders(s)) {
      const unknown = o.requires.find((r) => !s.discovered.includes(r.itemId) && countItem(s, r.itemId) === 0);
      if (unknown && getItem(unknown.itemId).level > 1) return { id: 'where', text: TEXT.where, target: { kind: 'ui', anchor: 'chip', id: unknown.itemId } };
    }
  }
  return null;
}

export function markFlag(s: GameState, flag: HintFlag): GameState {
  return s.flags.includes(flag) ? s : { ...s, flags: [...s.flags, flag] };
}
