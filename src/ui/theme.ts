import type { Mode, Quadrant } from '../domain/types';

export const QUADRANT_CLASS: Record<Quadrant, { text: string; bg: string; soft: string; ring: string }> = {
  q1: { text: 'text-secondary', bg: 'bg-secondary', soft: 'bg-secondary/15', ring: 'ring-secondary/60' },
  q2: { text: 'text-primary', bg: 'bg-primary', soft: 'bg-primary/15', ring: 'ring-primary/60' },
  q3: { text: 'text-tertiary', bg: 'bg-tertiary', soft: 'bg-tertiary/15', ring: 'ring-tertiary/60' },
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

export const SHORTCUTS = [
  { key: 'Espaço', label: 'Play/Pausa' },
  { key: 'R', label: 'Reset' },
  { key: 'S', label: 'Pular' },
];

export const PAGE = 'max-w-7xl mx-auto w-full px-margin md:px-margin-desktop py-space-xl flex flex-col gap-space-xl';
export const SECONDARY_BTN = 'rounded-lg bg-white/[0.03] border border-white/[0.07] text-[#D4D4D8] hover:bg-white/[0.07]';
export const TABS = 'flex items-center gap-space-xs p-1 rounded-lg bg-surface-container-lowest';

export function tabClass(active: boolean): string {
  return `px-space-md py-1.5 rounded text-title-sm transition-all ${
    active ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
  }`;
}

export function pct(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 1000) / 10 : 0;
}
