export type Preset = 'classic' | 'deep';
export type PhaseKind = 'focus' | 'break' | 'longBreak';
export type Quadrant = 1 | 2 | 3 | 4;

export interface Classification {
  quadrant: Quadrant;
  roleId: string;
  intention?: string;
}

export interface PhaseRecord {
  start: number;
  end: number;
  kind: PhaseKind;
  activeMs: number;
  quadrant?: Quadrant;
  roleId?: string;
  intention?: string;
}

export interface TimerState {
  preset: Preset;
  kind: PhaseKind;
  status: 'idle' | 'running' | 'paused';
  position: number;
  start: number | null;
  activeMs: number;
  segmentStart: number | null;
  pausedAt: number | null;
  classification: Classification | null;
}

export type TimerEvent =
  | { type: 'start'; classification?: Classification }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'reset' }
  | { type: 'skip' }
  | { type: 'endEarly' }
  | { type: 'tick' }
  | { type: 'setPreset'; preset: Preset };

export interface ReduceResult {
  state: TimerState;
  records: PhaseRecord[];
}

const MINUTE = 60_000;

export const PRESETS: Record<Preset, { focus: number; break: number; longBreak: number; blocksPerCycle: number }> = {
  classic: { focus: 25 * MINUTE, break: 5 * MINUTE, longBreak: 15 * MINUTE, blocksPerCycle: 4 },
  deep: { focus: 50 * MINUTE, break: 10 * MINUTE, longBreak: 15 * MINUTE, blocksPerCycle: 2 },
};

export function durationMs(preset: Preset, kind: PhaseKind): number {
  return PRESETS[preset][kind];
}

export function initialState(preset: Preset): TimerState {
  return idle(preset, 'focus', 1);
}

function idle(preset: Preset, kind: PhaseKind, position: number): TimerState {
  return {
    preset,
    kind,
    status: 'idle',
    position,
    start: null,
    activeMs: 0,
    segmentStart: null,
    pausedAt: null,
    classification: null,
  };
}

export function remainingMs(state: TimerState, now: number): number {
  const total = durationMs(state.preset, state.kind);
  if (state.status === 'idle') return total;
  return Math.max(0, total - activeSoFar(state, now));
}

export function scheduledEnd(state: TimerState): number | null {
  if (state.status !== 'running' || state.segmentStart === null) return null;
  return state.segmentStart + durationMs(state.preset, state.kind) - state.activeMs;
}

function activeSoFar(state: TimerState, now: number): number {
  if (state.status === 'running' && state.segmentStart !== null) {
    return state.activeMs + Math.max(0, now - state.segmentStart);
  }
  return state.activeMs;
}

function nextAfterCompletion(state: TimerState): TimerState {
  const { preset, kind, position } = state;
  if (kind === 'focus') {
    if (position >= PRESETS[preset].blocksPerCycle) return idle(preset, 'longBreak', position);
    return idle(preset, 'break', position + 1);
  }
  if (kind === 'longBreak') return idle(preset, 'focus', 1);
  return idle(preset, 'focus', position);
}

function makeRecord(state: TimerState, end: number, activeMs: number): PhaseRecord {
  const record: PhaseRecord = {
    start: state.start as number,
    end,
    kind: state.kind,
    activeMs,
  };
  if (state.kind === 'focus' && state.classification) {
    record.quadrant = state.classification.quadrant;
    record.roleId = state.classification.roleId;
    if (state.classification.intention) record.intention = state.classification.intention;
  }
  return record;
}

export function restore(stored: TimerState, now: number): ReduceResult {
  return reduce(stored, { type: 'tick' }, now);
}

export function reduce(state: TimerState, event: TimerEvent, now: number): ReduceResult {
  const unchanged: ReduceResult = { state, records: [] };

  switch (event.type) {
    case 'start': {
      if (state.status !== 'idle') return unchanged;
      let classification: Classification | null = null;
      if (state.kind === 'focus') {
        const c = event.classification;
        if (!c || !c.quadrant || !c.roleId) return unchanged;
        classification = { ...c };
      }
      return {
        state: {
          ...state,
          status: 'running',
          start: now,
          activeMs: 0,
          segmentStart: now,
          pausedAt: null,
          classification,
        },
        records: [],
      };
    }
    case 'pause': {
      if (state.status !== 'running') return unchanged;
      return {
        state: {
          ...state,
          status: 'paused',
          activeMs: activeSoFar(state, now),
          segmentStart: null,
          pausedAt: now,
        },
        records: [],
      };
    }
    case 'resume': {
      if (state.status !== 'paused') return unchanged;
      return {
        state: { ...state, status: 'running', segmentStart: now, pausedAt: null },
        records: [],
      };
    }
    case 'reset': {
      if (state.status === 'idle' || state.kind !== 'focus') return unchanged;
      return { state: idle(state.preset, 'focus', state.position), records: [] };
    }
    case 'skip': {
      if (state.status !== 'idle' || state.kind === 'focus') return unchanged;
      return { state: nextAfterCompletion(state), records: [] };
    }
    case 'endEarly': {
      if (state.status === 'idle' || state.kind === 'focus') return unchanged;
      return {
        state: nextAfterCompletion(state),
        records: [makeRecord(state, now, activeSoFar(state, now))],
      };
    }
    case 'tick': {
      const end = scheduledEnd(state);
      if (end === null || now < end) return unchanged;
      return {
        state: nextAfterCompletion(state),
        records: [makeRecord(state, end, durationMs(state.preset, state.kind))],
      };
    }
    case 'setPreset': {
      if (state.status !== 'idle') return unchanged;
      return { state: initialState(event.preset), records: [] };
    }
  }
}
