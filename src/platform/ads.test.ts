import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AD_MAX_DURATION_MS, AD_OPEN_TIMEOUT_MS, AdService, type AdAdapter, type AdState } from './ads';

class FakeAdapter implements AdAdapter {
  isRewardedSupported = true;
  isInterstitialSupported = true;
  throwOnShow = false;
  shown: string[] = [];
  private rewardedCb: (s: AdState) => void = () => {};
  private interstitialCb: (s: AdState) => void = () => {};
  showRewarded(p: string) {
    if (this.throwOnShow) throw new Error('sdk');
    this.shown.push('rewarded:' + p);
  }
  showInterstitial(p: string) {
    this.shown.push('interstitial:' + p);
  }
  onRewardedState(cb: (s: AdState) => void) {
    this.rewardedCb = cb;
  }
  onInterstitialState(cb: (s: AdState) => void) {
    this.interstitialCb = cb;
  }
  rewarded(...states: AdState[]) {
    states.forEach((s) => this.rewardedCb(s));
  }
  interstitial(...states: AdState[]) {
    states.forEach((s) => this.interstitialCb(s));
  }
}

function setup() {
  const adapter = new FakeAdapter();
  const pauses: boolean[] = [];
  let rewards = 0;
  const ads = new AdService(adapter, (p) => pauses.push(p), () => rewards++);
  return { adapter, ads, pauses, rewards: () => rewards };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('AdService rewarded', () => {
  it('grants once on rewarded and unpauses only after close', async () => {
    const { adapter, ads, pauses, rewards } = setup();
    const result = ads.showRewarded('energy_bonus');
    adapter.rewarded('loading', 'opened', 'rewarded');
    expect(rewards()).toBe(1);
    expect(pauses).toEqual([true]);
    adapter.rewarded('rewarded', 'closed');
    await expect(result).resolves.toBe('rewarded');
    expect(rewards()).toBe(1);
    expect(pauses).toEqual([true, false]);
  });

  it('gives nothing for a closed ad without rewarded, failure or exception', async () => {
    const { adapter, ads, rewards } = setup();
    let r = ads.showRewarded('p');
    adapter.rewarded('opened', 'closed');
    await vi.advanceTimersByTimeAsync(600);
    await expect(r).resolves.toBe('not_rewarded');
    r = ads.showRewarded('p');
    adapter.rewarded('failed');
    await expect(r).resolves.toBe('not_rewarded');
    adapter.throwOnShow = true;
    await expect(ads.showRewarded('p')).resolves.toBe('not_rewarded');
    expect(rewards()).toBe(0);
    expect(ads.busy).toBe(false);
  });

  it('accepts a rewarded event that arrives just after close', async () => {
    const { adapter, ads, rewards } = setup();
    const r = ads.showRewarded('p');
    adapter.rewarded('opened', 'closed', 'rewarded');
    await vi.advanceTimersByTimeAsync(600);
    await expect(r).resolves.toBe('rewarded');
    expect(rewards()).toBe(1);
  });

  it('blocks parallel requests and ignores late events of a finished request', async () => {
    const { adapter, ads, rewards } = setup();
    const first = ads.showRewarded('p');
    await expect(ads.showRewarded('p')).resolves.toBe('busy');
    await expect(ads.showInterstitial('i')).resolves.toBe('busy');
    adapter.rewarded('failed');
    await first;
    adapter.rewarded('rewarded', 'closed');
    expect(rewards()).toBe(0);
  });

  it('times out when the ad never opens or never closes', async () => {
    const { ads, pauses } = setup();
    const r = ads.showRewarded('p');
    await vi.advanceTimersByTimeAsync(AD_OPEN_TIMEOUT_MS + 1);
    await expect(r).resolves.toBe('not_rewarded');
    expect(pauses).toEqual([true, false]);
  });

  it('reports unsupported platforms without pausing', async () => {
    const { adapter, ads, pauses } = setup();
    adapter.isRewardedSupported = false;
    await expect(ads.showRewarded('p')).resolves.toBe('unavailable');
    expect(pauses).toEqual([]);
  });
});

describe('AdService interstitial', () => {
  it('continues after close or failure, and after a stuck ad', async () => {
    const { adapter, ads } = setup();
    let r = ads.showInterstitial('project_completed');
    adapter.interstitial('opened', 'closed');
    await expect(r).resolves.toBe('shown');
    r = ads.showInterstitial('project_completed');
    adapter.interstitial('failed');
    await expect(r).resolves.toBe('skipped');
    r = ads.showInterstitial('project_completed');
    adapter.interstitial('opened');
    await vi.advanceTimersByTimeAsync(AD_MAX_DURATION_MS + 1);
    await expect(r).resolves.toBe('shown');
    expect(ads.busy).toBe(false);
  });
});
