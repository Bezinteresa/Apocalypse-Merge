import './style.css';
import { describeContent, BoardView } from './ui/boardView';
import { moveContent, spawnFromGenerator } from './game/rules';
import type { GameState } from './game/state';
import { normalizeLanguage, setLanguage, t, type StringKey } from './i18n';
import { bridge, initPlatform, isLocalDev, platformId, platformLanguage, sendGameReady, setGameplayActive } from './platform/platform';
import { isPaused, onLifecycleChange, startLifecycle } from './platform/lifecycle';
import { SaveStore, type StorageBackend } from './platform/saveStore';

const app = document.getElementById('app')!;
const loader = document.getElementById('loader')!;

const storageBackend: StorageBackend = {
  get: async (keys) => (await bridge.storage.get(keys)) as unknown[],
  set: (keys, values) => bridge.storage.set(keys, values),
};

function showFatal(messageKey: StringKey, retry: () => void): void {
  loader.replaceChildren();
  const p = document.createElement('p');
  p.textContent = t(messageKey);
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = t('retry');
  btn.onclick = () => {
    loader.replaceChildren(document.createTextNode(t('loading')));
    retry();
  };
  loader.append(p, btn);
  loader.hidden = false;
}

async function boot(): Promise<void> {
  try {
    await initPlatform();
  } catch (e) {
    console.error('Bridge initialize failed', e);
    showFatal('initError', () => void boot());
    return;
  }

  setLanguage(normalizeLanguage(platformLanguage()));
  document.title = t('title');
  loader.textContent = t('loading');
  startLifecycle();

  const store = new SaveStore(storageBackend);
  let loaded;
  try {
    loaded = await store.load();
  } catch (e) {
    console.error('Save load failed', e);
    showFatal('loadError', () => void boot());
    return;
  }

  startGame(loaded.state, store);
  if (loaded.recovered) showToast(loaded.source === 'prev' ? 'recovered' : 'resetRecovered');

  loader.hidden = true;
  // Game Ready — после того как поле отрисовано и принимает ввод.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      sendGameReady();
      setGameplayActive(!isPaused());
    }),
  );
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function showToast(key: StringKey): void {
  const toast = document.getElementById('toast')!;
  toast.textContent = t(key);
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

function startGame(initial: GameState, store: SaveStore): void {
  let state = initial;
  let selected: number | null = null;

  app.innerHTML = `
    <header class="top">
      <div class="title"></div>
      <div class="money"><span class="money-label"></span> <b class="money-value"></b></div>
    </header>
    <section class="orders"><p class="placeholder"></p></section>
    <main class="board-wrap"><div id="board"></div></main>
    <footer class="info"><div class="info-title"></div><div class="info-detail"></div></footer>
    <div class="pause-overlay" hidden><span></span></div>
  `;
  app.querySelector('.title')!.textContent = t('title');
  app.querySelector('.money-label')!.textContent = t('money');
  app.querySelector('.orders .placeholder')!.textContent = t('ordersSoon');
  app.querySelector('.pause-overlay span')!.textContent = t('paused');
  const moneyEl = app.querySelector('.money-value')!;
  const infoTitle = app.querySelector('.info-title')!;
  const infoDetail = app.querySelector('.info-detail')!;
  const pauseOverlay = app.querySelector<HTMLElement>('.pause-overlay')!;

  const view = new BoardView(document.getElementById('board')!, {
    onTap(cell) {
      const content = state.cells[cell];
      if (state.locked.includes(cell)) {
        view.flash(cell, 'shake');
        showToast('locked');
        return;
      }
      if (content?.kind === 'generator') {
        const r = spawnFromGenerator(state, cell);
        if (!r.ok) {
          view.flash(cell, 'shake');
          showToast('boardFull');
        } else {
          commit(r.state);
          view.flash(r.cell, 'pop');
        }
      }
      select(content ? cell : null);
    },
    onDrop(from, to) {
      const r = moveContent(state, from, to);
      if (!r.ok) {
        view.flash(from, 'shake');
        if (r.reason === 'locked') showToast('locked');
        return;
      }
      commit(r.state);
      select(r.to);
      if (r.action === 'merge') view.flash(r.to, 'pop');
    },
  });

  function commit(next: GameState): void {
    state = next;
    store.save(state);
    render();
  }

  function select(cell: number | null): void {
    selected = cell;
    view.setSelected(cell);
    renderInfo();
  }

  function renderInfo(): void {
    const info = describeContent(selected !== null ? state.cells[selected] : null);
    infoTitle.textContent = info?.title ?? '';
    infoDetail.textContent = info?.detail ?? t('hintIdle');
  }

  function render(): void {
    moneyEl.textContent = String(state.money);
    view.render(state);
    renderInfo();
  }

  onLifecycleChange(({ paused }) => {
    view.setEnabled(!paused);
    pauseOverlay.hidden = !paused;
    setGameplayActive(!paused);
    if (paused) void store.flush();
  });
  view.setEnabled(!isPaused());
  pauseOverlay.hidden = !isPaused();
  render();

  if (isLocalDev()) {
    // Отладочный доступ для автоматической проверки в браузере; в релизной сборке не используется.
    (window as unknown as { __am: unknown }).__am = {
      platform: platformId(),
      getState: () => state,
      tap: (cell: number) => view['handlers'].onTap(cell),
      drop: (from: number, to: number) => view['handlers'].onDrop(from, to),
    };
  }
}

void boot();
