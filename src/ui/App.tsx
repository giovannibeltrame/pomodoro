import { computed } from '@preact/signals';
import { useCallback, useRef, useState } from 'preact/hooks';
import { openSettings, settingsView, timer } from '../state/signals';
import { ClassificationControls } from './ClassificationControls';
import { PresetToggle } from './PresetToggle';
import { SettingsDrawer } from './SettingsDrawer';
import { TimerPanel } from './TimerPanel';
import { TodayList } from './TodayList';
import { TodaySheet } from './TodaySheet';
import { SettingsIcon, TodayIcon } from './icons';
import { iconButton } from './styles';

const onBreak = computed(() => timer.value.kind !== 'focus');

export function App() {
  const gearRef = useRef<HTMLButtonElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);
  const [todayOpen, setTodayOpen] = useState(false);
  const closeToday = useCallback(() => setTodayOpen(false), []);
  return (
    <div class="relative flex h-dvh flex-col bg-background text-on-surface">
      <div
        class="break-tint pointer-events-none absolute inset-0 bg-break-tint"
        data-testid="break-tint"
        data-active={onBreak}
        aria-hidden="true"
      />
      <header class="relative flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 sm:px-8">
        <div class="flex h-[60px] items-center gap-3">
          <span class="text-base leading-6 font-medium tracking-widest uppercase">QUADRANTIC</span>
          <span class="hidden pt-0.5 font-mono text-[11px] leading-[14px] tracking-wider text-outline sm:inline">
            POMODORO
          </span>
        </div>
        <div class="flex items-center gap-3 sm:gap-6">
          <PresetToggle />
          <button
            ref={todayRef}
            type="button"
            aria-label="Today"
            aria-haspopup="dialog"
            onClick={() => setTodayOpen(true)}
            class={`${iconButton} p-1 lg:hidden`}
          >
            <TodayIcon />
          </button>
          <button
            ref={gearRef}
            type="button"
            aria-label="Settings"
            aria-haspopup="dialog"
            onClick={openSettings}
            class={`${iconButton} p-1`}
          >
            <SettingsIcon width="18" height="18" />
          </button>
        </div>
      </header>
      <div class="relative flex min-h-0 flex-1">
        <main aria-label="Quadrantic Pomodoro" class="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 short:py-3">
          <div class="flex flex-col items-center">
            <TimerPanel />
            <ClassificationControls />
          </div>
        </main>
        <aside
          aria-label="Today"
          class="hidden w-[340px] shrink-0 flex-col border-l border-outline-variant bg-surface-container-low p-6 lg:flex"
        >
          <TodayList />
        </aside>
      </div>
      {todayOpen ? <TodaySheet returnFocus={todayRef} onClose={closeToday} /> : null}
      {settingsView.value ? <SettingsDrawer returnFocus={gearRef} /> : null}
    </div>
  );
}
