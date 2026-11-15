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
      class={`flex items-center gap-1 rounded-md border border-outline-variant bg-background p-1 ${locked ? 'opacity-50' : ''}`}
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
            class={`rounded px-3 py-1 font-mono text-xs leading-4 tracking-[0.02em] ${
              selected ? 'border-b-2 border-primary bg-surface-container-low font-medium text-primary' : 'text-outline'
            } ${locked ? 'cursor-not-allowed' : 'hover:text-on-surface'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
