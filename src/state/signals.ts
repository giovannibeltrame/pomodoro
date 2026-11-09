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
import { todayPhases } from '../domain/today';
import {
  deletePhase,
  KEYS,
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
export const settingsOpen = signal(false);
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
    const current = new Date();
    const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1).getTime();
    id = setTimeout(
      () => {
        now.value = Date.now();
        arm();
      },
      Math.max(1, next - current.getTime()),
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
  if (event.type === 'start' && result.state.status === 'running') intention.value = '';
  if (result.state === current && result.records.length === 0) {
    timer.value = current;
    return;
  }
  commit(result.state, result.records);
}

export function editPhase(start: number, edit: PhaseEdit): void {
  phases.value = updatePhase(start, edit);
}

export function removePhase(start: number): void {
  phases.value = deletePhase(start);
}

export function selectPreset(preset: Preset): void {
  const current = readTimer(settings.value.preset);
  if (current.status !== 'idle' || preset === settings.value.preset) return;
  settings.value = writeSettings({ preset });
  commit(reduce(current, { type: 'setPreset', preset }, Date.now()).state, []);
}

export function restoreTimer(now: number = Date.now()): void {
  const result = restore(readTimer(settings.value.preset), now);
  commit(result.state, result.records);
}

export function reloadKey(key: string): void {
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
