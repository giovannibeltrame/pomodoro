import { SHORTCUTS } from './theme';

export function Shortcuts() {
  return (
    <div className="flex items-center gap-space-md text-outline font-mono text-label-sm">
      {SHORTCUTS.map((s) => (
        <span key={s.key} className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface">{s.key}</kbd>
          <span className="text-on-surface-variant">{s.label}</span>
        </span>
      ))}
    </div>
  );
}
