// Раскладка поля 7 × 9 (GAME_DESIGN, раздел 5.1). По решению пользователя от 22.10.2026 поле открывается
// не проектами, а мерджем: клетки под паутиной держат видимый предмет, коробки — скрытый.
// Числа и предметы — рабочее предложение для теста.

export const BOARD_COLS = 7;
export const BOARD_ROWS = 9;
export const BOARD_SIZE = BOARD_COLS * BOARD_ROWS;

export function cellIndex(col: number, row: number): number {
  return row * BOARD_COLS + col;
}

export type Fog = 'web' | 'box';

/**
 * Стартовая карта по строкам сверху вниз:
 *   .       — открытая пустая клетка
 *   G:<id>:<ур.> — стартовый генератор на открытой клетке (уровень по умолчанию 4)
 *   g:<id>:<ур.> — дополнительная деталь генератора на открытой клетке (не входит в START_GENERATORS)
 *   w:<id>  — паутина: предмет виден, освобождается мерджем с таким же предметом
 *   b:<id>  — коробка с предметом (b:@<генератор>:<ур.> — с генератором); b — пустая коробка. Коробка становится паутиной (или открывается, если пустая),
 *             когда соседняя по стороне клетка становится открытой.
 */
export const START_LAYOUT: string[][] = [
  ['b:T03', 'b', 'b:M04', 'b', 'b:P03', 'b', 'b:E03'],
  ['b', 'b:M02', 'b', 'b:T04', 'b', 'b:E02', 'b'],
  ['b:P01', 'w:T01', 'w:M02', 'w:T02', 'w:M01', 'w:E01', 'b:P02'],
  ['w:M01', '.', '.', '.', '.', '.', 'w:T01'],
  ['w:T02', 'g:G_TOOL:3', 'G:G_TOOL:3', '.', 'G:G_MATERIAL', '.', 'w:M02'],
  ['w:P01', '.', '.', '.', '.', '.', 'w:E01'],
  ['b:T02', 'w:M01', 'w:T03', 'w:P02', 'w:M03', 'w:T01', 'b:M01'],
  ['b', 'b:E04', 'b', 'b:T05', 'b', 'b:P04', 'b'],
  ['b:M05', 'b', 'b:E01', 'b', 'b:@G_MATERIAL:4', 'b', 'b:P05'],
];

export interface StartCell {
  fog: Fog | null;
  itemId: string | null;
  generatorId: string | null;
  level: number;
  /** Основной стартовый генератор (G:), а не дополнительная деталь (g:). */
  main: boolean;
}

export function parseLayout(layout: string[][] = START_LAYOUT): StartCell[] {
  return layout.flat().map((token) => {
    const [kind, id, lvl] = token.split(':');
    const level = lvl ? Number(lvl) : 4;
    if (kind === 'G' || kind === 'g') return { fog: null, itemId: null, generatorId: id, level, main: kind === 'G' };
    if (kind === 'w') return { fog: 'web', itemId: id, generatorId: null, level: 0, main: false };
    if (kind === 'b' && id?.startsWith('@')) return { fog: 'box', itemId: null, generatorId: id.slice(1), level, main: false };
    if (kind === 'b') return { fog: 'box', itemId: id ?? null, generatorId: null, level: 0, main: false };
    return { fog: null, itemId: null, generatorId: null, level: 0, main: false };
  });
}

export const START_GENERATORS: { generatorId: string; cell: number }[] = parseLayout().flatMap((c, i) => (c.generatorId && c.main ? [{ generatorId: c.generatorId, cell: i }] : []));

/** Соседи по стороне. */
export function neighbors(cell: number): number[] {
  const col = cell % BOARD_COLS;
  const row = Math.floor(cell / BOARD_COLS);
  const out: number[] = [];
  if (col > 0) out.push(cell - 1);
  if (col < BOARD_COLS - 1) out.push(cell + 1);
  if (row > 0) out.push(cell - BOARD_COLS);
  if (row < BOARD_ROWS - 1) out.push(cell + BOARD_COLS);
  return out;
}
