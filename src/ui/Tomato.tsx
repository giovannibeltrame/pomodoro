import { useId } from 'preact/hooks';
import { ripenColor } from '../domain/ripen';
import type { PhaseKind } from '../domain/timer';

export interface TomatoProps {
  kind: PhaseKind;
  status: 'idle' | 'running' | 'paused';
  progress: number;
}

const BODY = 'M80 50 C 120 36 148 66 146 106 C 144 142 114 164 80 164 C 46 164 16 142 14 106 C 12 66 40 36 80 50 Z';
const TOP = 46;
const HEIGHT = 118;

export function Tomato({ kind, status, progress }: TomatoProps) {
  const clipId = useId();
  const filling = kind === 'focus' && status !== 'idle';
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const state = kind !== 'focus' ? 'break' : status;

  return (
    <svg
      class="text-on-surface-variant"
      data-slot="tomato"
      data-state={state}
      width="160"
      height="180"
      viewBox="0 0 160 180"
      fill="none"
      role="img"
      aria-label="Focus progress"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
      </defs>
      {filling && (
        <g clip-path={`url(#${clipId})`}>
          <rect
            data-slot="tomato-fill"
            class="tomato-fill"
            x="0"
            y={TOP}
            width="160"
            height={HEIGHT}
            fill={ripenColor(p)}
            opacity={status === 'paused' ? 0.5 : 1}
            style={{ transform: `translateY(${(1 - p) * HEIGHT}px)` }}
          />
        </g>
      )}
      <path
        d={BODY}
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linejoin="round"
        opacity={state === 'break' ? 0.6 : 1}
      />
      <path d="M80 50 L80 30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      <path
        d="M80 38 C 92 18 114 18 124 28 C 112 40 94 42 80 38 Z"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </svg>
  );
}
