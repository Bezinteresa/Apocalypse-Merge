import { PROJECTS, STORAGE_CAPACITY } from '../content/orders';
import { validateState } from '../game/rules';
import { triggeredDialogIds } from '../game/tutorial';
import { SCHEMA_VERSION, createInitialState, type GameState } from '../game/state';

// Сервис сохранений. Основной ключ и предыдущая корректная копия читаются и пишутся одним вызовом.
// Ошибка чтения не равна отсутствию сохранения: в этом случае load() бросает исключение,
// и игра не перезаписывает неизвестное удалённое состояние новым.

export const SAVE_KEY = 'am_save';
export const PREV_KEY = 'am_save_prev';

export interface StorageBackend {
  get(keys: string[]): Promise<unknown[]>;
  set(keys: string[], values: unknown[]): Promise<void>;
}

export type LoadResult = { state: GameState; source: 'main' | 'prev' | 'new'; recovered: boolean };

export class SaveFormatError extends Error {}

function parse(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isEmpty(raw: unknown): boolean {
  return raw === null || raw === undefined || raw === '';
}

/** Миграции по версиям схемы. Более новая версия — не наш формат, не затираем её. */
export function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  let data = raw as Record<string, unknown>;
  const version = data.schemaVersion;
  if (typeof version === 'number' && version > SCHEMA_VERSION) {
    throw new SaveFormatError(`Save schema ${version} is newer than supported ${SCHEMA_VERSION}`);
  }
  if (version === 1) {
    // v2: склад, заказы, проекты и отмена продажи
    data = {
      ...data,
      schemaVersion: 2,
      storage: new Array(STORAGE_CAPACITY).fill(null),
      completedOrders: [],
      completedProjects: [],
      lastSale: null,
    };
  }
  if (data.schemaVersion === 2) {
    // v3: просмотренные сцены. Игроку с прогрессом уже доступные сцены не повторяем.
    const progressed = (data.nextUid as number) > 1 || (data.completedOrders as string[]).length > 0;
    data = { ...data, schemaVersion: 3, seenDialogs: [] };
    if (progressed) data.seenDialogs = triggeredDialogIds(data as unknown as GameState);
  }
  if (data.schemaVersion === 3) {
    // v4: входящее хранилище. Генераторы-награды уже завершённых проектов, которых нет на поле,
    // выдаются туда (в пробном срезе этапа 2 награда R03 была только анонсом).
    const cells = (data.cells as GameState['cells']) ?? [];
    const onBoard = new Set(cells.flatMap((c) => (c?.kind === 'generator' ? [c.generatorId] : [])));
    const incoming = ((data.completedProjects as string[]) ?? [])
      .map((id) => PROJECTS.find((pr) => pr.id === id)?.generatorReward)
      .filter((g): g is string => !!g && !onBoard.has(g));
    data = { ...data, schemaVersion: 4, incoming };
  }
  return data.schemaVersion === SCHEMA_VERSION && validateState(data) ? data : null;
}

export class SaveStore {
  private revision = 0;
  private savedRevision = 0;
  private lastSaved: GameState | null = null;
  private pending: GameState | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private writing: Promise<void> | null = null;
  private retryDelay = 0;

  constructor(
    private backend: StorageBackend,
    private debounceMs = 800,
  ) {}

  async load(): Promise<LoadResult> {
    const [mainRaw, prevRaw] = await this.backend.get([SAVE_KEY, PREV_KEY]);
    if (isEmpty(mainRaw) && isEmpty(prevRaw)) return { state: createInitialState(), source: 'new', recovered: false };

    const main = migrate(parse(mainRaw));
    if (main) {
      this.lastSaved = main;
      return { state: main, source: 'main', recovered: false };
    }
    const prev = migrate(parse(prevRaw));
    if (prev) {
      this.lastSaved = prev;
      return { state: prev, source: 'prev', recovered: true };
    }
    return { state: createInitialState(), source: 'new', recovered: true };
  }

  get isDirty(): boolean {
    return this.savedRevision !== this.revision;
  }

  /** Отметить изменение; запись объединяется по времени и выполняется последовательно. */
  save(state: GameState): void {
    this.revision += 1;
    this.pending = state;
    this.schedule(this.debounceMs);
  }

  /** Немедленная попытка записи, например при уходе в фон. */
  flush(): Promise<void> {
    // запись начинается синхронно: при уходе со страницы таймер уже может не сработать
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    return this.write();
  }

  private schedule(delay: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.write();
    }, delay);
  }

  private async write(): Promise<void> {
    if (this.writing) {
      await this.writing;
      if (this.isDirty) this.schedule(0);
      return;
    }
    if (!this.pending || !this.isDirty) return;
    const state = this.pending;
    const revision = this.revision;
    const prev = this.lastSaved ?? state;

    this.writing = this.backend.set([SAVE_KEY, PREV_KEY], [state, prev]).then(
      () => {
        this.lastSaved = state;
        // старый ответ не помечает более новое изменение сохранённым
        this.savedRevision = Math.max(this.savedRevision, revision);
        this.retryDelay = 0;
      },
      (e: unknown) => {
        console.warn('Save failed, will retry', e);
        this.retryDelay = Math.min(this.retryDelay ? this.retryDelay * 2 : 2000, 30000);
      },
    );
    await this.writing;
    this.writing = null;
    if (this.isDirty) this.schedule(this.retryDelay || 0);
  }
}
