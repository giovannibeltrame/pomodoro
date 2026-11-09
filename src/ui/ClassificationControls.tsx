import type { Quadrant } from '../domain/timer';
import { activeRoles, intention, openRoles, quadrant, roleId, selection, timer } from '../state/signals';

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
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const label = 'font-mono text-[11px] leading-[14px] uppercase tracking-wider text-outline';

const field =
  'h-10 w-full appearance-none rounded border border-outline-variant bg-surface-container px-4 text-[13px] leading-5 text-on-surface placeholder:text-outline disabled:cursor-not-allowed';

function Adornment({ locked }: { locked: boolean }) {
  return (
    <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-outline">
      {locked ? <Lock /> : <Chevron />}
    </span>
  );
}

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
    <section class="mt-8 flex w-full max-w-[620px] flex-col gap-5" aria-label="Classification">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class={label}>Quadrant</span>
          {!locked && selection.value === null && (
            <span class="text-xs text-outline">Choose a quadrant and role to start</span>
          )}
        </div>
        <div class="grid grid-cols-4 gap-3" role="group" aria-label="Quadrant">
          {QUADRANTS.map((q) => {
            const selected = shownQuadrant === q.id;
            const dimmed = locked && !selected;
            return (
              <button
                key={q.id}
                type="button"
                aria-pressed={selected}
                disabled={locked}
                onClick={() => (quadrant.value = q.id)}
                class={`flex h-[76px] flex-col justify-between rounded-lg border bg-surface-container p-3 text-left disabled:cursor-default ${dimmed ? 'opacity-45' : ''}`}
                style={
                  selected
                    ? {
                        borderColor: `var(--q${q.id})`,
                        backgroundColor: `color-mix(in srgb, var(--q${q.id}) 6%, var(--surface-container))`,
                      }
                    : { borderColor: 'var(--outline-variant)' }
                }
              >
                <span class="flex w-full items-center justify-between">
                  <span class="font-mono text-xs font-medium" style={{ color: `var(--q${q.id})` }}>
                    {`Q${q.id} ${q.name}`}
                  </span>
                  <span class="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(--q${q.id})` }} />
                </span>
                <span class="text-xs leading-tight text-outline">{q.descriptor}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class={label}>Role</span>
        <div class={`relative ${dim}`}>
          <select
            aria-label="Role"
            class={field}
            disabled={locked}
            value={shownRole}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (value === MANAGE) {
                event.currentTarget.value = shownRole;
                openRoles();
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
          <Adornment locked={locked} />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class={label}>Intention (optional)</span>
        <div class={`relative ${dim}`}>
          <input
            type="text"
            aria-label="Intention"
            class={field}
            placeholder="What will you work on?"
            disabled={locked}
            value={shownIntention}
            onInput={(event) => (intention.value = event.currentTarget.value)}
          />
          {locked && <Adornment locked />}
        </div>
      </div>
    </section>
  );
}
