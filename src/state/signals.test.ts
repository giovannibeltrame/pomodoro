import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState, PRESETS, reduce } from '../domain/timer';
import { startAlarm, type AlarmWorker } from './alarm';
import {
  dispatch,
  handleStorage,
  intention,
  phases,
  quadrant,
  restoreTimer,
  roleId,
  roles,
  settings,
  startSync,
  timer,
} from './signals';
import { KEYS, readPhases, readRoles, readSettings, resetMemory, writeSettings, writeTimer } from './storage';

const classification = { quadrant: 2 as const, roleId: 'builder' };
const T0 = 1_700_000_000_000;

function storageEvent(key: string | null): StorageEvent {
  return new StorageEvent('storage', { key });
}

beforeEach(() => {
  localStorage.clear();
  resetMemory();
  writeTimer(initialState('classic'));
  timer.value = initialState('classic');
  phases.value = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sync handler', () => {
  it('reloads the timer signal on a storage event for the timer key', () => {
    const running = reduce(initialState('classic'), { type: 'start', classification }, T0).state;
    writeTimer(running);
    handleStorage(storageEvent(KEYS.timer));
    expect(timer.value).toEqual(running);
  });

  it('reloads the phases signal on a storage event for the phases key', () => {
    localStorage.setItem(
      KEYS.phases,
      JSON.stringify({ v: 1, data: [{ start: 1, end: 2, kind: 'break', activeMs: 1 }] }),
    );
    handleStorage(storageEvent(KEYS.phases));
    expect(phases.value).toEqual(readPhases());
    expect(phases.value).toHaveLength(1);
  });

  it('reloads roles and settings', () => {
    writeSettings({ theme: 'dark' });
    handleStorage(storageEvent(KEYS.settings));
    expect(settings.value.theme).toBe('dark');
    localStorage.setItem(
      KEYS.roles,
      JSON.stringify({ v: 1, data: [{ id: 'x', name: 'X', archived: false, order: 0 }] }),
    );
    handleStorage(storageEvent(KEYS.roles));
    expect(roles.value).toEqual(readRoles());
    expect(roles.value.map((r) => r.id)).toEqual(['x']);
  });

  it('reloads every key when the key is null', () => {
    writeSettings({ theme: 'light' });
    handleStorage(storageEvent(null));
    expect(settings.value).toEqual(readSettings());
  });

  it('ignores unrelated keys', () => {
    const before = timer.value;
    handleStorage(storageEvent('other'));
    expect(timer.value).toBe(before);
  });

  it('is wired to window storage events by startSync', () => {
    const stop = startSync();
    writeSettings({ theme: 'dark' });
    window.dispatchEvent(storageEvent(KEYS.settings));
    expect(settings.value.theme).toBe('dark');
    stop();
    writeSettings({ theme: 'light' });
    window.dispatchEvent(storageEvent(KEYS.settings));
    expect(settings.value.theme).toBe('dark');
  });
});

describe('phase end in several tabs', () => {
  it('records a phase once when two tabs both tick at the end', () => {
    dispatch({ type: 'start', classification }, T0);
    const end = T0 + PRESETS.classic.focus;
    dispatch({ type: 'tick' }, end);
    dispatch({ type: 'tick' }, end + 5);
    expect(readPhases()).toHaveLength(1);
    expect(readPhases()[0]).toMatchObject({ start: T0, end, kind: 'focus' });
    expect(timer.value).toMatchObject({ kind: 'break', status: 'idle' });
  });

  it('records once when a stale running timer is written back after the end', () => {
    dispatch({ type: 'start', classification }, T0);
    const running = timer.value;
    const end = T0 + PRESETS.classic.focus;
    dispatch({ type: 'tick' }, end);
    writeTimer(running);
    dispatch({ type: 'tick' }, end + 3);
    expect(readPhases().filter((p) => p.start === T0)).toHaveLength(1);
  });

  it('records an expired phase once on restore', () => {
    dispatch({ type: 'start', classification }, T0);
    const late = T0 + PRESETS.classic.focus + 60_000;
    restoreTimer(late);
    restoreTimer(late);
    expect(readPhases()).toHaveLength(1);
    expect(readPhases()[0].end).toBe(T0 + PRESETS.classic.focus);
  });

  it('updates the phases signal when a tick records', () => {
    dispatch({ type: 'start', classification }, T0);
    dispatch({ type: 'tick' }, T0 + PRESETS.classic.focus);
    expect(phases.value).toHaveLength(1);
  });

  it('preselects the classification of a block that ended while the app was closed', () => {
    dispatch({ type: 'start', classification }, T0);
    quadrant.value = 1;
    roleId.value = 'manager';
    restoreTimer(T0 + PRESETS.classic.focus + 60_000);
    expect(quadrant.value).toBe(classification.quadrant);
    expect(roleId.value).toBe(classification.roleId);
  });
});

describe('start', () => {
  it('keeps the typed intention when another tab already started the timer', () => {
    writeTimer(reduce(initialState('classic'), { type: 'start', classification }, T0).state);
    intention.value = 'Draft the ADR';
    dispatch({ type: 'start', classification }, T0 + 1000);
    expect(intention.value).toBe('Draft the ADR');
  });
});

describe('alarm', () => {
  function fakeWorker() {
    let listener: () => void = () => {};
    const worker: AlarmWorker & { sent: unknown[]; fire: () => void } = {
      sent: [],
      postMessage(command) {
        worker.sent.push(command);
      },
      addEventListener(_type, l) {
        listener = l;
      },
      terminate: vi.fn(),
      fire: () => listener(),
    };
    return worker;
  }

  it('schedules the scheduled end, cancels when idle, and ticks on message', () => {
    const worker = fakeWorker();
    const stop = startAlarm(worker);
    expect(worker.sent.at(-1)).toEqual({ type: 'cancel' });

    const now = Date.now();
    dispatch({ type: 'start', classification }, now);
    expect(worker.sent.at(-1)).toEqual({ type: 'schedule', at: now + PRESETS.classic.focus });

    vi.spyOn(Date, 'now').mockReturnValue(now + PRESETS.classic.focus);
    worker.fire();
    expect(readPhases()).toHaveLength(1);
    expect(worker.sent.at(-1)).toEqual({ type: 'cancel' });

    stop();
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('reschedules on pause and resume', () => {
    const worker = fakeWorker();
    const stop = startAlarm(worker);
    dispatch({ type: 'start', classification }, T0);
    dispatch({ type: 'pause' }, T0 + 60_000);
    expect(worker.sent.at(-1)).toEqual({ type: 'cancel' });
    dispatch({ type: 'resume' }, T0 + 120_000);
    expect(worker.sent.at(-1)).toEqual({ type: 'schedule', at: T0 + 120_000 + PRESETS.classic.focus - 60_000 });
    stop();
  });
});
