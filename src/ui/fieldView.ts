import { BOARD_COLS, BOARD_SIZE, type Fog } from '../content/board';
import { CHAINS, GENERATORS, getItem } from '../content/items';
import { t, tx } from '../i18n';
import { canMerge, getAt } from '../game/rules';
import type { CellContent, GameState, Loc } from '../game/state';
import { generatorSprite, hasSprite, itemSprite, spriteImg, spriteUrl, uiSprite } from './sprites';

// Поле и склад с общим перетаскиванием. Условная графика: цветные плашки с подписью и номером уровня.
// Отображение только показывает состояние и передаёт намерения игрока в контроллер.

export interface FieldHandlers {
  onTap(loc: Loc): void;
  /** true — ход принят; false — предмет возвращается на своё место. */
  onDrop(from: Loc, to: Loc): boolean;
}

const DRAG_THRESHOLD_PX = 8;


function sameLoc(a: Loc | null, b: Loc | null): boolean {
  return !!a && !!b && a.area === b.area && a.index === b.index;
}

export class FieldView {
  private cellEls: HTMLElement[] = [];
  private slotEls: HTMLElement[] = [];
  private state: GameState | null = null;
  private selected: Loc | null = null;
  private wanted = new Set<string>();
  private tutorialIds = new Set<string>();
  private hintCells = new Set<number>();
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
    // плитки поля из графики, если они уже есть
    for (const [name, prop] of [['cell', '--cell-img'], ['cell_locked', '--cell-locked-img'], ['web', '--web-img']] as const) {
      if (hasSprite(uiSprite(name))) document.documentElement.style.setProperty(prop, `url("${spriteUrl(uiSprite(name))}")`);
    }
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

  /** Подсветка обучения: ID генераторов и предметов, на которые нужно нажать или которые нужно соединить. */
  setTutorialTargets(ids: Set<string>): void {
    this.tutorialIds = ids;
  }

  /** Временная подсветка «Где получить?»: генератор и предметы, из которых собирается нужный. */
  setHintCells(cells: number[]): void {
    this.hintCells = new Set(cells);
    if (this.state) this.render(this.state);
  }

  render(state: GameState): void {
    this.state = state;
    while (this.slotEls.length < state.storage.length) this.slotEls.push(this.createCell(this.storageRoot, 'storage', this.slotEls.length));
    const selectedContent = this.selected ? getAt(state, this.selected) : null;
    const paint = (el: HTMLElement, loc: Loc, fog: Fog | null) => {
      // содержимое коробки скрыто
      const content = fog === 'box' ? null : getAt(state, loc);
      const isSelected = sameLoc(loc, this.selected);
      el.classList.toggle('locked', fog === 'box');
      el.classList.toggle('web', fog === 'web');
      el.classList.toggle('selected', isSelected);
      el.classList.toggle('mergeable', !isSelected && canMerge(selectedContent, content));
      // под паутиной предмет нельзя сдать — не подсвечиваем его как нужный
      el.classList.toggle('wanted', !fog && content?.kind === 'item' && this.wanted.has(content.itemId));
      const contentId = content ? (content.kind === 'item' ? content.itemId : content.generatorId) : null;
      el.classList.toggle('tut', contentId !== null && this.tutorialIds.has(contentId));
      el.classList.toggle('hint', loc.area === 'board' && this.hintCells.has(loc.index));
      el.replaceChildren();
      if (content) el.appendChild(renderContent(content));
    };
    this.cellEls.forEach((el, i) => paint(el, { area: 'board', index: i }, state.fog[i] ?? null));
    this.slotEls.forEach((el, i) => paint(el, { area: 'storage', index: i }, null));
  }

  flash(loc: Loc, cls: 'pop' | 'shake'): void {
    const el = loc.area === 'board' ? this.cellEls[loc.index] : this.slotEls[loc.index];
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /**
   * Эффекты поля поверх клеток: вылет предмета из генератора, вспышка мерджа, облачко освобождённой паутины.
   * Состояние уже принято и отрисовано — эффект только сопровождает его.
   */
  effect(kind: 'spawn' | 'merge' | 'freed', at: Loc, from?: Loc): void {
    const cell = this.elOf(at);
    if (!cell || cell.offsetParent === null) return;
    const r = cell.getBoundingClientRect();
    if (kind === 'spawn' && from) {
      const src = this.elOf(from)?.getBoundingClientRect();
      const piece = cell.querySelector<HTMLElement>('.piece');
      if (!src || !piece) return;
      const fly = piece.cloneNode(true) as HTMLElement;
      fly.classList.add('fx-fly');
      fly.style.width = `${r.width}px`;
      fly.style.height = `${r.height}px`;
      fly.style.transform = `translate(${src.left}px, ${src.top}px) scale(0.4)`;
      document.body.appendChild(fly);
      cell.classList.add('arriving');
      requestAnimationFrame(() => requestAnimationFrame(() => (fly.style.transform = `translate(${r.left}px, ${r.top}px) scale(1)`)));
      setTimeout(() => {
        fly.remove();
        cell.classList.remove('arriving');
        this.flash(at, 'pop');
      }, 260);
      return;
    }
    const fx = document.createElement('div');
    fx.className = `fx fx-${kind}`;
    fx.style.left = `${r.left}px`;
    fx.style.top = `${r.top}px`;
    fx.style.width = `${r.width}px`;
    fx.style.height = `${r.height}px`;
    if (kind === 'merge') {
      fx.innerHTML = '<span class="fx-ring"></span>';
      for (let i = 0; i < 8; i++) {
        const s = document.createElement('span');
        s.className = 'fx-spark';
        const a = (i / 8) * Math.PI * 2;
        s.style.setProperty('--sx', `${Math.cos(a) * 70}%`);
        s.style.setProperty('--sy', `${Math.sin(a) * 70}%`);
        fx.appendChild(s);
      }
      this.flash(at, 'pop');
    } else {
      for (let i = 0; i < 6; i++) {
        const p = document.createElement('span');
        p.className = 'puff';
        const a = (i / 6) * Math.PI * 2;
        p.style.setProperty('--px', `${Math.cos(a) * 45}%`);
        p.style.setProperty('--py', `${Math.sin(a) * 45}%`);
        p.style.setProperty('--ps', '0.9');
        fx.appendChild(p);
      }
    }
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 900);
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
      if (!content || (d.from.area === 'board' && this.state.fog[d.from.index] != null)) return;
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
    const ghost = d.ghost;
    const targetEl = this.elAt(e.clientX, e.clientY);
    // призрак снимаем сами: при неудаче он должен доехать обратно
    d.ghost = null;
    this.cancelDrag();
    if (!ghost) {
      if (this.enabled) this.handlers.onTap(d.from);
      return;
    }
    const to = targetEl ? this.locOf(targetEl) : null;
    const accepted = this.enabled && !!to && !sameLoc(to, d.from) && this.handlers.onDrop(d.from, to);
    if (accepted) ghost.remove();
    else this.returnGhost(ghost, d.from);
  };

  /** Неудачный ход: предмет плавно возвращается в исходную клетку, пока на ней виден бледный след. */
  private returnGhost(ghost: HTMLElement, from: Loc): void {
    const src = this.elOf(from);
    if (!src) {
      ghost.remove();
      return;
    }
    src.classList.add('dragging');
    const r = src.getBoundingClientRect();
    ghost.classList.add('returning');
    ghost.style.transform = `translate(${r.left}px, ${r.top}px)`;
    const done = () => {
      ghost.remove();
      this.elOf(from)?.classList.remove('dragging');
    };
    ghost.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 300);
  }

  private cancelDrag = (): void => {
    const d = this.drag;
    if (!d) return;
    d.ghost?.remove();
    this.elOf(d.from)?.classList.remove('dragging');
    d.hover?.classList.remove('hover');
    this.drag = null;
  };
}

export function renderItemChip(itemId: string): HTMLElement {
  const def = getItem(itemId);
  const el = document.createElement('span');
  el.className = 'chip';
  el.dataset.item = itemId;
  el.style.setProperty('--chain', CHAINS[def.chain].color);
  el.innerHTML = '<b></b><span></span>';
  el.querySelector('b')!.textContent = String(def.level);
  el.querySelector('span')!.textContent = tx(def.name);
  const img = spriteImg(itemSprite(itemId), 'chip-img');
  if (img) el.prepend(img);
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
    withArt(el, generatorSprite(def.id));
    return el;
  }
  const def = getItem(content.itemId);
  el.className = 'piece item';
  el.style.setProperty('--chain', CHAINS[def.chain].color);
  el.innerHTML = `<span class="badge"></span><span class="label"></span>`;
  el.querySelector('.badge')!.textContent = String(def.level);
  el.querySelector('.label')!.textContent = tx(def.name);
  if (!def.nextId) el.classList.add('max');
  withArt(el, itemSprite(def.id));
  return el;
}

/** Если для слота есть картинка, плашка показывает её; номер уровня остаётся маленьким значком. */
function withArt(el: HTMLElement, file: string): void {
  const img = spriteImg(file, 'piece-img');
  if (!img) return;
  el.classList.add('has-art');
  el.prepend(img);
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
