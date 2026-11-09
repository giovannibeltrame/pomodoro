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

function clock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function todayPhases(records: readonly PhaseRecord[], now: number): PhaseRecord[] {
  const from = startOfDay(now);
  const to = nextStartOfDay(now);
  return records.filter((r) => r.start >= from && r.start < to).sort((a, b) => a.start - b.start);
}

export function totals(records: readonly PhaseRecord[]): string {
  const focus = records.filter((r) => r.kind === 'focus');
  const total = Math.round(focus.reduce((sum, r) => sum + r.activeMs, 0) / MINUTE);
  const mm = String(total % 60).padStart(2, '0');
  const noun = focus.length === 1 ? 'block' : 'blocks';
  return `${focus.length} ${noun} · ${Math.floor(total / 60)}h${mm} focus`;
}

export function formatRow(record: PhaseRecord, index: number): string {
  const label = PHASE_LABEL[record.kind];
  return `#${index + 1} · ${clock(record.start)}–${clock(record.end)} · ${label} ${minutes(record.activeMs)}m`;
}
