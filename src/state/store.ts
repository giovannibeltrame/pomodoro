import * as timer from '../domain/timer';
import type { Block, Durations, Mode, Plan, Quadrant } from '../domain/types';

export const STORAGE_KEY = 'pomodoro:v1';

export const DEFAULT_DURATIONS: Durations = { focus: 25, short: 5, long: 15, longEvery: 4 };
export const DEFAULT_PLAN: Plan = { q1: 6, q2: 8, q3: 4 };
export const DEFAULT_ROLES = [
  'Arquiteto de Software',
  'Líder Técnico',
  'Criador de Conteúdo',
  'Gestor de Produtos',
  'Pesquisador / Estudioso',
  'Operador de Infraestrutura',
];

export interface AppState {
  durations: Durations;
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
  | { type: 'finish'; now: number; id: string; endsAt: number | null }
  | { type: 'selectQuadrant'; quadrant: Quadrant }
  | { type: 'selectRole'; role: string }
  | { type: 'addRole'; role: string }
  | { type: 'setGoal'; goal: string }
  | { type: 'setPlan'; weekKey: string; plan: Plan };

export function initialState(): AppState {
  return {
    durations: DEFAULT_DURATIONS,
    timer: timer.initialTimer(DEFAULT_DURATIONS),
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

export function reducer(state: AppState, action: Action): AppState {
  const d = state.durations;
  switch (action.type) {
    case 'start':
      return { ...state, timer: timer.start(state.timer, action.now) };
    case 'pause':
      return { ...state, timer: timer.pause(state.timer, action.now) };
    case 'reset':
      return { ...state, timer: timer.reset(state.timer, d) };
    case 'setMode':
      return { ...state, timer: timer.setMode(state.timer, action.mode, d) };
    case 'finish': {
      if (action.endsAt !== state.timer.endsAt) return state;
      const { next, finished } = timer.finish(state.timer, d, action.now);
      if (finished.mode !== 'focus' || finished.elapsedMs <= 0) return { ...state, timer: next };
      const block: Block = {
        id: action.id,
        quadrant: state.quadrant,
        role: state.role,
        goal: state.goal.trim(),
        startedAt: finished.startedAt,
        endedAt: finished.endedAt,
        focusMs: finished.elapsedMs,
      };
      return { ...state, timer: next, blocks: [...state.blocks, block] };
    }
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
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return base;
    return { ...base, ...(JSON.parse(raw) as Partial<AppState>) };
  } catch {
    return base;
  }
}

export function save(storage: Pick<Storage, 'setItem'>, state: AppState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}
