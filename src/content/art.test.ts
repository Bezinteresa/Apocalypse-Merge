import { describe, expect, it } from 'vitest';
import spec from '../../art/generation-prompts.json';
import { CARDS, CHESTS } from './collections';
import { GENERATORS, ITEMS } from './items';
import { PROJECTS, VISITORS } from './orders';
import { cardSprite, chestSprite, generatorSprite, itemSprite, portraitSprite, shopSprite } from '../ui/sprites';

// Спецификация графики — единственный источник правды: у каждой сущности игры есть слот.
// Новая сущность в данных без строки в art/generation-prompts.json роняет этот тест.

const files = new Set(spec.assets.map((a) => a.file));

describe('art specification', () => {
  it('has a slot for every game entity that shows a picture', () => {
    const expected = [
      ...Object.keys(ITEMS).map(itemSprite),
      ...Object.keys(GENERATORS).map(generatorSprite),
      ...Object.keys(VISITORS).filter((v) => v !== 'RADIO').map(portraitSprite),
      shopSprite(null),
      ...PROJECTS.map((p) => shopSprite(p.id)),
      ...Object.keys(CHESTS).map(chestSprite),
      ...CARDS.map((c) => cardSprite(c.id)),
    ];
    expect(expected.filter((f) => !files.has(f))).toEqual([]);
  });

  it('every slot has a size, a subject and a unique Latin file name', () => {
    expect(files.size).toBe(spec.assets.length);
    for (const a of spec.assets) {
      expect(a.file, a.file).toMatch(/^[a-z]+\/[A-Za-z0-9_]+\.(png|webp)$/);
      expect(a.w > 0 && a.h > 0, a.file).toBe(true);
      expect(a.subject.length, a.file).toBeGreaterThan(20);
    }
  });
});
