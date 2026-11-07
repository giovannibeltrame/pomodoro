import { describe, expect, it } from 'vitest';
import { BLOCKS_KEY, STATE_KEY, initialState, load, planFor, reducer, save, type AppState } from './store';

const MIN = 60_000;

function run(state: AppState, ...actions: Parameters<typeof reducer>[1][]): AppState {
  return actions.reduce(reducer, state);
}

function memoryStorage() {
  const mem = new Map<string, string>();
  const writes: string[] = [];
  return {
    mem,
    writes,
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      writes.push(k);
      mem.set(k, v);
    },
  };
}

describe('store', () => {
  it('records a block with the selected quadrant, role and goal when focus expires', () => {
    const s = run(
      initialState(),
      { type: 'selectQuadrant', quadrant: 'q1' },
      { type: 'addRole', role: 'Revisor' },
      { type: 'setGoal', goal: '  Corrigir deploy  ' },
      { type: 'start', now: 0 },
      { type: 'expire', now: 25 * MIN, id: 'b1' },
    );
    expect(s.blocks).toEqual([
      { id: 'b1', quadrant: 'q1', role: 'Revisor', goal: 'Corrigir deploy', startedAt: 0, endedAt: 25 * MIN, focusMs: 25 * MIN },
    ]);
    expect(s.timer.mode).toBe('short');
  });

  it('does not record breaks or unstarted skipped focus blocks', () => {
    const s = run(
      initialState(),
      { type: 'skip', now: 0, id: 'skip' },
      { type: 'start', now: 0 },
      { type: 'expire', now: 5 * MIN, id: 'break' },
    );
    expect(s.blocks).toEqual([]);
    expect(s.timer.mode).toBe('focus');
  });

  it('discards a skipped focus block shorter than five minutes', () => {
    const started = run(initialState(), { type: 'start', now: 0 });
    expect(run(started, { type: 'skip', now: 5 * MIN - 1, id: 'short' }).blocks).toEqual([]);
    expect(run(started, { type: 'skip', now: 5 * MIN, id: 'kept' }).blocks.map((b) => b.focusMs)).toEqual([5 * MIN]);
  });

  it('ignores an expiry that is early, repeated, or for a paused timer', () => {
    const started = run(initialState(), { type: 'start', now: 0 });
    expect(run(started, { type: 'expire', now: 24 * MIN, id: 'early' })).toBe(started);
    const done = run(started, { type: 'expire', now: 25 * MIN, id: 'b1' }, { type: 'expire', now: 25 * MIN, id: 'b2' });
    expect(done.blocks.map((b) => b.id)).toEqual(['b1']);
    expect(done.timer.mode).toBe('short');
    const paused = run(started, { type: 'pause', now: MIN });
    expect(run(paused, { type: 'expire', now: 99 * MIN, id: 'x' })).toBe(paused);
  });

  it('carries a current or future plan forward to later weeks without their own plan', () => {
    const s = run(
      initialState(),
      { type: 'setPlan', weekKey: '2026-11-02', currentWeekKey: '2026-11-02', plan: { q1: 2, q2: 10, q3: 1 } },
      { type: 'setPlan', weekKey: '2026-11-23', currentWeekKey: '2026-11-02', plan: { q1: 0, q2: 12, q3: 0 } },
    );
    expect(planFor(s, '2026-10-26')).toMatchObject({ q1: 6, q2: 8, q3: 4 });
    expect(planFor(s, '2026-11-02')).toMatchObject({ q1: 2, q2: 10, q3: 1 });
    expect(planFor(s, '2026-11-16')).toMatchObject({ q1: 2, q2: 10, q3: 1 });
    expect(planFor(s, '2026-11-30')).toMatchObject({ q1: 0, q2: 12, q3: 0 });
  });

  it('applies a plan saved for a past week to that week only', () => {
    const s = run(
      initialState(),
      { type: 'setPlan', weekKey: '2026-10-19', currentWeekKey: '2026-10-19', plan: { q1: 1, q2: 1, q3: 1 } },
      { type: 'setPlan', weekKey: '2026-10-26', currentWeekKey: '2026-11-09', plan: { q1: 9, q2: 9, q3: 9 } },
    );
    expect(planFor(s, '2026-10-26')).toMatchObject({ q1: 9, q2: 9, q3: 9 });
    expect(planFor(s, '2026-11-02')).toMatchObject({ q1: 1, q2: 1, q3: 1 });
  });

  it('loads plans stored without a carries flag as carrying and drops the old default plan', () => {
    const storage = memoryStorage();
    storage.mem.set(STATE_KEY, JSON.stringify({ plans: { '2026-11-02': { q1: 3, q2: 3, q3: 3 } }, defaultPlan: { q1: 3, q2: 3, q3: 3 } }));
    const s = load(storage);
    expect(s).not.toHaveProperty('defaultPlan');
    expect(s.plans['2026-11-02'].carries).toBe(true);
    expect(planFor(s, '2026-11-09')).toMatchObject({ q1: 3, q2: 3, q3: 3 });
  });

  it('ignores a mode switch to the current mode', () => {
    const started = run(initialState(), { type: 'start', now: 0 });
    expect(run(started, { type: 'setMode', mode: 'focus' })).toBe(started);
    expect(run(started, { type: 'setMode', mode: 'short' }).timer.endsAt).toBeNull();
  });

  it('round-trips state through storage and survives corrupt data', () => {
    const storage = memoryStorage();
    const s = run(initialState(), { type: 'start', now: 0 }, { type: 'expire', now: 25 * MIN, id: 'b1' });
    expect(save(storage, s)).toBe(true);
    expect(load(storage)).toEqual(s);
    storage.mem.set(STATE_KEY, '{not json');
    expect(load(storage)).toEqual({ ...initialState(), blocks: s.blocks });
    storage.mem.set(BLOCKS_KEY, '{not json');
    expect(load(storage)).toEqual(initialState());
  });

  it('reports a failed write so the caller can retry it', () => {
    const failing = {
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(save(failing, initialState())).toBe(false);
  });

  it('rewrites block history only when it changed', () => {
    const storage = memoryStorage();
    const a = initialState();
    const b = run(a, { type: 'setGoal', goal: 'x' });
    save(storage, b, a);
    expect(storage.writes).toEqual([STATE_KEY]);
    const c = run(b, { type: 'start', now: 0 }, { type: 'expire', now: 25 * MIN, id: 'b1' });
    save(storage, c, b);
    expect(storage.writes).toEqual([STATE_KEY, STATE_KEY, BLOCKS_KEY]);
  });
});
