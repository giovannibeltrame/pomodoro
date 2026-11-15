/**
 * PROTOTYPE for issue #20, throwaway. Font pairings and colour schemes applied to the real app,
 * mixed freely or through curated combos. Lives only on branch proto/typography-colors.
 */

export interface FontPairing {
  id: string;
  name: string;
  mood: 'sober' | 'ludic';
  sans: string;
  mono: string;
  timer: string;
  display: string;
  timerWeight: number;
  displayStyle?: string;
  sansFvs?: string;
  monoFvs?: string;
  timerFvs?: string;
  displayFvs?: string;
  note: string;
}

export const FONTS: FontPairing[] = [
  {
    id: 'current',
    name: 'Geist + JetBrains Mono',
    mood: 'sober',
    sans: "'Geist Variable'",
    mono: "'JetBrains Mono'",
    timer: "'JetBrains Mono'",
    display: "'Geist Variable'",
    timerWeight: 400,
    note: 'Today. Two families from different foundries; the mono reads as a code editor.',
  },
  {
    id: 'geist',
    name: 'Geist + Geist Mono',
    mood: 'sober',
    sans: "'Geist Variable'",
    mono: "'Geist Mono Variable'",
    timer: "'Geist Mono Variable'",
    display: "'Geist Variable'",
    timerWeight: 300,
    note: 'One superfamily, same metrics and rhythm. Smallest change; drops JetBrains Mono.',
  },
  {
    id: 'plex',
    name: 'IBM Plex Sans + Plex Mono',
    mood: 'sober',
    sans: "'IBM Plex Sans Variable'",
    mono: "'IBM Plex Mono'",
    timer: "'IBM Plex Mono'",
    display: "'IBM Plex Sans Variable'",
    timerWeight: 400,
    note: 'Technical, engineered. Plex Sans digits are already tabular.',
  },
  {
    id: 'editorial',
    name: 'Instrument Sans + Fraunces + DM Mono',
    mood: 'sober',
    sans: "'Instrument Sans Variable'",
    mono: "'DM Mono'",
    timer: "'Instrument Sans Variable'",
    display: "'Fraunces Variable'",
    displayStyle: 'italic',
    displayFvs: "'SOFT' 100, 'WONK' 1",
    timerWeight: 300,
    note: 'Serif wordmark, soft sans. Fraunces has no tabular digits, so the timer stays in Instrument Sans.',
  },
  {
    id: 'calm',
    name: 'Manrope + DM Mono',
    mood: 'sober',
    sans: "'Manrope Variable'",
    mono: "'DM Mono'",
    timer: "'Manrope Variable'",
    display: "'Manrope Variable'",
    timerWeight: 200,
    note: 'Open geometric sans with a thin tabular timer; quiet and wellness-like.',
  },
  {
    id: 'bubbly',
    name: 'Fredoka + Baloo 2',
    mood: 'ludic',
    sans: "'Fredoka Variable'",
    mono: "'Baloo 2 Variable'",
    timer: "'Baloo 2 Variable'",
    display: "'Fredoka Variable'",
    timerWeight: 600,
    note: 'Rounded, toy-like. Fredoka lacks tabular digits, so numbers use Baloo 2 with tnum.',
  },
  {
    id: 'casual',
    name: 'Recursive Casual',
    mood: 'ludic',
    sans: "'Recursive Variable'",
    mono: "'Recursive Variable'",
    timer: "'Recursive Variable'",
    display: "'Recursive Variable'",
    sansFvs: "'CASL' 1, 'MONO' 0",
    monoFvs: "'CASL' 1, 'MONO' 1",
    timerFvs: "'CASL' 1, 'MONO' 1",
    displayFvs: "'CASL' 1, 'MONO' 0",
    timerWeight: 600,
    note: 'One variable font, brush-like casual axis. MONO=1 gives fixed-width numbers.',
  },
  {
    id: 'quirky',
    name: 'Bricolage Grotesque + Space Mono',
    mood: 'ludic',
    sans: "'Bricolage Grotesque Variable'",
    mono: "'Space Mono'",
    timer: "'Bricolage Grotesque Variable'",
    display: "'Bricolage Grotesque Variable'",
    timerWeight: 800,
    note: 'Inky, characterful grotesque with a retro mono. Heavy tabular timer.',
  },
  {
    id: 'notebook',
    name: 'Shantell Sans + DM Mono',
    mood: 'ludic',
    sans: "'Shantell Sans Variable'",
    mono: "'DM Mono'",
    timer: "'Shantell Sans Variable'",
    display: "'Shantell Sans Variable'",
    displayFvs: "'INFM' 100, 'BNCE' 60",
    timerFvs: "'INFM' 60",
    timerWeight: 500,
    note: 'Marker handwriting with tabular digits. Informal and bounce axes on the wordmark.',
  },
  {
    id: 'soft',
    name: 'Nunito',
    mood: 'ludic',
    sans: "'Nunito Variable'",
    mono: "'Nunito Variable'",
    timer: "'Nunito Variable'",
    display: "'Nunito Variable'",
    timerWeight: 300,
    note: 'Rounded terminals, friendly but legible at 11px. Digits are tabular by default.',
  },
];

export interface ThemeTokens {
  background: string;
  panel: string;
  menu: string;
  border: string;
  text: string;
  textVariant: string;
  muted: string;
  tomatoStroke: string;
  primary: string;
  onPrimary: string;
  q: [string, string, string, string];
  breakTint: string;
  breakLabel: string;
}

export interface Palette {
  id: string;
  name: string;
  mood: 'sober' | 'ludic';
  dark: ThemeTokens;
  light: ThemeTokens;
  note: string;
}

export const PALETTES: Palette[] = [
  {
    id: 'zinc',
    name: 'Zinc (current)',
    mood: 'sober',
    note: 'Today: untinted greys, Tailwind red/indigo/amber/grey quadrants.',
    dark: {
      background: '#0f0f10',
      panel: '#161617',
      menu: '#1d1d1f',
      border: '#2a2a2d',
      text: '#ededee',
      textVariant: '#a1a1a6',
      muted: '#6b6b70',
      tomatoStroke: '#3a3a3e',
      primary: '#ededee',
      onPrimary: '#0f0f10',
      q: ['#f87171', '#818cf8', '#f59e0b', '#71717a'],
      breakTint: '#10b981',
      breakLabel: '#10b981',
    },
    light: {
      background: '#fafafa',
      panel: '#ffffff',
      menu: '#f4f4f5',
      border: '#e4e4e7',
      text: '#18181b',
      textVariant: '#52525b',
      muted: '#a1a1aa',
      tomatoStroke: '#d4d4d8',
      primary: '#18181b',
      onPrimary: '#fafafa',
      q: ['#ef4444', '#6366f1', '#d97706', '#71717a'],
      breakTint: '#10b981',
      breakLabel: '#059669',
    },
  },
  {
    id: 'okabe',
    name: 'Zinc · CVD-tuned',
    mood: 'sober',
    note: 'Same greys; quadrants searched in OKLCH for AA labels and separation under protan and deutan: vermilion, sky, peach, grey (dark); deep red, navy, burnt orange, grey (light).',
    dark: {
      background: '#0f0f10',
      panel: '#161617',
      menu: '#1d1d1f',
      border: '#2a2a2d',
      text: '#ededee',
      textVariant: '#a1a1a6',
      muted: '#75757a',
      tomatoStroke: '#3a3a3e',
      primary: '#ededee',
      onPrimary: '#0f0f10',
      q: ['#f92917', '#30aff8', '#faae6e', '#8a8a90'],
      breakTint: '#10b981',
      breakLabel: '#10b981',
    },
    light: {
      background: '#fafafa',
      panel: '#ffffff',
      menu: '#f4f4f5',
      border: '#e4e4e7',
      text: '#18181b',
      textVariant: '#52525b',
      muted: '#8a8a93',
      tomatoStroke: '#d4d4d8',
      primary: '#18181b',
      onPrimary: '#fafafa',
      q: ['#822b31', '#224a8d', '#ba5702', '#71717a'],
      breakTint: '#10b981',
      breakLabel: '#047857',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    mood: 'sober',
    note: 'Warm stone neutrals like a paper notebook; earthy quadrants: terracotta, slate blue, ochre, stone.',
    dark: {
      background: '#171513',
      panel: '#1e1b18',
      menu: '#26221e',
      border: '#332e28',
      text: '#eee8df',
      textVariant: '#ada395',
      muted: '#80766a',
      tomatoStroke: '#423b33',
      primary: '#eee8df',
      onPrimary: '#171513',
      q: ['#e07a5f', '#7c9cc4', '#d9a441', '#8f877c'],
      breakTint: '#6b9e6e',
      breakLabel: '#8bbf8e',
    },
    light: {
      background: '#f6f2ea',
      panel: '#fffdf8',
      menu: '#efe9de',
      border: '#e3dccf',
      text: '#2a241d',
      textVariant: '#5f5546',
      muted: '#8c8170',
      tomatoStroke: '#d8cfbf',
      primary: '#2a241d',
      onPrimary: '#f6f2ea',
      q: ['#b84b32', '#3d6596', '#946a10', '#7d7366'],
      breakTint: '#5c8a5f',
      breakLabel: '#3f6b42',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    mood: 'sober',
    note: 'Cool blue-grey neutrals; signal quadrants: vermilion, cobalt, yellow, grey.',
    dark: {
      background: '#0e1116',
      panel: '#151a21',
      menu: '#1c232c',
      border: '#262f3a',
      text: '#e6edf3',
      textVariant: '#9aa7b4',
      muted: '#6e7a87',
      tomatoStroke: '#34404d',
      primary: '#e6edf3',
      onPrimary: '#0e1116',
      q: ['#ff6b57', '#5b9cff', '#f2c94c', '#7d8794'],
      breakTint: '#2fbf8f',
      breakLabel: '#3dd6a3',
    },
    light: {
      background: '#f6f8fa',
      panel: '#ffffff',
      menu: '#eef1f4',
      border: '#dde3e9',
      text: '#14191f',
      textVariant: '#4f5b67',
      muted: '#838f9b',
      tomatoStroke: '#cfd7df',
      primary: '#14191f',
      onPrimary: '#f6f8fa',
      q: ['#d1361f', '#1f5fd6', '#8f6b00', '#66707c'],
      breakTint: '#10b981',
      breakLabel: '#047857',
    },
  },
  {
    id: 'sage',
    name: 'Sage',
    mood: 'sober',
    note: 'Green-grey neutrals, low saturation; muted quadrants: coral, periwinkle, sand, mist.',
    dark: {
      background: '#121513',
      panel: '#181c19',
      menu: '#1f2420',
      border: '#2b312c',
      text: '#e7ece7',
      textVariant: '#a0aaa1',
      muted: '#727d73',
      tomatoStroke: '#3a423b',
      primary: '#e7ece7',
      onPrimary: '#121513',
      q: ['#f08c7a', '#9aa8f0', '#d9b26a', '#8e9a94'],
      breakTint: '#7fbf8a',
      breakLabel: '#94d19e',
    },
    light: {
      background: '#f4f6f2',
      panel: '#fbfcfa',
      menu: '#ecefe8',
      border: '#dde3d8',
      text: '#1b211c',
      textVariant: '#4f5a50',
      muted: '#859086',
      tomatoStroke: '#cfd6ca',
      primary: '#1b211c',
      onPrimary: '#f4f6f2',
      q: ['#c24f3d', '#4c5cc0', '#8c6820', '#6a7670'],
      breakTint: '#4f9a5c',
      breakLabel: '#2f6e3a',
    },
  },
  {
    id: 'candy',
    name: 'Candy',
    mood: 'ludic',
    note: 'Plum night / cream day; bright pastel quadrants: bubblegum, sky, sunflower, lilac.',
    dark: {
      background: '#1a1424',
      panel: '#221a2f',
      menu: '#2b2139',
      border: '#3a2d4b',
      text: '#f6eefc',
      textVariant: '#c2b2d4',
      muted: '#917fa6',
      tomatoStroke: '#4b3c5e',
      primary: '#f6eefc',
      onPrimary: '#1a1424',
      q: ['#ff6b9a', '#4cc9f0', '#ffd84d', '#b79cff'],
      breakTint: '#5ef2b0',
      breakLabel: '#5ef2b0',
    },
    light: {
      background: '#fff8f0',
      panel: '#ffffff',
      menu: '#fbeee2',
      border: '#f0dcca',
      text: '#2d1f3d',
      textVariant: '#65547a',
      muted: '#9a88ad',
      tomatoStroke: '#ead5c2',
      primary: '#2d1f3d',
      onPrimary: '#fff8f0',
      q: ['#d42a62', '#0a7fae', '#a87c00', '#7452d1'],
      breakTint: '#1fbf7a',
      breakLabel: '#0d7a4c',
    },
  },
  {
    id: 'garden',
    name: 'Tomato garden',
    mood: 'ludic',
    note: 'Leaf-dark / straw-light neutrals, tomato-red Start button; quadrants: tomato, blueberry, mustard, aubergine.',
    dark: {
      background: '#14170f',
      panel: '#1b1f15',
      menu: '#23281b',
      border: '#313826',
      text: '#f3f1e4',
      textVariant: '#b3b59c',
      muted: '#83866d',
      tomatoStroke: '#3f4732',
      primary: '#ff5a3c',
      onPrimary: '#14170f',
      q: ['#ff7a5c', '#6fa8dc', '#f2c14e', '#b394c4'],
      breakTint: '#8fd16a',
      breakLabel: '#a6e07f',
    },
    light: {
      background: '#fbf7ec',
      panel: '#fffdf6',
      menu: '#f3eddc',
      border: '#e6dfc8',
      text: '#23261b',
      textVariant: '#5a5d48',
      muted: '#8c8f75',
      tomatoStroke: '#ddd5bd',
      primary: '#d63b22',
      onPrimary: '#fffdf6',
      q: ['#c93a22', '#2f6aa8', '#8f6a00', '#7b4f94'],
      breakTint: '#5aa83a',
      breakLabel: '#3b7a22',
    },
  },
];

export interface Combo {
  key: string;
  name: string;
  font: string;
  palette: string;
}

export const COMBOS: Combo[] = [
  { key: 'A', name: 'Current', font: 'current', palette: 'zinc' },
  { key: 'B', name: 'Refined', font: 'geist', palette: 'okabe' },
  { key: 'C', name: 'Editorial', font: 'editorial', palette: 'paper' },
  { key: 'D', name: 'Technical', font: 'plex', palette: 'slate' },
  { key: 'E', name: 'Calm', font: 'calm', palette: 'sage' },
  { key: 'F', name: 'Bubbly', font: 'bubbly', palette: 'candy' },
  { key: 'G', name: 'Casual garden', font: 'casual', palette: 'garden' },
  { key: 'H', name: 'Notebook', font: 'notebook', palette: 'paper' },
];

export function themeCss(font: FontPairing, palette: Palette): string {
  const vars = (t: ThemeTokens): string => `
    --background: ${t.background};
    --surface: ${t.background};
    --surface-container-lowest: ${t.background};
    --surface-container-low: ${t.panel};
    --surface-container: ${t.panel};
    --surface-container-high: ${t.menu};
    --surface-container-highest: ${t.menu};
    --on-surface: ${t.text};
    --on-surface-variant: ${t.textVariant};
    --outline: ${t.muted};
    --outline-variant: ${t.border};
    --tomato-stroke: ${t.tomatoStroke};
    --primary: ${t.primary};
    --on-primary: ${t.onPrimary};
    --q1: ${t.q[0]};
    --q2: ${t.q[1]};
    --q3: ${t.q[2]};
    --q4: ${t.q[3]};
    --break-tint: ${t.breakTint};
    --break-label: ${t.breakLabel};
    --menu-bg: ${t.menu};
    --menu-border: ${t.border};
    --switch-knob: ${t.onPrimary};`;
  return `
  html[data-theme='dark'] {${vars(palette.dark)} }
  html[data-theme='light'] {${vars(palette.light)} }
  html:root {
    --font-sans: ${font.sans}, ui-sans-serif, system-ui, sans-serif;
    --font-mono: ${font.mono}, ui-monospace, monospace;
  }
  html body { font-variation-settings: ${font.sansFvs ?? 'normal'}; }
  html .font-mono { font-variation-settings: ${font.monoFvs ?? 'normal'}; font-variant-numeric: tabular-nums; }
  html section[aria-label='Timer'] .text-\\[72px\\] {
    font-family: ${font.timer};
    font-weight: ${font.timerWeight};
    font-variation-settings: ${font.timerFvs ?? 'normal'};
    font-variant-numeric: tabular-nums;
  }
  html header span.tracking-widest {
    font-family: ${font.display};
    font-style: ${font.displayStyle ?? 'normal'};
    font-variation-settings: ${font.displayFvs ?? 'normal'};
  }`;
}
