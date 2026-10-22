import { getItem } from '../content/items';
import { PROJECTS, SLICE, VISITORS, type ProjectDef, type Requirement } from '../content/orders';
import { t, tx, type StringKey } from '../i18n';
import {
  availableOrders,
  canCompleteProject,
  canDeliver,
  completeProject,
  countItem,
  currentProject,
  deliverOrder,
  getAt,
  moveItem,
  sellItem,
  spawnFromGenerator,
  undoSale,
} from '../game/rules';
import type { GameState, Loc } from '../game/state';
import { FieldView, describeContent, renderItemChip } from './fieldView';

// Экран игры: поле, склад, заказы, информация о предмете и сцена магазина.
// Все изменения состояния идут через правила; после принятия состояние сразу сохраняется.

export interface GameScreenDeps {
  save(state: GameState): void;
  toast(key: StringKey, extra?: string): void;
}

export interface GameScreen {
  setPaused(paused: boolean): void;
  getState(): GameState;
  tap(loc: Loc): void;
  drop(from: Loc, to: Loc): void;
}

export function createGameScreen(app: HTMLElement, initial: GameState, deps: GameScreenDeps): GameScreen {
  let state = initial;
  let selected: Loc | null = null;
  let sellArmed = false;

  app.innerHTML = `
    <header class="top">
      <div class="title"></div>
      <div class="money"><span class="money-label"></span> <b class="money-value"></b></div>
      <button class="btn small shop-btn"></button>
    </header>
    <section class="orders"></section>
    <button class="project-strip"></button>
    <main class="board-wrap"><div id="board"></div></main>
    <section class="storage-wrap"><span class="storage-label"></span><div id="storage"></div></section>
    <footer class="info">
      <div class="info-text"><div class="info-title"></div><div class="info-detail"></div></div>
      <div class="info-actions"><button class="btn small undo-btn"></button><button class="btn small sell-btn"></button></div>
    </footer>
    <section class="shop" hidden>
      <header class="shop-head"><h2></h2><button class="btn small back-btn"></button></header>
      <ol class="zones"></ol>
      <div class="project-card"></div>
    </section>
    <div class="modal" hidden><div class="modal-box"><h3></h3><p></p><button class="btn modal-close"></button></div></div>
    <div class="pause-overlay" hidden><span></span></div>
  `;
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
  $('.title').textContent = t('title');
  $('.money-label').textContent = t('money');
  $('.storage-label').textContent = t('storageLabel');
  $('.pause-overlay span').textContent = t('paused');
  $('.shop-head h2').textContent = t('shop');
  $('.back-btn').textContent = t('field');
  $('.modal-close').textContent = t('close');
  $('.undo-btn').textContent = t('undoSale');
  const shopBtn = $<HTMLButtonElement>('.shop-btn');
  shopBtn.textContent = t('shop');
  const shopEl = $('.shop');
  const modal = $('.modal');
  const sellBtn = $<HTMLButtonElement>('.sell-btn');
  const undoBtn = $<HTMLButtonElement>('.undo-btn');

  const view = new FieldView($('#board'), $('#storage'), {
    onTap(loc) {
      const content = getAt(state, loc);
      if (loc.area === 'board' && state.locked.includes(loc.index)) {
        view.flash(loc, 'shake');
        deps.toast('locked');
        return;
      }
      if (content?.kind === 'generator' && loc.area === 'board') {
        const r = spawnFromGenerator(state, loc.index);
        if (!r.ok) {
          view.flash(loc, 'shake');
          deps.toast('boardFull');
        } else {
          commit(r.state);
          view.flash({ area: 'board', index: r.cell }, 'pop');
        }
      }
      select(content ? loc : null);
    },
    onDrop(from, to) {
      const r = moveItem(state, from, to);
      if (!r.ok) {
        view.flash(from, 'shake');
        if (r.reason === 'locked') deps.toast('locked');
        if (r.reason === 'generator_to_storage') deps.toast('generatorToStorage');
        return;
      }
      commit(r.state);
      select(r.to);
      if (r.action === 'merge') view.flash(r.to, 'pop');
    },
  });

  shopBtn.onclick = () => openShop(true);
  $('.project-strip').onclick = () => openShop(true);
  $('.back-btn').onclick = () => openShop(false);
  $('.modal-close').onclick = () => (modal.hidden = true);

  sellBtn.onclick = () => {
    if (!selected) return;
    const content = getAt(state, selected);
    if (content?.kind !== 'item') return;
    if (!getItem(content.itemId).nextId && !sellArmed) {
      sellArmed = true;
      renderInfo();
      return;
    }
    const r = sellItem(state, selected);
    if (!r.ok) return;
    commit(r.state);
    deps.toast('sold', `+${r.price}`);
    select(null);
  };

  undoBtn.onclick = () => {
    const r = undoSale(state);
    if (!r.ok) return;
    commit(r.state);
    select(r.loc);
    view.flash(r.loc, 'pop');
  };

  function commit(next: GameState): void {
    state = next;
    deps.save(state);
    render();
  }

  function select(loc: Loc | null): void {
    selected = loc;
    sellArmed = false;
    view.setSelected(loc);
    renderInfo();
  }

  function renderInfo(): void {
    const content = selected ? getAt(state, selected) : null;
    const info = describeContent(content);
    $('.info-title').textContent = info?.title ?? '';
    let detail = info?.detail ?? t('hintIdle');
    if (content?.kind === 'item') {
      const users = [...availableOrders(state).filter((o) => o.requires.some((r) => r.itemId === content.itemId)).map((o) => o.id)];
      const project = currentProject(state);
      if (project?.requires.some((r) => r.itemId === content.itemId)) users.push(project.id);
      if (users.length) detail += ` · ${t('neededFor')}: ${users.join(', ')}`;
    }
    $('.info-detail').textContent = detail;
    const sellable = content?.kind === 'item';
    sellBtn.hidden = !sellable;
    if (sellable) sellBtn.textContent = sellArmed ? t('sellConfirm') : `${t('sell')} +${getItem(content.itemId).sellPrice}`;
    sellBtn.classList.toggle('danger', sellArmed);
    undoBtn.hidden = !state.lastSale;
  }

  function requirementChips(reqs: Requirement[]): HTMLElement {
    const box = document.createElement('div');
    box.className = 'reqs';
    for (const req of reqs) {
      const chip = renderItemChip(req.itemId);
      const have = countItem(state, req.itemId);
      chip.classList.toggle('have', have >= req.count);
      if (req.count > 1) chip.append(` ×${req.count}`);
      box.appendChild(chip);
    }
    return box;
  }

  function renderOrders(): void {
    const box = $('.orders');
    box.replaceChildren();
    const orders = availableOrders(state);
    if (!orders.length) {
      const p = document.createElement('p');
      p.className = 'placeholder';
      p.textContent = t('noOrders');
      box.appendChild(p);
    }
    for (const order of orders) {
      const ready = canDeliver(state, order);
      const card = document.createElement('div');
      card.className = 'order';
      card.classList.toggle('ready', ready);
      const head = document.createElement('div');
      head.className = 'order-head';
      head.textContent = `${tx(VISITORS[order.visitor].name)} · ${order.id}`;
      const text = document.createElement('div');
      text.className = 'order-text';
      text.textContent = tx(order.text);
      const btn = document.createElement('button');
      btn.className = 'btn small';
      btn.textContent = `${t('deliver')} +${order.reward}`;
      btn.disabled = !ready;
      btn.onclick = () => {
        const r = deliverOrder(state, order.id);
        if (!r.ok) {
          deps.toast('missingItems');
          return;
        }
        commit(r.state);
        deps.toast('delivered', `+${r.reward}`);
        select(null);
      };
      card.append(head, text, requirementChips(order.requires), btn);
      box.appendChild(card);
    }
  }

  function renderProjectStrip(): void {
    const strip = $('.project-strip');
    const project = currentProject(state);
    strip.hidden = !project;
    if (!project) return;
    const ready = canCompleteProject(state, project);
    strip.classList.toggle('ready', ready);
    strip.textContent = `${t('project')} ${project.id}: ${tx(project.name)} — ${ready ? t('projectReady') : `${t('money')}: ${state.money}/${project.cost}`}`;
  }

  function renderShop(): void {
    const zones = $('.zones');
    zones.replaceChildren();
    const current = currentProject(state);
    for (const p of PROJECTS.filter((p) => p.id <= SLICE.lastProject)) {
      const li = document.createElement('li');
      const done = state.completedProjects.includes(p.id);
      li.className = done ? 'zone done' : p.id === current?.id ? 'zone current' : 'zone';
      const status = done ? `✓ ${tx(p.result)}` : p.id === current?.id ? t('project') : t('notYet');
      li.innerHTML = '<b></b><span></span>';
      li.querySelector('b')!.textContent = `${p.id} · ${tx(p.name)}`;
      li.querySelector('span')!.textContent = status;
      zones.appendChild(li);
    }
    const card = $('.project-card');
    card.replaceChildren();
    if (!current) {
      const p = document.createElement('p');
      p.textContent = t('sliceDone');
      card.appendChild(p);
      return;
    }
    const title = document.createElement('h3');
    title.textContent = `${current.id} · ${tx(current.name)}`;
    const cost = document.createElement('p');
    cost.className = state.money >= current.cost ? 'cost ok' : 'cost';
    cost.textContent = `${t('money')}: ${state.money} / ${current.cost}`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = t('restore');
    btn.disabled = !canCompleteProject(state, current);
    btn.onclick = () => finishProject(current);
    card.append(title, requirementChips(current.requires), cost, btn);
  }

  function finishProject(project: ProjectDef): void {
    const r = completeProject(state, project.id);
    if (!r.ok) {
      deps.toast(r.reason === 'no_money' ? 'noMoney' : 'missingItems');
      return;
    }
    commit(r.state);
    select(null);
    $('.modal h3').textContent = `${t('restored')}: ${tx(project.name)}`;
    $('.modal p').textContent = currentProject(state) ? tx(project.result) : `${tx(project.result)}. ${t('sliceDone')}`;
    modal.hidden = false;
  }

  function openShop(open: boolean): void {
    shopEl.hidden = !open;
    if (open) renderShop();
  }

  function render(): void {
    $('.money-value').textContent = String(state.money);
    const wanted = new Set<string>();
    for (const o of availableOrders(state)) for (const r of o.requires) wanted.add(r.itemId);
    for (const r of currentProject(state)?.requires ?? []) wanted.add(r.itemId);
    view.setWanted(wanted);
    view.render(state);
    renderOrders();
    renderProjectStrip();
    renderInfo();
    if (!shopEl.hidden) renderShop();
  }

  render();

  return {
    setPaused(paused) {
      view.setEnabled(!paused);
      $('.pause-overlay').hidden = !paused;
    },
    getState: () => state,
    tap: (loc) => view['handlers'].onTap(loc),
    drop: (from, to) => view['handlers'].onDrop(from, to),
  };
}
