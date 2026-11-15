import { describe, expect, it } from 'vitest';
import { clock, entries, isNewDay, phaseLength, todayPhases, totals } from './today';
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
    expect(totals([rec(at(9, 0), 45 * MIN)])).toBe('1 block · 0h45');
  });

  it('reads plural and pads minutes', () => {
    expect(totals([rec(at(9, 0), 50 * MIN), rec(at(10, 0), 50 * MIN), rec(at(11, 0), 5 * MIN)])).toBe(
      '3 blocks · 1h45',
    );
    expect(totals([rec(at(9, 0), 125 * MIN), rec(at(12, 0), 75 * MIN)])).toBe('2 blocks · 3h20');
  });

  it('counts only focus records', () => {
    const rows = [rec(at(9, 0), 25 * MIN), rec(at(9, 25), 5 * MIN, 'break'), rec(at(9, 30), 15 * MIN, 'longBreak')];
    expect(totals(rows)).toBe('1 block · 0h25');
  });

  it('uses activeMs, not end minus start', () => {
    expect(totals([rec(at(9, 0), 20 * MIN, 'focus', at(10, 0))])).toBe('1 block · 0h20');
  });

  it('reads zero when there are no blocks', () => {
    expect(totals([])).toBe('0 blocks · 0h00');
  });
});

describe('phaseLength', () => {
  it('names the kind and its active minutes', () => {
    expect(phaseLength(rec(at(9, 40), 50 * MIN))).toBe('Focus 50m');
    expect(phaseLength(rec(at(10, 30), 10 * MIN, 'break'))).toBe('Break 10m');
    expect(phaseLength(rec(at(10, 30), 15 * MIN, 'longBreak'))).toBe('Long break 15m');
  });

  it('rounds to the nearest minute', () => {
    expect(phaseLength(rec(at(9, 0), 24 * MIN + 29_000))).toBe('Focus 24m');
    expect(phaseLength(rec(at(9, 0), 24 * MIN + 30_000))).toBe('Focus 25m');
  });

  it('shows at least 1m', () => {
    expect(phaseLength(rec(at(9, 0), 10_000, 'break'))).toBe('Break 1m');
    expect(phaseLength(rec(at(9, 0), 0, 'break'))).toBe('Break 1m');
  });
});

describe('clock', () => {
  it('zero-pads 24-hour times', () => {
    expect(clock(at(0, 5))).toBe('00:05');
    expect(clock(at(14, 30))).toBe('14:30');
  });
});

describe('entries', () => {
  const focusA = rec(at(9, 0), 25 * MIN);
  const breakA = rec(at(9, 25), 5 * MIN, 'break');
  const focusB = rec(at(9, 30), 25 * MIN);
  const longB = rec(at(9, 55), 15 * MIN, 'longBreak');

  it('folds the break after a focus block into it, newest first', () => {
    expect(entries([focusA, breakA, focusB, longB])).toEqual([
      { record: focusB, rest: longB },
      { record: focusA, rest: breakA },
    ]);
  });

  it('keeps a focus block without a break on its own', () => {
    expect(entries([focusA, focusB, longB])).toEqual([{ record: focusB, rest: longB }, { record: focusA }]);
  });

  it('keeps a break with no focus block before it on its own', () => {
    expect(entries([breakA, focusB])).toEqual([{ record: focusB }, { record: breakA }]);
  });

  it('folds only the first of two breaks in a row', () => {
    expect(entries([focusA, breakA, longB])).toEqual([{ record: longB }, { record: focusA, rest: breakA }]);
  });

  it('is empty for no records', () => {
    expect(entries([])).toEqual([]);
  });
});

describe('isNewDay', () => {
  const now = at(9, 0);

  it('is true when there are no records', () => {
    expect(isNewDay([], now)).toBe(true);
  });

  it('is false when the latest record starts today, even if older ones do not', () => {
    expect(isNewDay([rec(at(15, 10, 14), MIN), rec(at(8, 0), MIN)], now)).toBe(false);
  });

  it('is true when the latest record starts yesterday', () => {
    expect(isNewDay([rec(at(8, 0, 13), MIN), rec(at(17, 0, 14), MIN)], now)).toBe(true);
  });

  it('treats a record starting at local midnight as today and one a millisecond earlier as yesterday', () => {
    expect(isNewDay([rec(at(0, 0), MIN)], now)).toBe(false);
    expect(isNewDay([rec(at(0, 0) - 1, MIN)], now)).toBe(true);
  });
});
