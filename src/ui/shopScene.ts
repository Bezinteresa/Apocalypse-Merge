import { getItem } from '../content/items';
import { PROJECTS, VISITORS } from '../content/orders';
import { ROOMS, SCENE_SIZE, SPOTS, VISITOR_ARRIVAL, VISITOR_COLOR, ZONES, type Rect } from '../content/shopLayout';
import { tx } from '../i18n';
import { availableOrders, canDeliver, currentProject } from '../game/rules';
import type { GameState } from '../game/state';
import { BUILDING_SPRITE, LEVEL2_SPRITE, characterSprite, hasSprite, spriteImg, spriteUrl, uiSprite, zoneSprite } from './sprites';

// Здание в разрезе: комнаты, места ремонта (сломано / починено / текущий ремонт) и посетители с репликами.
// Без картинок всё рисуется условными плашками; файлы из public/sprites подменяют их по имени.

export interface SceneHandlers {
  /** Нажатие на место ремонта. */
  onZone(projectId: string): void;
  /** Нажатие на реплику посетителя с заказом. */
  onVisitor(visitorId: string): void;
}

// Координаты плана — в процентах ширины и исходной высоты здания (1000); сцена с этажом −2 выше (SCENE_SIZE.h),
// поэтому вертикаль пересчитывается в проценты её полной высоты.
const vy = (v: number) => (v * 1000) / SCENE_SIZE.h;

function place(el: HTMLElement, r: Rect): void {
  el.style.left = `${r.x}%`;
  el.style.top = `${vy(r.y)}%`;
  el.style.width = `${r.w}%`;
  el.style.height = `${vy(r.h)}%`;
}

export function isVisitorPresent(state: GameState, visitorId: string): boolean {
  const after = VISITOR_ARRIVAL[visitorId];
  return after === null || (after !== undefined && state.completedProjects.includes(after));
}

/** Реплика посетителя с открытым заказом: что нужно и награда; без заказа реплики нет (решение пользователя от 23.10.2026). */
export function visitorLine(state: GameState, visitorId: string): { text: string; ready: boolean } | null {
  const order = availableOrders(state).find((o) => o.visitor === visitorId);
  if (!order) return null;
  const items = order.requires.map((r) => tx(getItem(r.itemId).name)).join(', ');
  return { text: `${tx(order.text)}: ${items} · +${order.reward} 💰`, ready: canDeliver(state, order) };
}

export function renderShopScene(root: HTMLElement, state: GameState, handlers: SceneHandlers): void {
  root.replaceChildren();
  root.className = 'scene';
  const powered = state.completedProjects.includes('R06');
  root.classList.toggle('powered', powered);
  root.style.aspectRatio = `${SCENE_SIZE.w} / ${SCENE_SIZE.h}`;
  if (hasSprite(BUILDING_SPRITE)) {
    root.classList.add('has-bg');
    root.style.backgroundImage = `url("${spriteUrl(BUILDING_SPRITE)}")`;
  }
  // этаж −2 под зданием: своя полоса фона (пока её нет — тёмная земля из стилей)
  const level2 = document.createElement('div');
  level2.className = 'scene-level2';
  place(level2, { x: 0, y: 100, w: 100, h: (SCENE_SIZE.h - 1000) / 10 });
  if (hasSprite(LEVEL2_SPRITE)) level2.style.backgroundImage = `url("${spriteUrl(LEVEL2_SPRITE)}")`;
  root.appendChild(level2);

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
    // расчищенная гора мусора исчезает
    if (zone.rubble && done) continue;
    const project = PROJECTS.find((p) => p.id === zone.project)!;
    const el = document.createElement('button');
    el.className = 'zone-spot';
    el.classList.add(done ? 'fixed' : 'broken');
    el.classList.toggle('rubble', !!zone.rubble);
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
      label.textContent = zone.rubble ? '🗑' : `${done ? '✓' : '✕'} ${zone.project}`;
      el.appendChild(label);
    }
    if (isCurrent) {
      const badge = document.createElement('span');
      badge.className = 'zone-badge';
      badge.textContent = zone.rubble ? '🧹' : '🔨';
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
    el.style.top = `${vy(spot.bottom - spot.h)}%`;
    el.style.height = `${vy(spot.h)}%`;
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

    // остальные просто стоят в магазине без облачка; нажатие на реплику с заказом ведёт на поле
    const line = visitorLine(state, spot.visitor);
    if (line) {
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

/** Длительность облачка «пуф» после восстановления, мс. */
export const POOF_MS = 900;

/**
 * Облачко пыли на месте ремонта: сломанный объект скрывается в облаке, из него проступает починенный.
 * Состояние к этому моменту уже принято и сохранено; эффект только показывает смену.
 */
export function playPoof(sceneRoot: HTMLElement, projectId: string): boolean {
  if (sceneRoot.offsetParent === null) return false;
  const zone = sceneRoot.querySelector<HTMLElement>(`.zone-spot[data-project="${projectId}"]`);
  // расчищенной горы мусора на сцене уже нет — облачко встаёт на её место по плану здания
  const rect = ZONES.find((z) => z.project === projectId);
  if (!zone && !rect) return false;
  if (zone) {
    zone.classList.remove('appear');
    void zone.offsetWidth;
    zone.classList.add('appear');
  }
  const poof = document.createElement('div');
  poof.className = 'poof';
  if (zone) {
    poof.style.left = zone.style.left;
    poof.style.top = zone.style.top;
    poof.style.width = zone.style.width;
    poof.style.height = zone.style.height;
  } else place(poof, rect!);
  const cloud = hasSprite(uiSprite('poof')) ? `url("${spriteUrl(uiSprite('poof'))}")` : '';
  for (let i = 0; i < 9; i++) {
    const puff = document.createElement('span');
    puff.className = 'puff';
    const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 22 + Math.random() * 26;
    puff.style.setProperty('--px', `${Math.cos(angle) * dist}%`);
    puff.style.setProperty('--py', `${Math.sin(angle) * dist}%`);
    puff.style.setProperty('--ps', `${0.7 + Math.random() * 0.6}`);
    puff.style.animationDelay = `${Math.random() * 120}ms`;
    if (cloud) puff.style.backgroundImage = cloud;
    poof.appendChild(puff);
  }
  for (let i = 0; i < 6; i++) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    spark.textContent = '✦';
    spark.style.setProperty('--px', `${(Math.random() - 0.5) * 140}%`);
    spark.style.setProperty('--py', `${(Math.random() - 0.7) * 120}%`);
    spark.style.animationDelay = `${250 + Math.random() * 250}ms`;
    poof.appendChild(spark);
  }
  sceneRoot.appendChild(poof);
  setTimeout(() => poof.remove(), POOF_MS + 300);
  return true;
}
