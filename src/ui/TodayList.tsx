import { useEffect, useRef, useState } from 'preact/hooks';
import type { PhaseRecord, Quadrant } from '../domain/timer';
import { formatRow, totals } from '../domain/today';
import { activeRoles, editPhase, removePhase, roles, startDayWatch, todayRecords } from '../state/signals';

type Mode = 'view' | 'menu' | 'edit' | 'confirm';

const field =
  'h-8 w-full rounded border border-outline-variant bg-surface-container px-2 text-xs text-on-surface placeholder:text-outline';
const action = 'rounded border border-outline-variant px-2 py-1 text-xs text-on-surface hover:bg-surface-container';

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
      <li class="today-row truncate font-mono text-xs text-on-surface-variant" data-kind={record.kind}>
        {line}
      </li>
    );
  }
  if (mode === 'edit') {
    return (
      <li class="today-row flex flex-col gap-1" data-kind="focus" ref={ref}>
        <span class="truncate font-mono text-xs text-on-surface-variant">{line}</span>
        <EditForm record={record} onDone={() => setMode('view')} />
      </li>
    );
  }
  if (mode === 'confirm') {
    return (
      <li class="today-row flex flex-col gap-1" data-kind="focus" ref={ref}>
        <span class="truncate font-mono text-xs text-on-surface-variant">{line}</span>
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
    <li class="today-row group relative flex flex-col gap-0.5" data-kind="focus" ref={ref}>
      <button
        type="button"
        aria-label="Block actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setMode(open ? 'view' : 'menu')}
        class={`absolute right-0 top-0 rounded px-1 text-on-surface-variant hover:bg-surface-container focus:opacity-100 group-hover:opacity-100 ${open ? 'opacity-100' : 'opacity-0'}`}
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          class="absolute right-0 top-5 z-10 flex flex-col rounded border border-outline-variant bg-surface-container py-1 text-xs text-on-surface"
        >
          <button
            type="button"
            role="menuitem"
            class="px-3 py-1 text-left hover:bg-surface"
            onClick={() => setMode('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            class="px-3 py-1 text-left hover:bg-surface"
            onClick={() => setMode('confirm')}
          >
            Delete
          </button>
        </div>
      )}
      <span class="truncate pr-5 font-mono text-xs text-on-surface-variant">{line}</span>
      <span class="flex min-w-0 items-baseline gap-1 whitespace-nowrap text-xs text-on-surface">
        {role && <span class="shrink-0">{role.name}</span>}
        {record.quadrant && (
          <>
            {role && <span class="shrink-0 text-outline">·</span>}
            <span
              class="shrink-0 font-mono font-medium"
              data-testid="chip"
              style={{ color: `var(--q${record.quadrant})` }}
            >
              {`Q${record.quadrant}`}
            </span>
          </>
        )}
        {record.intention && (
          <>
            <span class="shrink-0 text-outline">·</span>
            <span class="truncate text-on-surface-variant">{`"${record.intention}"`}</span>
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
    <section class="flex flex-col gap-2">
      <h2 class="font-mono text-xs font-medium tracking-[0.02em] text-on-surface">Today</h2>
      <p class="font-mono text-xs text-on-surface-variant">{totals(records)}</p>
      <hr class="border-outline-variant" />
      {records.length === 0 ? (
        <p class="text-xs text-on-surface-variant">No blocks yet today. Start your first focus block.</p>
      ) : (
        <ol class="flex flex-col gap-3">
          {records.map((record, index) => (
            <Row key={record.start} record={record} index={index} />
          ))}
        </ol>
      )}
    </section>
  );
}
