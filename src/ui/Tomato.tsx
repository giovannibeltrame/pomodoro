import { useId } from 'preact/hooks';
import { ripenColor } from '../domain/ripen';
import type { PhaseKind } from '../domain/timer';

export interface TomatoProps {
  kind: PhaseKind;
  status: 'idle' | 'running' | 'paused';
  progress: number;
}

const BODY = 'M16 10c-6.8 0-11 4.5-11 11.2C5 26.5 9.5 29 16 29s11-2.5 11-7.8C27 14.5 22.8 10 16 10z';
const TOP = 10;
const HEIGHT = 19;

export function Tomato({ kind, status, progress }: TomatoProps) {
  const clipId = useId();
  const filling = kind === 'focus' && status !== 'idle';
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const state = kind !== 'focus' ? 'break' : status;

  return (
    <svg
      data-slot="tomato"
      data-state={state}
      width="180"
      height="180"
      viewBox="0 0 32 32"
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
            width="32"
            height={HEIGHT}
            fill={ripenColor(p)}
            opacity={status === 'paused' ? 0.5 : 1}
            style={{ transform: `translateY(${(1 - p) * HEIGHT}px)` }}
          />
        </g>
      )}
      <g
        stroke="var(--tomato-stroke)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity={state === 'break' ? 0.6 : 1}
      >
        <path d="M16 4v4" />
        <path d="M16 8c-2.5-3-6-2.5-7.5-1.5 1 2 2.5 3.5 5.5 3.5" />
        <path d="M16 8c2.5-3 6-2.5 7.5-1.5-1 2-2.5 3.5-5.5 3.5" />
        <path d="M16 8l-2 3" />
        <path d="M16 8l2 3" />
        <path d={BODY} />
      </g>
    </svg>
  );
}
