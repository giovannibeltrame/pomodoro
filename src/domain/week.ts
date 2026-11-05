import { QUADRANTS, type Block, type Plan, type Quadrant } from './types';

export function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d.getTime();
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

export function emptyCounts(): Record<Quadrant, number> {
  return { q1: 0, q2: 0, q3: 0 };
}

export interface QuadrantSummary {
  planned: number;
  done: number;
}

export interface DaySummary {
  date: number;
  counts: Record<Quadrant, number>;
  total: number;
}

export interface RoleSummary {
  role: string;
  blocks: number;
  focusMs: number;
  counts: Record<Quadrant, number>;
}

export interface WeekSummary {
  byQuadrant: Record<Quadrant, QuadrantSummary>;
  totalPlanned: number;
  totalDone: number;
  focusMs: number;
  days: DaySummary[];
  roles: RoleSummary[];
}

export function blocksInRange(blocks: Block[], from: number, to: number): Block[] {
  return blocks.filter((b) => b.endedAt >= from && b.endedAt < to);
}

export function summarizeWeek(blocks: Block[], weekStart: number, plan: Plan): WeekSummary {
  const end = addWeeks(weekStart, 1);
  const inWeek = blocksInRange(blocks, weekStart, end);

  const days: DaySummary[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return { date: d.getTime(), counts: emptyCounts(), total: 0 };
  });

  const byQuadrant = Object.fromEntries(QUADRANTS.map((q) => [q, { planned: plan[q], done: 0 }])) as Record<
    Quadrant,
    QuadrantSummary
  >;
  const roles = new Map<string, RoleSummary>();
  let focusMs = 0;

  for (const b of inWeek) {
    byQuadrant[b.quadrant].done += 1;
    focusMs += b.focusMs;
    const day = days.findLast((d) => d.date <= b.endedAt) ?? days[0];
    day.counts[b.quadrant] += 1;
    day.total += 1;
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

export function dayRange(ts: number): [number, number] {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  return [d.getTime(), next.getTime()];
}

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
