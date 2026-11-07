import { describe, expect, it } from 'vitest';
import * as t from './timer';
import type { Durations } from './types';

const d: Durations = { focus: 25, short: 5, long: 15, longEvery: 4, minFocus: 5 };
const MIN = 60_000;

describe('timer', () => {
  it('counts down from the end timestamp while running', () => {
    const s = t.start(t.initialTimer(d), 0);
    expect(t.remaining(s, 10 * MIN)).toBe(15 * MIN);
    expect(t.remaining(s, 30 * MIN)).toBe(0);
  });

  it('keeps remaining time across pause and resume', () => {
    let s = t.start(t.initialTimer(d), 0);
    s = t.pause(s, 10 * MIN);
    expect(s.endsAt).toBeNull();
    expect(t.remaining(s, 99 * MIN)).toBe(15 * MIN);
    s = t.start(s, 100 * MIN);
    expect(s.startedAt).toBe(0);
    expect(t.remaining(s, 105 * MIN)).toBe(10 * MIN);
  });

  it('never reports more time than was left at the last start, even with an older clock', () => {
    const s = t.start(t.initialTimer(d), 10 * MIN);
    expect(t.remaining(s, 9 * MIN)).toBe(25 * MIN);
  });

  it('records the scheduled end, not the observation time, when completion is seen late', () => {
    const s = t.start(t.initialTimer(d), 0);
    const { finished } = t.finish(s, d, 40 * MIN);
    expect(finished).toEqual({ mode: 'focus', startedAt: 0, endedAt: 25 * MIN, elapsedMs: 25 * MIN, counted: true });
  });

  it('records only the focused time when a focus block is skipped early', () => {
    const s = t.start(t.initialTimer(d), 0);
    expect(t.finish(s, d, 10 * MIN).finished.elapsedMs).toBe(10 * MIN);
  });

  it('alternates short breaks and a long break every fourth focus block', () => {
    let s = t.initialTimer(d);
    const modes: string[] = [];
    for (let i = 0; i < 8; i++) {
      s = t.finish(t.start(s, 0), d, 100 * MIN).next;
      modes.push(s.mode);
    }
    expect(modes).toEqual(['short', 'focus', 'short', 'focus', 'short', 'focus', 'long', 'focus']);
    expect(s.remainingMs).toBe(25 * MIN);
  });

  it('does not count a focus shorter than the minimum or never started', () => {
    const unstarted = t.finish(t.initialTimer(d), d, 0);
    expect(unstarted.finished.counted).toBe(false);
    expect(unstarted.next).toMatchObject({ mode: 'short', completedFocus: 0 });
    const short = t.finish(t.start(t.initialTimer(d), 0), d, 5 * MIN - 1);
    expect(short.finished.counted).toBe(false);
    expect(short.next).toMatchObject({ mode: 'short', completedFocus: 0 });
    expect(t.finish(t.start(t.initialTimer(d), 0), d, 5 * MIN).finished.counted).toBe(true);
  });

  it('does not reach the long break through uncounted skips', () => {
    let s = { ...t.initialTimer(d), completedFocus: 3 };
    s = t.finish(t.start(s, 0), d, MIN).next;
    expect(s).toMatchObject({ mode: 'short', completedFocus: 3 });
    s = t.finish(t.finish(s, d, 0).next, d, 0).next;
    expect(s.mode).toBe('short');
  });

  it('reports the cycle within the current set', () => {
    let s = t.initialTimer(d);
    expect(t.cycleNumber(s, d)).toBe(1);
    s = t.finish(t.start(s, 0), d, 25 * MIN).next;
    expect(t.cycleNumber(s, d)).toBe(1);
    s = t.finish(s, d, 0).next;
    expect(t.cycleNumber(s, d)).toBe(2);
    s = t.finish(s, d, 0).next;
    expect(t.cycleNumber(s, d)).toBe(1);
    s = { ...s, completedFocus: 4, mode: 'long' };
    expect(t.cycleNumber(s, d)).toBe(4);
  });

  it('beeps only for an expiry seen within a minute of the scheduled end', () => {
    expect(t.beepDue(25 * MIN, 25 * MIN)).toBe(true);
    expect(t.beepDue(25 * MIN, 26 * MIN)).toBe(true);
    expect(t.beepDue(25 * MIN, 26 * MIN + 1)).toBe(false);
  });

  it('formats the clock as mm:ss rounding partial seconds up', () => {
    expect(t.formatClock(25 * MIN)).toBe('25:00');
    expect(t.formatClock(61_001)).toBe('01:02');
    expect(t.formatClock(0)).toBe('00:00');
  });
});
