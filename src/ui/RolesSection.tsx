import { useEffect, useRef, useState } from 'preact/hooks';
import {
  activeRoles,
  changeRoleName,
  createRole,
  moveRole,
  roles,
  setRoleArchived,
  settingsView,
} from '../state/signals';
import type { Role } from '../state/storage';
import { EditIcon, strokeIcon } from './icons';
import { sectionLabel } from './styles';

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
  const [editing, setEditing] = useState(false);
  const finished = useRef(false);
  const editRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (refocus.current) {
      refocus.current = false;
      editRef.current?.focus();
    }
  }, [editing]);

  const finish = (): void => {
    finished.current = true;
    setError(null);
    setEditing(false);
  };

  const commit = (input: HTMLInputElement): void => {
    if (finished.current) return;
    const value = input.value;
    if (value.trim() === role.name) {
      finish();
      return;
    }
    const problem = changeRoleName(role.id, value);
    if (problem !== null) {
      setError(problem);
      return;
    }
    finish();
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
      class="flex flex-col border-b border-outline-variant/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-outline"
    >
      <div class="flex h-10 items-center gap-2.5">
        <svg {...strokeIcon} class="h-4 w-4 shrink-0 cursor-grab text-outline">
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            aria-label={`Rename ${role.name}`}
            aria-invalid={error !== null}
            defaultValue={role.name}
            onBlur={(event) => commit(event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                refocus.current = true;
                commit(event.currentTarget);
              } else if (event.key === 'Escape' && !event.altKey) {
                event.stopPropagation();
                event.currentTarget.value = role.name;
                refocus.current = true;
                finish();
              }
            }}
            class="min-w-0 flex-1 border-b border-outline bg-transparent text-[13px] leading-5 text-on-surface outline-none"
          />
        ) : (
          <span class="min-w-0 flex-1 truncate text-[13px] leading-5 text-on-surface">{role.name}</span>
        )}
        <div class="flex items-center gap-3">
          <button
            ref={editRef}
            type="button"
            aria-label={`Edit ${role.name}`}
            onClick={() => {
              finished.current = false;
              setEditing(true);
            }}
            class="text-outline transition-colors duration-150 hover:text-on-surface"
          >
            <EditIcon class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Archive ${role.name}`}
            onClick={() => setRoleArchived(role.id, true)}
            class="text-outline transition-colors duration-150 hover:text-on-surface"
          >
            <svg {...strokeIcon} class="h-3.5 w-3.5">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </button>
        </div>
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
    const problem = createRole(value);
    if (problem !== null) {
      setError(problem);
      return;
    }
    onDone();
  };

  return (
    <li class="flex flex-col border-b border-outline-variant/60">
      <div class="flex h-10 items-center gap-2">
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
          class="min-w-0 flex-1 bg-transparent text-[13px] leading-5 text-on-surface outline-none placeholder:text-outline"
        />
        <button
          type="button"
          onClick={() => submit(ref.current?.value ?? '')}
          class="font-mono text-xs text-on-surface-variant transition-colors duration-150 hover:text-on-surface"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          class="font-mono text-xs text-on-surface-variant transition-colors duration-150 hover:text-on-surface"
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
    if (settingsView.value === 'roles') sectionRef.current?.scrollIntoView?.({ block: 'start' });
  }, []);

  useEffect(() => {
    const id = focusId.current;
    if (id === null) return;
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-role-id]') ?? []);
    const row = rows.find((r) => r.dataset.roleId === id);
    if (row && document.activeElement !== row && !row.contains(document.activeElement)) row.focus();
  }, [order]);

  return (
    <section ref={sectionRef} aria-label="Roles" class="flex flex-col gap-3 pt-5">
      <h3 class={sectionLabel}>Roles</h3>
      <ul
        ref={listRef}
        class="flex flex-col"
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
      <button
        type="button"
        aria-label="Add role"
        onClick={() => setAdding(true)}
        disabled={adding}
        class="mt-1 flex h-9 w-full items-center justify-center rounded-[4px] border border-outline-variant text-xs text-on-surface-variant transition-colors duration-150 hover:border-tomato-stroke hover:text-on-surface disabled:opacity-50"
      >
        + Add role
      </button>
      {archived.length > 0 ? (
        <details class="mt-3">
          <summary class={`${sectionLabel} cursor-pointer hover:text-on-surface-variant`}>
            Archived ({archived.length})
          </summary>
          <ul class="mt-2 flex flex-col">
            {archived.map((role) => (
              <li key={role.id} class="flex h-9 items-center justify-between gap-2 px-1">
                <span class="min-w-0 truncate text-[13px] leading-5 text-outline">{role.name}</span>
                <button
                  type="button"
                  aria-label={`Restore ${role.name}`}
                  onClick={() => setRoleArchived(role.id, false)}
                  class="text-xs text-on-surface-variant transition-colors duration-150 hover:text-on-surface"
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
