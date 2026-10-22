import { describe, expect, it } from 'vitest';
import { MAX_EVENTS, Telemetry, emptyLog, parseLog } from './telemetry';

function make() {
  let now = 0;
  const sent: string[] = [];
  let changes = 0;
  const tel = new Telemetry(emptyLog(), (name) => sent.push(name), () => changes++, () => now);
  return { tel, sent, advance: (ms: number) => (now += ms), changes: () => changes };
}

describe('telemetry', () => {
  it('counts only active time', () => {
    const { tel, advance } = make();
    advance(10_000);
    tel.setActive(false);
    advance(60_000);
    tel.setActive(true);
    advance(5_000);
    expect(tel.data.activeMs).toBe(15_000);
  });

  it('records spawns per goal and resets after delivery', () => {
    const { tel } = make();
    tel.spawned('G_TOOL');
    tel.spawned('G_TOOL');
    tel.spawned('G_MATERIAL');
    tel.goal('order_delivered', 'O01');
    tel.spawned('G_MATERIAL');
    tel.goal('project_completed', 'R01');
    const events = tel.data.events;
    expect(events[0]).toMatchObject({ e: 'order_delivered', d: { id: 'O01', spawns: 3, spawns_total: 3 } });
    expect(events[1]).toMatchObject({ e: 'project_completed', d: { id: 'R01', spawns: 1, spawns_total: 4 } });
    expect(tel.data.spawnsByGenerator).toEqual({ G_TOOL: 2, G_MATERIAL: 2 });
  });

  it('sends only milestones to the platform and keeps the log bounded', () => {
    const { tel, sent } = make();
    tel.sold('T01');
    tel.refused('board_full');
    tel.once('first_merge', 'first_merge');
    tel.once('first_merge', 'first_merge');
    expect(sent).toEqual(['spawn_refused', 'first_merge']);
    for (let i = 0; i < MAX_EVENTS + 50; i++) tel.track('x');
    expect(tel.data.events).toHaveLength(MAX_EVENTS);
  });

  it('survives a broken analytics sender and falls back on bad stored data', () => {
    const tel = new Telemetry(emptyLog(), () => {
      throw new Error('blocked');
    }, () => {});
    expect(() => tel.track('session_start')).not.toThrow();
    expect(parseLog({ version: 9 })).toEqual(emptyLog());
    expect(parseLog(null)).toEqual(emptyLog());
  });
});
