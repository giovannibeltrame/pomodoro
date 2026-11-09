import { computed, effect } from '@preact/signals';
import { scheduledEnd } from '../domain/timer';
import type { AlarmCommand } from './alarm.worker';
import { dispatch, timer } from './signals';

export interface AlarmWorker {
  postMessage(command: AlarmCommand): void;
  addEventListener(type: 'message', listener: () => void): void;
  terminate(): void;
}

export function createAlarmWorker(): AlarmWorker {
  return new Worker(new URL('./alarm.worker.ts', import.meta.url), { type: 'module' });
}

export function startAlarm(worker: AlarmWorker = createAlarmWorker()): () => void {
  worker.addEventListener('message', () => dispatch({ type: 'tick' }));
  const end = computed(() => scheduledEnd(timer.value));
  const stop = effect(() => {
    const at = end.value;
    worker.postMessage(at === null ? { type: 'cancel' } : { type: 'schedule', at });
  });
  return () => {
    stop();
    worker.terminate();
  };
}
