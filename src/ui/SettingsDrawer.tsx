import { useEffect, useRef } from 'preact/hooks';
import { closeSettings, settings, updateSettings } from '../state/signals';
import type { Settings } from '../state/storage';
import { RolesSection } from './RolesSection';

const THEMES: { value: Settings['theme']; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function notificationsBlocked(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'denied';
}

function Toggle({
  label,
  checked,
  disabled = false,
  hint,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div class="flex items-center justify-between py-3">
      <div class="flex flex-col">
        <span class="text-sm text-on-surface">{label}</span>
        {hint ? <span class="font-mono text-xs text-on-surface-variant">{hint}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        class={`flex h-6 w-10 items-center rounded-full border border-outline-variant p-0.5 ${
          checked ? 'justify-end bg-surface-container-high' : 'justify-start'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span class={`h-4 w-4 rounded-full ${checked ? 'bg-on-surface' : 'bg-outline'}`} />
      </button>
    </div>
  );
}

export function SettingsDrawer({ returnFocus }: { returnFocus: { current: HTMLElement | null } }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeSettings();
    };
    document.addEventListener('keydown', onKey);
    const target = returnFocus;
    return () => {
      document.removeEventListener('keydown', onKey);
      target.current?.focus();
    };
  }, [returnFocus]);

  const blocked = notificationsBlocked();
  const current = settings.value;

  return (
    <div class="fixed inset-0 z-20 flex justify-end">
      <div class="absolute inset-0 bg-black/40" data-testid="drawer-backdrop" onClick={closeSettings} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        class="relative flex h-full w-[360px] flex-col gap-6 overflow-y-auto border-l border-outline-variant bg-surface-container-low p-6"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-base font-medium text-on-surface">Settings</h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close settings"
            onClick={closeSettings}
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
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <section class="flex flex-col gap-2">
          <h3 class="font-mono text-xs uppercase tracking-[0.02em] text-on-surface-variant">Theme</h3>
          <div role="group" aria-label="Theme" class="flex rounded border border-outline-variant p-0.5">
            {THEMES.map(({ value, label }) => {
              const selected = current.theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateSettings({ theme: value })}
                  class={`flex-1 rounded-sm px-3 py-1 font-mono text-xs ${
                    selected
                      ? 'bg-surface-container-high text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>
        <section class="flex flex-col">
          <Toggle label="Sound" checked={current.sound} onChange={(sound) => updateSettings({ sound })} />
          <Toggle
            label="Notifications"
            checked={current.notifications && !blocked}
            disabled={blocked}
            hint={blocked ? 'Blocked in browser' : undefined}
            onChange={(notifications) => updateSettings({ notifications })}
          />
        </section>
        <RolesSection />
      </div>
    </div>
  );
}
