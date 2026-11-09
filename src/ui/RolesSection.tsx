import { useEffect, useRef, useState } from 'preact/hooks';
import {
  activeRoles,
  changeRoleName,
  createRole,
  moveRole,
  roleNameError,
  roles,
  setRoleArchived,
  settingsToRoles,
} from '../state/signals';
import type { Role } from '../state/storage';

function ActiveRow({
  role,
  index,
  onDragStart,
  onDropOn,
}: {
  role: Role;
  index: number;
  onDragStart: (id: string) => void;
  onDropOn: (index: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const commit = (input: HTMLInputElement): void => {
    const value = input.value;
    if (value.trim() === role.name) {
      setError(null);
      input.value = role.name;
      return;
    }
    if (roleNameError(value, role.id) !== null) {
      setError(roleNameError(value, role.id));
      return;
    }
    changeRoleName(role.id, value);
    setError(null);
  };

  return (
    <li
      data-role-id={role.id}
      tabIndex={0}
      draggable
      aria-label={role.name}
      onDragStart={() => onDragStart(role.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDropOn(index);
      }}
      onKeyDown={(event) => {
        if (!event.altKey) return;
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveRole(role.id, index - 1);
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveRole(role.id, index + 1);
        }
      }}
      class="flex flex-col gap-1 rounded border border-outline-variant px-2 py-1"
    >
      <div class="flex items-center gap-2">
        <span aria-hidden="true" class="cursor-grab select-none font-mono text-on-surface-variant">
          ⋮⋮
        </span>
        <input
          key={role.name}
          type="text"
          aria-label={`Rename ${role.name}`}
          aria-invalid={error !== null}
          defaultValue={role.name}
          onBlur={(event) => commit(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit(event.currentTarget);
            } else if (event.key === 'Escape' && !event.altKey) {
              event.stopPropagation();
              event.currentTarget.value = role.name;
              setError(null);
            }
          }}
          class="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none"
        />
        <button
          type="button"
          aria-label={`Archive ${role.name}`}
          onClick={() => setRoleArchived(role.id, true)}
          class="rounded px-2 py-0.5 font-mono text-xs text-on-surface-variant hover:bg-surface-container-high"
        >
          Archive
        </button>
      </div>
      {error ? (
        <span role="alert" class="font-mono text-xs text-on-surface-variant">
          {error}
        </span>
      ) : null}
    </li>
  );
}

function AddRow({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = (value: string): void => {
    const problem = roleNameError(value);
    if (problem !== null) {
      setError(problem);
      return;
    }
    createRole(value);
    onDone();
  };

  return (
    <li class="flex flex-col gap-1 rounded border border-outline-variant px-2 py-1">
      <div class="flex items-center gap-2">
        <input
          ref={ref}
          type="text"
          aria-label="New role name"
          aria-invalid={error !== null}
          placeholder="Role name"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit(event.currentTarget.value);
            } else if (event.key === 'Escape') {
              event.stopPropagation();
              onDone();
            }
          }}
          class="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none"
        />
        <button
          type="button"
          onClick={() => submit(ref.current?.value ?? '')}
          class="rounded px-2 py-0.5 font-mono text-xs text-on-surface-variant hover:bg-surface-container-high"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          class="rounded px-2 py-0.5 font-mono text-xs text-on-surface-variant hover:bg-surface-container-high"
        >
          Cancel
        </button>
      </div>
      {error ? (
        <span role="alert" class="font-mono text-xs text-on-surface-variant">
          {error}
        </span>
      ) : null}
    </li>
  );
}

export function RolesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dragId = useRef<string | null>(null);
  const [adding, setAdding] = useState(false);
  const active = activeRoles.value;
  const archived = roles.value.filter((r) => r.archived);
  const order = active.map((r) => r.id).join(',');
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    if (settingsToRoles.value) sectionRef.current?.scrollIntoView?.({ block: 'start' });
  }, []);

  useEffect(() => {
    const id = focusId.current;
    if (id === null) return;
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-role-id]') ?? []);
    const row = rows.find((r) => r.dataset.roleId === id);
    if (row && document.activeElement !== row && !row.contains(document.activeElement)) row.focus();
  }, [order]);

  return (
    <section ref={sectionRef} aria-label="Roles" class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3 class="font-mono text-xs uppercase tracking-[0.02em] text-on-surface-variant">Roles</h3>
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={adding}
          class="rounded px-2 py-0.5 font-mono text-xs text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
        >
          Add role
        </button>
      </div>
      <ul
        ref={listRef}
        class="flex flex-col gap-1"
        onFocusIn={(event) => {
          const row = (event.target as HTMLElement).closest<HTMLElement>('[data-role-id]');
          focusId.current = row?.dataset.roleId ?? null;
        }}
      >
        {active.map((role, index) => (
          <ActiveRow
            key={role.id}
            role={role}
            index={index}
            onDragStart={(id) => {
              dragId.current = id;
            }}
            onDropOn={(to) => {
              const id = dragId.current;
              dragId.current = null;
              if (id !== null) moveRole(id, to);
            }}
          />
        ))}
        {adding ? <AddRow onDone={() => setAdding(false)} /> : null}
      </ul>
      {archived.length > 0 ? (
        <details class="rounded border border-outline-variant px-2 py-1">
          <summary class="cursor-pointer font-mono text-xs text-on-surface-variant">
            Archived ({archived.length})
          </summary>
          <ul class="mt-1 flex flex-col gap-1">
            {archived.map((role) => (
              <li key={role.id} class="flex items-center justify-between gap-2">
                <span class="min-w-0 truncate text-sm text-on-surface-variant">{role.name}</span>
                <button
                  type="button"
                  aria-label={`Restore ${role.name}`}
                  onClick={() => setRoleArchived(role.id, false)}
                  class="rounded px-2 py-0.5 font-mono text-xs text-on-surface-variant hover:bg-surface-container-high"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
