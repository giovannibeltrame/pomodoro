import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState, PRESETS, reduce } from '../domain/timer';
import { resetFeedback } from './feedback';
import { dispatch, phases, settings, timer } from './signals';
import { resetMemory, writeSettings, writeTimer } from './storage';

const classification = { quadrant: 2 as const, roleId: 'builder' };
const T0 = 1_700_000_000_000;

const log: string[] = [];
let permission: NotificationPermission;
let notifications: Array<{ title: string; body?: string }>;
let oscillators: number;

class FakeAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  constructor() {
    log.push('create');
  }
  resume() {
    log.push('resume');
    this.state = 'running';
    return Promise.resolve();
  }
  createOscillator() {
    oscillators += 1;
    return {
      type: '',
      frequency: { value: 0 },
      connect: () => undefined,
      start: () => log.push('chime'),
      stop: () => undefined,
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => undefined,
        linearRampToValueAtTime: () => undefined,
        exponentialRampToValueAtTime: () => undefined,
      },
      connect: () => undefined,
    };
  }
}

class FakeNotification {
  static get permission() {
    return permission;
  }
  static requestPermission() {
    log.push('request');
    permission = 'granted';
    return Promise.resolve(permission);
  }
  constructor(title: string, options?: { body?: string }) {
    notifications.push({ title, body: options?.body });
  }
}

function runningFocus(): void {
  const running = reduce(initialState('classic'), { type: 'start', classification }, T0).state;
  writeTimer(running);
  timer.value = running;
}

beforeEach(() => {
  localStorage.clear();
  resetMemory();
  resetFeedback();
  log.length = 0;
  notifications = [];
  oscillators = 0;
  permission = 'default';
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('Notification', FakeNotification);
  writeTimer(initialState('classic'));
  timer.value = initialState('classic');
  phases.value = [];
  settings.value = writeSettings({ sound: true, notifications: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('phase-end feedback', () => {
  it('creates the audio context and asks for permission on Start, before any chime', () => {
    dispatch({ type: 'start', classification }, T0);
    expect(log).toEqual(['create', 'resume', 'request']);
    expect(oscillators).toBe(0);
  });

  it('plays two notes and notifies when a focus phase ends', () => {
    dispatch({ type: 'start', classification }, T0);
    log.length = 0;
    dispatch({ type: 'tick' }, T0 + PRESETS.classic.focus);
    expect(log).toEqual(['chime', 'chime']);
    expect(oscillators).toBe(2);
    expect(notifications).toEqual([{ title: 'Focus complete', body: 'Next: Break' }]);
  });

  it('names a long break as the next phase after the last block', () => {
    const last = { ...reduce(initialState('classic'), { type: 'start', classification }, T0).state, position: 4 };
    writeTimer(last);
    timer.value = last;
    permission = 'granted';
    dispatch({ type: 'tick' }, T0 + PRESETS.classic.focus);
    expect(notifications).toEqual([{ title: 'Focus complete', body: 'Next: Long break' }]);
  });

  it('stays silent with sound and notifications off', () => {
    settings.value = writeSettings({ sound: false, notifications: false });
    permission = 'granted';
    runningFocus();
    dispatch({ type: 'tick' }, T0 + PRESETS.classic.focus);
    expect(oscillators).toBe(0);
    expect(notifications).toEqual([]);
  });

  it('still plays the chime when permission is denied', () => {
    permission = 'denied';
    runningFocus();
    dispatch({ type: 'tick' }, T0 + PRESETS.classic.focus);
    expect(oscillators).toBe(2);
    expect(notifications).toEqual([]);
  });

  it('does not request permission on Start when notifications are off', () => {
    settings.value = writeSettings({ notifications: false });
    dispatch({ type: 'start', classification }, T0);
    expect(log).not.toContain('request');
  });

  it('fires once per phase end when a second tab ticks afterwards', () => {
    permission = 'granted';
    runningFocus();
    dispatch({ type: 'tick' }, T0 + PRESETS.classic.focus);
    dispatch({ type: 'tick' }, T0 + PRESETS.classic.focus + 5);
    expect(oscillators).toBe(2);
    expect(notifications).toHaveLength(1);
  });

  it('is silent on a tick before the end and on ending a break early', () => {
    permission = 'granted';
    runningFocus();
    dispatch({ type: 'tick' }, T0 + 1000);
    const breakRunning = reduce({ ...initialState('classic'), kind: 'break' as const }, { type: 'start' }, T0).state;
    writeTimer(breakRunning);
    timer.value = breakRunning;
    dispatch({ type: 'endEarly' }, T0 + 1000);
    expect(oscillators).toBe(0);
    expect(notifications).toEqual([]);
  });
});
