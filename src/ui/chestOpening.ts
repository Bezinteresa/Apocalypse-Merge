import { CHESTS, RARITY, getCard } from '../content/collections';
import { t, tx } from '../i18n';
import type { ChestResult } from '../game/collections';
import { cardSprite, chestSprite, spriteImg } from './sprites';

// Сцена открытия сундука: сундук трясётся и раскрывается, осколки по одному вылетают к своим картам,
// у каждой карты видно прибавку к прогрессу или превращение лишнего осколка в жетоны.
// Результат к этому моменту уже принят и сохранён — сцена только показывает его.

const SHAKE_MS = 700;
const STEP_MS = 520;

export function showChestOpening(result: ChestResult, shardsBefore: Record<string, number>, onClose: () => void): void {
  const chest = CHESTS[result.chestId];
  const root = document.createElement('div');
  root.className = 'chest-open';
  root.innerHTML = `
    <div class="chest-open-title"></div>
    <div class="chest-open-cards"></div>
    <div class="chest-open-stage"><div class="chest-rays"></div><div class="chest-open-chest"></div></div>
    <div class="chest-open-hint"></div>
    <button class="btn chest-open-close" hidden></button>
  `;
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  $('.chest-open-title').textContent = tx(chest.name);
  $('.chest-open-hint').textContent = t('tapToSkip');
  const closeBtn = $<HTMLButtonElement>('.chest-open-close');
  closeBtn.textContent = t('collect');
  const chestEl = $('.chest-open-chest');
  const img = spriteImg(chestSprite(result.chestId), 'chest-open-img');
  if (img) chestEl.appendChild(img);
  else chestEl.textContent = '🧰';
  document.body.appendChild(root);

  // карточки выпавших карт; повтор одной карты в сундуке показывается одной карточкой со счётчиком
  const cardsBox = $('.chest-open-cards');
  const running = { ...shardsBefore };
  const tiles = new Map<string, HTMLElement>();
  const timers: ReturnType<typeof setTimeout>[] = [];
  let finished = false;

  function tileFor(cardId: string): HTMLElement {
    let tile = tiles.get(cardId);
    if (tile) return tile;
    const card = getCard(cardId);
    const rarity = RARITY[card.rarity];
    tile = document.createElement('div');
    tile.className = 'co-card';
    tile.style.setProperty('--rarity', rarity.color);
    const art = spriteImg(cardSprite(cardId), 'co-card-img');
    if (art) tile.appendChild(art);
    else {
      const ph = document.createElement('div');
      ph.className = 'co-card-ph';
      ph.textContent = '🃏';
      tile.appendChild(ph);
    }
    tile.insertAdjacentHTML('beforeend', '<small></small><b></b><div class="card-bar"><span></span></div><div class="co-card-count"></div>');
    tile.querySelector('small')!.textContent = tx(rarity.name);
    tile.querySelector('b')!.textContent = tx(card.name);
    cardsBox.appendChild(tile);
    tiles.set(cardId, tile);
    return tile;
  }

  function reveal(index: number): void {
    const draw = result.draws[index];
    const card = getCard(draw.cardId);
    const rarity = RARITY[card.rarity];
    const tile = tileFor(draw.cardId);
    tile.classList.add('shown');
    if (draw.guaranteed) tile.classList.add('guaranteed');
    // осколок вылетает из сундука к карточке
    const from = chestEl.getBoundingClientRect();
    const to = tile.getBoundingClientRect();
    const shard = document.createElement('div');
    shard.className = 'co-shard';
    shard.style.setProperty('--rarity', rarity.color);
    shard.style.left = `${from.left + from.width / 2}px`;
    shard.style.top = `${from.top + from.height / 3}px`;
    document.body.appendChild(shard);
    requestAnimationFrame(() => {
      shard.style.transform = `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 3)}px) rotate(540deg) scale(0.6)`;
      shard.style.opacity = '0.2';
    });
    timers.push(setTimeout(() => shard.remove(), 450));
    if (!draw.excess) running[draw.cardId] = (running[draw.cardId] ?? 0) + 1;
    const have = Math.min(running[draw.cardId] ?? 0, rarity.threshold);
    (tile.querySelector('.card-bar span') as HTMLElement).style.width = `${(100 * have) / rarity.threshold}%`;
    const count = tile.querySelector('.co-card-count')!;
    count.textContent = draw.excess ? `${t('excessShard')} +${draw.tokens} ${t('tokens').toLowerCase()}` : `+1 ${t('shard')} · ${have}/${rarity.threshold}${have >= rarity.threshold ? ' ✓' : ''}`;
    tile.classList.toggle('excess', draw.excess);
    tile.classList.remove('bump');
    void tile.offsetWidth;
    tile.classList.add('bump');
  }

  function finish(): void {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    for (let i = 0; i < result.draws.length; i++) if (!root.dataset[`d${i}`]) reveal(i);
    closeBtn.hidden = false;
    $('.chest-open-hint').hidden = true;
  }

  // тряска → раскрытие → осколки по одному
  chestEl.classList.add('shaking');
  timers.push(
    setTimeout(() => {
      chestEl.classList.remove('shaking');
      root.classList.add('opened');
    }, SHAKE_MS),
  );
  result.draws.forEach((_, i) =>
    timers.push(
      setTimeout(() => {
        root.dataset[`d${i}`] = '1';
        reveal(i);
        if (i === result.draws.length - 1) timers.push(setTimeout(finish, 400));
      }, SHAKE_MS + 250 + i * STEP_MS),
    ),
  );

  // нажатие ускоряет показ; закрытие — кнопкой «Забрать»
  root.addEventListener('click', (e) => {
    if (e.target === closeBtn) return;
    if (!finished) {
      root.classList.add('opened');
      chestEl.classList.remove('shaking');
      result.draws.forEach((_, i) => {
        if (!root.dataset[`d${i}`]) {
          root.dataset[`d${i}`] = '1';
          reveal(i);
        }
      });
      finish();
    }
  });
  closeBtn.onclick = () => {
    root.remove();
    onClose();
  };
}
