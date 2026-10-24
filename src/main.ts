import './style.css';
import { normalizeLanguage, setLanguage, t, type StringKey } from './i18n';
import { bridge, initPlatform, isLocalDev, platformId, platformLanguage, sendGameReady, setGameplayActive } from './platform/platform';
import { isAudioAllowed, isPaused, onLifecycleChange, startLifecycle } from './platform/lifecycle';
import { setSoundAllowed, startSound } from './platform/sound';
import { SaveStore, type StorageBackend } from './platform/saveStore';
import { createGameScreen } from './ui/gameScreen';
import { createInitialState } from './game/state';
import { Telemetry, parseLog } from './platform/telemetry';
import { AdService, createFakeAdAdapter, type AdAdapter, type AdState } from './platform/ads';
import { setPauseReason } from './platform/lifecycle';

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

  const telemetry = new Telemetry(
    parseLog(loaded.log),
    (name, data) => bridge.analytics.send(name, data),
    () => store.touch(),
  );
  store.attachLog(() => telemetry.data);
  telemetry.setActive(!isPaused());
  telemetry.track('session_start', { returning: loaded.source !== 'new', platform: platformId() });

  const adapter: AdAdapter = {
    get isRewardedSupported() {
      return bridge.advertisement.isRewardedSupported;
    },
    get isInterstitialSupported() {
      return bridge.advertisement.isInterstitialSupported;
    },
    showRewarded: (p) => bridge.advertisement.showRewarded(p),
    showInterstitial: (p) => bridge.advertisement.showInterstitial(p),
    onRewardedState: (cb) => bridge.advertisement.on(bridge.EVENT_NAME.REWARDED_STATE_CHANGED, (s: unknown) => cb(s as AdState)),
    onInterstitialState: (cb) => bridge.advertisement.on(bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, (s: unknown) => cb(s as AdState)),
  };
  // экран создаётся ниже; награда приходит только после действия игрока на уже созданном экране
  const fakeAds = isLocalDev() ? new URLSearchParams(location.search).get('fakeads') : null;
  const ads = new AdService(fakeAds ? createFakeAdAdapter(fakeAds === 'cancel' ? 'cancel' : 'ok') : adapter, (active) => setPauseReason('ad', active), () => screen.grantAdReward());

  const screen = createGameScreen(app, loaded.state, {
    save: (s, critical) => {
      store.save(s);
      if (critical) void store.flush();
    },
    toast: showToast,
    debug: isLocalDev(),
    telemetry,
    ads,
    async resetProgress() {
      // сброс не обнуляет лимит наград за рекламу и настройку звука
      const fresh = { ...createInitialState(), adRewards: screen.getState().adRewards, soundOn: screen.getState().soundOn };
      telemetry.reset();
      store.save(fresh);
      await store.flush();
      location.reload();
    },
  });
  screen.setPaused(isPaused());
  startSound();
  setSoundAllowed(isAudioAllowed());
  onLifecycleChange(({ paused, audioAllowed }) => {
    // звук молчит при рекламе, в фоне, на паузе и при запрете площадки
    setSoundAllowed(audioAllowed);
    telemetry.setActive(!paused);
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
