import { getProject } from '../content/orders';
import { openBoard } from './testUtils';
import { describe, expect, it } from 'vitest';
import { START_GENERATORS } from '../content/board';
import { ENERGY_REGEN_MS, msToNextEnergy, regenerate } from './energy';
import { completeProject, spawnFromGenerator } from './rules';
import type { GameState } from './state';

const TOOL = START_GENERATORS[0].cell;
const at = (energy: number, energyUpdatedAt: number): GameState => ({ ...openBoard(), energy, energyUpdatedAt });

describe('energy', () => {
  it('spawning costs 1 and refuses at zero without changing state', () => {
    const r = spawnFromGenerator(at(5, 0), TOOL, 0);
    expect(r.ok && r.state.energy).toBe(4);
    const empty = at(0, 0);
    expect(spawnFromGenerator(empty, TOOL, 1000)).toEqual({ ok: false, reason: 'no_energy' });
  });

  it('a full board refuses before charging energy', () => {
    let s = at(100, 0);
    for (let i = 0; i < s.cells.length; i++) {
      if (s.cells[i] === null && !s.fog[i]) {
        s = { ...s, cells: s.cells.map((c, j) => (j === i ? { kind: 'item', uid: s.nextUid, itemId: 'T01' } : c)), nextUid: s.nextUid + 1 };
      }
    }
    expect(spawnFromGenerator(s, TOOL, 0)).toEqual({ ok: false, reason: 'board_full' });
    const noEnergyFull = { ...s, energy: 0 };
    expect(spawnFromGenerator(noEnergyFull, TOOL, 0)).toEqual({ ok: false, reason: 'board_full' });
  });

  it('regenerates 1 per 120 s below the cap and keeps the remainder', () => {
    const s = regenerate(at(98, 0), ENERGY_REGEN_MS + 5000);
    expect(s.energy).toBe(99);
    expect(s.energyUpdatedAt).toBe(ENERGY_REGEN_MS);
    expect(msToNextEnergy(s, ENERGY_REGEN_MS + 5000)).toBe(ENERGY_REGEN_MS - 5000);
    const capped = regenerate(at(98, 0), ENERGY_REGEN_MS * 10);
    expect(capped.energy).toBe(100);
    expect(capped.energyUpdatedAt).toBe(ENERGY_REGEN_MS * 10);
  });

  it('gives nothing for time going backwards', () => {
    const s = regenerate(at(50, 1_000_000), 500_000);
    expect(s.energy).toBe(50);
    expect(s.energyUpdatedAt).toBe(500_000);
  });

  it('does not cut a bonus above the cap and does not regenerate above it', () => {
    const s = regenerate(at(150, 0), ENERGY_REGEN_MS * 100);
    expect(s.energy).toBe(150);
    const spent = spawnFromGenerator(s, TOOL, ENERGY_REGEN_MS * 100);
    expect(spent.ok && spent.state.energy).toBe(149);
  });

  it('starts the regen timer when energy drops below the cap, not before', () => {
    const t0 = 10_000_000;
    const r = spawnFromGenerator(at(100, 0), TOOL, t0);
    if (!r.ok) throw new Error();
    expect(r.state.energy).toBe(99);
    expect(regenerate(r.state, t0 + ENERGY_REGEN_MS - 1).energy).toBe(99);
    expect(regenerate(r.state, t0 + ENERGY_REGEN_MS).energy).toBe(100);
  });

  it('unlimited mode does not spend energy', () => {
    const r = spawnFromGenerator({ ...at(0, 0), energyUnlimited: true }, TOOL, 0);
    expect(r.ok && r.state.energy).toBe(0);
    expect(msToNextEnergy({ ...at(0, 0), energyUnlimited: true }, 0)).toBeNull();
  });

  it('R02 adds 50 energy on top of the current amount', () => {
    const s: GameState = {
      ...at(100, 0),
      cells: openBoard().cells.map((c, i) => (i === 0 ? { kind: 'item', uid: 1, itemId: 'T02' } : i === 1 ? { kind: 'item', uid: 2, itemId: 'M03' } : c)),
      nextUid: 3,
      // детали R02 сданы заказом Q02, монет ровно на ремонт
      money: getProject('R02').cost,
      completedOrders: ['O01', 'Q02'],
      completedProjects: ['R01', 'C01'],
    };
    const r = completeProject(s, 'R02');
    expect(r.ok && r.state.energy).toBe(150);
  });
});
