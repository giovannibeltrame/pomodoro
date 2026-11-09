import { useEffect, useRef, useState } from 'preact/hooks';
import type { PhaseRecord, Quadrant } from '../domain/timer';
import { formatRow, totals } from '../domain/today';
import { activeRoles, editPhase, removePhase, roles, startDayWatch, todayRecords } from '../state/signals';

type Mode = 'view' | 'menu' | 'edit' | 'confirm';

const field =
  'h-8 w-full rounded border border-outline-variant bg-surface-container px-2 text-xs text-on-surface placeholder:text-outline';
const action = 'rounded border border-outline-variant px-2 py-1 text-xs text-on-surface hover:bg-surface-container';

const iconProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round' as const,
  'stroke-linejoin': 'round' as const,
  'aria-hidden': true,
};

function EditIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function EditForm({ record, onDone }: { record: PhaseRecord; onDone: () => void }) {
  const [q, setQ] = useState<Quadrant | undefined>(record.quadrant);
  const [roleId, setRoleId] = useState(record.roleId ?? '');
  const [text, setText] = useState(record.intention ?? '');
  const ordered = [...activeRoles.value, ...roles.value.filter((r) => r.archived && r.id === record.roleId)];
  const save = () => {
    const edit: { quadrant?: Quadrant; roleId?: string; intention?: string } = { intention: text.trim() };
    if (q !== undefined) edit.quadrant = q;
    if (roleId) edit.roleId = roleId;
    editPhase(record.start, edit);
    onDone();
  };
  return (
    <div class="flex flex-col gap-2" data-testid="edit-form">
      <div class="flex gap-1" role="group" aria-label="Quadrant">
        {([1, 2, 3, 4] as const).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={q === n}
            onClick={() => setQ(n)}
            class="flex-1 rounded border px-1 py-1 font-mono text-xs"
            style={
              q === n
                ? { borderColor: `var(--q${n})`, color: `var(--q${n})` }
                : { borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }
            }
          >
            {`Q${n}`}
          </button>
        ))}
      </div>
      <select aria-label="Role" class={field} value={roleId} onChange={(event) => setRoleId(event.currentTarget.value)}>
        {roleId === '' && (
          <option value="" disabled>
            Select a role
          </option>
        )}
        {ordered.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        aria-label="Intention"
        class={field}
        placeholder="What did you work on?"
        value={text}
        onInput={(event) => setText(event.currentTarget.value)}
      />
      <div class="flex justify-end gap-2">
        <button type="button" class={action} onClick={onDone}>
          Cancel
        </button>
        <button type="button" class={action} onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}

function Row({ record, index }: { record: PhaseRecord; index: number }) {
  const [mode, setMode] = useState<Mode>('view');
  const ref = useRef<HTMLLIElement>(null);
  const open = mode === 'menu';

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMode('view');
    };
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setMode('view');
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  const line = formatRow(record, index);
  if (record.kind !== 'focus') {
    return (
      <li class="today-row truncate py-2.5 font-mono text-[11px] text-outline" data-kind={record.kind}>
        {line}
      </li>
    );
  }
  if (mode === 'edit') {
    return (
      <li class="today-row flex flex-col gap-1 py-2.5" data-kind="focus" ref={ref}>
        <span class="truncate font-mono text-[11px] text-outline">{line}</span>
        <EditForm record={record} onDone={() => setMode('view')} />
      </li>
    );
  }
  if (mode === 'confirm') {
    return (
      <li class="today-row flex flex-col gap-1 py-2.5" data-kind="focus" ref={ref}>
        <span class="truncate font-mono text-[11px] text-outline">{line}</span>
        <span class="text-xs text-on-surface">Delete this block?</span>
        <div class="flex gap-2">
          <button type="button" class={action} onClick={() => removePhase(record.start)}>
            Delete
          </button>
          <button type="button" class={action} onClick={() => setMode('view')}>
            Cancel
          </button>
        </div>
      </li>
    );
  }
  const role = roles.value.find((r) => r.id === record.roleId);
  return (
    <li
      class={`today-row group relative -mx-2 flex flex-col gap-1 rounded px-2 py-2.5 hover:bg-surface-container-high ${open ? 'bg-surface-container-high' : ''}`}
      data-kind="focus"
      ref={ref}
    >
      <div class="flex items-center justify-between gap-2">
        <span class="truncate font-mono text-[11px] text-outline">{line}</span>
        <button
          type="button"
          aria-label="Block actions"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setMode(open ? 'view' : 'menu')}
          class={`flex shrink-0 items-center justify-center rounded p-0.5 text-on-surface-variant hover:text-on-surface focus:opacity-100 group-hover:opacity-100 ${open ? 'opacity-100' : 'opacity-0'}`}
        >
          <MoreIcon />
        </button>
      </div>
      {open && (
        <div
          role="menu"
          class="absolute right-2 top-8 z-20 flex w-[140px] flex-col rounded-md border border-menu-border bg-menu-bg py-1 text-[13px] shadow-menu"
        >
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-on-surface transition-colors hover:bg-outline-variant"
            onClick={() => setMode('edit')}
          >
            <EditIcon />
            <span>Edit</span>
          </button>
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-q1 transition-colors hover:bg-outline-variant"
            onClick={() => setMode('confirm')}
          >
            <DeleteIcon />
            <span>Delete</span>
          </button>
        </div>
      )}
      <span class="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs">
        {role && <span class="shrink-0 text-on-surface-variant">{role.name}</span>}
        {record.quadrant && (
          <>
            {role && <span class="shrink-0 text-outline">·</span>}
            <span
              class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium"
              data-testid="chip"
              style={{
                color: `var(--q${record.quadrant})`,
                backgroundColor: `color-mix(in srgb, var(--q${record.quadrant}) var(--chip-tint), transparent)`,
              }}
            >
              {`Q${record.quadrant}`}
            </span>
          </>
        )}
        {record.intention && (
          <>
            <span class="shrink-0 text-outline">·</span>
            <span class="truncate text-on-surface">{`"${record.intention}"`}</span>
          </>
        )}
      </span>
    </li>
  );
}

export function TodayList() {
  useEffect(() => startDayWatch(), []);
  const records = todayRecords.value;
  return (
    <section class="flex flex-col">
      <h2 class="text-base leading-6 font-medium text-on-surface">Today</h2>
      <p class="mt-1 font-mono text-[11px] text-outline">{totals(records)}</p>
      <hr class="my-4 border-outline-variant" />
      {records.length === 0 ? (
        <p class="text-xs text-on-surface-variant">No blocks yet today. Start your first focus block.</p>
      ) : (
        <ol class="flex flex-col divide-y divide-outline-variant/60">
          {records.map((record, index) => (
            <Row key={record.start} record={record} index={index} />
          ))}
        </ol>
      )}
    </section>
  );
}
