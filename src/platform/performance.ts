// Замер плавности для телеметрии Playgama (контракт `performance_sample` из руководства площадки):
// кадры считаются только во время видимой активной игры, раз в ~30 с активного времени уходит
// одна сводка окна. Пауза, фон и реклама в замер не попадают, а разрыв после паузы не считается кадром.

export interface PerformanceSample {
  target_fps: number;
  window_ms: number;
  active_ms: number;
  frame_count: number;
  fps_avg: number;
  fps_p10: number;
  frame_time_p50_ms: number;
  frame_time_p95_ms: number;
  frame_time_p99_ms: number;
  frame_time_max_ms: number;
  frames_over_50ms: number;
  frames_over_100ms: number;
  frames_over_250ms: number;
  frames_over_500ms: number;
  frames_over_1000ms: number;
  game_version: string;
  js_error_count: number;
}

const TARGET_FPS = 60;
const WINDOW_ACTIVE_MS = 30_000;

const round = (v: number) => Math.round(v * 10) / 10;

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

/** Сводка окна по длительностям кадров; чистая функция — проверяется тестом. */
export function summarizeFrames(frames: number[], windowMs: number, version: string, jsErrors: number): PerformanceSample {
  const sorted = [...frames].sort((a, b) => a - b);
  const active = frames.reduce((a, b) => a + b, 0);
  const fpsSorted = sorted.map((f) => 1000 / f).sort((a, b) => a - b);
  const over = (ms: number) => frames.filter((f) => f > ms).length;
  return {
    target_fps: TARGET_FPS,
    window_ms: Math.round(windowMs),
    active_ms: Math.round(active),
    frame_count: frames.length,
    fps_avg: round(active > 0 ? (frames.length * 1000) / active : 0),
    fps_p10: round(percentile(fpsSorted, 10)),
    frame_time_p50_ms: round(percentile(sorted, 50)),
    frame_time_p95_ms: round(percentile(sorted, 95)),
    frame_time_p99_ms: round(percentile(sorted, 99)),
    frame_time_max_ms: round(sorted[sorted.length - 1] ?? 0),
    frames_over_50ms: over(50),
    frames_over_100ms: over(100),
    frames_over_250ms: over(250),
    frames_over_500ms: over(500),
    frames_over_1000ms: over(1000),
    game_version: version,
    js_error_count: jsErrors,
  };
}

/** Запуск замера; `send` — тот же адаптер аналитики, что у остальных событий. */
export function startPerformanceSampling(send: (sample: PerformanceSample) => void, version: string): { setActive(active: boolean): void; last(): PerformanceSample | null } {
  let active = true;
  let last: number | null = null;
  let frames: number[] = [];
  let activeMs = 0;
  let windowStart = performance.now();
  let jsErrors = 0;
  let lastSample: PerformanceSample | null = null;
  window.addEventListener('error', () => jsErrors++);
  window.addEventListener('unhandledrejection', () => jsErrors++);

  const tick = (now: number) => {
    if (active && document.visibilityState === 'visible') {
      if (last !== null) {
        const dt = now - last;
        frames.push(dt);
        activeMs += dt;
      }
      last = now;
      if (activeMs >= WINDOW_ACTIVE_MS && frames.length) {
        lastSample = summarizeFrames(frames, now - windowStart, version, jsErrors);
        try {
          send(lastSample);
        } catch {
          /* аналитика не должна ломать игру */
        }
        frames = [];
        activeMs = 0;
        jsErrors = 0;
        windowStart = now;
      }
    } else {
      // пауза или фон: следующий кадр начнёт отсчёт заново, разрыв не станет «зависшим» кадром
      last = null;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    setActive(value: boolean) {
      active = value;
      if (!value) last = null;
    },
    /** Последняя отправленная сводка — для отладки на localhost. */
    last: () => lastSample,
  };
}
