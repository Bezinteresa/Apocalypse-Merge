import { BOARD_COLS, BOARD_SIZE, LOCKED_GROUPS } from '../content/board';
import { CHAINS, GENERATORS, getItem } from '../content/items';
import { t, tx } from '../i18n';
import { canMerge, getAt } from '../game/rules';
import type { CellContent, GameState, Loc } from '../game/state';

// Поле и склад с общим перетаскиванием. Условная графика: цветные плашки с подписью и номером уровня.
// Отображение только показывает состояние и передаёт намерения игрока в контроллер.

export interface FieldHandlers {
  onTap(loc: Loc): void;
  onDrop(from: Loc, to: Loc): void;
}

const DRAG_THRESHOLD_PX = 8;

const LOCK_LABEL = new Map<number, string>(LOCKED_GROUPS.flatMap((g) => g.cells.map((c) => [c, g.unlockedBy] as [number, string])));

function sameLoc(a: Loc | null, b: Loc | null): boolean {
  return !!a && !!b && a.area === b.area && a.index === b.index;
}

export class FieldView {
  private cellEls: HTMLElement[] = [];
  private slotEls: HTMLElement[] = [];
  private state: GameState | null = null;
  private selected: Loc | null = null;
  private wanted = new Set<string>();
  private enabled = true;
  private drag: {
    pointerId: number;
    from: Loc;
    startX: number;
    startY: number;
    ghost: HTMLElement | null;
    hover: HTMLElement | null;
  } | null = null;

  constructor(
    private boardRoot: HTMLElement,
    private storageRoot: HTMLElement,
    private handlers: FieldHandlers,
  ) {
    boardRoot.classList.add('board');
    boardRoot.style.setProperty('--cols', String(BOARD_COLS));
    for (let i = 0; i < BOARD_SIZE; i++) this.cellEls.push(this.createCell(boardRoot, 'board', i));
    storageRoot.classList.add('storage');
    for (const root of [boardRoot, storageRoot]) {
      root.addEventListener('pointerdown', this.onPointerDown);
      root.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.cancelDrag);
  }

  private createCell(root: HTMLElement, area: Loc['area'], index: number): HTMLElement {
    const el = document.createElement('div');
    el.className = 'cell';
    el.dataset.area = area;
    el.dataset.index = String(index);
    root.appendChild(el);
    return el;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancelDrag();
  }

  setSelected(loc: Loc | null): void {
    this.selected = loc;
    if (this.state) this.render(this.state);
  }

  /** Предметы, которые нужны открытым заказам и текущему проекту, подсвечиваются. */
  setWanted(itemIds: Set<string>): void {
    this.wanted = itemIds;
  }

  render(state: GameState): void {
    this.state = state;
    while (this.slotEls.length < state.storage.length) this.slotEls.push(this.createCell(this.storageRoot, 'storage', this.slotEls.length));
    const selectedContent = this.selected ? getAt(state, this.selected) : null;
    const paint = (el: HTMLElement, loc: Loc, locked: boolean) => {
      const content = getAt(state, loc);
      const isSelected = sameLoc(loc, this.selected);
      el.classList.toggle('locked', locked);
      el.classList.toggle('selected', isSelected);
      el.classList.toggle('mergeable', !isSelected && canMerge(selectedContent, content));
      el.classList.toggle('wanted', content?.kind === 'item' && this.wanted.has(content.itemId));
      el.replaceChildren();
      if (content) el.appendChild(renderContent(content));
      else if (locked) el.appendChild(lockLabel(LOCK_LABEL.get(loc.index) ?? ''));
    };
    this.cellEls.forEach((el, i) => paint(el, { area: 'board', index: i }, state.locked.includes(i)));
    this.slotEls.forEach((el, i) => paint(el, { area: 'storage', index: i }, false));
  }

  flash(loc: Loc, cls: 'pop' | 'shake'): void {
    const el = loc.area === 'board' ? this.cellEls[loc.index] : this.slotEls[loc.index];
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  private elAt(x: number, y: number): HTMLElement | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.cell');
    return el && (this.boardRoot.contains(el) || this.storageRoot.contains(el)) ? el : null;
  }

  private locOf(el: HTMLElement): Loc {
    return { area: el.dataset.area as Loc['area'], index: Number(el.dataset.index) };
  }

  private elOf(loc: Loc): HTMLElement {
    return loc.area === 'board' ? this.cellEls[loc.index] : this.slotEls[loc.index];
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (!this.enabled || this.drag || !this.state || e.button > 0) return;
    const el = this.elAt(e.clientX, e.clientY);
    if (!el) return;
    e.preventDefault();
    this.drag = { pointerId: e.pointerId, from: this.locOf(el), startX: e.clientX, startY: e.clientY, ghost: null, hover: null };
  };

  private onPointerMove = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId || !this.state) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD_PX) return;
      const content = getAt(this.state, d.from);
      if (!content || (d.from.area === 'board' && this.state.locked.includes(d.from.index))) return;
      const src = this.elOf(d.from);
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
    const hover = this.elAt(e.clientX, e.clientY);
    if (hover !== d.hover) {
      d.hover?.classList.remove('hover');
      hover?.classList.add('hover');
      d.hover = hover;
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    const wasDrag = d.ghost !== null;
    const targetEl = this.elAt(e.clientX, e.clientY);
    this.cancelDrag();
    if (!this.enabled) return;
    if (!wasDrag) this.handlers.onTap(d.from);
    else if (targetEl) {
      const to = this.locOf(targetEl);
      if (!sameLoc(to, d.from)) this.handlers.onDrop(d.from, to);
    }
  };

  private cancelDrag = (): void => {
    const d = this.drag;
    if (!d) return;
    d.ghost?.remove();
    this.elOf(d.from)?.classList.remove('dragging');
    d.hover?.classList.remove('hover');
    this.drag = null;
  };
}

function lockLabel(projectId: string): HTMLElement {
  const el = document.createElement('span');
  el.className = 'lock-label';
  el.textContent = projectId;
  return el;
}

export function renderItemChip(itemId: string): HTMLElement {
  const def = getItem(itemId);
  const el = document.createElement('span');
  el.className = 'chip';
  el.style.setProperty('--chain', CHAINS[def.chain].color);
  el.innerHTML = '<b></b><span></span>';
  el.querySelector('b')!.textContent = String(def.level);
  el.querySelector('span')!.textContent = tx(def.name);
  return el;
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
