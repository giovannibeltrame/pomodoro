import { describe, expect, it } from 'vitest';
import {
  initialState,
  reduce,
  remainingMs,
  restore,
  scheduledEnd,
  type Classification,
  type TimerEvent,
  type TimerState,
} from './timer';

const MIN = 60_000;
const T0 = 1_000_000_000_000;
const cls: Classification = { quadrant: 2, roleId: 'r1', intention: 'write' };

function run(state: TimerState, event: TimerEvent, now: number) {
  return reduce(state, event, now);
}

function startFocus(state: TimerState, now = T0) {
  return run(state, { type: 'start', classification: cls }, now).state;
}

function completeFocus(state: TimerState, now: number) {
  const started = startFocus(state, now);
  return run(started, { type: 'tick' }, now + remainingMs(started, now));
}

function deepLongBreak() {
  let s = completeFocus(initialState('deep'), T0).state;
  s = run(s, { type: 'skip' }, T0 + 60 * MIN).state;
  return completeFocus(s, T0 + 70 * MIN).state;
}

describe('start', () => {
  it('requires a quadrant and a role on an idle Focus', () => {
    const s = initialState('classic');
    expect(run(s, { type: 'start' }, T0).state).toBe(s);
    const noQuadrant = { roleId: 'r1' } as unknown as Classification;
    expect(run(s, { type: 'start', classification: noQuadrant }, T0).state).toBe(s);
    const noRole = { quadrant: 1 } as unknown as Classification;
    expect(run(s, { type: 'start', classification: noRole }, T0).state).toBe(s);
    const started = run(s, { type: 'start', classification: cls }, T0).state;
    expect(started.status).toBe('running');
    expect(started.start).toBe(T0);
    expect(started.classification).toEqual(cls);
  });

  it('starts an idle break without a classification', () => {
    const brk = completeFocus(initialState('classic'), T0).state;
    expect(run(brk, { type: 'start' }, T0 + 30 * MIN).state.status).toBe('running');
  });

  it('does nothing while running or paused', () => {
    const running = startFocus(initialState('classic'));
    expect(run(running, { type: 'start', classification: cls }, T0 + 1).state).toBe(running);
    const paused = run(running, { type: 'pause' }, T0 + 1).state;
    expect(run(paused, { type: 'start', classification: cls }, T0 + 2).state).toBe(paused);
  });
});

describe('pause and resume', () => {
  it('freezes the remaining time and continues from it across several cycles', () => {
    let s = startFocus(initialState('classic'));
    s = run(s, { type: 'pause' }, T0 + 5 * MIN).state;
    expect(remainingMs(s, T0 + 5 * MIN)).toBe(20 * MIN);
    expect(remainingMs(s, T0 + 50 * MIN)).toBe(20 * MIN);
    s = run(s, { type: 'resume' }, T0 + 60 * MIN).state;
    expect(remainingMs(s, T0 + 60 * MIN)).toBe(20 * MIN);
    expect(remainingMs(s, T0 + 63 * MIN)).toBe(17 * MIN);
    s = run(s, { type: 'pause' }, T0 + 63 * MIN).state;
    s = run(s, { type: 'resume' }, T0 + 100 * MIN).state;
    expect(remainingMs(s, T0 + 100 * MIN)).toBe(17 * MIN);
    s = run(s, { type: 'pause' }, T0 + 102 * MIN).state;
    s = run(s, { type: 'resume' }, T0 + 200 * MIN).state;
    expect(remainingMs(s, T0 + 200 * MIN)).toBe(15 * MIN);
    expect(run(s, { type: 'tick' }, T0 + 214 * MIN).records).toEqual([]);
    const done = run(s, { type: 'tick' }, T0 + 215 * MIN);
    expect(done.records).toHaveLength(1);
    expect(done.records[0].end).toBe(T0 + 215 * MIN);
    expect(done.records[0].activeMs).toBe(25 * MIN);
    expect(done.records[0].start).toBe(T0);
  });

  it('ignores pause when not running and resume when not paused', () => {
    const idle = initialState('classic');
    expect(run(idle, { type: 'pause' }, T0).state).toBe(idle);
    expect(run(idle, { type: 'resume' }, T0).state).toBe(idle);
    const running = startFocus(idle);
    expect(run(running, { type: 'resume' }, T0 + 1).state).toBe(running);
  });

  it('does not end a paused phase on tick', () => {
    const paused = run(startFocus(initialState('classic')), { type: 'pause' }, T0 + MIN).state;
    const r = run(paused, { type: 'tick' }, T0 + 999 * MIN);
    expect(r.state).toBe(paused);
    expect(r.records).toEqual([]);
  });
});

describe('reset', () => {
  it('discards a running Focus without a record and keeps the cycle position', () => {
    const afterOne = completeFocus(initialState('classic'), T0).state;
    const brk = run(afterOne, { type: 'skip' }, T0 + 26 * MIN).state;
    expect(brk.position).toBe(2);
    const running = startFocus(brk, T0 + 30 * MIN);
    const r = run(running, { type: 'reset' }, T0 + 40 * MIN);
    expect(r.records).toEqual([]);
    expect(r.state.status).toBe('idle');
    expect(r.state.kind).toBe('focus');
    expect(r.state.position).toBe(2);
    expect(r.state.start).toBeNull();
    expect(r.state.classification).toBeNull();
  });

  it('discards a paused Focus without a record', () => {
    const paused = run(startFocus(initialState('classic')), { type: 'pause' }, T0 + MIN).state;
    const r = run(paused, { type: 'reset' }, T0 + 2 * MIN);
    expect(r.records).toEqual([]);
    expect(r.state).toEqual(initialState('classic'));
  });

  it('does nothing on an idle phase', () => {
    const idle = initialState('classic');
    expect(run(idle, { type: 'reset' }, T0).state).toBe(idle);
  });
});

describe('endEarly', () => {
  it('records a running Break with its actual end and activeMs', () => {
    const brk = completeFocus(initialState('classic'), T0).state;
    const running = run(brk, { type: 'start' }, T0 + 30 * MIN).state;
    const r = run(running, { type: 'endEarly' }, T0 + 32 * MIN);
    expect(r.records).toEqual([{ start: T0 + 30 * MIN, end: T0 + 32 * MIN, kind: 'break', activeMs: 2 * MIN }]);
    expect(r.state.status).toBe('idle');
    expect(r.state.kind).toBe('focus');
    expect(r.state.position).toBe(2);
  });

  it('records a paused Break excluding paused time', () => {
    const brk = completeFocus(initialState('classic'), T0).state;
    let s = run(brk, { type: 'start' }, T0 + 30 * MIN).state;
    s = run(s, { type: 'pause' }, T0 + 31 * MIN).state;
    const r = run(s, { type: 'endEarly' }, T0 + 40 * MIN);
    expect(r.records).toHaveLength(1);
    expect(r.records[0].activeMs).toBe(MIN);
    expect(r.records[0].end).toBe(T0 + 40 * MIN);
    expect(r.state.kind).toBe('focus');
  });

  it('records a Long break and returns the counter to 1', () => {
    const running = run(deepLongBreak(), { type: 'start' }, T0 + 120 * MIN).state;
    const r = run(running, { type: 'endEarly' }, T0 + 123 * MIN);
    expect(r.records[0]).toMatchObject({ kind: 'longBreak', activeMs: 3 * MIN });
    expect(r.state.kind).toBe('focus');
    expect(r.state.position).toBe(1);
  });

  it('ignores Focus and idle phases', () => {
    const idle = initialState('classic');
    expect(run(idle, { type: 'endEarly' }, T0).records).toEqual([]);
    const running = startFocus(idle);
    const r = run(running, { type: 'endEarly' }, T0 + MIN);
    expect(r.state).toBe(running);
    expect(r.records).toEqual([]);
  });
});

describe('skip', () => {
  it('skips an idle Break without a record', () => {
    const brk = completeFocus(initialState('classic'), T0).state;
    const r = run(brk, { type: 'skip' }, T0 + 26 * MIN);
    expect(r.records).toEqual([]);
    expect(r.state.kind).toBe('focus');
    expect(r.state.status).toBe('idle');
    expect(r.state.position).toBe(2);
  });

  it('skips an idle Long break, returning the counter to 1', () => {
    const r = run(deepLongBreak(), { type: 'skip' }, T0 + 120 * MIN);
    expect(r.records).toEqual([]);
    expect(r.state.kind).toBe('focus');
    expect(r.state.position).toBe(1);
  });

  it('does nothing on Focus or on a running Break', () => {
    const idle = initialState('classic');
    expect(run(idle, { type: 'skip' }, T0).state).toBe(idle);
    const brk = completeFocus(idle, T0).state;
    const running = run(brk, { type: 'start' }, T0 + 26 * MIN).state;
    expect(run(running, { type: 'skip' }, T0 + 27 * MIN).state).toBe(running);
  });
});

describe('tick', () => {
  it('does nothing before the scheduled end and when idle', () => {
    const idle = initialState('classic');
    expect(run(idle, { type: 'tick' }, T0).state).toBe(idle);
    const running = startFocus(idle);
    const r = run(running, { type: 'tick' }, T0 + 25 * MIN - 1);
    expect(r.state).toBe(running);
    expect(r.records).toEqual([]);
  });

  it('emits one record ending at the scheduled end, not now, with the locked classification', () => {
    const running = startFocus(initialState('classic'));
    const r = run(running, { type: 'tick' }, T0 + 40 * MIN);
    expect(r.records).toEqual([
      {
        start: T0,
        end: T0 + 25 * MIN,
        kind: 'focus',
        activeMs: 25 * MIN,
        quadrant: 2,
        roleId: 'r1',
        intention: 'write',
      },
    ]);
  });

  it('emits a record exactly at the scheduled end and no second record afterwards', () => {
    const running = startFocus(initialState('classic'));
    const first = run(running, { type: 'tick' }, T0 + 25 * MIN);
    expect(first.records).toHaveLength(1);
    const second = run(first.state, { type: 'tick' }, T0 + 26 * MIN);
    expect(second.records).toEqual([]);
    expect(second.state).toBe(first.state);
  });

  it('omits an empty intention and records breaks without classification', () => {
    const noIntention = run(
      initialState('classic'),
      { type: 'start', classification: { quadrant: 1, roleId: 'r2' } },
      T0,
    ).state;
    const done = run(noIntention, { type: 'tick' }, T0 + 25 * MIN);
    expect(done.records[0]).not.toHaveProperty('intention');
    const brk = run(done.state, { type: 'start' }, T0 + 26 * MIN).state;
    const brkDone = run(brk, { type: 'tick' }, T0 + 31 * MIN);
    expect(brkDone.records).toEqual([{ start: T0 + 26 * MIN, end: T0 + 31 * MIN, kind: 'break', activeMs: 5 * MIN }]);
  });
});

describe('sequencing', () => {
  it('prepares the next phase idle and never auto-starts', () => {
    const r = completeFocus(initialState('classic'), T0);
    expect(r.state.status).toBe('idle');
    expect(r.state.kind).toBe('break');
    expect(r.state.start).toBeNull();
    const brk = run(r.state, { type: 'start' }, T0 + 26 * MIN).state;
    const after = run(brk, { type: 'tick' }, T0 + 31 * MIN);
    expect(after.state.status).toBe('idle');
    expect(after.state.kind).toBe('focus');
  });

  it('gives a Long break after the Nth block and a Break after any other (classic)', () => {
    let s = initialState('classic');
    let now = T0;
    const kinds: string[] = [];
    for (let i = 0; i < 4; i++) {
      s = completeFocus(s, now).state;
      kinds.push(s.kind);
      now += 100 * MIN;
      s = run(s, { type: 'skip' }, now).state;
    }
    expect(kinds).toEqual(['break', 'break', 'break', 'longBreak']);
    expect(s.kind).toBe('focus');
    expect(s.position).toBe(1);
  });

  it('gives a Long break after every 2nd block in Deep', () => {
    const afterFirst = completeFocus(initialState('deep'), T0).state;
    expect(afterFirst.kind).toBe('break');
    expect(deepLongBreak().kind).toBe('longBreak');
  });

  it('advances the counter only after a completed focus block', () => {
    let s = initialState('classic');
    expect(s.position).toBe(1);
    s = startFocus(s);
    s = run(s, { type: 'pause' }, T0 + MIN).state;
    s = run(s, { type: 'reset' }, T0 + 2 * MIN).state;
    expect(s.position).toBe(1);
    s = completeFocus(s, T0 + 3 * MIN).state;
    expect(s.position).toBe(2);
    const brk = run(s, { type: 'start' }, T0 + 40 * MIN).state;
    s = run(brk, { type: 'endEarly' }, T0 + 41 * MIN).state;
    expect(s.kind).toBe('focus');
    expect(s.position).toBe(2);
  });

  it('returns the counter to 1 after a completed long break', () => {
    let s = run(deepLongBreak(), { type: 'start' }, T0 + 130 * MIN).state;
    s = run(s, { type: 'tick' }, T0 + 145 * MIN).state;
    expect(s.kind).toBe('focus');
    expect(s.position).toBe(1);
  });
});

describe('setPreset', () => {
  it('applies while idle: counter to 1 and an idle Focus', () => {
    let s = completeFocus(initialState('classic'), T0).state;
    s = run(s, { type: 'setPreset', preset: 'deep' }, T0 + 30 * MIN).state;
    expect(s).toEqual(initialState('deep'));
  });

  it('returns the state unchanged while running or paused', () => {
    const running = startFocus(initialState('classic'));
    expect(run(running, { type: 'setPreset', preset: 'deep' }, T0 + 1).state).toBe(running);
    const paused = run(running, { type: 'pause' }, T0 + 2).state;
    expect(run(paused, { type: 'setPreset', preset: 'deep' }, T0 + 3).state).toBe(paused);
  });
});

describe('restore', () => {
  it('restores a running phase with the remaining time to the scheduled end', () => {
    const s = startFocus(initialState('classic'));
    const now = T0 + 10 * MIN;
    const { state, records } = restore(s, now);
    expect(records).toEqual([]);
    expect(state).toEqual(s);
    expect(state.status).toBe('running');
    expect(remainingMs(state, now)).toBe((scheduledEnd(s) as number) - now);
    expect(remainingMs(state, now)).toBe(15 * MIN);
  });

  it('restores a paused phase with the same remaining time', () => {
    let s = startFocus(initialState('classic'));
    s = run(s, { type: 'pause' }, T0 + 5 * MIN).state;
    const { state, records } = restore(s, T0 + 500 * MIN);
    expect(records).toEqual([]);
    expect(state).toEqual(s);
    expect(remainingMs(state, T0 + 500 * MIN)).toBe(20 * MIN);
  });

  it('restores an idle state unchanged', () => {
    const s = initialState('deep');
    expect(restore(s, T0)).toEqual({ state: s, records: [] });
  });

  it('records an expired focus at the scheduled end and prepares a break', () => {
    const s = startFocus(initialState('classic'));
    const { state, records } = restore(s, T0 + 180 * MIN);
    expect(records).toEqual([
      {
        start: T0,
        end: T0 + 25 * MIN,
        kind: 'focus',
        activeMs: 25 * MIN,
        quadrant: 2,
        roleId: 'r1',
        intention: 'write',
      },
    ]);
    expect(state).toMatchObject({ kind: 'break', status: 'idle', position: 2 });
  });

  it('counts a phase ending exactly now as ended', () => {
    const s = startFocus(initialState('classic'));
    const { state, records } = restore(s, T0 + 25 * MIN);
    expect(records).toHaveLength(1);
    expect(records[0].end).toBe(T0 + 25 * MIN);
    expect(state.status).toBe('idle');
  });

  it('keeps a phase running one millisecond before its end', () => {
    const s = startFocus(initialState('classic'));
    const { state, records } = restore(s, T0 + 25 * MIN - 1);
    expect(records).toEqual([]);
    expect(remainingMs(state, T0 + 25 * MIN - 1)).toBe(1);
  });

  it('records an expired break and prepares the next focus', () => {
    const brk = completeFocus(initialState('classic'), T0).state;
    const started = run(brk, { type: 'start' }, T0 + 30 * MIN).state;
    const { state, records } = restore(started, T0 + 500 * MIN);
    expect(records).toEqual([{ start: T0 + 30 * MIN, end: T0 + 35 * MIN, kind: 'break', activeMs: 5 * MIN }]);
    expect(state).toMatchObject({ kind: 'focus', status: 'idle', position: 2 });
  });

  it('records an expired long break and returns the counter to 1', () => {
    const started = run(deepLongBreak(), { type: 'start' }, T0 + 200 * MIN).state;
    const { state, records } = restore(started, T0 + 900 * MIN);
    expect(records).toEqual([{ start: T0 + 200 * MIN, end: T0 + 215 * MIN, kind: 'longBreak', activeMs: 15 * MIN }]);
    expect(state).toMatchObject({ kind: 'focus', status: 'idle', position: 1 });
  });
});
