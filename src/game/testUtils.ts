import { START_GENERATORS } from '../content/board';
import { STORAGE_CAPACITY } from '../content/orders';
import { createInitialState, type GameState } from './state';

/**
 * Поле без тумана и стартовых предметов — только основные генераторы, сразу рабочего 4-го уровня,
 * и открытый склад на 6 мест. Для проверок правил, не зависящих от раскладки и обучения.
 */
export function openBoard(seed = 1): GameState {
  const s = createInitialState(seed);
  const main = new Set(START_GENERATORS.map((g) => g.cell));
  return {
    ...s,
    cells: s.cells.map((c, i) => (c?.kind === 'generator' && main.has(i) ? { ...c, level: 4 } : null)),
    fog: s.fog.map(() => null),
    storage: new Array(STORAGE_CAPACITY).fill(null),
  };
}
