import { createInitialState, type GameState } from './state';

/** Поле без тумана и стартовых предметов — только генераторы. Для проверок правил, не зависящих от раскладки. */
export function openBoard(seed = 1): GameState {
  const s = createInitialState(seed);
  return {
    ...s,
    cells: s.cells.map((c) => (c?.kind === 'generator' ? c : null)),
    fog: s.fog.map(() => null),
  };
}
