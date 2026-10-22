import { DIALOGS, type DialogDef } from '../content/dialogs';
import type { LangText } from '../content/items';
import { countItem } from './rules';
import type { GameState } from './state';

// Обучение до R01 (GAME_DESIGN, раздел 11). Шаг вычисляется из фактического состояния:
// выполненное заранее действие засчитывается, перезапуск продолжает с того же места,
// а отдельный счётчик шага не может разойтись с полем.

export type TutorialTarget =
  | { kind: 'generator'; generatorId: string }
  | { kind: 'item'; itemId: string }
  | { kind: 'order'; orderId: string }
  | { kind: 'project' };

export interface TutorialStep {
  id: string;
  hint: LangText;
  targets: TutorialTarget[];
  done(state: GameState): boolean;
}

const has = (state: GameState, itemId: string, n = 1) => countItem(state, itemId) >= n;
const orderDone = (state: GameState, id: string) => state.completedOrders.includes(id);
const projectDone = (state: GameState, id: string) => state.completedProjects.includes(id);

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'spawn_tools',
    hint: { ru: 'Нажмите на ящик инструментов два раза', en: 'Tap the toolbox twice' },
    targets: [{ kind: 'generator', generatorId: 'G_TOOL' }],
    done: (s) => has(s, 'T01', 2) || has(s, 'T02') || orderDone(s, 'O01'),
  },
  {
    id: 'merge_t02',
    hint: { ru: 'Перетащите одну отвёртку на другую', en: 'Drag one screwdriver onto the other' },
    targets: [{ kind: 'item', itemId: 'T01' }],
    done: (s) => has(s, 'T02') || orderDone(s, 'O01'),
  },
  {
    id: 'deliver_o01',
    hint: { ru: 'Отдайте пассатижи Льву: нажмите «Сдать»', en: 'Give the pliers to Lev: tap "Deliver"' },
    targets: [{ kind: 'order', orderId: 'O01' }],
    done: (s) => orderDone(s, 'O01'),
  },
  {
    id: 'make_m02',
    hint: { ru: 'Достаньте два металлолома и соедините их', en: 'Get two scrap metals and merge them' },
    targets: [{ kind: 'generator', generatorId: 'G_MATERIAL' }, { kind: 'item', itemId: 'M01' }],
    done: (s) => has(s, 'M02') || projectDone(s, 'R01'),
  },
  {
    id: 'restore_r01',
    hint: { ru: 'Откройте ремонт и восстановите вход', en: 'Open the repair and restore the entrance' },
    targets: [{ kind: 'project' }],
    done: (s) => projectDone(s, 'R01'),
  },
];

/** Текущий шаг обучения; null — обучение завершено. */
export function currentTutorialStep(state: GameState): TutorialStep | null {
  if (projectDone(state, 'R01')) return null;
  return TUTORIAL_STEPS.find((step) => !step.done(state)) ?? null;
}

function dialogTriggered(state: GameState, d: DialogDef): boolean {
  if (!d.after) return true;
  if ('order' in d.after) return orderDone(state, d.after.order);
  return projectDone(state, d.after.project);
}

/** Первая непросмотренная сцена, условие которой выполнено. */
export function pendingDialog(state: GameState): DialogDef | null {
  return DIALOGS.find((d) => !state.seenDialogs.includes(d.id) && dialogTriggered(state, d)) ?? null;
}

/** Отметить сцену просмотренной. Пропуск сцены тоже отмечает её: награды и открытия от этого не зависят. */
export function markDialogSeen(state: GameState, dialogId: string): GameState {
  if (state.seenDialogs.includes(dialogId)) return state;
  return { ...state, seenDialogs: [...state.seenDialogs, dialogId] };
}

/** Сцены, уже доступные в этом состоянии; используется миграцией, чтобы не повторять их игроку с прогрессом. */
export function triggeredDialogIds(state: GameState): string[] {
  return DIALOGS.filter((d) => dialogTriggered(state, d)).map((d) => d.id);
}
