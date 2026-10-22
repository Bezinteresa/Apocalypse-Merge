import './style.css';
import { normalizeLanguage, setLanguage, t, type StringKey } from './i18n';
import { bridge, initPlatform, isLocalDev, platformId, platformLanguage, sendGameReady, setGameplayActive } from './platform/platform';
import { isPaused, onLifecycleChange, startLifecycle } from './platform/lifecycle';
import { SaveStore, type StorageBackend } from './platform/saveStore';
import { createGameScreen } from './ui/gameScreen';

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

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function showToast(key: StringKey, extra?: string): void {
  const toast = document.getElementById('toast')!;
  toast.textContent = extra ? `${t(key)} ${extra}` : t(key);
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
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

  const screen = createGameScreen(app, loaded.state, { save: (s) => store.save(s), toast: showToast });
  screen.setPaused(isPaused());
  onLifecycleChange(({ paused }) => {
    screen.setPaused(paused);
    setGameplayActive(!paused);
    if (paused) void store.flush();
  });
  if (loaded.recovered) showToast(loaded.source === 'prev' ? 'recovered' : 'resetRecovered');

  if (isLocalDev()) {
    // Отладочный доступ для автоматической проверки в браузере; на площадке не подключается.
    (window as unknown as { __am: unknown }).__am = { platform: platformId(), ...screen };
  }

  loader.hidden = true;
  // Game Ready — после того как поле отрисовано и принимает ввод.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      sendGameReady();
      setGameplayActive(!isPaused());
    }),
  );
}

void boot();
