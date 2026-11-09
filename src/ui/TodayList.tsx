import { useEffect } from 'preact/hooks';
import type { PhaseRecord } from '../domain/timer';
import { formatRow, totals } from '../domain/today';
import { roles, startDayWatch, todayRecords } from '../state/signals';

function Row({ record, index }: { record: PhaseRecord; index: number }) {
  const line = formatRow(record, index);
  if (record.kind !== 'focus') {
    return (
      <li class="today-row truncate font-mono text-xs text-on-surface-variant" data-kind={record.kind}>
        {line}
      </li>
    );
  }
  const role = roles.value.find((r) => r.id === record.roleId);
  return (
    <li class="today-row flex flex-col gap-0.5" data-kind="focus">
      <span class="truncate font-mono text-xs text-on-surface-variant">{line}</span>
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
