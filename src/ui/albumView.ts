import { CHESTS, LEGENDARY_PITY, RARITIES, RARITY, SETS, cardsOf, getCard } from '../content/collections';
import { t, tx, type StringKey } from '../i18n';
import {
  assembleCard,
  buyShard,
  cardShards,
  claimSetReward,
  isAssembled,
  isSetComplete,
  openChest,
  type ChestResult,
} from '../game/collections';
import type { GameState } from '../game/state';
import { cardSprite, chestSprite, spriteImg } from './sprites';

// Экран альбома: сундуки, карты набора, обмен жетонов и награда за набор.
// Результат открытия принимается и сохраняется до показа окна с выдачами.

export interface AlbumContext {
  getState(): GameState;
  commit(next: GameState, critical?: boolean): void;
  toast(key: StringKey, extra?: string): void;
  showModal(title: string, text: string): void;
  track(name: string, data?: Record<string, string | number | boolean>): void;
}

export function describeChestResult(result: ChestResult): string {
  return result.draws
    .map((d) => {
      const card = getCard(d.cardId);
      const head = `${tx(RARITY[d.rarity].name)} · ${tx(card.name)}`;
      const tail = d.excess ? `${t('excessShard')} +${d.tokens} ${t('tokens').toLowerCase()}` : `+1 ${t('shard')}`;
      return `${d.guaranteed ? '★ ' : ''}${head}: ${tail}`;
    })
    .join('\n');
}

export function createAlbum(root: HTMLElement, ctx: AlbumContext): { render(): void } {
  const setDef = SETS[0];

  function open(index: number): void {
    const r = openChest(ctx.getState(), index, setDef.id);
    if (!r.ok) {
      ctx.toast('noChests');
      return;
    }
    ctx.track('chest_opened', { chest: r.result.chestId, legendary: r.result.draws.some((d) => d.rarity === 'legendary') });
    // результат сначала принимается и сохраняется, затем показывается
    ctx.commit(r.state, true);
    ctx.showModal(tx(CHESTS[r.result.chestId].name), describeChestResult(r.result));
  }

  function render(): void {
    const state = ctx.getState();
    const progress = state.collections[setDef.id];
    const cards = cardsOf(setDef.id);
    root.replaceChildren();

    const head = document.createElement('div');
    head.className = 'album-head';
    head.textContent = `${tx(setDef.name)} · ${t('assembled')}: ${progress.assembled.length}/${cards.length} · ${t('tokens')}: ${state.tokens}`;
    root.appendChild(head);

    // сундуки, сгруппированные по типу
    const chestBox = document.createElement('div');
    chestBox.className = 'chest-list';
    const groups = new Map<string, number>();
    state.chests.forEach((id) => groups.set(id, (groups.get(id) ?? 0) + 1));
    if (!groups.size) {
      const p = document.createElement('p');
      p.className = 'placeholder';
      p.textContent = t('noChests');
      chestBox.appendChild(p);
    }
    for (const [chestId, count] of groups) {
      const chest = CHESTS[chestId];
      const row = document.createElement('div');
      row.className = 'chest-row';
      const info = document.createElement('div');
      const odds = RARITIES.map((r) => `${tx(RARITY[r].name)} ${chest.odds[r]}%`).join(', ');
      info.innerHTML = '<b></b><small></small>';
      info.querySelector('b')!.textContent = `${tx(chest.name)} ×${count}`;
      info.querySelector('small')!.textContent = `${chest.draws} ${t('drawsWord')} · ${odds} · ${t('pityLeft')}: ${LEGENDARY_PITY + 1 - progress.pity}`;
      const btn = document.createElement('button');
      btn.className = 'btn small';
      btn.textContent = t('openChest');
      btn.onclick = () => open(state.chests.indexOf(chestId));
      const icon = spriteImg(chestSprite(chestId), 'chest-img');
      if (icon) row.append(icon);
      row.append(info, btn);
      chestBox.appendChild(row);
    }
    root.appendChild(chestBox);

    // карты набора
    const grid = document.createElement('div');
    grid.className = 'card-grid';
    for (const card of cards) {
      const rarity = RARITY[card.rarity];
      const shards = cardShards(state, card.id);
      const done = isAssembled(state, card.id);
      const tile = document.createElement('div');
      tile.className = 'card-tile';
      tile.dataset.card = card.id;
      tile.classList.toggle('done', done);
      tile.style.setProperty('--rarity', rarity.color);
      tile.innerHTML = '<small></small><b></b><div class="card-bar"><span></span></div><div class="card-count"></div>';
      const art = spriteImg(cardSprite(card.id), 'card-img');
      if (art) tile.prepend(art);
      tile.querySelector('small')!.textContent = tx(rarity.name);
      tile.querySelector('b')!.textContent = tx(card.name);
      (tile.querySelector('.card-bar span') as HTMLElement).style.width = `${Math.min(100, (100 * (done ? rarity.threshold : shards)) / rarity.threshold)}%`;
      tile.querySelector('.card-count')!.textContent = done ? '✓' : `${shards}/${rarity.threshold}`;
      const btn = document.createElement('button');
      btn.className = 'btn small';
      if (done) {
        btn.className = 'btn small ghost';
        btn.textContent = t('readLore');
        btn.onclick = () => ctx.showModal(tx(card.name), tx(card.lore));
      } else if (shards >= rarity.threshold) {
        btn.textContent = t('assemble');
        btn.onclick = () => {
          const r = assembleCard(ctx.getState(), card.id);
          if (!r.ok) return;
          ctx.track('card_assembled', { card: card.id });
          ctx.commit(r.state, true);
          ctx.showModal(`${t('cardAssembled')}: ${tx(card.name)}`, tx(card.lore));
        };
      } else {
        btn.textContent = `${t('buyShard')} ${rarity.shardPrice}`;
        btn.classList.toggle('dim', state.tokens < rarity.shardPrice);
        btn.onclick = () => {
          const r = buyShard(ctx.getState(), card.id);
          if (!r.ok) {
            ctx.toast('noTokens', `${ctx.getState().tokens}/${rarity.shardPrice}`);
            return;
          }
          ctx.commit(r.state);
        };
      }
      tile.appendChild(btn);
      grid.appendChild(tile);
    }
    root.appendChild(grid);

    // награда за набор
    const reward = document.createElement('div');
    reward.className = 'set-reward';
    const rewardText = `+${setDef.reward.money} ${t('money').toLowerCase()}, +${setDef.reward.energy} ⚡`;
    if (progress.rewardClaimed) {
      reward.textContent = `✓ ${t('setRewardClaimed')}`;
    } else if (isSetComplete(state, setDef.id)) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = `${t('claimSetReward')}: ${rewardText}`;
      btn.onclick = () => {
        const r = claimSetReward(ctx.getState(), setDef.id);
        if (!r.ok) return;
        ctx.track('set_completed', { set: setDef.id });
        ctx.commit(r.state, true);
        ctx.showModal(t('setComplete'), rewardText);
      };
      reward.appendChild(btn);
    } else {
      reward.textContent = `${t('setRewardHint')}: ${rewardText}`;
    }
    root.appendChild(reward);

    if (state.lastChest) {
      const last = document.createElement('details');
      last.className = 'last-chest';
      last.innerHTML = '<summary></summary><pre></pre>';
      last.querySelector('summary')!.textContent = `${t('lastChest')}: ${tx(CHESTS[state.lastChest.chestId].name)}`;
      last.querySelector('pre')!.textContent = describeChestResult(state.lastChest);
      root.appendChild(last);
    }
  }

  return { render };
}
