import { describe, expect, it } from 'vitest';
import spec from '../../art/generation-prompts.json';
import { CARDS, CHESTS } from './collections';
import { GENERATORS, ITEMS } from './items';
import { PROJECTS, VISITORS } from './orders';
import { BUILDING_SPRITE, cardSprite, characterSprite, chestSprite, generatorSprite, itemSprite, portraitSprite, zoneSprite } from '../ui/sprites';
import { SPOTS, ZONES } from './shopLayout';

// Спецификация графики — единственный источник правды: у каждой сущности игры есть слот.
// Новая сущность в данных без строки в art/generation-prompts.json роняет этот тест.

const files = new Set(spec.assets.map((a) => a.file));

describe('art specification', () => {
  it('has a slot for every game entity that shows a picture', () => {
    const expected = [
      ...Object.keys(ITEMS).map(itemSprite),
      ...Object.keys(GENERATORS).flatMap((g) => [1, 2, 3, 4, 5, 6].map((l) => generatorSprite(g, l))),
      ...Object.keys(VISITORS).filter((v) => v !== 'RADIO').map(portraitSprite),
      BUILDING_SPRITE,
      ...ZONES.flatMap((z) => [zoneSprite(z.project, false), zoneSprite(z.project, true)]),
      ...SPOTS.map((s) => characterSprite(s.visitor)),
      ...Object.keys(CHESTS).map(chestSprite),
      ...CARDS.map((c) => cardSprite(c.id)),
    ];
    expect(expected.filter((f) => !files.has(f))).toEqual([]);
  });

  it('every repair project has a place in the building and every visitor a spot', () => {
    expect(PROJECTS.map((p) => p.id).filter((id) => !ZONES.some((z) => z.project === id))).toEqual([]);
    expect(Object.keys(VISITORS).filter((v) => v !== 'RADIO' && !SPOTS.some((s) => s.visitor === v))).toEqual([]);
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
