import { useLayoutEffect, useRef } from 'preact/hooks';
import { closeSettings, settings, updateSettings } from '../state/signals';
import type { Settings } from '../state/storage';
import { RolesSection } from './RolesSection';
import { sectionLabel } from './styles';

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
  description,
  checked,
  disabled = false,
  hint,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <section class="flex flex-col gap-2.5 border-b border-outline-variant py-5">
      <h3 class={sectionLabel}>{label}</h3>
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col">
          <span class="text-[13px] leading-5 text-on-surface">{description}</span>
          {hint ? <span class="font-mono text-[11px] text-outline">{hint}</span> : null}
        </div>
        <button
          type="button"
          role="switch"
          aria-label={label}
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          class={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 ${
            checked ? 'justify-end bg-primary' : 'justify-start bg-outline-variant'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <span class={`h-5 w-5 rounded-full shadow-sm ${checked ? 'bg-switch-knob' : 'bg-outline'}`} />
        </button>
      </div>
    </section>
  );
}

export function SettingsDrawer({ returnFocus }: { returnFocus: { current: HTMLElement | null } }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedInside = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const target = returnFocus;
    return () => {
      dialog?.close();
      target.current?.focus();
    };
  }, [returnFocus]);

  const blocked = notificationsBlocked();
  const current = settings.value;

  return (
    <dialog
      ref={ref}
      aria-label="Settings"
      onCancel={(event) => {
        event.preventDefault();
        closeSettings();
      }}
      onMouseDown={(event) => {
        pressedInside.current = event.target !== event.currentTarget;
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pressedInside.current) closeSettings();
      }}
      class="m-0 ml-auto h-full max-h-none w-[400px] max-w-none border-0 border-l border-menu-border bg-menu-bg p-0 text-on-surface backdrop:bg-scrim"
    >
      <div class="flex h-full flex-col overflow-y-auto p-6">
        <div class="flex items-center justify-between border-b border-outline-variant pb-5">
          <h2 class="text-base font-medium leading-6 text-on-surface">Settings</h2>
          <button
            type="button"
            aria-label="Close settings"
            onClick={closeSettings}
            class={`flex items-center justify-center rounded-[4px] p-1 text-on-surface-variant transition-colors duration-150 hover:text-on-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-outline`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <section class="flex flex-col gap-2.5 border-b border-outline-variant py-5">
          <h3 class={sectionLabel}>Theme</h3>
          <div
            role="group"
            aria-label="Theme"
            class="flex w-full items-center gap-1 rounded-md border border-outline-variant bg-background p-1"
          >
            {THEMES.map(({ value, label }) => {
              const selected = current.theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateSettings({ theme: value })}
                  class={`flex-1 py-1.5 text-center font-mono text-xs transition-colors duration-150 ${
                    selected
                      ? 'rounded-[4px] border-b-2 border-primary bg-surface-container-low font-medium text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>
        <Toggle
          label="Sound"
          description="Play a sound when a phase ends"
          checked={current.sound}
          onChange={(sound) => updateSettings({ sound })}
        />
        <Toggle
          label="Notifications"
          description="Browser notification when a phase ends"
          checked={current.notifications && !blocked}
          disabled={blocked}
          hint={blocked ? 'Blocked in browser' : undefined}
          onChange={(notifications) => updateSettings({ notifications })}
        />
        <RolesSection />
      </div>
    </dialog>
  );
}
