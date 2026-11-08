import { computed, signal } from '@preact/signals';
import { reduce, restore, type PhaseRecord, type TimerEvent, type TimerState } from '../domain/timer';
import { todayPhases } from '../domain/today';
import {
  KEYS,
  readPhases,
  readRoles,
  readSettings,
  readTimer,
  recordPhase,
  writeTimer,
  type Role,
  type Settings,
} from './storage';

export const settings = signal<Settings>(readSettings());
export const timer = signal<TimerState>(readTimer(settings.value.preset));
export const phases = signal<PhaseRecord[]>(readPhases());
export const roles = signal<Role[]>(readRoles());
export const todayRecords = computed(() => todayPhases(phases.value, Date.now()));

function commit(state: TimerState, records: PhaseRecord[]): void {
  writeTimer(state);
  timer.value = state;
  if (records.length === 0) return;
  let next = phases.value;
  for (const record of records) next = recordPhase(record);
  phases.value = next;
}

export function dispatch(event: TimerEvent, now: number = Date.now()): void {
  const current = readTimer(settings.value.preset);
  const result = reduce(current, event, now);
  if (result.state === current && result.records.length === 0) {
    timer.value = current;
    return;
  }
  commit(result.state, result.records);
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
