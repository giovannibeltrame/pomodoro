import * as timer from '../domain/timer';
import type { Block, Durations, Mode, Plan, Quadrant } from '../domain/types';

export const STATE_KEY = 'pomodoro:v1:state';
export const BLOCKS_KEY = 'pomodoro:v1:blocks';

export const DURATIONS: Durations = { focus: 25, short: 5, long: 15, longEvery: 4 };
const DEFAULT_PLAN: Plan = { q1: 6, q2: 8, q3: 4 };
const DEFAULT_ROLES = [
  'Arquiteto de Software',
  'Líder Técnico',
  'Criador de Conteúdo',
  'Gestor de Produtos',
  'Pesquisador / Estudioso',
  'Operador de Infraestrutura',
];

export interface AppState {
  timer: timer.TimerState;
  quadrant: Quadrant;
  role: string;
  goal: string;
  roles: string[];
  blocks: Block[];
  plans: Record<string, Plan>;
  defaultPlan: Plan;
}

export type Action =
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'reset' }
  | { type: 'setMode'; mode: Mode }
  | { type: 'expire'; now: number; id: string }
  | { type: 'skip'; now: number; id: string }
  | { type: 'selectQuadrant'; quadrant: Quadrant }
  | { type: 'selectRole'; role: string }
  | { type: 'addRole'; role: string }
  | { type: 'setGoal'; goal: string }
  | { type: 'setPlan'; weekKey: string; plan: Plan };

export function initialState(): AppState {
  return {
    timer: timer.initialTimer(DURATIONS),
    quadrant: 'q2',
    role: DEFAULT_ROLES[0],
    goal: '',
    roles: DEFAULT_ROLES,
    blocks: [],
    plans: {},
    defaultPlan: DEFAULT_PLAN,
  };
}

export function planFor(state: AppState, key: string): Plan {
  return state.plans[key] ?? state.defaultPlan;
}

function finish(state: AppState, now: number, id: string): AppState {
  const { next, finished } = timer.finish(state.timer, DURATIONS, now);
  if (finished.mode !== 'focus' || finished.elapsedMs <= 0) return { ...state, timer: next };
  const block: Block = {
    id,
    quadrant: state.quadrant,
    role: state.role,
    goal: state.goal.trim(),
    startedAt: finished.startedAt,
    endedAt: finished.endedAt,
    focusMs: finished.elapsedMs,
  };
  return { ...state, timer: next, blocks: [...state.blocks, block] };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'start':
      return { ...state, timer: timer.start(state.timer, action.now) };
    case 'pause':
      return { ...state, timer: timer.pause(state.timer, action.now) };
    case 'reset':
      return { ...state, timer: timer.reset(state.timer, DURATIONS) };
    case 'setMode':
      return { ...state, timer: timer.setMode(state.timer, action.mode, DURATIONS) };
    case 'expire': {
      const { endsAt } = state.timer;
      return endsAt !== null && action.now >= endsAt ? finish(state, action.now, action.id) : state;
    }
    case 'skip':
      return finish(state, action.now, action.id);
    case 'selectQuadrant':
      return { ...state, quadrant: action.quadrant };
    case 'selectRole':
      return { ...state, role: action.role };
    case 'addRole': {
      const role = action.role.trim();
      if (!role) return state;
      const roles = state.roles.includes(role) ? state.roles : [...state.roles, role];
      return { ...state, roles, role };
    }
    case 'setGoal':
      return { ...state, goal: action.goal };
    case 'setPlan':
      return { ...state, plans: { ...state.plans, [action.weekKey]: action.plan }, defaultPlan: action.plan };
  }
}

export function load(storage: Pick<Storage, 'getItem'>): AppState {
  const base = initialState();
  try {
    const rest = JSON.parse(storage.getItem(STATE_KEY) ?? '{}') as Partial<AppState>;
    const blocks = JSON.parse(storage.getItem(BLOCKS_KEY) ?? '[]') as Block[];
    return { ...base, ...rest, blocks };
  } catch {
    return base;
  }
}

/**
 * Persists the state. Block history lives under its own key and is written
 * only when it changed since `prev`, so frequent edits stay cheap.
 */
export function save(storage: Pick<Storage, 'setItem'>, state: AppState, prev?: AppState): void {
  try {
    const { blocks, ...rest } = state;
    storage.setItem(STATE_KEY, JSON.stringify(rest));
    if (!prev || prev.blocks !== blocks) storage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  } catch {
    return;
  }
}
