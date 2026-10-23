// Журнал игровых событий для наблюдаемого теста (PROTOTYPE_PLAN, раздел 3).
// Без персональных данных. Вехи уходят в аналитику Bridge; подробный журнал и счётчики
// хранятся вместе с сохранением (ограниченный размер) и выгружаются из отладочной панели.

export type EventData = Record<string, string | number | boolean>;

export interface LogEntry {
  /** Секунды активной игры с первого запуска. */
  t: number;
  e: string;
  d?: EventData;
}

export interface TelemetryLog {
  version: 1;
  activeMs: number;
  spawnsTotal: number;
  spawnsByGenerator: Record<string, number>;
  /** Выдачи с момента последней сдачи заказа или ремонта: «стоимость» следующей цели. */
  spawnsSinceGoal: number;
  refusals: Record<string, number>;
  sales: number;
  undos: number;
  flags: Record<string, boolean>;
  events: LogEntry[];
}

export const MAX_EVENTS = 300;

/** События, которые отправляются в аналитику площадки; частые действия остаются только в счётчиках. */
const SENT_TO_PLATFORM = new Set([
  'session_start',
  'tutorial_step',
  'tutorial_completed',
  'first_merge',
  'order_delivered',
  'project_completed',
  'spawn_refused',
  'chapter_completed',
]);

export function emptyLog(): TelemetryLog {
  return { version: 1, activeMs: 0, spawnsTotal: 0, spawnsByGenerator: {}, spawnsSinceGoal: 0, refusals: {}, sales: 0, undos: 0, flags: {}, events: [] };
}

export function parseLog(raw: unknown): TelemetryLog {
  if (!raw || typeof raw !== 'object' || (raw as TelemetryLog).version !== 1) return emptyLog();
  const log = raw as TelemetryLog;
  return Array.isArray(log.events) && typeof log.activeMs === 'number' ? log : emptyLog();
}

export class Telemetry {
  private activeSince: number | null;

  constructor(
    private log: TelemetryLog,
    private send: (name: string, data?: EventData) => void,
    private onChange: () => void,
    private now: () => number = Date.now,
  ) {
    this.activeSince = now();
  }

  get data(): TelemetryLog {
    return { ...this.log, activeMs: this.activeMs() };
  }

  private activeMs(): number {
    return this.log.activeMs + (this.activeSince !== null ? this.now() - this.activeSince : 0);
  }

  private activeSec(): number {
    return Math.round(this.activeMs() / 1000);
  }

  /** Начать журнал заново (сброс прогресса в отладке). */
  reset(): void {
    this.log = emptyLog();
    this.activeSince = this.now();
  }

  /** Учитывать только время, когда игра видна и не на паузе. */
  setActive(active: boolean): void {
    if (active && this.activeSince === null) this.activeSince = this.now();
    if (!active && this.activeSince !== null) {
      this.log.activeMs += this.now() - this.activeSince;
      this.activeSince = null;
    }
  }

  track(name: string, data?: EventData): void {
    const entry: LogEntry = { t: this.activeSec(), e: name };
    if (data) entry.d = data;
    this.log.events.push(entry);
    if (this.log.events.length > MAX_EVENTS) this.log.events.splice(0, this.log.events.length - MAX_EVENTS);
    if (SENT_TO_PLATFORM.has(name)) {
      try {
        this.send(name, data);
      } catch (e) {
        console.warn('analytics send failed', e);
      }
    }
    this.onChange();
  }

  /** Событие, которое записывается один раз за всю игру. */
  once(flag: string, name: string, data?: EventData): void {
    if (this.log.flags[flag]) return;
    this.log.flags[flag] = true;
    this.track(name, data);
  }

  spawned(generatorId: string): void {
    this.log.spawnsTotal += 1;
    this.log.spawnsSinceGoal += 1;
    this.log.spawnsByGenerator[generatorId] = (this.log.spawnsByGenerator[generatorId] ?? 0) + 1;
  }

  refused(reason: string): void {
    this.log.refusals[reason] = (this.log.refusals[reason] ?? 0) + 1;
    this.track('spawn_refused', { reason });
  }

  sold(itemId: string): void {
    this.log.sales += 1;
    this.track('item_sold', { item: itemId });
  }

  undone(itemId: string): void {
    this.log.undos += 1;
    this.track('sale_undone', { item: itemId });
  }

  /** Сдача заказа или ремонта: фиксирует, сколько выдач понадобилось с прошлой цели. */
  goal(name: 'order_delivered' | 'project_completed' | 'rubble_cleared', id: string): void {
    const spawns = this.log.spawnsSinceGoal;
    this.log.spawnsSinceGoal = 0;
    this.track(name, { id, spawns, spawns_total: this.log.spawnsTotal, active_sec: this.activeSec() });
  }
}
