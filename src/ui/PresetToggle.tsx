import type { Preset } from '../domain/timer';
import { selectPreset, settings, timer } from '../state/signals';

const OPTIONS: { value: Preset; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'deep', label: 'Deep' },
];

export function PresetToggle() {
  const locked = timer.value.status !== 'idle';
  return (
    <div
      role="group"
      aria-label="Preset"
      class={`flex rounded border border-outline-variant p-0.5 ${locked ? 'opacity-50' : ''}`}
    >
      {OPTIONS.map(({ value, label }) => {
        const selected = settings.value.preset === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            disabled={locked}
            onClick={() => selectPreset(value)}
            class={`rounded-sm px-3 py-1 font-mono text-xs ${
              selected ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant'
            } ${locked ? 'cursor-not-allowed' : 'hover:text-on-surface'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
