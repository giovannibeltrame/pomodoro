import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, initialState, load, planFor, reducer, save, type AppState } from './store';

const MIN = 60_000;

function run(state: AppState, ...actions: Parameters<typeof reducer>[1][]): AppState {
  return actions.reduce(reducer, state);
}

describe('store', () => {
  it('records a block with the selected quadrant, role and goal when focus finishes', () => {
    const s = run(
      initialState(),
      { type: 'selectQuadrant', quadrant: 'q1' },
      { type: 'addRole', role: 'Revisor' },
      { type: 'setGoal', goal: '  Corrigir deploy  ' },
      { type: 'start', now: 0 },
      { type: 'finish', now: 25 * MIN, id: 'b1', endsAt: 25 * MIN },
    );
    expect(s.blocks).toEqual([
      { id: 'b1', quadrant: 'q1', role: 'Revisor', goal: 'Corrigir deploy', startedAt: 0, endedAt: 25 * MIN, focusMs: 25 * MIN },
    ]);
    expect(s.timer.mode).toBe('short');
  });

  it('does not record breaks or unstarted skipped focus blocks', () => {
    const s = run(
      initialState(),
      { type: 'finish', now: 0, id: 'skip', endsAt: null },
      { type: 'start', now: 0 },
      { type: 'finish', now: 5 * MIN, id: 'break', endsAt: 5 * MIN },
    );
    expect(s.blocks).toEqual([]);
    expect(s.timer.mode).toBe('focus');
  });

  it('ignores a repeated completion of the same segment', () => {
    const done = { type: 'finish', now: 25 * MIN, id: 'b1', endsAt: 25 * MIN } as const;
    const s = run(initialState(), { type: 'start', now: 0 }, done, { ...done, id: 'b2' });
    expect(s.blocks.map((b) => b.id)).toEqual(['b1']);
    expect(s.timer.mode).toBe('short');
  });

  it('carries the latest plan forward to weeks without their own plan', () => {
    const s = run(initialState(), { type: 'setPlan', weekKey: '2026-11-02', plan: { q1: 2, q2: 10, q3: 1 } });
    expect(planFor(s, '2026-11-02')).toEqual({ q1: 2, q2: 10, q3: 1 });
    expect(planFor(s, '2026-11-09')).toEqual({ q1: 2, q2: 10, q3: 1 });
    expect(planFor(initialState(), '2026-11-02')).toEqual({ q1: 6, q2: 8, q3: 4 });
  });

  it('round-trips state through storage and survives corrupt data', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const s = run(initialState(), { type: 'start', now: 0 }, { type: 'finish', now: 25 * MIN, id: 'b1', endsAt: 25 * MIN });
    save(storage, s);
    expect(load(storage)).toEqual(s);
    mem.set(STORAGE_KEY, '{not json');
    expect(load(storage)).toEqual(initialState());
  });
});
