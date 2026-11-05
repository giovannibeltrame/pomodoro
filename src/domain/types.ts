export const QUADRANTS = ['q1', 'q2', 'q3'] as const;
export type Quadrant = (typeof QUADRANTS)[number];

export type Mode = 'focus' | 'short' | 'long';

export interface Durations {
  focus: number;
  short: number;
  long: number;
  longEvery: number;
}

export interface Block {
  id: string;
  quadrant: Quadrant;
  role: string;
  goal: string;
  startedAt: number;
  endedAt: number;
  focusMs: number;
}

export type Plan = Record<Quadrant, number>;

export const QUADRANT_INFO: Record<Quadrant, { label: string; title: string; hint: string; axis: string }> = {
  q1: {
    label: 'Q1',
    title: 'Crises & Urgências',
    hint: 'Incêndios, bloqueios imediatos, bugs de produção.',
    axis: 'Urgente + Importante',
  },
  q2: {
    label: 'Q2',
    title: 'Trabalho Profundo',
    hint: 'Arquitetura, estratégia, escrita técnica, criação.',
    axis: 'Não Urgente + Importante',
  },
  q3: {
    label: 'Q3',
    title: 'Demandas & Interrupções',
    hint: 'Mensagens, triagem de emails reativa, reuniões ad-hoc.',
    axis: 'Urgente + Não Importante',
  },
};
