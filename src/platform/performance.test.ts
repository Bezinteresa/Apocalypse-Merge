import { describe, expect, it } from 'vitest';
import { summarizeFrames } from './performance';

describe('performance sample', () => {
  it('summarizes a window of frame times by the Playgama contract', () => {
    // 98 ровных кадров по 16 мс, один подвис на 120 мс и один на 600 мс
    const frames = [...new Array(98).fill(16), 120, 600];
    const s = summarizeFrames(frames, 31_000, '0.4.2', 0);
    expect(s.frame_count).toBe(100);
    expect(s.active_ms).toBe(98 * 16 + 120 + 600);
    expect(s.frame_time_p50_ms).toBe(16);
    expect(s.frame_time_max_ms).toBe(600);
    expect(s.frames_over_50ms).toBe(2);
    expect(s.frames_over_100ms).toBe(2);
    expect(s.frames_over_250ms).toBe(1);
    expect(s.frames_over_500ms).toBe(1);
    expect(s.frames_over_1000ms).toBe(0);
    expect(s.fps_avg).toBeCloseTo(100_000 / s.active_ms, 1);
    expect(s).toMatchObject({ target_fps: 60, window_ms: 31_000, game_version: '0.4.2' });
  });

  it('gives zeros, not NaN, for an empty window', () => {
    const s = summarizeFrames([], 1000, '0.4.2', 0);
    expect(s.fps_avg).toBe(0);
    expect(s.frame_time_max_ms).toBe(0);
  });
});
