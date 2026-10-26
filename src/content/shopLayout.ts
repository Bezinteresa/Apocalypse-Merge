import layout from './shopLayout.json';
import type { LangText } from './items';

// План здания: комнаты, места ремонта и места персонажей в процентах сцены 16:10.
// Данные лежат в JSON, чтобы из них же рисовалась картинка-разметка для генерации фона (art/make_layout_guide.py).

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoomDef extends Rect {
  id: string;
  name: LangText;
  locked?: LangText;
  /** Комната открывается после этого проекта. */
  unlockAfter?: string;
  /** Другая подпись закрытой комнаты после проекта (например, найден спуск). */
  lockedAfter?: Record<string, LangText>;
  outdoor?: boolean;
}

export interface ZoneDef extends Rect {
  /** Проект восстановления, который меняет это место. */
  project: string;
  room: string;
  broken: string;
  fixed: string;
  /** Гора мусора: после расчистки исчезает, картинки «починено» нет. */
  rubble?: boolean;
}

export interface SpotDef {
  visitor: string;
  /** Центр персонажа по горизонтали и линия пола, в процентах сцены. */
  x: number;
  bottom: number;
  h: number;
}

export const SCENE_SIZE = { w: layout.width, h: layout.height };
export const ROOMS: RoomDef[] = layout.rooms as RoomDef[];
export const ZONES: ZoneDef[] = layout.zones;
export const SPOTS: SpotDef[] = layout.spots;

/** Когда посетитель появляется в магазине: Лев с начала, Ника после R03, Марта после R05 (GAME_DESIGN, раздел 10). */
export const VISITOR_ARRIVAL: Record<string, string | null> = { LEV: null, NIKA: 'R03', MARTA: 'R05', SAVVA: 'R10', TIKHON: 'R14', VERA: 'R19' };

export const VISITOR_COLOR: Record<string, string> = { LEV: '#c98a3a', NIKA: '#6f9a4a', MARTA: '#d1b832', SAVVA: '#b5533c', TIKHON: '#3f9fc4', VERA: '#d9565b', RADIO: '#5aa0e0' };
