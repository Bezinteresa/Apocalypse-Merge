import { describe, expect, it } from 'vitest';
import { AD_REWARD_COOLDOWN_MS, AD_REWARD_ENERGY, INTERSTITIAL_FIRST_DELAY_MS, INTERSTITIAL_INTERVAL_MS, adCooldownLeft, canShowInterstitial, canWatchRewardAd, grantAdReward } from './ads';
import { createInitialState, type GameState } from './state';

function grant(s: GameState, now: number): GameState {
  const r = grantAdReward(s, now);
  if (!r) throw new Error('limit');
  return r;
}

describe('rewarded limit', () => {
  it('gives +20 energy three times, then a 3 hour cooldown that survives a save round-trip', () => {
    let s = createInitialState(1);
    const t0 = 1_000_000;
    s = grant(grant(grant(s, t0), t0 + 1), t0 + 2);
    expect(s.energy).toBe(100 + 3 * AD_REWARD_ENERGY);
    expect(canWatchRewardAd(s, t0 + 3)).toBe(false);
    expect(grantAdReward(s, t0 + 3)).toBeNull();
    const reloaded = JSON.parse(JSON.stringify(s)) as GameState;
    expect(adCooldownLeft(reloaded, t0 + 2 + 60_000)).toBe(AD_REWARD_COOLDOWN_MS - 60_000);
    expect(canWatchRewardAd(reloaded, t0 + 2 + AD_REWARD_COOLDOWN_MS)).toBe(true);
    const after = grant(reloaded, t0 + 2 + AD_REWARD_COOLDOWN_MS);
    expect(after.adRewards.used).toBe(1);
  });
});

describe('interstitial schedule', () => {
  const ready = { ...createInitialState(1), completedProjects: ['R01', 'R02'] };

  it('waits for R02, 180 s after launch and 120 s between shows', () => {
    const start = 0;
    expect(canShowInterstitial({ ...ready, completedProjects: ['R01'] }, start, null, 10 * 60_000)).toBe(false);
    expect(canShowInterstitial(ready, start, null, INTERSTITIAL_FIRST_DELAY_MS - 1)).toBe(false);
    expect(canShowInterstitial(ready, start, null, INTERSTITIAL_FIRST_DELAY_MS)).toBe(true);
    const last = INTERSTITIAL_FIRST_DELAY_MS;
    expect(canShowInterstitial(ready, start, last, last + INTERSTITIAL_INTERVAL_MS - 1)).toBe(false);
    expect(canShowInterstitial(ready, start, last, last + INTERSTITIAL_INTERVAL_MS)).toBe(true);
  });
});
