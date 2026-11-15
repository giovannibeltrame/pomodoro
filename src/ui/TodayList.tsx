import { useState } from 'preact/hooks';
import { QUADRANTS, type PhaseRecord, type Quadrant } from '../domain/timer';
import { clock, entries, phaseLength, totals, type Entry } from '../domain/today';
import { activeRoles, editPhase, removePhase, roles, todayRecords } from '../state/signals';
import type { PhaseEdit } from '../state/storage';
import { DeleteIcon, EditIcon } from './icons';
import { RowMenu } from './RowMenu';

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
    const edit: PhaseEdit = { intention: text.trim() };
    if (q !== undefined) edit.quadrant = q;
    if (roleId) edit.roleId = roleId;
    editPhase(record.start, edit);
    onDone();
  };
  return (
    <div class="flex flex-col gap-2" data-testid="edit-form">
      <div class="flex gap-1" role="group" aria-label="Quadrant">
        {QUADRANTS.map(({ id: n }) => (
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

const meta = 'font-mono text-[11px] leading-[18px] text-outline';

function Time({ record }: { record: PhaseRecord }) {
  return <span class={`w-9 shrink-0 ${meta}`}>{clock(record.start)}</span>;
}

function BreakRow({ record }: { record: PhaseRecord }) {
  return (
    <li class="today-row flex gap-3 py-2.5" data-kind={record.kind}>
      <Time record={record} />
      <span class={meta}>{phaseLength(record)}</span>
    </li>
  );
}

function Separator() {
  return <span class="shrink-0 text-outline">·</span>;
}

function Intention({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      aria-expanded={expanded}
      title={text}
      onClick={() => setExpanded(!expanded)}
      class={`text-left text-xs leading-[18px] break-words text-on-surface ${expanded ? '' : 'line-clamp-2'}`}
    >
      {text}
    </button>
  );
}

function FocusRow({ entry }: { entry: Entry }) {
  const { record, rest } = entry;
  const [mode, setMode] = useState<Mode>('view');
  const open = mode === 'menu';
  const browsing = mode === 'view' || open;
  const length = phaseLength(record);
  const role = roles.value.find((r) => r.id === record.roleId);
  const menu = (
    <RowMenu
      class="-my-[3px] ml-auto"
      label="Block actions"
      open={open}
      onOpenChange={(next) => setMode(next ? 'menu' : 'view')}
      revealOnHover
      items={[
        { label: 'Edit', icon: <EditIcon />, onSelect: () => setMode('edit') },
        { label: 'Delete', icon: <DeleteIcon />, onSelect: () => setMode('confirm'), danger: true },
      ]}
    />
  );
  return (
    <li
      class={`today-row group -mx-2 flex gap-3 rounded px-2 py-2.5 ${browsing ? 'hover:bg-surface-container-high' : ''} ${open ? 'bg-surface-container-high' : ''}`}
      data-kind="focus"
    >
      <Time record={record} />
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        {browsing ? (
          <>
            <div class="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs leading-[18px]">
              <span class={`shrink-0 ${meta}`}>{length}</span>
              {role && (
                <>
                  <Separator />
                  <span class="truncate text-on-surface-variant">{role.name}</span>
                </>
              )}
              {record.quadrant && (
                <>
                  <Separator />
                  <span
                    class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] leading-[14px] font-medium"
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
              {menu}
            </div>
            {record.intention && <Intention text={record.intention} />}
          </>
        ) : (
          <>
            <span class={meta}>{length}</span>
            {mode === 'edit' ? (
              <EditForm record={record} onDone={() => setMode('view')} />
            ) : (
              <>
                <span class="text-xs text-on-surface">Delete this block?</span>
                <div class="flex gap-2">
                  <button type="button" class={action} onClick={() => removePhase(record.start)}>
                    Delete
                  </button>
                  <button type="button" class={action} onClick={() => setMode('view')}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {rest && <span class={meta}>{`+ ${phaseLength(rest)}`}</span>}
      </div>
    </li>
  );
}

export function TodayList() {
  const records = todayRecords.value;
  return (
    <section class="flex min-h-0 flex-1 flex-col">
      <h2 class="text-base leading-6 font-medium text-on-surface">Today</h2>
      <p class="mt-1 font-mono text-[11px] leading-[14px] text-outline">{totals(records)}</p>
      <hr class="my-4 border-outline-variant" />
      {records.length === 0 ? (
        <p class="text-xs text-on-surface-variant">No blocks yet today. Start your first focus block.</p>
      ) : (
        <ol class="-mx-2 flex min-h-0 flex-1 flex-col divide-y divide-outline-variant/60 overflow-y-auto px-2">
          {entries(records).map((entry) =>
            entry.record.kind === 'focus' ? (
              <FocusRow key={entry.record.start} entry={entry} />
            ) : (
              <BreakRow key={entry.record.start} record={entry.record} />
            ),
          )}
        </ol>
      )}
    </section>
  );
}
