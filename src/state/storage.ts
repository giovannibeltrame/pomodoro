import {
  initialState,
  QUADRANTS,
  type Classification,
  type PhaseKind,
  type PhaseRecord,
  type Preset,
  type Quadrant,
  type TimerState,
} from '../domain/timer';

export const KEYS = {
  phases: 'quadrantic:v1:phases',
  roles: 'quadrantic:v1:roles',
  settings: 'quadrantic:v1:settings',
  timer: 'quadrantic:v1:timer',
} as const;

type Key = (typeof KEYS)[keyof typeof KEYS];

export interface Role {
  id: string;
  name: string;
  archived: boolean;
  order: number;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  sound: boolean;
  notifications: boolean;
  preset: Preset;
  lastClassification?: { quadrant: Quadrant; roleId: string };
}

export interface PhaseEdit {
  quadrant?: Quadrant;
  roleId?: string;
  intention?: string;
}

const memory = new Map<Key, string>();
const memoryOnly = new Set<Key>();

export function resetMemory(): void {
  memory.clear();
  memoryOnly.clear();
}

function readRaw(key: Key): string | null {
  if (memoryOnly.has(key)) return memory.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    memoryOnly.add(key);
    return memory.get(key) ?? null;
  }
}

function writeRaw(key: Key, raw: string): void {
  memory.set(key, raw);
  if (memoryOnly.has(key)) return;
  try {
    localStorage.setItem(key, raw);
  } catch {
    memoryOnly.add(key);
  }
}

function load<T>(key: Key, check: (data: unknown) => data is T): T | undefined {
  const raw = readRaw(key);
  if (raw === null) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isObject(parsed) && parsed.v === 1 && check(parsed.data)) return parsed.data;
  } catch {
    return undefined;
  }
  return undefined;
}

function save(key: Key, data: unknown): void {
  writeRaw(key, JSON.stringify({ v: 1, data }));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isQuadrant(value: unknown): value is Quadrant {
  return QUADRANTS.some((q) => q.id === value);
}

function isKind(value: unknown): value is PhaseKind {
  return value === 'focus' || value === 'break' || value === 'longBreak';
}

function isPreset(value: unknown): value is Preset {
  return value === 'classic' || value === 'deep';
}

function isOptional(value: unknown, test: (v: unknown) => boolean): boolean {
  return value === undefined || test(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isPhaseRecord(value: unknown): value is PhaseRecord {
  return (
    isObject(value) &&
    isNumber(value.start) &&
    isNumber(value.end) &&
    isKind(value.kind) &&
    isNumber(value.activeMs) &&
    isOptional(value.quadrant, isQuadrant) &&
    isOptional(value.roleId, isString) &&
    isOptional(value.intention, isString)
  );
}

function isRole(value: unknown): value is Role {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    typeof value.archived === 'boolean' &&
    isNumber(value.order)
  );
}

function isClassification(value: unknown): value is Classification {
  return (
    isObject(value) && isQuadrant(value.quadrant) && isString(value.roleId) && isOptional(value.intention, isString)
  );
}

function isSettings(value: unknown): value is Settings {
  return (
    isObject(value) &&
    (value.theme === 'system' || value.theme === 'light' || value.theme === 'dark') &&
    typeof value.sound === 'boolean' &&
    typeof value.notifications === 'boolean' &&
    isPreset(value.preset) &&
    isOptional(value.lastClassification, (v) => isObject(v) && isQuadrant(v.quadrant) && isString(v.roleId))
  );
}

function isTimerState(value: unknown): value is TimerState {
  return (
    isObject(value) &&
    isPreset(value.preset) &&
    isKind(value.kind) &&
    (value.status === 'idle' || value.status === 'running' || value.status === 'paused') &&
    isNumber(value.position) &&
    (value.start === null || isNumber(value.start)) &&
    isNumber(value.activeMs) &&
    (value.segmentStart === null || isNumber(value.segmentStart)) &&
    (value.classification === null || isClassification(value.classification))
  );
}

const isArrayOf =
  <T>(test: (v: unknown) => v is T) =>
  (value: unknown): value is T[] =>
    Array.isArray(value) && value.every(test);

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  sound: true,
  notifications: true,
  preset: 'classic',
};

function seedRoles(): Role[] {
  return ['Builder', 'Manager', 'Learner'].map((name, order) => ({
    id: name.toLowerCase(),
    name,
    archived: false,
    order,
  }));
}

export function readPhases(): PhaseRecord[] {
  return load(KEYS.phases, isArrayOf(isPhaseRecord)) ?? [];
}

export function recordPhase(record: PhaseRecord): PhaseRecord[] {
  const phases = readPhases();
  if (phases.some((p) => p.start === record.start)) return phases;
  const next = [...phases, record];
  save(KEYS.phases, next);
  return next;
}

export function updatePhase(start: number, edit: PhaseEdit): PhaseRecord[] {
  const phases = readPhases();
  const next = phases.map((p) => (p.start === start ? { ...p, ...edit } : p));
  save(KEYS.phases, next);
  return next;
}

export function deletePhase(start: number): PhaseRecord[] {
  const next = readPhases().filter((p) => p.start !== start);
  save(KEYS.phases, next);
  return next;
}

function sorted(roles: Role[]): Role[] {
  return [...roles].sort((a, b) => a.order - b.order);
}

export function readRoles(): Role[] {
  const stored = load(KEYS.roles, isArrayOf(isRole));
  if (stored) return sorted(stored);
  const seeded = seedRoles();
  save(KEYS.roles, seeded);
  return seeded;
}

function nextOrder(roles: Role[]): number {
  return roles.reduce((max, r) => Math.max(max, r.order), -1) + 1;
}

function newRoleId(): string {
  return `role-${crypto.randomUUID()}`;
}

export function addRole(name: string): Role[] {
  const roles = readRoles();
  const next = [...roles, { id: newRoleId(), name, archived: false, order: nextOrder(roles) }];
  save(KEYS.roles, next);
  return next;
}

function patchRole(id: string, patch: (role: Role, roles: Role[]) => Role): Role[] {
  const roles = readRoles();
  const next = roles.map((r) => (r.id === id ? patch(r, roles) : r));
  save(KEYS.roles, next);
  return sorted(next);
}

export function renameRole(id: string, name: string): Role[] {
  return patchRole(id, (r) => ({ ...r, name }));
}

export function archiveRole(id: string): Role[] {
  return patchRole(id, (r) => ({ ...r, archived: true }));
}

export function restoreRole(id: string): Role[] {
  return patchRole(id, (r, roles) => ({ ...r, archived: false, order: nextOrder(roles) }));
}

export function reorderRoles(ids: string[]): Role[] {
  const roles = readRoles();
  const listed = ids.flatMap((id) => roles.filter((r) => r.id === id));
  const rest = roles.filter((r) => !ids.includes(r.id));
  const next = [...listed, ...rest].map((r, order) => ({ ...r, order }));
  save(KEYS.roles, next);
  return next;
}

export function readSettings(): Settings {
  return load(KEYS.settings, isSettings) ?? { ...DEFAULT_SETTINGS };
}

export function writeSettings(patch: Partial<Settings>): Settings {
  const next = { ...readSettings(), ...patch };
  save(KEYS.settings, next);
  return next;
}

export function readTimer(preset: Preset): TimerState {
  return load(KEYS.timer, isTimerState) ?? initialState(preset);
}

export function writeTimer(state: TimerState): void {
  save(KEYS.timer, state);
}
