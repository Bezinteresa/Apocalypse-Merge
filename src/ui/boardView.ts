import { BOARD_COLS, BOARD_SIZE } from '../content/board';
import { CHAINS, GENERATORS, getItem } from '../content/items';
import { t, tx } from '../i18n';
import { canMerge } from '../game/rules';
import type { CellContent, GameState } from '../game/state';

// Условная графика этапа 1: цветные плашки с подписью и номером уровня.
// Отображение только показывает состояние и передаёт намерения игрока в контроллер.

export interface BoardHandlers {
  onTap(cell: number): void;
  onDrop(from: number, to: number): void;
}

const DRAG_THRESHOLD_PX = 8;

export class BoardView {
  private cellEls: HTMLElement[] = [];
  private state: GameState | null = null;
  private selected: number | null = null;
  private enabled = true;
  private drag: {
    pointerId: number;
    from: number;
    startX: number;
    startY: number;
    ghost: HTMLElement | null;
    hover: number | null;
  } | null = null;

  constructor(
    private root: HTMLElement,
    private handlers: BoardHandlers,
  ) {
    root.classList.add('board');
    root.style.setProperty('--cols', String(BOARD_COLS));
    for (let i = 0; i < BOARD_SIZE; i++) {
      const el = document.createElement('div');
      el.className = 'cell';
      el.dataset.cell = String(i);
      root.appendChild(el);
      this.cellEls.push(el);
    }
    root.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.cancelDrag);
    root.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancelDrag();
  }

  setSelected(cell: number | null): void {
    this.selected = cell;
    if (this.state) this.render(this.state);
  }

  render(state: GameState): void {
    this.state = state;
    const selectedContent = this.selected !== null ? state.cells[this.selected] : null;
    for (let i = 0; i < BOARD_SIZE; i++) {
      const el = this.cellEls[i];
      const content = state.cells[i];
      el.classList.toggle('locked', state.locked.includes(i));
      el.classList.toggle('selected', i === this.selected);
      el.classList.toggle('mergeable', i !== this.selected && canMerge(selectedContent, content));
      el.replaceChildren();
      if (content) el.appendChild(renderContent(content));
    }
  }

  flash(cell: number, cls: 'pop' | 'shake'): void {
    const el = this.cellEls[cell];
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  private cellAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.cell');
    if (!el || !this.root.contains(el)) return null;
    return Number(el.dataset.cell);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (!this.enabled || this.drag || !this.state || e.button > 0) return;
    const cell = this.cellAt(e.clientX, e.clientY);
    if (cell === null) return;
    e.preventDefault();
    this.drag = { pointerId: e.pointerId, from: cell, startX: e.clientX, startY: e.clientY, ghost: null, hover: null };
  };

  private onPointerMove = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId || !this.state) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD_PX) return;
      const content = this.state.cells[d.from];
      if (!content || this.state.locked.includes(d.from)) return;
      const src = this.cellEls[d.from];
      const rect = src.getBoundingClientRect();
      d.ghost = renderContent(content);
      d.ghost.classList.add('ghost');
      d.ghost.style.width = `${rect.width}px`;
      d.ghost.style.height = `${rect.height}px`;
      document.body.appendChild(d.ghost);
      src.classList.add('dragging');
      this.selected = d.from;
      this.render(this.state);
    }
    d.ghost.style.transform = `translate(${e.clientX - d.ghost.offsetWidth / 2}px, ${e.clientY - d.ghost.offsetHeight / 2}px)`;
    const hover = this.cellAt(e.clientX, e.clientY);
    if (hover !== d.hover) {
      if (d.hover !== null) this.cellEls[d.hover].classList.remove('hover');
      if (hover !== null) this.cellEls[hover].classList.add('hover');
      d.hover = hover;
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    const wasDrag = d.ghost !== null;
    const target = this.cellAt(e.clientX, e.clientY);
    this.cancelDrag();
    if (!this.enabled) return;
    if (!wasDrag) this.handlers.onTap(d.from);
    else if (target !== null && target !== d.from) this.handlers.onDrop(d.from, target);
  };

  private cancelDrag = (): void => {
    const d = this.drag;
    if (!d) return;
    d.ghost?.remove();
    this.cellEls[d.from].classList.remove('dragging');
    if (d.hover !== null) this.cellEls[d.hover].classList.remove('hover');
    this.drag = null;
  };
}

function renderContent(content: CellContent): HTMLElement {
  const el = document.createElement('div');
  if (content.kind === 'generator') {
    const def = GENERATORS[content.generatorId];
    const out = getItem(def.output);
    el.className = 'piece generator';
    el.style.setProperty('--chain', CHAINS[out.chain].color);
    el.innerHTML = `<span class="badge">⟳</span><span class="label"></span>`;
    // в клетке — короткая подпись цепочки, полное название генератора выводится в панели информации
    el.querySelector('.label')!.textContent = tx(CHAINS[out.chain].name);
    return el;
  }
  const def = getItem(content.itemId);
  el.className = 'piece item';
  el.style.setProperty('--chain', CHAINS[def.chain].color);
  el.innerHTML = `<span class="badge"></span><span class="label"></span>`;
  el.querySelector('.badge')!.textContent = String(def.level);
  el.querySelector('.label')!.textContent = tx(def.name);
  if (!def.nextId) el.classList.add('max');
  return el;
}

export function describeContent(content: CellContent | null): { title: string; detail: string } | null {
  if (!content) return null;
  if (content.kind === 'generator') {
    const def = GENERATORS[content.generatorId];
    return { title: tx(def.name), detail: `${t('generatorHint')}: ${tx(getItem(def.output).name)}` };
  }
  const def = getItem(content.itemId);
  const next = def.nextId ? `${t('next')}: ${tx(getItem(def.nextId).name)}` : t('maxLevel');
  return { title: `${tx(def.name)} · ${t('level')} ${def.level}`, detail: `${tx(CHAINS[def.chain].name)} · ${next}` };
}
