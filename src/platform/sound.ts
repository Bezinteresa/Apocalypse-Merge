// Простые звуки действий, синтезированные через Web Audio — без файлов, архив не растёт.
// Звучат, только когда их разрешили и игрок (настройка), и площадка с контроллером паузы
// (реклама, фоновая вкладка, запрет звука платформой). Контекст создаётся после первого касания:
// браузеры не дают запускать звук без действия игрока.

export type SoundName = 'tap' | 'spawn' | 'merge' | 'error' | 'coins' | 'repair' | 'poof' | 'chest' | 'card';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let userEnabled = true;
let platformAllowed = true;

function audible(): boolean {
  return userEnabled && platformAllowed;
}

function sync(): void {
  if (!ctx) return;
  if (audible()) void ctx.resume().catch(() => undefined);
  else void ctx.suspend().catch(() => undefined);
}

function ensureContext(): void {
  if (ctx) return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    sync();
  } catch {
    ctx = null;
  }
}

/** Подписка один раз за запуск: контекст создаётся на первом касании. */
export function startSound(): void {
  const unlock = () => {
    ensureContext();
    if (ctx) {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    }
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

/** Настройка игрока «Звук» (хранится в сохранении). */
export function setSoundEnabled(enabled: boolean): void {
  if (userEnabled === enabled) return;
  userEnabled = enabled;
  sync();
}

/** Разрешение от площадки и контроллера паузы: реклама, фон, запрет звука. */
export function setSoundAllowed(allowed: boolean): void {
  if (platformAllowed === allowed) return;
  platformAllowed = allowed;
  sync();
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; to?: number; at?: number } = {}): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + (opts.at ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
  const vol = opts.vol ?? 0.15;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, opts: { from?: number; to?: number; vol?: number; at?: number } = {}): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + (opts.at ?? 0);
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(opts.from ?? 1500, t0);
  filter.frequency.exponentialRampToValueAtTime(opts.to ?? 300, t0 + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(opts.vol ?? 0.2, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
}

/** Звук действия; level — уровень получившегося предмета (выше уровень — выше звук). */
export function playSound(name: SoundName, level = 1): void {
  if (!audible()) return;
  ensureContext();
  if (!ctx || ctx.state !== 'running') return;
  switch (name) {
    case 'tap':
      tone(880, 0.05, { type: 'triangle', vol: 0.06 });
      break;
    case 'spawn':
      tone(440, 0.12, { type: 'triangle', to: 760, vol: 0.12 });
      break;
    case 'merge': {
      const base = 520 * Math.pow(1.09, Math.min(level, 8));
      tone(base, 0.12, { type: 'sine', vol: 0.16 });
      tone(base * 1.5, 0.18, { type: 'sine', vol: 0.12, at: 0.07 });
      break;
    }
    case 'error':
      tone(190, 0.16, { type: 'sawtooth', to: 130, vol: 0.06 });
      break;
    case 'coins':
      [988, 1319, 1568].forEach((f, i) => tone(f, 0.09, { type: 'sine', vol: 0.1, at: i * 0.06 }));
      break;
    case 'repair':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.13, at: i * 0.09 }));
      break;
    case 'poof':
      noise(0.35, { from: 1800, to: 250, vol: 0.22 });
      break;
    case 'chest':
      noise(0.2, { from: 900, to: 200, vol: 0.18 });
      tone(392, 0.35, { type: 'triangle', to: 784, vol: 0.12, at: 0.12 });
      break;
    case 'card':
      tone(1175, 0.07, { type: 'sine', vol: 0.09 });
      tone(1568, 0.09, { type: 'sine', vol: 0.07, at: 0.05 });
      break;
  }
}
