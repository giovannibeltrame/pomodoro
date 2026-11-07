import type { Durations, Mode } from './types';

export interface TimerState {
  mode: Mode;
  endsAt: number | null;
  remainingMs: number;
  startedAt: number | null;
  completedFocus: number;
}

interface FinishedSegment {
  mode: Mode;
  startedAt: number;
  endedAt: number;
  elapsedMs: number;
  counted: boolean;
}

export function durationMs(mode: Mode, d: Durations): number {
  return d[mode] * 60_000;
}

export function initialTimer(d: Durations): TimerState {
  return { mode: 'focus', endsAt: null, remainingMs: durationMs('focus', d), startedAt: null, completedFocus: 0 };
}

/**
 * Time left in the segment. While running, `remainingMs` holds the value at
 * the last start, so it caps readings taken with a clock older than the start.
 */
export function remaining(s: TimerState, now: number): number {
  return s.endsAt === null ? s.remainingMs : Math.min(s.remainingMs, Math.max(0, s.endsAt - now));
}

export function start(s: TimerState, now: number): TimerState {
  if (s.endsAt !== null) return s;
  return { ...s, endsAt: now + s.remainingMs, startedAt: s.startedAt ?? now };
}

export function pause(s: TimerState, now: number): TimerState {
  if (s.endsAt === null) return s;
  return { ...s, endsAt: null, remainingMs: remaining(s, now) };
}

export function reset(s: TimerState, d: Durations): TimerState {
  return { ...s, endsAt: null, startedAt: null, remainingMs: durationMs(s.mode, d) };
}

export function setMode(s: TimerState, mode: Mode, d: Durations): TimerState {
  return reset({ ...s, mode }, d);
}

export function cycleNumber(s: TimerState, d: Durations): number {
  const inSet = s.completedFocus % d.longEvery;
  if (s.mode === 'focus') return inSet + 1;
  if (s.mode === 'long') return d.longEvery;
  return Math.max(inSet, 1);
}

/**
 * Ends the current segment (natural completion or skip) and returns the next
 * segment's state. A focus segment counts only if it lasted at least
 * `minFocus` minutes; a counted focus advances the cycle and chooses a long
 * break every `longEvery` focus blocks, while an uncounted one moves to a
 * short break without advancing. A break always returns to focus.
 */
export function finish(s: TimerState, d: Durations, now: number): { next: TimerState; finished: FinishedSegment } {
  const left = remaining(s, now);
  const endedAt = s.endsAt !== null && now > s.endsAt ? s.endsAt : now;
  const elapsedMs = durationMs(s.mode, d) - left;
  const counted = s.mode === 'focus' && elapsedMs >= d.minFocus * 60_000;
  const finished: FinishedSegment = {
    mode: s.mode,
    startedAt: s.startedAt ?? endedAt - elapsedMs,
    endedAt,
    elapsedMs,
    counted,
  };
  const completedFocus = counted ? s.completedFocus + 1 : s.completedFocus;
  const nextMode: Mode = s.mode !== 'focus' ? 'focus' : counted && completedFocus % d.longEvery === 0 ? 'long' : 'short';
  return { next: setMode({ ...s, completedFocus }, nextMode, d), finished };
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
