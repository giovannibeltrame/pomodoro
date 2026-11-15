import { MINUTE, PHASE_LABEL, type PhaseRecord } from './timer';

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function nextStartOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

function minutes(ms: number): number {
  return Math.max(1, Math.round(ms / MINUTE));
}

export function clock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function todayPhases(records: readonly PhaseRecord[], now: number): PhaseRecord[] {
  const from = startOfDay(now);
  const to = nextStartOfDay(now);
  return records.filter((r) => r.start >= from && r.start < to).sort((a, b) => a.start - b.start);
}

export function isNewDay(records: readonly PhaseRecord[], now: number): boolean {
  const from = startOfDay(now);
  return records.every((r) => r.start < from);
}

export function totals(records: readonly PhaseRecord[]): string {
  const focus = records.filter((r) => r.kind === 'focus');
  const total = Math.round(focus.reduce((sum, r) => sum + r.activeMs, 0) / MINUTE);
  const mm = String(total % 60).padStart(2, '0');
  const noun = focus.length === 1 ? 'block' : 'blocks';
  return `${focus.length} ${noun} · ${Math.floor(total / 60)}h${mm}`;
}

export function phaseLength(record: PhaseRecord): string {
  return `${PHASE_LABEL[record.kind]} ${minutes(record.activeMs)}m`;
}

export interface Entry {
  record: PhaseRecord;
  rest?: PhaseRecord;
}

export function entries(records: readonly PhaseRecord[]): Entry[] {
  const list: Entry[] = [];
  for (const record of records) {
    const last = list.at(-1);
    if (record.kind !== 'focus' && last?.record.kind === 'focus' && !last.rest) last.rest = record;
    else list.push({ record });
  }
  return list.reverse();
}
