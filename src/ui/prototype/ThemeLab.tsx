/**
 * PROTOTYPE for issue #20, throwaway. Floating switcher over the real app: curated combos (←/→),
 * free font and palette mixing, a theme flip, an in-memory sample day, and live contrast and
 * colour-blindness readouts for the shown theme. Nothing here writes to storage.
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { PhaseRecord } from '../../domain/timer';
import { phases } from '../../state/signals';
import { COMBOS, FONTS, PALETTES, themeCss, type ThemeTokens } from './lab';
import './fonts.css';

type Rgb = [number, number, number];

function hex(c: string): Rgb {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lin(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(c: string): number {
  const [r, g, b] = hex(c).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const CVD: Record<string, number[][]> = {
  normal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

function oklab(c: string, m: number[][]): Rgb {
  const v = hex(c).map(lin);
  const [r, g, b] = m.map((row) => Math.min(1, Math.max(0, row[0] * v[0] + row[1] * v[1] + row[2] * v[2])));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s,
  ];
}

function minDelta(colors: string[], m: number[][]): { d: number; pair: string } {
  let best = { d: Infinity, pair: '' };
  for (let i = 0; i < colors.length; i++)
    for (let j = i + 1; j < colors.length; j++) {
      const [a, b] = [oklab(colors[i], m), oklab(colors[j], m)];
      const d = 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      if (d < best.d) best = { d, pair: `Q${i + 1}–Q${j + 1}` };
    }
  return best;
}

function sampleDay(): PhaseRecord[] {
  const day = new Date();
  const at = (h: number, m: number): number =>
    new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime();
  const rows: [number, number, number, PhaseRecord['kind'], (1 | 2 | 3 | 4)?, string?, string?][] = [
    [8, 30, 25, 'focus', 2, 'builder', 'Outline the quarterly plan and list the three bets for the team'],
    [8, 55, 5, 'break'],
    [9, 0, 25, 'focus', 1, 'builder', 'Fix the sign-in regression before the afternoon release'],
    [9, 25, 5, 'break'],
    [9, 30, 25, 'focus', 3, 'manager', 'Answer vendor emails'],
    [9, 55, 5, 'break'],
    [10, 0, 25, 'focus', 2, 'learner', 'Read the chapter on spaced repetition'],
    [10, 25, 15, 'longBreak'],
    [10, 40, 25, 'focus', 4, 'manager', 'Tidy the shared drive'],
  ];
  return rows.map(([h, m, min, kind, quadrant, roleId, intention]) => ({
    start: at(h, m),
    end: at(h, m) + min * 60_000,
    kind,
    activeMs: min * 60_000,
    quadrant,
    roleId,
    intention,
  }));
}

function param(name: string): string | null {
  return new URLSearchParams(location.search).get(name);
}

function rating(v: number, good: number, fair: number): string {
  return v >= good ? '✓' : v >= fair ? '~' : '✗';
}

export function ThemeLab() {
  const initial = COMBOS.find((c) => c.key === param('variant')) ?? COMBOS[0];
  const [fontId, setFontId] = useState(param('font') ?? initial.font);
  const [paletteId, setPaletteId] = useState(param('palette') ?? initial.palette);
  const [mode, setMode] = useState(document.documentElement.dataset.theme ?? 'dark');
  const [info, setInfo] = useState(true);

  const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const combo = COMBOS.find((c) => c.font === font.id && c.palette === palette.id);

  useEffect(() => {
    let el = document.getElementById('theme-lab') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'theme-lab';
      document.head.append(el);
    }
    el.textContent = themeCss(font, palette);
    const q = new URLSearchParams(location.search);
    if (combo) {
      q.set('variant', combo.key);
      q.delete('font');
      q.delete('palette');
    } else {
      q.delete('variant');
      q.set('font', font.id);
      q.set('palette', palette.id);
    }
    history.replaceState(null, '', `?${q}`);
  }, [font, palette, combo]);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const step = (dir: number): void => {
    const i = combo ? COMBOS.indexOf(combo) : -1;
    const next = COMBOS[(i + dir + COMBOS.length) % COMBOS.length];
    setFontId(next.font);
    setPaletteId(next.palette);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tokens: ThemeTokens = mode === 'light' ? palette.light : palette.dark;
  const metrics = useMemo(() => {
    const checks: [string, number, number][] = [
      ['Text / canvas', contrast(tokens.text, tokens.background), 4.5],
      ['Secondary / panel', contrast(tokens.textVariant, tokens.panel), 4.5],
      ['Muted / panel', contrast(tokens.muted, tokens.panel), 3],
      ['Button label', contrast(tokens.onPrimary, tokens.primary), 4.5],
      ['Break label / canvas', contrast(tokens.breakLabel, tokens.background), 4.5],
      ...tokens.q.map((c, i): [string, number, number] => [`Q${i + 1} label / panel`, contrast(c, tokens.panel), 4.5]),
    ];
    const cvd = Object.entries(CVD).map(([k, m]) => ({ k, ...minDelta(tokens.q, m) }));
    return { checks, cvd };
  }, [tokens]);

  const bar =
    'pointer-events-auto flex items-center gap-2 rounded-full bg-[#111] px-3 py-2 text-[12px] text-white shadow-[0_8px_30px_rgb(0_0_0/0.45)] ring-1 ring-white/20';
  const sel = 'rounded bg-[#222] px-1.5 py-1 text-white ring-1 ring-white/20';
  const btn = 'rounded px-2 py-1 hover:bg-white/15';
  const labStyle = { fontFamily: 'system-ui, sans-serif', fontVariationSettings: 'normal' };

  return (
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2" style={labStyle}>
      {info && (
        <div class="pointer-events-auto fixed bottom-20 left-4 w-[360px] rounded-xl bg-[#111]/95 p-4 text-[12px] leading-[18px] text-white shadow-[0_8px_30px_rgb(0_0_0/0.45)] ring-1 ring-white/20">
          <div class="mb-2 text-[11px] tracking-wider text-white/50 uppercase">Prototype #20 · {mode} theme</div>
          <p>
            <b>{font.name}</b> <span class="text-white/50">({font.mood})</span> — {font.note}
          </p>
          <p class="mt-1">
            <b>{palette.name}</b> <span class="text-white/50">({palette.mood})</span> — {palette.note}
          </p>
          <div class="mt-3 flex flex-col gap-3">
            <div>
              <div class="mb-1 text-white/50">WCAG contrast (target)</div>
              {metrics.checks.map(([label, v, target]) => (
                <div key={label} class="flex justify-between tabular-nums">
                  <span>{label}</span>
                  <span class={v >= target ? 'text-emerald-300' : 'text-rose-300'}>
                    {v.toFixed(2)} ({target}) {v >= target ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <div class="mb-1 text-white/50">Quadrant separation, min ΔE OKLab ×100 (≥15 ✓, ≥8 ~)</div>
              {metrics.cvd.map(({ k, d, pair }) => (
                <div key={k} class="flex justify-between tabular-nums">
                  <span>{k}</span>
                  <span class={d >= 15 ? 'text-emerald-300' : d >= 8 ? 'text-amber-300' : 'text-rose-300'}>
                    {d.toFixed(1)} {pair} {rating(d, 15, 8)}
                  </span>
                </div>
              ))}
              <div class="mt-2 flex gap-1">
                {tokens.q.map((c, i) => (
                  <span
                    key={c}
                    class="flex items-center gap-1 rounded px-1.5 py-0.5"
                    style={{ background: tokens.panel, color: c }}
                  >
                    ● Q{i + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div class={bar}>
        <button type="button" class={btn} aria-label="Previous combo" onClick={() => step(-1)}>
          ←
        </button>
        <span class="min-w-[130px] text-center font-semibold">
          {combo ? `${combo.key} · ${combo.name}` : 'Custom mix'}
        </span>
        <button type="button" class={btn} aria-label="Next combo" onClick={() => step(1)}>
          →
        </button>
        <select class={sel} value={font.id} onChange={(e) => setFontId(e.currentTarget.value)} aria-label="Fonts">
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.mood === 'ludic' ? '🎈 ' : ''}
              {f.name}
            </option>
          ))}
        </select>
        <select
          class={sel}
          value={palette.id}
          onChange={(e) => setPaletteId(e.currentTarget.value)}
          aria-label="Colours"
        >
          {PALETTES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.mood === 'ludic' ? '🎈 ' : ''}
              {p.name}
            </option>
          ))}
        </select>
        <button type="button" class={btn} onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
          {mode === 'dark' ? '☾ Dark' : '☀ Light'}
        </button>
        <button type="button" class={btn} onClick={() => (phases.value = sampleDay())}>
          Sample day
        </button>
        <button type="button" class={btn} onClick={() => setInfo(!info)}>
          {info ? 'Hide info' : 'Info'}
        </button>
      </div>
    </div>
  );
}
