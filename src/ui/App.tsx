import { useRef } from 'preact/hooks';
import { settingsOpen, timer } from '../state/signals';
import { ClassificationControls } from './ClassificationControls';
import { PresetToggle } from './PresetToggle';
import { SettingsDrawer } from './SettingsDrawer';
import { TimerPanel } from './TimerPanel';
import { TodayList } from './TodayList';

export function App() {
  const gearRef = useRef<HTMLButtonElement>(null);
  const onBreak = timer.value.kind !== 'focus';
  return (
    <div class="relative flex min-h-screen flex-col bg-background text-on-surface">
      <div
        class="break-tint pointer-events-none absolute inset-0 bg-break-tint"
        data-testid="break-tint"
        data-active={onBreak}
        aria-hidden="true"
      />
      <header class="relative flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-8">
        <div class="flex h-[60px] items-center gap-3">
          <span class="text-base leading-6 font-medium tracking-widest uppercase">QUADRANTIC</span>
          <span class="pt-0.5 font-mono text-[11px] leading-[14px] tracking-wider text-outline">POMODORO</span>
        </div>
        <div class="flex items-center gap-6">
          <div data-slot="preset-toggle">
            <PresetToggle />
          </div>
          <button
            ref={gearRef}
            type="button"
            aria-label="Settings"
            aria-haspopup="dialog"
            onClick={() => {
              settingsOpen.value = true;
            }}
            class="flex items-center justify-center rounded p-1 text-on-surface-variant hover:text-on-surface"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M10.3 3h3.4l.5 2.4 1.9.8 2.1-1.3 2.4 2.4-1.3 2.1.8 1.9 2.4.5v3.4l-2.4.5-.8 1.9 1.3 2.1-2.4 2.4-2.1-1.3-1.9.8-.5 2.4h-3.4l-.5-2.4-1.9-.8-2.1 1.3-2.4-2.4 1.3-2.1-.8-1.9L3 13.7v-3.4l2.4-.5.8-1.9-1.3-2.1 2.4-2.4 2.1 1.3 1.9-.8z" />
            </svg>
          </button>
        </div>
      </header>
      <div class="relative flex flex-1">
        <main aria-label="Quadrantic Pomodoro" class="flex-1 px-8 py-8">
          <div class="flex flex-col items-center">
            <TimerPanel />
            <ClassificationControls />
          </div>
        </main>
        <aside
          aria-label="Today"
          class="w-[300px] shrink-0 border-l border-outline-variant bg-surface-container-low p-5"
        >
          <TodayList />
        </aside>
      </div>
      {settingsOpen.value ? <SettingsDrawer returnFocus={gearRef} /> : null}
    </div>
  );
}
