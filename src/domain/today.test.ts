import { describe, expect, it } from 'vitest';
import { formatRow, todayPhases, totals } from './today';
import type { PhaseKind, PhaseRecord } from './timer';

const MIN = 60_000;

function at(h: number, m: number, day = 15): number {
  return new Date(2026, 10, day, h, m).getTime();
}

function rec(start: number, activeMs: number, kind: PhaseKind = 'focus', end = start + activeMs): PhaseRecord {
  return { start, end, kind, activeMs };
}

describe('todayPhases', () => {
  const now = at(12, 0);

  it('keeps records starting on the local day of now, oldest first', () => {
    const late = rec(at(15, 0), 25 * MIN);
    const early = rec(at(8, 0), 25 * MIN);
    expect(todayPhases([late, early], now)).toEqual([early, late]);
  });

  it('includes a record starting at local midnight and excludes one a millisecond earlier', () => {
    const midnight = rec(at(0, 0), MIN);
    const before = rec(at(0, 0) - 1, MIN);
    expect(todayPhases([before, midnight], now)).toEqual([midnight]);
  });

  it('excludes a record starting exactly at the next local midnight', () => {
    const next = rec(at(0, 0, 16), MIN);
    const last = rec(at(0, 0, 16) - 1, MIN);
    expect(todayPhases([next, last], now)).toEqual([last]);
  });

  it('assigns a phase spanning midnight to the day it started', () => {
    const spanning = rec(at(23, 50, 14), 25 * MIN, 'focus', at(0, 15));
    expect(todayPhases([spanning], at(23, 55, 14))).toEqual([spanning]);
    expect(todayPhases([spanning], now)).toEqual([]);
  });
});

describe('totals', () => {
  it('reads singular for one block', () => {
    expect(totals([rec(at(9, 0), 45 * MIN)])).toBe('1 block · 0h45 focus');
  });

  it('reads plural and pads minutes', () => {
    expect(totals([rec(at(9, 0), 50 * MIN), rec(at(10, 0), 50 * MIN), rec(at(11, 0), 5 * MIN)])).toBe(
      '3 blocks · 1h45 focus',
    );
    expect(totals([rec(at(9, 0), 125 * MIN), rec(at(12, 0), 75 * MIN)])).toBe('2 blocks · 3h20 focus');
  });

  it('counts only focus records', () => {
    const rows = [rec(at(9, 0), 25 * MIN), rec(at(9, 25), 5 * MIN, 'break'), rec(at(9, 30), 15 * MIN, 'longBreak')];
    expect(totals(rows)).toBe('1 block · 0h25 focus');
  });

  it('uses activeMs, not end minus start', () => {
    expect(totals([rec(at(9, 0), 20 * MIN, 'focus', at(10, 0))])).toBe('1 block · 0h20 focus');
  });

  it('reads zero when there are no blocks', () => {
    expect(totals([])).toBe('0 blocks · 0h00 focus');
  });
});

describe('formatRow', () => {
  it('formats a focus line', () => {
    expect(formatRow(rec(at(9, 40), 50 * MIN), 2)).toBe('#3 · 09:40–10:30 · Focus 50m');
  });

  it('formats a break and a long break', () => {
    expect(formatRow(rec(at(10, 30), 10 * MIN, 'break'), 3)).toBe('#4 · 10:30–10:40 · Break 10m');
    expect(formatRow(rec(at(10, 30), 15 * MIN, 'longBreak'), 3)).toBe('#4 · 10:30–10:45 · Long break 15m');
  });

  it('zero-pads clock times in 24-hour form', () => {
    expect(formatRow(rec(at(0, 5), 25 * MIN), 0)).toBe('#1 · 00:05–00:30 · Focus 25m');
  });

  it('rounds to the nearest minute', () => {
    expect(formatRow(rec(at(9, 0), 24 * MIN + 29_000), 0)).toContain('Focus 24m');
    expect(formatRow(rec(at(9, 0), 24 * MIN + 30_000), 0)).toContain('Focus 25m');
  });

  it('shows at least 1m', () => {
    expect(formatRow(rec(at(9, 0), 10_000, 'break'), 0)).toContain('Break 1m');
    expect(formatRow(rec(at(9, 0), 0, 'break'), 0)).toContain('Break 1m');
  });
});
