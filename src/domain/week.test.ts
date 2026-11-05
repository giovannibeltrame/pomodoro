import { describe, expect, it } from 'vitest';
import type { Block } from './types';
import { addWeeks, startOfWeek, summarizeWeek, weekKey } from './week';

function at(y: number, m: number, d: number, h = 10): number {
  return new Date(y, m - 1, d, h).getTime();
}

function block(endedAt: number, quadrant: Block['quadrant'], role = 'Dev'): Block {
  return { id: String(endedAt) + quadrant, quadrant, role, goal: '', startedAt: endedAt - 25 * 60_000, endedAt, focusMs: 25 * 60_000 };
}

describe('week', () => {
  it('starts weeks on Monday at local midnight', () => {
    expect(weekKey(startOfWeek(at(2026, 11, 5)))).toBe('2026-11-02');
    expect(weekKey(startOfWeek(at(2026, 11, 8, 23)))).toBe('2026-11-02');
    expect(weekKey(startOfWeek(at(2026, 11, 9, 0)))).toBe('2026-11-09');
  });

  it('compares planned and done per quadrant and ignores other weeks', () => {
    const ws = startOfWeek(at(2026, 11, 5));
    const blocks = [
      block(at(2026, 11, 2), 'q1'),
      block(at(2026, 11, 3), 'q2'),
      block(at(2026, 11, 3, 15), 'q2', 'Líder'),
      block(at(2026, 11, 8, 22), 'q3'),
      block(at(2026, 11, 1), 'q1'),
      block(addWeeks(ws, 1), 'q2'),
    ];
    const s = summarizeWeek(blocks, ws, { q1: 6, q2: 8, q3: 4 });
    expect(s.byQuadrant).toEqual({ q1: { planned: 6, done: 1 }, q2: { planned: 8, done: 2 }, q3: { planned: 4, done: 1 } });
    expect(s.totalPlanned).toBe(18);
    expect(s.totalDone).toBe(4);
    expect(s.focusMs).toBe(100 * 60_000);
    expect(s.days.map((d) => d.total)).toEqual([1, 2, 0, 0, 0, 0, 1]);
    expect(s.days[1].counts).toEqual({ q1: 0, q2: 2, q3: 0 });
    expect(s.roles.map((r) => [r.role, r.blocks])).toEqual([
      ['Dev', 3],
      ['Líder', 1],
    ]);
  });
});
