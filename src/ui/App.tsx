import { computed } from '@preact/signals';
import { useRef } from 'preact/hooks';
import { openSettings, settingsView, timer } from '../state/signals';
import { ClassificationControls } from './ClassificationControls';
import { PresetToggle } from './PresetToggle';
import { SettingsDrawer } from './SettingsDrawer';
import { TimerPanel } from './TimerPanel';
import { TodayList } from './TodayList';
import { SettingsIcon } from './icons';

const onBreak = computed(() => timer.value.kind !== 'focus');

export function App() {
  const gearRef = useRef<HTMLButtonElement>(null);
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
          <PresetToggle />
          <button
            ref={gearRef}
            type="button"
            aria-label="Settings"
            aria-haspopup="dialog"
            onClick={openSettings}
            class="flex items-center justify-center rounded p-1 text-on-surface-variant hover:text-on-surface"
          >
            <SettingsIcon width="18" height="18" />
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
          class="w-[300px] shrink-0 border-l border-outline-variant bg-surface-container-low p-6"
        >
          <TodayList />
        </aside>
      </div>
      {settingsView.value ? <SettingsDrawer returnFocus={gearRef} /> : null}
    </div>
  );
}
