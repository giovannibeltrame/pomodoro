import { computed, signal } from '@preact/signals';
import {
  reduce,
  restore,
  type Classification,
  type PhaseRecord,
  type Preset,
  type Quadrant,
  type TimerEvent,
  type TimerState,
} from '../domain/timer';
import { nextStartOfDay, todayPhases } from '../domain/today';
import { announcePhaseEnd, primeFeedback } from './feedback';
import {
  addRole,
  archiveRole,
  deletePhase,
  KEYS,
  renameRole,
  reorderRoles,
  restoreRole,
  readPhases,
  readRoles,
  readSettings,
  readTimer,
  recordPhase,
  updatePhase,
  writeSettings,
  writeTimer,
  type PhaseEdit,
  type Role,
  type Settings,
} from './storage';

export const settings = signal<Settings>(readSettings());
export const timer = signal<TimerState>(readTimer(settings.value.preset));
export const phases = signal<PhaseRecord[]>(readPhases());
export const roles = signal<Role[]>(readRoles());
export const quadrant = signal<Quadrant | null>(settings.value.lastClassification?.quadrant ?? null);
export const roleId = signal<string | null>(settings.value.lastClassification?.roleId ?? null);
export const intention = signal('');
export const settingsView = signal<'top' | 'roles' | null>(null);
export const activeRoles = computed(() => roles.value.filter((r) => !r.archived).sort((a, b) => a.order - b.order));
export const selection = computed<Classification | null>(() => {
  const id = roleId.value;
  if (quadrant.value === null || id === null || !activeRoles.value.some((r) => r.id === id)) return null;
  const text = intention.value.trim();
  return text ? { quadrant: quadrant.value, roleId: id, intention: text } : { quadrant: quadrant.value, roleId: id };
});
export const now = signal(Date.now());
export const todayRecords = computed(() => todayPhases(phases.value, now.value));

export function startDayWatch(): () => void {
  let id: ReturnType<typeof setTimeout>;
  const arm = () => {
    const current = Date.now();
    id = setTimeout(
      () => {
        now.value = Date.now();
        arm();
      },
      Math.max(1, nextStartOfDay(current) - current),
    );
  };
  arm();
  return () => clearTimeout(id);
}

function commit(state: TimerState, records: PhaseRecord[]): void {
  writeTimer(state);
  timer.value = state;
  if (records.length === 0) return;
  let next = phases.value;
  for (const record of records) next = recordPhase(record);
  phases.value = next;
  const last = records.findLast((r) => r.kind === 'focus' && r.quadrant && r.roleId);
  if (last?.quadrant && last.roleId) {
    settings.value = writeSettings({ lastClassification: { quadrant: last.quadrant, roleId: last.roleId } });
  }
}

export function dispatch(event: TimerEvent, now: number = Date.now()): void {
  const current = readTimer(settings.value.preset);
  const result = reduce(current, event, now);
  if (event.type === 'start') primeFeedback(settings.value);
  if (event.type === 'start' && result.state.status === 'running') intention.value = '';
  if (result.state === current && result.records.length === 0) {
    timer.value = current;
    return;
  }
  commit(result.state, result.records);
  if (event.type === 'tick' && result.records.length > 0) {
    announcePhaseEnd(current.kind, result.state.kind, settings.value);
  }
}

export function editPhase(start: number, edit: PhaseEdit): void {
  phases.value = updatePhase(start, edit);
}

export function removePhase(start: number): void {
  phases.value = deletePhase(start);
}

export function updateSettings(patch: Partial<Settings>): void {
  settings.value = writeSettings(patch);
}

export function openSettings(): void {
  settingsView.value = 'top';
}

export function openRoles(): void {
  settingsView.value = 'roles';
}

export function closeSettings(): void {
  settingsView.value = null;
}

export function roleNameError(name: string, exceptId?: string): string | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'Name is required';
  const key = trimmed.toLowerCase();
  const taken = roles.value.some((r) => r.id !== exceptId && r.name.trim().toLowerCase() === key);
  return taken ? 'Name already in use' : null;
}

export function createRole(name: string): string | null {
  const problem = roleNameError(name);
  if (problem === null) roles.value = addRole(name.trim());
  return problem;
}

export function changeRoleName(id: string, name: string): string | null {
  const problem = roleNameError(name, id);
  if (problem === null) roles.value = renameRole(id, name.trim());
  return problem;
}

export function setRoleArchived(id: string, archived: boolean): void {
  roles.value = archived ? archiveRole(id) : restoreRole(id);
}

export function moveRole(id: string, toIndex: number): void {
  const ids = activeRoles.value.map((r) => r.id);
  const from = ids.indexOf(id);
  if (from === -1) return;
  const to = Math.max(0, Math.min(ids.length - 1, toIndex));
  if (to === from) return;
  ids.splice(from, 1);
  ids.splice(to, 0, id);
  roles.value = reorderRoles(ids);
}

export function selectPreset(preset: Preset): void {
  const current = readTimer(settings.value.preset);
  if (current.status !== 'idle' || preset === settings.value.preset) return;
  settings.value = writeSettings({ preset });
  commit(reduce(current, { type: 'setPreset', preset }, Date.now()).state, []);
}

export function restoreTimer(now: number = Date.now()): void {
  const stored = readTimer(settings.value.preset);
  const result = restore(stored, now);
  if (result.state === stored && result.records.length === 0) return;
  commit(result.state, result.records);
}

function reloadKey(key: string): void {
  switch (key) {
    case KEYS.phases:
      phases.value = readPhases();
      break;
    case KEYS.roles:
      roles.value = readRoles();
      break;
    case KEYS.settings:
      settings.value = readSettings();
      break;
    case KEYS.timer:
      timer.value = readTimer(settings.value.preset);
      break;
  }
}

export function handleStorage(event: StorageEvent): void {
  if (event.key === null) {
    for (const key of Object.values(KEYS)) reloadKey(key);
    return;
  }
  reloadKey(event.key);
}

export function startSync(target: Window = window): () => void {
  target.addEventListener('storage', handleStorage);
  return () => target.removeEventListener('storage', handleStorage);
}
