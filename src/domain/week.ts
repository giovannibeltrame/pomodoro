import { QUADRANTS, type Block, type Counts, type Plan, type Quadrant } from './types';

export function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dayOfWeek(ts));
  return d.getTime();
}

export function dayOfWeek(ts: number): number {
  return (new Date(ts).getDay() + 6) % 7;
}

export function addWeeks(weekStart: number, n: number): number {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + n * 7);
  return d.getTime();
}

export function weekKey(weekStart: number): string {
  const d = new Date(weekStart);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function emptyCounts(): Counts {
  return { q1: 0, q2: 0, q3: 0 };
}

export interface DaySummary {
  date: number;
  counts: Counts;
  total: number;
  focusMs: number;
}

interface RoleSummary {
  role: string;
  blocks: number;
  focusMs: number;
  counts: Counts;
}

export interface WeekSummary {
  byQuadrant: Record<Quadrant, { planned: number; done: number }>;
  totalPlanned: number;
  totalDone: number;
  focusMs: number;
  days: DaySummary[];
  roles: RoleSummary[];
}

export function summarizeWeek(blocks: Block[], weekStart: number, plan: Plan): WeekSummary {
  const end = addWeeks(weekStart, 1);
  const inWeek = blocks.filter((b) => b.endedAt >= weekStart && b.endedAt < end);

  const days: DaySummary[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return { date: d.getTime(), counts: emptyCounts(), total: 0, focusMs: 0 };
  });

  const byQuadrant = Object.fromEntries(QUADRANTS.map((q) => [q, { planned: plan[q], done: 0 }])) as WeekSummary['byQuadrant'];
  const roles = new Map<string, RoleSummary>();
  let focusMs = 0;

  for (const b of inWeek) {
    byQuadrant[b.quadrant].done += 1;
    focusMs += b.focusMs;
    const day = days[dayOfWeek(b.endedAt)];
    day.counts[b.quadrant] += 1;
    day.total += 1;
    day.focusMs += b.focusMs;
    const r = roles.get(b.role) ?? { role: b.role, blocks: 0, focusMs: 0, counts: emptyCounts() };
    r.blocks += 1;
    r.focusMs += b.focusMs;
    r.counts[b.quadrant] += 1;
    roles.set(b.role, r);
  }

  return {
    byQuadrant,
    totalPlanned: QUADRANTS.reduce((n, q) => n + plan[q], 0),
    totalDone: inWeek.length,
    focusMs,
    days,
    roles: [...roles.values()].sort((a, b) => b.blocks - a.blocks),
  };
}

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
