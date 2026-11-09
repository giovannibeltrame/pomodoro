import { computed, signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { durationMs, PHASE_LABEL, PRESETS, remainingMs, type TimerState } from '../domain/timer';
import { dispatch, selection, timer } from '../state/signals';
import { Tomato } from './Tomato';

const APP_TITLE = 'Quadrantic Pomodoro';

const now = signal(Date.now());
const remainingSeconds = computed(() => Math.ceil(remainingMs(timer.value, now.value) / 1000));
const canStart = computed(
  () => timer.value.status === 'idle' && (timer.value.kind !== 'focus' || selection.value !== null),
);

function formatClock(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function phaseLabel(state: TimerState): string {
  const label = PHASE_LABEL[state.kind].toUpperCase();
  if (state.kind !== 'focus') return label;
  return `${label} · Block ${state.position} of ${PRESETS[state.preset].blocksPerCycle}`;
}

function tabTitle(state: TimerState, seconds: number): string {
  if (state.status === 'idle') return APP_TITLE;
  return `${formatClock(seconds)} · ${PHASE_LABEL[state.kind]} — ${APP_TITLE}`;
}

function start(): void {
  dispatch({ type: 'start', classification: selection.value ?? undefined });
}

function toggleFromKeyboard(): void {
  const { status } = timer.value;
  if (status === 'idle') {
    if (canStart.value) start();
    return;
  }
  dispatch({ type: status === 'running' ? 'pause' : 'resume' });
}

function PhaseLabel({ state }: { state: TimerState }) {
  if (state.kind === 'focus') {
    return (
      <>
        {phaseLabel(state)}
        {state.status === 'paused' && (
          <>
            {' · '}
            <span class="opacity-50">PAUSED</span>
          </>
        )}
      </>
    );
  }
  const completed = state.kind === 'break' ? state.position - 1 : state.position;
  return (
    <>
      <span class="font-medium text-break-label">{phaseLabel(state)}</span>
      {` · AFTER BLOCK ${completed} OF ${PRESETS[state.preset].blocksPerCycle}`}
    </>
  );
}

const primary =
  'rounded bg-primary px-6 py-2 font-mono text-xs leading-4 font-medium tracking-wider text-on-primary uppercase select-none disabled:cursor-not-allowed disabled:border disabled:border-outline-variant disabled:bg-surface-container-low disabled:text-outline';
const secondary =
  'ml-4 font-mono text-xs leading-4 font-medium tracking-[0.02em] text-outline transition-colors duration-150 hover:text-on-surface';

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
      if (document.querySelector('dialog[open]')) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, select, textarea, button, [contenteditable]')) return;
      event.preventDefault();
      toggleFromKeyboard();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const seconds = remainingSeconds.value;
  const title = tabTitle(state, seconds);

  useEffect(() => {
    document.title = title;
  }, [title]);

  const isFocus = state.kind === 'focus';
  const total = durationMs(state.preset, state.kind);
  const progress = state.status === 'idle' ? 0 : 1 - (seconds * 1000) / total;

  return (
    <section class="flex flex-col items-center" aria-label="Timer">
      <Tomato kind={state.kind} status={state.status} progress={progress} />
      <div class="mt-1 font-mono text-[11px] leading-[14px] tracking-wider text-outline uppercase">
        <PhaseLabel state={state} />
      </div>
      <div
        class={`mt-2 mb-6 font-mono text-[72px] leading-[72px] font-normal tracking-[-0.03em] tabular-nums ${state.status === 'paused' ? 'opacity-50' : ''}`}
        aria-live="off"
      >
        {formatClock(seconds)}
      </div>
      <div class="flex items-center justify-center">
        {state.status === 'idle' && (
          <button type="button" class={primary} disabled={!canStart.value} onClick={start}>
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
          <button type="button" class={`${secondary} uppercase`} onClick={() => dispatch({ type: 'skip' })}>
            Skip
          </button>
        )}
        {!isFocus && state.status !== 'idle' && (
          <button type="button" class={`${secondary} uppercase`} onClick={() => dispatch({ type: 'endEarly' })}>
            End break
          </button>
        )}
      </div>
    </section>
  );
}
