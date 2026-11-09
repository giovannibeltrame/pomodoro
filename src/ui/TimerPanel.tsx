import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { durationMs, PRESETS, remainingMs, type TimerState } from '../domain/timer';
import { dispatch, selection, timer } from '../state/signals';
import { Tomato } from './Tomato';

const APP_TITLE = 'Quadrantic Pomodoro';
const KIND_NAMES = { focus: 'Focus', break: 'Break', longBreak: 'Long break' } as const;

const now = signal(Date.now());

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function phaseLabel(state: TimerState): string {
  if (state.kind === 'break') return 'BREAK';
  if (state.kind === 'longBreak') return 'LONG BREAK';
  return `FOCUS · Block ${state.position} of ${PRESETS[state.preset].blocksPerCycle}`;
}

export function tabTitle(state: TimerState, remaining: number): string {
  if (state.status === 'idle') return APP_TITLE;
  return `${formatClock(remaining)} · ${KIND_NAMES[state.kind]} — ${APP_TITLE}`;
}

export function canStart(state: TimerState): boolean {
  return state.status === 'idle' && (state.kind !== 'focus' || selection.value !== null);
}

export function toggleFromKeyboard(): void {
  const state = timer.value;
  if (state.status === 'idle') {
    if (canStart(state)) start();
    return;
  }
  dispatch({ type: state.status === 'running' ? 'pause' : 'resume' });
}

function start(): void {
  const state = timer.value;
  if (state.kind === 'focus') {
    const classification = selection.value;
    if (!classification) return;
    dispatch({ type: 'start', classification });
    return;
  }
  dispatch({ type: 'start' });
}

const primary =
  'h-10 rounded bg-primary px-6 text-sm font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-40';
const secondary =
  'h-10 rounded border border-outline-variant px-6 text-sm font-medium text-on-surface hover:bg-surface-container-high';

export function TimerPanel() {
  const state = timer.value;

  useEffect(() => {
    now.value = Date.now();
    if (state.status !== 'running') return;
    const id = setInterval(() => {
      now.value = Date.now();
    }, 250);
    return () => clearInterval(id);
  }, [state.status, state.start]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, select, textarea, button, [contenteditable]')) return;
      event.preventDefault();
      toggleFromKeyboard();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const remaining = remainingMs(state, now.value);
  const title = tabTitle(state, remaining);

  useEffect(() => {
    document.title = title;
  }, [title]);

  const isFocus = state.kind === 'focus';
  const total = durationMs(state.preset, state.kind);
  const progress = state.status === 'idle' ? 0 : 1 - remaining / total;

  return (
    <section class="flex flex-col items-center gap-6 py-6" aria-label="Timer">
      <Tomato kind={state.kind} status={state.status} progress={progress} />
      <div class="font-mono text-[11px] leading-[14px] tracking-[0.04em] text-outline uppercase">
        {phaseLabel(state)}
      </div>
      <div class="font-mono text-[72px] leading-[72px] font-normal tracking-[-0.03em] tabular-nums" aria-live="off">
        {formatClock(remaining)}
      </div>
      <div class="flex items-center gap-3">
        {state.status === 'idle' && (
          <button type="button" class={primary} disabled={!canStart(state)} onClick={start}>
            Start
          </button>
        )}
        {state.status === 'running' && (
          <button type="button" class={primary} onClick={() => dispatch({ type: 'pause' })}>
            Pause
          </button>
        )}
        {state.status === 'paused' && (
          <button type="button" class={primary} onClick={() => dispatch({ type: 'resume' })}>
            Resume
          </button>
        )}
        {isFocus && state.status !== 'idle' && (
          <button type="button" class={secondary} onClick={() => dispatch({ type: 'reset' })}>
            Reset
          </button>
        )}
        {!isFocus && state.status === 'idle' && (
          <button type="button" class={secondary} onClick={() => dispatch({ type: 'skip' })}>
            Skip
          </button>
        )}
        {!isFocus && state.status !== 'idle' && (
          <button type="button" class={secondary} onClick={() => dispatch({ type: 'endEarly' })}>
            End break
          </button>
        )}
      </div>
    </section>
  );
}
