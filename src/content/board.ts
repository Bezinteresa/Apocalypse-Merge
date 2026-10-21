// Раскладка поля: 7 × 9, 12 закрытых клеток в четырёх группах (GAME_DESIGN, раздел о поле).
// Расположение клеток — рабочее предложение прототипа, каталог его не фиксирует.

export const BOARD_COLS = 7;
export const BOARD_ROWS = 9;
export const BOARD_SIZE = BOARD_COLS * BOARD_ROWS;

export function cellIndex(col: number, row: number): number {
  return row * BOARD_COLS + col;
}

/** Группы закрытых клеток и проект, который их открывает. */
export const LOCKED_GROUPS: { unlockedBy: string; cells: number[] }[] = [
  { unlockedBy: 'R02', cells: [cellIndex(4, 6), cellIndex(5, 6), cellIndex(6, 6)] },
  { unlockedBy: 'R04', cells: [cellIndex(4, 7), cellIndex(5, 7), cellIndex(6, 7)] },
  { unlockedBy: 'R06', cells: [cellIndex(4, 8), cellIndex(5, 8), cellIndex(6, 8)] },
  { unlockedBy: 'R08', cells: [cellIndex(1, 8), cellIndex(2, 8), cellIndex(3, 8)] },
];

export const START_GENERATORS: { generatorId: string; cell: number }[] = [
  { generatorId: 'G_TOOL', cell: cellIndex(2, 4) },
  { generatorId: 'G_MATERIAL', cell: cellIndex(4, 4) },
];
