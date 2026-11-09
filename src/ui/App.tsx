import { timer } from '../state/signals';
import { TimerPanel } from './TimerPanel';

export function App() {
  const onBreak = timer.value.kind !== 'focus';
  return (
    <div class="relative flex min-h-screen flex-col bg-background text-on-surface">
      <div
        class="break-tint pointer-events-none absolute inset-0 bg-break-tint"
        data-testid="break-tint"
        data-active={onBreak}
        aria-hidden="true"
      />
      <header class="relative flex h-14 items-center justify-between border-b border-outline-variant px-8">
        <div class="font-mono text-xs font-medium tracking-[0.02em]">
          QUADRANTIC <span class="text-outline">POMODORO</span>
        </div>
        <div class="flex items-center gap-3">
          <div data-slot="preset-toggle" />
          <button
            type="button"
            aria-label="Settings"
            class="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
            </svg>
          </button>
        </div>
      </header>
      <div class="relative flex flex-1">
        <main aria-label="Quadrantic Pomodoro" class="flex-1 px-8 py-8">
          <TimerPanel />
        </main>
        <aside
          aria-label="Today"
          class="w-[300px] shrink-0 border-l border-outline-variant bg-surface-container-low p-5"
        />
      </div>
    </div>
  );
}
