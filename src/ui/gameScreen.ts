import { CHAINS, GENERATORS, GENERATOR_ACTIVE_LEVEL, GENERATOR_MAX_LEVEL, ITEMS, generatorDrops, generatorLevelName, getItem, parseGeneratorToken } from '../content/items';
import { CHAPTERS, PROJECTS, VISITORS, chapterEndedBy, type ProjectDef, type Requirement } from '../content/orders';
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
  findSources,
  ingredientCells,
  isChapterComplete,
  areAllOrdersDone,
  moveItem,
  placeIncoming,
  sellItem,
  spawnFromGenerator,
  undoSale,
  whereToGet,
} from '../game/rules';
import { ENERGY_CAP, addEnergy, msToNextEnergy, regenerate, setUnlimited } from '../game/energy';
import type { GameState, Loc } from '../game/state';
import { currentTutorialStep, markDialogSeen, pendingDialog } from '../game/tutorial';
import type { DialogDef } from '../content/dialogs';
import { FieldView, describeContent, renderContentIcon, renderItemChip } from './fieldView';
import type { Telemetry } from '../platform/telemetry';
import type { AdService } from '../platform/ads';
import { AD_REWARD_ENERGY, AD_REWARD_LIMIT, adCooldownLeft, adRewardsAt, canShowInterstitial, canWatchRewardAd, grantAdReward } from '../game/ads';
import { createAlbum } from './albumView';
import { Finger } from './finger';
import { currentHint, markFlag } from '../game/hints';
import { BUILDING_SPRITE, hasSprite, portraitSprite, spriteImg, spriteUrl, uiSprite } from './sprites';
import { POOF_MS, playPoof, renderShopScene } from './shopScene';
import { VISITOR_COLOR } from '../content/shopLayout';
import { CHESTS } from '../content/collections';

// Экран игры: поле, склад, заказы, информация о предмете и сцена магазина.
// Все изменения состояния идут через правила; после принятия состояние сразу сохраняется.

export interface GameScreenDeps {
  /** critical — записать сразу, без объединения по времени (сдача заказа, ремонт). */
  save(state: GameState, critical?: boolean): void;
  toast(key: StringKey, extra?: string): void;
  /** Отладочная панель (энергия без лимита, пополнение). Только локальная разработка. */
  debug: boolean;
  telemetry: Telemetry;
  ads: AdService;
  /** Отладка: начать игру заново (сохранение и журнал теста); лимит наград за рекламу не сбрасывается. */
  resetProgress(): Promise<void>;
}

export interface GameScreen {
  setPaused(paused: boolean): void;
  /** Площадка подтвердила просмотр rewarded: выдать награду и сохранить сразу. */
  grantAdReward(): void;
  getState(): GameState;
  tap(loc: Loc): void;
  drop(from: Loc, to: Loc): void;
}

export function createGameScreen(app: HTMLElement, initial: GameState, deps: GameScreenDeps): GameScreen {
  let state = initial;
  let selected: Loc | null = null;
  // фон экрана поля — размытая сцена магазина; адрес абсолютный, чтобы url() из переменной не считался от папки стилей
  if (hasSprite(BUILDING_SPRITE)) document.documentElement.style.setProperty('--field-bg-img', `url("${new URL(spriteUrl(BUILDING_SPRITE), location.href).href}")`);
  let sellArmed = false;

  app.innerHTML = `
    <header class="top">
      <div class="title"></div>
      <div class="money"><span class="money-label"></span> <b class="money-value"></b></div>
      <div class="energy"><span>⚡</span> <b class="energy-value"></b> <small class="energy-timer"></small></div>
      <button class="btn small ghost debug-btn" hidden>DBG</button>
      <button class="btn small album-btn"></button>
      <button class="btn small shop-btn"></button>
    </header>
    <section class="orders"></section>
    <button class="project-strip"></button>
    <main class="board-wrap"><div id="board"></div></main>
    <section class="storage-wrap"><button class="btn small incoming-btn" hidden></button></section>
    <footer class="info">
      <div class="storage-sheet" hidden><span class="storage-label"></span><div id="storage"></div></div>
      <div class="info-icon-slot"></div>
      <button class="info-btn where-btn" hidden>i</button>
      <div class="info-text"><div class="info-title"></div><div class="info-detail"></div></div>
      <div class="info-actions"><button class="btn small undo-btn"></button><button class="btn small sell-btn"></button></div>
      <button class="storage-btn" type="button"><span class="storage-icon">📦</span><small class="storage-count"></small></button>
    </footer>
    <section class="shop" hidden>
      <header class="shop-head"><h2></h2><button class="btn small back-btn"></button></header>
      <div class="scene-wrap">
        <div class="scene-scroll"><div class="scene"></div></div>
        <div class="chapter-progress"><span class="chapter-label"></span><div class="chapter-bar"><i></i></div></div>
        <div class="project-card"></div>
      </div>
    </section>
    <section class="shop album" hidden>
      <header class="shop-head"><h2></h2><button class="btn small back-btn album-back"></button></header>
      <div class="album-body"></div>
    </section>
    <div class="dialog" hidden><div class="dialog-box">
      <div class="dialog-avatar"><img class="dialog-portrait" alt="" hidden><span class="dialog-initial"></span></div>
      <div class="dialog-main"><div class="dialog-speaker"></div><p class="dialog-text"></p>
      <div class="dialog-actions"><button class="btn small ghost dialog-skip"></button><button class="btn small dialog-next"></button></div></div>
    </div></div>
    <div class="modal" hidden><div class="modal-box"><h3></h3><p></p><button class="btn modal-close"></button></div></div>
    <div class="modal chain-modal" hidden><div class="modal-box chain-box">
      <header class="chain-head"><h3></h3><button class="btn small ghost chain-close">✕</button></header>
      <div class="chain-levels"></div><p class="chain-source"></p><button class="btn chain-show" hidden></button>
    </div></div>
    <div class="modal energy-modal" hidden><div class="modal-box">
      <h3></h3><p class="energy-info"></p>
      <button class="btn energy-ad"></button>
      <p class="energy-ad-note"></p>
      <button class="btn small ghost energy-close"></button>
    </div></div>
    <div class="modal debug-modal" hidden><div class="modal-box">
      <h3>Debug</h3>
      <label class="debug-row"><input type="checkbox" class="debug-unlimited"> <span></span></label>
      <button class="btn small debug-refill">+100 ⚡</button>
      <button class="btn small debug-chests">+3 🎁</button>
      <button class="btn small danger debug-reset"></button>
      <pre class="debug-summary"></pre>
      <button class="btn small debug-export"></button>
      <button class="btn small ghost debug-close">✕</button>
    </div></div>
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
  const dialogEl = $('.dialog');
  $('.dialog-skip').textContent = t('skip');
  $('.dialog-next').textContent = t('next');
  let dialog: { def: DialogDef; line: number } | null = null;
  const undoBtn = $<HTMLButtonElement>('.undo-btn');
  const whereBtn = $<HTMLButtonElement>('.where-btn');
  whereBtn.title = t('whereToGet');
  whereBtn.setAttribute('aria-label', t('whereToGet'));
  const chainModal = $('.chain-modal');
  $('.chain-show').textContent = t('showOnBoard');
  $('.energy').title = t('energy');
  // иконки валют из графики заменяют значки-символы
  for (const [sel, name] of [['.energy > span', 'energy'], ['.money', 'coin']] as const) {
    const icon = spriteImg(uiSprite(name), 'ui-icon');
    if (!icon) continue;
    const host = $(sel);
    if (sel === '.money') {
      host.classList.add('has-icon');
      host.prepend(icon);
    } else {
      host.replaceChildren(icon);
    }
  }
  let hintTimer: ReturnType<typeof setTimeout> | undefined;
  /** Идёт эффект восстановления: окна и подсказки ждут его окончания. */
  let effectPlaying = false;
  const tel = deps.telemetry;
  const ads = deps.ads;
  const sessionStart = Date.now();
  let lastInterstitialAt: number | null = null;
  let interstitialAfterModal = false;
  const energyModal = $('.energy-modal');
  $('.energy-modal h3').textContent = t('energyTitle');
  $('.energy-close').textContent = t('close');
  $('.energy-close').onclick = () => (energyModal.hidden = true);
  $('.energy').onclick = () => openEnergy();
  $('.energy-ad').onclick = () => {
    if (ads.busy || !canWatchRewardAd(state, Date.now())) return;
    energyModal.hidden = true;
    void ads.showRewarded('energy_bonus').then((outcome) => {
      if (outcome === 'not_rewarded') deps.toast('adNoReward');
      if (outcome === 'unavailable') deps.toast('adUnavailable');
    });
  };
  const albumEl = $('.album');
  const albumBtn = $<HTMLButtonElement>('.album-btn');
  $('.album .shop-head h2').textContent = t('album');
  $('.album-back').textContent = t('field');
  const album = createAlbum($('.album-body'), {
    getState: () => state,
    commit: (next, critical) => commit(next, critical),
    toast: (key, extra) => deps.toast(key, extra),
    showModal: (title, text) => {
      $('.modal h3').textContent = title;
      $('.modal p').textContent = text;
      modal.hidden = false;
    },
    track: (name, data) => tel.track(name, data),
  });
  albumBtn.onclick = () => {
    album.render();
    albumEl.hidden = false;
    albumEl.classList.add('enter');
  };
  $('.album-back').onclick = () => (albumEl.hidden = true);

  const view = new FieldView($('#board'), $('#storage'), {
    onTap(loc) {
      const content = getAt(state, loc);
      if (loc.area === 'board' && state.fog[loc.index] === 'box') {
        view.flash(loc, 'shake');
        deps.toast('boxHint');
        return;
      }
      if (content?.kind === 'generator' && loc.area === 'board') {
        const r = spawnFromGenerator(state, loc.index);
        if (!r.ok) {
          view.flash(loc, 'shake');
          tel.refused(r.reason);
          if (r.reason === 'inactive') {
            deps.toast('generatorInactive');
          } else if (r.reason === 'no_energy') {
            const ms = msToNextEnergy(state, Date.now());
            deps.toast('noEnergy', ms !== null ? `+1 ⚡ ${formatMs(ms)}` : '');
            if (ads.isRewardedSupported && canWatchRewardAd(state, Date.now())) openEnergy();
          } else {
            deps.toast('boardFull');
          }
        } else {
          tel.spawned(content.generatorId);
          commit(r.state);
          view.effect('spawn', { area: 'board', index: r.cell }, loc);
        }
      }
      select(content ? loc : null);
    },
    onStorageFull() {
      deps.toast(state.storage.length ? 'storageFull' : 'storageLocked');
    },
    onDrop(from, to) {
      const r = moveItem(state, from, to);
      if (!r.ok) {
        view.flash(from, 'shake');
        if (r.reason === 'locked') deps.toast(to.area === 'board' && state.fog[to.index] === 'web' ? 'webHint' : 'locked');
        if (r.reason === 'generator_to_storage') deps.toast('generatorToStorage');
        return false;
      }
      const source = getAt(state, from);
      const target = getAt(state, to);
      commit(r.state);
      select(r.to);
      if (r.action === 'merge') {
        view.effect('merge', r.to);
        if (r.freed) {
          view.effect('freed', r.to);
          deps.toast('cellFreed');
        }
        tel.once('first_merge', 'first_merge', { item: r.itemId ?? '' });
      }
      // одинаковые предметы максимального уровня меняются местами — объясняем, почему без объединения
      if (r.action === 'swap' && source?.kind === 'item' && target?.kind === 'item' && source.itemId === target.itemId) deps.toast('maxLevelNoMerge');
      return true;
    },
  });

  // склад — отдельной кнопкой внизу, как в «Отеле Мечты»: нажатие открывает панель с местами,
  // на кнопку можно перетащить предмет; до ремонта склада R04 он закрыт
  const storageBtn = $<HTMLButtonElement>('.storage-btn');
  const storageSheet = $('.storage-sheet');
  view.storageButton = storageBtn;
  storageBtn.onclick = () => {
    if (!state.storage.length) {
      deps.toast('storageLocked');
      return;
    }
    storageSheet.hidden = !storageSheet.hidden;
    storageBtn.classList.toggle('open', !storageSheet.hidden);
  };

  shopBtn.onclick = () => openShop(true);
  $('.project-strip').onclick = () => {
    if (currentProject(state)) openShop(true);
  };
  $('.back-btn').onclick = () => openShop(false);
  $('.modal-close').onclick = () => {
    modal.hidden = true;
    // межстраничная — только на естественной паузе после ремонта; итог уже сохранён до запроса
    const now = Date.now();
    if (interstitialAfterModal && canShowInterstitial(state, sessionStart, lastInterstitialAt, now)) {
      interstitialAfterModal = false;
      lastInterstitialAt = now;
      void ads.showInterstitial('project_completed').then(() => maybeShowDialog());
      return;
    }
    interstitialAfterModal = false;
    maybeShowDialog();
  };
  $('.incoming-btn').onclick = () => {
    const r = placeIncoming(state);
    if (!r.ok) {
      deps.toast('boardFull');
      return;
    }
    commit(r.state);
    view.flash({ area: 'board', index: r.cell }, 'pop');
  };
  whereBtn.onclick = () => {
    const content = selected ? getAt(state, selected) : null;
    if (content?.kind === 'item') openChain(content.itemId);
    if (content?.kind === 'generator') openGeneratorInfo(content.generatorId, content.level);
  };
  $('.chain-close').onclick = () => (chainModal.hidden = true);
  chainModal.onclick = (e) => {
    if (e.target === chainModal) chainModal.hidden = true;
  };
  if (deps.debug) {
    const dbgModal = $('.debug-modal');
    const dbgBtn = $('.debug-btn');
    dbgBtn.hidden = false;
    $('.debug-row span').textContent = t('energyUnlimited');
    $('.debug-export').textContent = t('exportLog');
    const resetBtn = $<HTMLButtonElement>('.debug-reset');
    let resetArmed = false;
    dbgBtn.onclick = () => {
      resetArmed = false;
      resetBtn.textContent = t('resetProgress');
      $<HTMLInputElement>('.debug-unlimited').checked = state.energyUnlimited;
      const d = tel.data;
      $('.debug-summary').textContent = [
        `active: ${Math.round(d.activeMs / 60000)} min`,
        `spawns: ${d.spawnsTotal} ${JSON.stringify(d.spawnsByGenerator)}`,
        `refusals: ${JSON.stringify(d.refusals)}`,
        `sales: ${d.sales}, undos: ${d.undos}`,
        `events: ${d.events.length}`,
      ].join('\n');
      dbgModal.hidden = false;
    };
    $('.debug-export').onclick = () => {
      const blob = new Blob([JSON.stringify({ log: tel.data, state }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `apocalypse-merge-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    $('.debug-close').onclick = () => (dbgModal.hidden = true);
    $<HTMLInputElement>('.debug-unlimited').onchange = (e) => commit(setUnlimited(state, (e.target as HTMLInputElement).checked));
    $('.debug-refill').onclick = () => commit(addEnergy(regenerate(state, Date.now()), 100));
    resetBtn.textContent = t('resetProgress');
    // двойное нажатие: первое просит подтверждения
    resetBtn.onclick = () => {
      if (!resetArmed) {
        resetArmed = true;
        resetBtn.textContent = t('resetConfirm');
        return;
      }
      resetBtn.disabled = true;
      void deps.resetProgress();
    };
    $('.debug-chests').onclick = () => commit({ ...state, chests: [...state.chests, 'CH_WORN', 'CH_TRADER', 'CH_ARCHIVE'] });
  }
  $('.dialog-next').onclick = () => advanceDialog();
  $('.dialog-text').onclick = () => advanceDialog();
  $('.dialog-skip').onclick = () => closeDialog();

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
    tel.sold(content.itemId);
    commit(r.state);
    deps.toast('sold', `+${r.price}`);
    select(null);
  };

  undoBtn.onclick = () => {
    const r = undoSale(state);
    if (!r.ok) return;
    tel.undone(state.lastSale?.item.itemId ?? '');
    commit(r.state);
    select(r.loc);
    view.flash(r.loc, 'pop');
  };

  function commit(next: GameState, critical = false): void {
    const prevStep = currentTutorialStep(state)?.id ?? null;
    state = next;
    const step = currentTutorialStep(state)?.id ?? null;
    if (step !== prevStep) {
      if (prevStep) tel.track('tutorial_step', { step: prevStep });
      if (!step) tel.once('tutorial_completed', 'tutorial_completed');
    }
    deps.save(state, critical);
    render();
    maybeShowDialog();
  }

  function maybeShowDialog(): void {
    if (dialog || !modal.hidden || ads.busy || effectPlaying) return;
    const def = pendingDialog(state);
    if (!def) return;
    dialog = { def, line: 0 };
    renderDialog();
    dialogEl.hidden = false;
  }

  function renderDialog(): void {
    if (!dialog) return;
    const line = dialog.def.lines[dialog.line];
    $('.dialog-speaker').textContent = tx(VISITORS[line.speaker].name);
    const portrait = $<HTMLImageElement>('.dialog-portrait');
    const file = portraitSprite(line.speaker);
    portrait.hidden = !hasSprite(file);
    if (!portrait.hidden) portrait.src = spriteUrl(file);
    $('.dialog-initial').textContent = portrait.hidden ? tx(VISITORS[line.speaker].name).slice(0, 1) : '';
    $('.dialog-box').style.setProperty('--visitor', VISITOR_COLOR[line.speaker] ?? '#999');
    $('.dialog-text').textContent = tx(line.text);
    $('.dialog-next').textContent = dialog.line < dialog.def.lines.length - 1 ? t('next') : t('close');
  }

  function advanceDialog(): void {
    if (!dialog) return;
    if (dialog.line < dialog.def.lines.length - 1) {
      dialog.line += 1;
      renderDialog();
    } else {
      closeDialog();
    }
  }

  function closeDialog(): void {
    if (!dialog) return;
    const id = dialog.def.id;
    dialog = null;
    dialogEl.hidden = true;
    commit(markDialogSeen(state, id));
    maybeShowDialog();
  }

  /** Окно энергии: запас, таймер и опциональный просмотр рекламы с понятной наградой. */
  function openEnergy(): void {
    const now = Date.now();
    const shown = regenerate(state, now);
    const ms = msToNextEnergy(state, now);
    $('.energy-info').textContent = `${shown.energy}/${ENERGY_CAP}${ms !== null ? ` · +1 ⚡ ${formatMs(ms)}` : ''}. ${t('energy')}`;
    const btn = $<HTMLButtonElement>('.energy-ad');
    const note = $('.energy-ad-note');
    btn.hidden = !ads.isRewardedSupported;
    note.hidden = !ads.isRewardedSupported;
    if (ads.isRewardedSupported) {
      const left = AD_REWARD_LIMIT - adRewardsAt(state, now).used;
      const cooldown = adCooldownLeft(state, now);
      btn.textContent = `${t('watchAd')}: +${AD_REWARD_ENERGY} ⚡`;
      btn.classList.toggle('dim', left <= 0 || ads.busy);
      note.textContent = cooldown !== null ? `${t('adCooldown')} ${formatMs(cooldown)}` : `${t('adLeft')}: ${left}/${AD_REWARD_LIMIT}`;
    }
    energyModal.hidden = false;
  }

  function formatMs(ms: number): string {
    const sec = Math.ceil(ms / 1000);
    const h = Math.floor(sec / 3600);
    const mm = String(Math.floor((sec % 3600) / 60)).padStart(h ? 2 : 1, '0');
    return `${h ? `${h}:` : ''}${mm}:${String(sec % 60).padStart(2, '0')}`;
  }

  function renderEnergy(): void {
    const now = Date.now();
    const shown = regenerate(state, now);
    $('.energy-value').textContent = state.energyUnlimited ? '∞' : `${shown.energy}/${ENERGY_CAP}`;
    const ms = msToNextEnergy(state, now);
    $('.energy-timer').textContent = ms !== null ? formatMs(ms) : '';
    $('.energy').classList.toggle('empty', !state.energyUnlimited && shown.energy <= 0);
  }

  /** Окно цепочки: все уровни, нужный выделен, откуда получить и кнопка показать на поле. */
  function openChain(itemId: string): void {
    if (!state.flags.includes('chain_opened')) commit(markFlag(state, 'chain_opened'));
    const def = getItem(itemId);
    $('.chain-head h3').textContent = `${tx(CHAINS[def.chain].name)}: ${tx(def.name)}`;
    const levels = $('.chain-levels');
    levels.replaceChildren();
    for (const item of Object.values(ITEMS).filter((i) => i.chain === def.chain)) {
      const known = item.id === itemId || state.discovered.includes(item.id);
      const chip = known ? renderItemChip(item.id) : unknownChip(item.level);
      chip.classList.toggle('target', item.id === itemId);
      chip.classList.toggle('have', countItem(state, item.id) > 0);
      levels.appendChild(chip);
    }
    const src = whereToGet(state, itemId);
    const genName = tx(GENERATORS[src.generatorId].name);
    const showBtn = $<HTMLButtonElement>('.chain-show');
    let text = `${t('whereFrom')}: ${genName}`;
    if (src.status === 'incoming') text += ` — ${t('generatorWaiting').toLowerCase()}`;
    if (src.status === 'locked') text += ` — ${t('opensAfter')} ${src.unlockProject ?? ''}`;
    const prev = Object.values(ITEMS).find((i) => i.nextId === itemId);
    if (prev) text += `. ${t('mergeFrom')}: 2 × ${tx(prev.name)}`;
    $('.chain-source').textContent = text;
    showBtn.hidden = src.status !== 'on_board';
    showBtn.onclick = () => {
      chainModal.hidden = true;
      if (src.status !== 'on_board') return;
      view.setHintCells([src.cell, ...ingredientCells(state, itemId)]);
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => view.setHintCells([]), 4000);
    };
    chainModal.hidden = false;
  }

  function unknownChip(level: number): HTMLElement {
    const el = document.createElement('span');
    el.className = 'chip unknown';
    el.innerHTML = '<b></b><span>?</span>';
    el.querySelector('b')!.textContent = String(level);
    return el;
  }

  /** Окно ящика: уровни (ещё не виденные — «?») и что он создаёт на текущем уровне, с шансами. */
  function openGeneratorInfo(generatorId: string, level: number): void {
    if (!state.flags.includes('chain_opened')) commit(markFlag(state, 'chain_opened'));
    $('.chain-head h3').textContent = tx(GENERATORS[generatorId].name);
    const levels = $('.chain-levels');
    levels.replaceChildren();
    for (let l = 1; l <= GENERATOR_MAX_LEVEL; l++) {
      const known = l <= level || state.flags.includes(`gen:${generatorId}:${l}`);
      const chip = document.createElement('span');
      chip.className = known ? 'chip' : 'chip unknown';
      chip.style.setProperty('--chain', CHAINS[getItem(GENERATORS[generatorId].output).chain].color);
      chip.innerHTML = '<b></b><span></span>';
      chip.querySelector('b')!.textContent = String(l);
      chip.querySelector('span')!.textContent = known ? tx(generatorLevelName(generatorId, l)) : '?';
      chip.classList.toggle('target', l === level);
      levels.appendChild(chip);
    }
    const drops = level >= GENERATOR_ACTIVE_LEVEL ? generatorDrops(generatorId, level) : [];
    $('.chain-source').textContent = drops.length
      ? `${t('generatorCreates')}: ${drops.map((d) => `${tx(getItem(d.itemId).name)} — ${d.chance}%`).join(', ')}`
      : t('generatorWorksFrom');
    $<HTMLButtonElement>('.chain-show').hidden = true;
    chainModal.hidden = false;
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
    const icon = renderContentIcon(content);
    $('.info-icon-slot').replaceChildren(...(icon ? [icon] : []));
    $('.info-title').textContent = info?.title ?? '';
    let detail = info?.detail ?? t('hintIdle');
    if (content?.kind === 'item') {
      const users = [...availableOrders(state).filter((o) => o.requires.some((r) => r.itemId === content.itemId)).map((o) => o.id)];
      const project = currentProject(state);
      if (project?.requires.some((r) => r.itemId === content.itemId)) users.push(project.id);
      if (users.length) detail += ` · ${t('neededFor')}: ${users.join(', ')}`;
    }
    $('.info-detail').textContent = detail;
    const underWeb = selected?.area === 'board' && state.fog[selected.index] === 'web';
    if (underWeb) detail = t('webHint');
    const sellable = content?.kind === 'item' && !underWeb;
    sellBtn.hidden = !sellable;
    whereBtn.hidden = !content;
    if (sellable) sellBtn.textContent = sellArmed ? t('sellConfirm') : `${t('sell')} +${getItem(content.itemId).sellPrice}`;
    sellBtn.classList.toggle('danger', sellArmed);
    undoBtn.hidden = !state.lastSale;
  }

  function requirementChips(reqs: Requirement[]): HTMLElement {
    const box = document.createElement('div');
    box.className = 'reqs';
    for (const req of reqs) {
      const chip = renderItemChip(req.itemId);
      chip.classList.add('clickable');
      chip.onclick = () => openChain(req.itemId);
      const have = countItem(state, req.itemId);
      chip.classList.toggle('have', have >= req.count);
      if (req.count > 1) chip.append(` ×${req.count}`);
      box.appendChild(chip);
    }
    return box;
  }

  /** Названия недостающих предметов для сообщения об отказе. */
  function missingList(reqs: Requirement[]): string {
    return reqs
      .filter((req) => !findSources(state, [req]))
      .map((req) => tx(getItem(req.itemId).name))
      .join(', ');
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
      // карточка как в «Отеле Мечты»: портрет заказчика над карточкой, награда, крупные иконки предметов
      const card = document.createElement('div');
      card.className = 'order';
      card.classList.toggle('ready', ready);
      card.style.setProperty('--visitor', VISITOR_COLOR[order.visitor] ?? '#999');
      card.title = `${tx(VISITORS[order.visitor].name)}: ${tx(order.text)}`;
      const head = document.createElement('div');
      head.className = 'order-head';
      const face = spriteImg(portraitSprite(order.visitor), 'order-face');
      const avatar = document.createElement('div');
      avatar.className = 'order-avatar';
      if (face) avatar.appendChild(face);
      else avatar.textContent = tx(VISITORS[order.visitor].name).slice(0, 1);
      const name = document.createElement('span');
      name.className = 'order-name';
      name.textContent = tx(VISITORS[order.visitor].name);
      head.append(avatar, name);
      const text = document.createElement('div');
      text.className = 'order-text';
      text.textContent = tx(order.text);
      const btn = document.createElement('button');
      btn.className = 'btn small order-btn';
      btn.dataset.order = order.id;
      btn.textContent = ready ? `${t('deliver')} +${order.reward}` : `+${order.reward}`;
      // кнопка не блокируется: нажатие на неготовый заказ объясняет, чего не хватает
      btn.classList.toggle('dim', !ready);
      btn.classList.toggle('tut', currentTutorialStep(state)?.targets.some((x) => x.kind === 'order' && x.orderId === order.id) ?? false);
      btn.onclick = () => {
        const r = deliverOrder(state, order.id);
        if (!r.ok) {
          deps.toast('missingItems', missingList(order.requires));
          return;
        }
        tel.goal('order_delivered', order.id);
        const gotChest = r.state.chests.length > state.chests.length;
        commit(r.state, true);
        deps.toast('delivered', gotChest ? `+${r.reward} · ${t('chestReceived')}` : `+${r.reward}`);
        select(null);
      };
      card.append(head, text, requirementChips(order.requires), btn);
      box.appendChild(card);
    }
  }

  function renderProjectStrip(): void {
    const strip = $('.project-strip');
    const project = currentProject(state);
    const step = currentTutorialStep(state);
    strip.classList.toggle('tutorial', !!step);
    strip.classList.toggle('tut', step?.targets.some((x) => x.kind === 'project') ?? false);
    if (step) {
      strip.hidden = false;
      strip.classList.remove('ready');
      strip.textContent = `${t('tutorial')}: ${tx(step.hint)}`;
      return;
    }
    if (!project) {
      strip.hidden = !isChapterComplete(state);
      strip.classList.remove('ready');
      strip.textContent = areAllOrdersDone(state) ? t('chapterAllDone') : t('chapterDone');
      return;
    }
    strip.hidden = false;
    const ready = canCompleteProject(state, project);
    strip.classList.toggle('ready', ready);
    strip.textContent = `${project.kind === 'rubble' ? '🧹' : '🔨'} ${tx(project.name)} — ${ready ? t(project.kind === 'rubble' ? 'rubbleReady' : 'projectReady') : `💰 ${state.money}/${project.cost}`}`;
  }

  function renderShop(): void {
    renderShopScene($('.scene'), state, {
      onZone(projectId) {
        const project = PROJECTS.find((p) => p.id === projectId)!;
        if (state.completedProjects.includes(projectId)) {
          deps.toast('restored', `— ${tx(project.name)}: ${tx(project.result)}`);
        } else if (currentProject(state)?.id === projectId) {
          $('.project-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          $('.project-card').classList.remove('pop');
          void $('.project-card').offsetWidth;
          $('.project-card').classList.add('pop');
        } else {
          deps.toast('repairLater', currentProject(state) ? `${t('repairFirst')} ${currentProject(state)!.id}` : '');
        }
      },
      onVisitor() {
        // заказы сдаются на поле: реплика ведёт туда
        openShop(false);
      },
    });
    // на телефоне сцена шире экрана и прокручивается: показываем место текущей задачи
    const scroller = $('.scene-scroll');
    const spot = scroller.querySelector<HTMLElement>('.zone-spot.current');
    if (spot && scroller.scrollWidth > scroller.clientWidth) scroller.scrollLeft = spot.offsetLeft + spot.offsetWidth / 2 - scroller.clientWidth / 2;
    // как в «Отеле Мечты»: вместо списка всех ремонтов — прогресс главы и одна текущая задача
    const current = currentProject(state);
    const chapter = chapterTasks(current?.id ?? PROJECTS[PROJECTS.length - 1].id);
    const doneInChapter = chapter.tasks.filter((p) => state.completedProjects.includes(p.id)).length;
    $('.chapter-label').textContent = `${t('chapterLabel')} ${chapter.id} · ${doneInChapter}/${chapter.tasks.length}`;
    $<HTMLElement>('.chapter-bar i').style.width = `${Math.round((doneInChapter / chapter.tasks.length) * 100)}%`;
    const card = $('.project-card');
    card.replaceChildren();
    if (!current) {
      const p = document.createElement('p');
      p.textContent = areAllOrdersDone(state) ? t('chapterAllDone') : t('chapterDone');
      card.appendChild(p);
      return;
    }
    const rubble = current.kind === 'rubble';
    card.classList.toggle('rubble', rubble);
    const title = document.createElement('h3');
    title.textContent = `${rubble ? '🧹' : '🔨'} ${tx(current.name)}`;
    const btn = document.createElement('button');
    btn.className = 'btn task-btn';
    btn.innerHTML = '<span></span><b></b>';
    btn.querySelector('span')!.textContent = rubble ? t('clearRubble') : t('restore');
    // цена на кнопке: красная, пока монет не хватает
    const price = btn.querySelector('b')!;
    const coin = spriteImg(uiSprite('coin'), 'ui-icon');
    if (coin) price.append(coin, ` ${current.cost}`);
    else price.textContent = `💰 ${current.cost}`;
    price.classList.toggle('short', state.money < current.cost);
    btn.classList.toggle('dim', !canCompleteProject(state, current));
    btn.classList.toggle('tut', currentTutorialStep(state)?.targets.some((x) => x.kind === 'project') ?? false);
    btn.onclick = () => finishProject(current);
    card.append(title);
    if (current.requires.length) card.append(requirementChips(current.requires));
    if (current.requiresGenerator && !state.cells.some((c) => c?.kind === 'generator' && c.generatorId === current.requiresGenerator)) {
      const need = document.createElement('p');
      need.className = 'cost';
      need.textContent = `${t('placeFirst')}: ${tx(GENERATORS[current.requiresGenerator].name)}`;
      card.appendChild(need);
    }
    card.appendChild(btn);
  }

  /** Задачи главы, в которую входит проект: от конца прошлой главы до её последнего проекта. */
  function chapterTasks(projectId: string): { id: number; tasks: ProjectDef[] } {
    const index = PROJECTS.findIndex((p) => p.id === projectId);
    let start = 0;
    for (const c of CHAPTERS) {
      const end = PROJECTS.findIndex((p) => p.id === c.lastProject);
      if (index <= end) return { id: c.id, tasks: PROJECTS.slice(start, end + 1) };
      start = end + 1;
    }
    return { id: CHAPTERS.length, tasks: PROJECTS.slice(start) };
  }

  function finishProject(project: ProjectDef): void {
    if (effectPlaying) return;
    const r = completeProject(state, project.id);
    if (!r.ok) {
      if (r.reason === 'no_money') deps.toast('noMoney', `${state.money}/${project.cost}`);
      else if (r.reason === 'generator_missing') deps.toast('placeFirst', project.requiresGenerator ? tx(GENERATORS[project.requiresGenerator].name) : '');
      else deps.toast('missingItems', missingList(project.requires));
      return;
    }
    if (project.kind === 'rubble') {
      // расчистка — короткое действие: облачко и всплывающая строка, без окна итога и рекламы
      tel.goal('rubble_cleared', project.id);
      commit(r.state, true);
      select(null);
      playPoof($('.scene'), project.id);
      deps.toast('rubbleCleared', `— ${tx(project.name)}`);
      finger.show(currentHint(state), !currentTutorialStep(state));
      return;
    }
    // окно итога открывается до принятия состояния, чтобы сцена после ремонта шла следом за ним
    $('.modal h3').textContent = `${t('restored')}: ${tx(project.name)}`;
    const parts = [tx(project.result)];
    if (project.generatorReward) parts.push(r.placedCell !== null ? `${t('generatorPlaced')}: ${tx(GENERATORS[project.generatorReward].name)}` : `${t('generatorWaiting')}: ${tx(GENERATORS[project.generatorReward].name)}`);
    if (project.generatorUpgrade) parts.push(`${t('extraCrate')}: ${tx(GENERATORS[parseGeneratorToken(project.generatorUpgrade).generatorId].name)}`);
    if (r.state.chests.length > state.chests.length) parts.push(`${t('chestReceived')}: ${tx(CHESTS[r.state.chests[r.state.chests.length - 1]].name)}`);
    const chapter = chapterEndedBy(project.id);
    if (chapter === 1) parts.push(t('chapterEnd1'));
    if (chapter === 2) parts.push(t('chapterEnd2'));
    $('.modal p').textContent = parts.join('. ');
    interstitialAfterModal = true;
    tel.goal('project_completed', project.id);
    if (chapter) tel.track('chapter_completed', { chapter, spawns_total: tel.data.spawnsTotal, active_sec: Math.round(tel.data.activeMs / 1000) });
    // состояние принимается и сохраняется сразу; облачко «пуф» на сцене только показывает смену,
    // окно итога открывается после него, а сцена с персонажем — после окна
    effectPlaying = true;
    commit(r.state, true);
    select(null);
    const shown = !shopEl.hidden && playPoof($('.scene'), project.id);
    setTimeout(() => {
      effectPlaying = false;
      modal.hidden = false;
      finger.show(currentHint(state), !currentTutorialStep(state));
    }, shown ? POOF_MS : 0);
  }

  function openShop(open: boolean): void {
    shopEl.hidden = !open;
    // рисуем после показа: прокрутка сцены к текущей задаче считается по видимым размерам
    if (open) renderShop();
    shopEl.classList.toggle('enter', open);
  }

  function render(): void {
    $('.money-value').textContent = String(state.money);
    renderEnergy();
    const wanted = new Set<string>();
    for (const o of availableOrders(state)) for (const r of o.requires) wanted.add(r.itemId);
    for (const r of currentProject(state)?.requires ?? []) wanted.add(r.itemId);
    view.setWanted(wanted);
    const tutIds = new Set<string>();
    for (const target of currentTutorialStep(state)?.targets ?? []) {
      if (target.kind === 'generator') tutIds.add(target.generatorId);
      if (target.kind === 'item') tutIds.add(target.itemId);
    }
    view.setTutorialTargets(tutIds);
    view.render(state);
    renderOrders();
    renderProjectStrip();
    const filled = state.storage.filter((x) => x !== null).length;
    storageBtn.classList.toggle('locked', !state.storage.length);
    $('.storage-count').textContent = state.storage.length ? `${filled}/${state.storage.length}` : '🔒';
    if (!state.storage.length) storageSheet.hidden = true;
    $('#storage').style.setProperty('--slot-cols', String(state.storage.length > 6 ? 5 : 6));
    const incomingBtn = $<HTMLButtonElement>('.incoming-btn');
    incomingBtn.hidden = state.incoming.length === 0;
    if (state.incoming.length) {
      const next = parseGeneratorToken(state.incoming[0]);
      incomingBtn.textContent = `${t('incoming')}: ${tx(GENERATORS[next.generatorId].name)} · ${next.level}`;
    }
    renderInfo();
    if (!shopEl.hidden) renderShop();
    if (!albumEl.hidden) album.render();
    albumBtn.textContent = state.chests.length ? `${t('album')} · ${state.chests.length}` : t('album');
    albumBtn.classList.toggle('has-chests', state.chests.length > 0);
    // во время обучения текст шага уже в полосе над полем
    finger.show(currentHint(state), !currentTutorialStep(state));
  }

  /** Где сейчас цель подсказки: зависит от того, открыт ли магазин, альбом или окно. */
  function resolveHint(hint: ReturnType<typeof currentHint> & object) {
    const overlayOpen = effectPlaying || !!document.querySelector('.chest-open') || !modal.hidden || !dialogEl.hidden || !chainModal.hidden || !energyModal.hidden;
    if (overlayOpen) return null;
    const cell = (i: number) => app.querySelector<HTMLElement>(`#board .cell[data-index="${i}"]`);
    const target = hint.target;
    const onField = shopEl.hidden && albumEl.hidden;
    if (target.kind === 'tap') {
      const el = onField ? cell(target.cell) : null;
      return el ? { from: el } : null;
    }
    if (target.kind === 'drag') {
      if (!onField) return null;
      const from = cell(target.from);
      // подсказка про склад ведёт на кнопку склада внизу
      const to = target.to === 'storage' ? app.querySelector<HTMLElement>('.storage-btn') : cell(target.to);
      return from && to ? { from, to } : null;
    }
    const pick = (sel: string) => {
      const el = app.querySelector<HTMLElement>(sel);
      return el ? { from: el } : null;
    };
    switch (target.anchor) {
      case 'order':
        return onField ? pick(`.order .btn[data-order="${target.id}"]`) : null;
      case 'chip':
        return onField ? pick(`.order .chip[data-item="${target.id}"]`) : null;
      case 'incoming':
        return onField ? pick('.incoming-btn') : null;
      case 'project':
        if (!shopEl.hidden) return pick('.project-card .btn');
        return onField ? pick('.project-strip') : null;
      case 'chest':
        if (!albumEl.hidden) return pick('.chest-row .btn');
        return onField ? pick('.album-btn') : null;
      case 'assemble':
        if (!albumEl.hidden) return pick(`.card-tile[data-card="${target.id}"] .btn`);
        return onField ? pick('.album-btn') : null;
    }
    return null;
  }

  const finger = new Finger((hint) => resolveHint(hint));

  render();
  maybeShowDialog();
  setInterval(renderEnergy, 1000);

  return {
    setPaused(paused) {
      view.setEnabled(!paused);
      $('.pause-overlay').hidden = !paused;
    },
    grantAdReward() {
      const next = grantAdReward(regenerate(state, Date.now()), Date.now());
      if (!next) return;
      tel.track('ad_reward', { reward: 'energy', amount: AD_REWARD_ENERGY });
      commit(next, true);
      deps.toast('adRewarded', `+${AD_REWARD_ENERGY} ⚡`);
    },
    getState: () => state,
    tap: (loc) => view['handlers'].onTap(loc),
    drop: (from, to) => view['handlers'].onDrop(from, to),
  };
}
