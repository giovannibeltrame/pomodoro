import type { Mode, Quadrant } from '../domain/types';

export const QUADRANT_CLASS: Record<Quadrant, { text: string; bg: string; soft: string; ring: string; stroke: string }> = {
  q1: { text: 'text-secondary', bg: 'bg-secondary', soft: 'bg-secondary/15', ring: 'ring-secondary/60', stroke: 'text-secondary' },
  q2: { text: 'text-primary', bg: 'bg-primary', soft: 'bg-primary/15', ring: 'ring-primary/60', stroke: 'text-primary' },
  q3: { text: 'text-tertiary', bg: 'bg-tertiary', soft: 'bg-tertiary/15', ring: 'ring-tertiary/60', stroke: 'text-tertiary' },
};

export const MODE_LABEL: Record<Mode, string> = {
  focus: 'Foco',
  short: 'Pausa Curta',
  long: 'Pausa Longa',
};

export const BREAK_STROKE: Record<Exclude<Mode, 'focus'>, string> = {
  short: 'text-break-short',
  long: 'text-break-long',
};

export function pct(done: number, planned: number): number {
  return planned > 0 ? Math.round((done / planned) * 1000) / 10 : 0;
}
