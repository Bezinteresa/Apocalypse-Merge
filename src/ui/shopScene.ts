import { getItem } from '../content/items';
import { ORDERS, PROJECTS, VISITORS } from '../content/orders';
import { ROOMS, SPOTS, VISITOR_ARRIVAL, VISITOR_COLOR, ZONES, type Rect } from '../content/shopLayout';
import { t, tx } from '../i18n';
import { availableOrders, canDeliver, currentProject, isChapterComplete } from '../game/rules';
import type { GameState } from '../game/state';
import { BUILDING_SPRITE, characterSprite, hasSprite, spriteImg, spriteUrl, zoneSprite } from './sprites';

// Здание в разрезе: комнаты, места ремонта (сломано / починено / текущий ремонт) и посетители с репликами.
// Без картинок всё рисуется условными плашками; файлы из public/sprites подменяют их по имени.

export interface SceneHandlers {
  /** Нажатие на место ремонта. */
  onZone(projectId: string): void;
  /** Нажатие на реплику посетителя с заказом. */
  onVisitor(visitorId: string): void;
}

function place(el: HTMLElement, r: Rect): void {
  el.style.left = `${r.x}%`;
  el.style.top = `${r.y}%`;
  el.style.width = `${r.w}%`;
  el.style.height = `${r.h}%`;
}

export function isVisitorPresent(state: GameState, visitorId: string): boolean {
  const after = VISITOR_ARRIVAL[visitorId];
  return after === null || (after !== undefined && state.completedProjects.includes(after));
}

/** Короткая реплика посетителя: его ближайший заказ или благодарность. */
export function visitorLine(state: GameState, visitorId: string): { text: string; ready: boolean; hasOrder: boolean } {
  const order = availableOrders(state).find((o) => o.visitor === visitorId);
  if (order) {
    const items = order.requires.map((r) => tx(getItem(r.itemId).name)).join(', ');
    return { text: `${tx(order.text)}: ${items}`, ready: canDeliver(state, order), hasOrder: true };
  }
  const anyLeft = ORDERS.some((o) => o.visitor === visitorId && !state.completedOrders.includes(o.id));
  return { text: anyLeft ? t('visitorWaiting') : t('visitorThanks'), ready: false, hasOrder: false };
}

export function renderShopScene(root: HTMLElement, state: GameState, handlers: SceneHandlers): void {
  root.replaceChildren();
  root.className = 'scene';
  const powered = state.completedProjects.includes('R06');
  root.classList.toggle('powered', powered);
  if (hasSprite(BUILDING_SPRITE)) {
    root.classList.add('has-bg');
    root.style.backgroundImage = `url("${spriteUrl(BUILDING_SPRITE)}")`;
  }

  for (const room of ROOMS) {
    const el = document.createElement('div');
    const locked = !!room.locked && !(room.unlockAfter && state.completedProjects.includes(room.unlockAfter));
    // подпись закрытой комнаты может смениться после проекта (найден спуск)
    const lockedText = Object.entries(room.lockedAfter ?? {}).find(([p]) => state.completedProjects.includes(p))?.[1] ?? room.locked;
    el.className = `room room-${room.id.toLowerCase()}`;
    el.classList.toggle('outdoor', !!room.outdoor);
    el.classList.toggle('locked', locked);
    place(el, room);
    const label = document.createElement('span');
    label.className = 'room-name';
    // в узкой закрытой комнате — только название, пояснение во всплывающей подсказке
    label.textContent = locked && lockedText ? `🔒 ${tx(room.name)}${room.w > 40 ? ` · ${tx(lockedText)}` : ''}` : tx(room.name);
    if (locked && lockedText) el.title = tx(lockedText);
    el.appendChild(label);
    root.appendChild(el);
  }

  const current = currentProject(state);
  for (const zone of ZONES) {
    const done = state.completedProjects.includes(zone.project);
    const isCurrent = current?.id === zone.project;
    // в закрытой комнате место ремонта видно, только когда до него дошла очередь
    const room = ROOMS.find((r) => r.id === zone.room);
    const roomLocked = !!room?.locked && !(room.unlockAfter && state.completedProjects.includes(room.unlockAfter));
    if (roomLocked && !done && !isCurrent) continue;
    const project = PROJECTS.find((p) => p.id === zone.project)!;
    const el = document.createElement('button');
    el.className = 'zone-spot';
    el.classList.add(done ? 'fixed' : 'broken');
    el.classList.toggle('current', isCurrent);
    el.dataset.project = zone.project;
    el.title = `${zone.project} · ${tx(project.name)}`;
    place(el, zone);
    const img = spriteImg(zoneSprite(zone.project, done), 'zone-img');
    if (img) {
      el.classList.add('has-art');
      el.appendChild(img);
    } else {
      const label = document.createElement('span');
      label.textContent = `${done ? '✓' : '✕'} ${zone.project}`;
      el.appendChild(label);
    }
    if (isCurrent) {
      const badge = document.createElement('span');
      badge.className = 'zone-badge';
      badge.textContent = '🔨';
      el.appendChild(badge);
    }
    el.onclick = () => handlers.onZone(zone.project);
    root.appendChild(el);
  }

  for (const spot of SPOTS) {
    if (!isVisitorPresent(state, spot.visitor)) continue;
    const el = document.createElement('div');
    el.className = 'visitor';
    el.style.setProperty('--visitor', VISITOR_COLOR[spot.visitor] ?? '#999');
    el.style.left = `${spot.x - spot.h / 4}%`;
    el.style.width = `${spot.h / 2}%`;
    el.style.top = `${spot.bottom - spot.h}%`;
    el.style.height = `${spot.h}%`;
    const body = spriteImg(characterSprite(spot.visitor), 'visitor-img');
    if (body) el.appendChild(body);
    else {
      const ph = document.createElement('div');
      ph.className = 'visitor-ph';
      ph.textContent = tx(VISITORS[spot.visitor].name).slice(0, 1);
      el.appendChild(ph);
    }
    const name = document.createElement('span');
    name.className = 'visitor-name';
    name.textContent = tx(VISITORS[spot.visitor].name);
    el.appendChild(name);

    const line = visitorLine(state, spot.visitor);
    if (!isChapterComplete(state) || line.hasOrder) {
      const bubble = document.createElement('button');
      bubble.className = 'bubble';
      bubble.classList.toggle('ready', line.ready);
      bubble.textContent = line.ready ? `✓ ${line.text}` : line.text;
      bubble.onclick = () => handlers.onVisitor(spot.visitor);
      el.appendChild(bubble);
    }
    root.appendChild(el);
  }
}
