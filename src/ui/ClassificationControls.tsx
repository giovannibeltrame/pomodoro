import type { Quadrant } from '../domain/timer';
import { activeRoles, intention, quadrant, roleId, selection, settingsOpen, timer } from '../state/signals';

const MANAGE = '__manage__';

const QUADRANTS: { id: Quadrant; name: string; descriptor: string }[] = [
  { id: 1, name: 'Do', descriptor: 'Urgent · Important' },
  { id: 2, name: 'Schedule', descriptor: 'Important · Not urgent' },
  { id: 3, name: 'Delegate', descriptor: 'Urgent · Not important' },
  { id: 4, name: 'Eliminate', descriptor: 'Neither' },
];

function Lock() {
  return (
    <svg
      data-testid="lock"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="1" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const field =
  'h-10 w-full rounded border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-outline disabled:cursor-not-allowed';

export function ClassificationControls() {
  const state = timer.value;
  if (state.kind !== 'focus') return null;
  const locked = state.status !== 'idle';
  const lockedValue = locked ? state.classification : null;
  const shownQuadrant = lockedValue ? lockedValue.quadrant : quadrant.value;
  const shownRole = lockedValue ? lockedValue.roleId : (activeRoles.value.find((r) => r.id === roleId.value)?.id ?? '');
  const shownIntention = lockedValue ? (lockedValue.intention ?? '') : intention.value;
  const dim = locked ? 'opacity-50' : '';

  return (
    <section class="flex w-full max-w-[640px] flex-col gap-3" aria-label="Classification">
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs font-medium tracking-[0.02em] text-on-surface-variant">CLASSIFY</span>
        {locked ? (
          <span class="text-on-surface-variant">
            <Lock />
          </span>
        ) : (
          selection.value === null && <span class="text-xs text-outline">Choose a quadrant and role to start</span>
        )}
      </div>
      <div class={`grid grid-cols-4 gap-2 ${dim}`} role="group" aria-label="Quadrant">
        {QUADRANTS.map((q) => {
          const selected = shownQuadrant === q.id;
          return (
            <button
              key={q.id}
              type="button"
              aria-pressed={selected}
              disabled={locked}
              onClick={() => (quadrant.value = q.id)}
              class="flex flex-col gap-1 rounded-lg border bg-surface-container p-3 text-left disabled:cursor-not-allowed"
              style={
                selected
                  ? {
                      borderColor: `var(--q${q.id})`,
                      backgroundColor: `color-mix(in srgb, var(--q${q.id}) 6%, var(--surface-container))`,
                    }
                  : { borderColor: 'var(--outline-variant)' }
              }
            >
              <span class="flex items-center gap-2 font-mono text-xs font-medium" style={{ color: `var(--q${q.id})` }}>
                <span class="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(--q${q.id})` }} />
                {`Q${q.id}`}
                <span class="text-on-surface">{q.name}</span>
              </span>
              <span class="text-xs text-on-surface-variant">{q.descriptor}</span>
            </button>
          );
        })}
      </div>
      <div class={dim}>
        <select
          aria-label="Role"
          class={field}
          disabled={locked}
          value={shownRole}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (value === MANAGE) {
              event.currentTarget.value = shownRole;
              settingsOpen.value = true;
              return;
            }
            roleId.value = value;
          }}
        >
          <option value="" disabled>
            Select a role
          </option>
          {activeRoles.value.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
          <option value={MANAGE}>Manage roles…</option>
        </select>
      </div>
      <div class={dim}>
        <input
          type="text"
          aria-label="Intention"
          class={field}
          placeholder="What will you work on?"
          disabled={locked}
          value={shownIntention}
          onInput={(event) => (intention.value = event.currentTarget.value)}
        />
      </div>
    </section>
  );
}
