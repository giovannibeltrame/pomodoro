import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState, type PhaseRecord } from '../domain/timer';
import {
  KEYS,
  addRole,
  archiveRole,
  deletePhase,
  readPhases,
  readRoles,
  readSettings,
  readTimer,
  recordPhase,
  renameRole,
  reorderRoles,
  resetMemory,
  restoreRole,
  updatePhase,
  writeSettings,
  writeTimer,
} from './storage';

const focus: PhaseRecord = {
  start: 1000,
  end: 2000,
  kind: 'focus',
  activeMs: 1000,
  quadrant: 2,
  roleId: 'builder',
  intention: 'write',
};

beforeEach(() => {
  localStorage.clear();
  resetMemory();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('storage keys', () => {
  it('wraps data in {v: 1, data}', () => {
    recordPhase(focus);
    expect(JSON.parse(localStorage.getItem(KEYS.phases) ?? '')).toEqual({ v: 1, data: [focus] });
  });

  it.each([
    ['invalid JSON', '{nope'],
    ['wrong v', JSON.stringify({ v: 2, data: [] })],
    ['wrong shape', JSON.stringify({ v: 1, data: 'x' })],
  ])('falls back to defaults on %s', (_name, raw) => {
    for (const key of Object.values(KEYS)) localStorage.setItem(key, raw);
    expect(readPhases()).toEqual([]);
    expect(readSettings()).toEqual({ theme: 'system', sound: true, notifications: true, preset: 'classic' });
    expect(readTimer('deep')).toEqual(initialState('deep'));
    expect(readRoles().map((r) => r.name)).toEqual(['Builder', 'Manager', 'Learner']);
  });

  it('round-trips settings and timer state', () => {
    const settings = writeSettings({ theme: 'dark', lastClassification: { quadrant: 1, roleId: 'manager' } });
    expect(readSettings()).toEqual(settings);
    const timer = { ...initialState('deep'), position: 2 };
    writeTimer(timer);
    expect(readTimer('classic')).toEqual(timer);
  });

  it('leaves pomodoro:v1:* keys untouched', () => {
    localStorage.setItem('pomodoro:v1:phases', 'old');
    localStorage.setItem('pomodoro:v1:roles', 'old');
    recordPhase(focus);
    readRoles();
    addRole('X');
    writeSettings({ sound: false });
    writeTimer(initialState('classic'));
    expect(localStorage.getItem('pomodoro:v1:phases')).toBe('old');
    expect(localStorage.getItem('pomodoro:v1:roles')).toBe('old');
  });
});

describe('phases', () => {
  it('records once per start', () => {
    recordPhase(focus);
    recordPhase({ ...focus });
    expect(readPhases()).toEqual([focus]);
  });

  it('edits only quadrant, roleId and intention', () => {
    recordPhase(focus);
    updatePhase(1000, { quadrant: 3, roleId: 'learner', intention: 'read' });
    expect(readPhases()).toEqual([{ ...focus, quadrant: 3, roleId: 'learner', intention: 'read' }]);
  });

  it('deletes by start', () => {
    recordPhase(focus);
    recordPhase({ ...focus, start: 5000, end: 6000 });
    deletePhase(1000);
    expect(readPhases().map((p) => p.start)).toEqual([5000]);
  });
});

describe('roles', () => {
  it('seeds Builder, Manager and Learner once', () => {
    expect(readRoles().map((r) => [r.name, r.archived, r.order])).toEqual([
      ['Builder', false, 0],
      ['Manager', false, 1],
      ['Learner', false, 2],
    ]);
    archiveRole('manager');
    expect(readRoles().find((r) => r.id === 'manager')?.archived).toBe(true);
  });

  it('does not reseed an existing empty list', () => {
    localStorage.setItem(KEYS.roles, JSON.stringify({ v: 1, data: [] }));
    expect(readRoles()).toEqual([]);
  });

  it('adds last with a unique id', () => {
    const roles = addRole('Coach');
    const added = roles[roles.length - 1];
    expect(added).toMatchObject({ name: 'Coach', archived: false, order: 3 });
    expect(new Set(roles.map((r) => r.id)).size).toBe(4);
  });

  it('renames without changing the id', () => {
    renameRole('builder', 'Maker');
    expect(readRoles()[0]).toMatchObject({ id: 'builder', name: 'Maker' });
  });

  it('archives and restores to the end', () => {
    archiveRole('builder');
    expect(readRoles().find((r) => r.id === 'builder')?.archived).toBe(true);
    const roles = restoreRole('builder');
    expect(roles.map((r) => r.id)).toEqual(['manager', 'learner', 'builder']);
    expect(roles[2]?.archived).toBe(false);
  });

  it('reorders', () => {
    const roles = reorderRoles(['learner', 'builder', 'manager']);
    expect(roles.map((r) => r.id)).toEqual(['learner', 'builder', 'manager']);
    expect(readRoles().map((r) => r.order)).toEqual([0, 1, 2]);
  });
});

describe('blocked storage', () => {
  it('works from memory when localStorage throws', () => {
    const boom = () => {
      throw new Error('blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);

    recordPhase(focus);
    recordPhase(focus);
    expect(readPhases()).toEqual([focus]);
    updatePhase(1000, { intention: 'new' });
    expect(readPhases()[0]?.intention).toBe('new');
    deletePhase(1000);
    expect(readPhases()).toEqual([]);

    expect(readRoles()).toHaveLength(3);
    addRole('Coach');
    renameRole('builder', 'Maker');
    archiveRole('manager');
    restoreRole('manager');
    reorderRoles(['coach']);
    expect(readRoles()).toHaveLength(4);

    writeSettings({ theme: 'light' });
    expect(readSettings().theme).toBe('light');
    const timer = { ...initialState('classic'), position: 3 };
    writeTimer(timer);
    expect(readTimer('classic')).toEqual(timer);
  });

  it('keeps working in memory when only writes throw', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    recordPhase(focus);
    expect(readPhases()).toEqual([focus]);
  });
});
