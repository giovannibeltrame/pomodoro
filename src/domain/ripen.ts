const STOPS: readonly (readonly [number, readonly [number, number, number]])[] = [
  [0, [0x4a, 0xde, 0x80]],
  [0.4, [0xa3, 0xc9, 0x4a]],
  [0.6, [0xf5, 0x9e, 0x0b]],
  [0.85, [0xef, 0x44, 0x44]],
];

function hex(channel: number): string {
  return Math.round(channel).toString(16).padStart(2, '0');
}

export function clampProgress(progress: number): number {
  return Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
}

export function ripenColor(progress: number): string {
  const p = clampProgress(progress);
  let index = 0;
  while (index < STOPS.length - 1 && p >= STOPS[index + 1][0]) index += 1;
  if (index === STOPS.length - 1) {
    const [r, g, b] = STOPS[index][1];
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }
  const [p0, c0] = STOPS[index];
  const [p1, c1] = STOPS[index + 1];
  const t = (p - p0) / (p1 - p0);
  return `#${hex(c0[0] + (c1[0] - c0[0]) * t)}${hex(c0[1] + (c1[1] - c0[1]) * t)}${hex(c0[2] + (c1[2] - c0[2]) * t)}`;
}
