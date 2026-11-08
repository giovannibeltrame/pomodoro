---
name: Quadrantic Pomodoro
colors:
  background: '#0f0f10'
  surface: '#0f0f10'
  surface-container-lowest: '#0b0b0c'
  surface-container-low: '#161617'
  surface-container: '#161617'
  surface-container-high: '#1d1d1f'
  surface-container-highest: '#242426'
  on-surface: '#ededee'
  on-surface-variant: '#a1a1a6'
  outline: '#6b6b70'
  outline-variant: '#2a2a2d'
  primary: '#ededee'
  on-primary: '#0f0f10'
  q1: '#f87171'
  q2: '#818cf8'
  q3: '#f59e0b'
  q4: '#71717a'
  break-tint: '#10b981'
  light-background: '#fafafa'
  light-surface: '#ffffff'
  light-outline-variant: '#e4e4e7'
  light-on-surface: '#18181b'
  light-on-surface-variant: '#52525b'
  light-outline: '#a1a1aa'
  light-primary: '#18181b'
  light-q1: '#ef4444'
  light-q2: '#6366f1'
  light-q3: '#d97706'
  light-q4: '#71717a'
typography:
  display-timer:
    fontFamily: JetBrains Mono
    fontSize: 72px
    fontWeight: '400'
    lineHeight: 72px
    letterSpacing: -0.03em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  DEFAULT: 0.25rem
  lg: 0.5rem
  full: 9999px
spacing:
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
  margin-desktop: 2rem
---

## Product

Quadrantic Pomodoro is a single-page **desktop-only** web app (min width 1024px). There are no tablet or mobile layouts.

One main screen:
- top bar: wordmark "QUADRANTIC" + muted "POMODORO", a `Classic | Deep` segmented toggle, a settings gear;
- center column: tomato progress indicator, phase label, timer, Start/Reset, classification (quadrant cards, role select, intention input);
- right panel (300px): the "Today" list.

Settings opens as a drawer over the main screen.

There is **no** quadrant matrix, **no** 2x2 grid, **no** task lists, **no** checkboxes, **no** charts, **no** history, **no** footer, **no** status indicators.

## Style

Calm, minimal, generous whitespace. Neutral grays with zero blue or warm tint. No glows, gradients or heavy shadows; depth comes only from tonal steps and 1px low-contrast borders. Radii: 4px controls, 8px cards and panels.

## Colors

Light and Dark themes (System default); every screen must exist in both.

- Dark: canvas `#0f0f10`; panels/cards/inputs `#161617`; menus/drawer `#1d1d1f`; borders `#2a2a2d`; text `#ededee` / `#a1a1a6` / muted `#6b6b70`.
- Light: canvas `#fafafa`; panels/cards/inputs `#ffffff`; borders `#e4e4e7`; text `#18181b` / `#52525b` / muted `#a1a1aa`.
- Primary button is monochrome: near-white on dark theme, near-black on light theme. Disabled: surface background, muted text.

### Quadrant colors

Use them sparingly: small dots, the `Qn` label, a 1px selected border, and the quadrant chip in Today rows. Apart from these, the only other hues are the tomato's ripening fill and the faint break tint.

| Quadrant | Name | Dark | Light |
|---|---|---|---|
| Q1 | Do | `#f87171` | `#ef4444` |
| Q2 | Schedule | `#818cf8` | `#6366f1` |
| Q3 | Delegate | `#f59e0b` | `#d97706` |
| Q4 | Eliminate | `#71717a` | `#71717a` |

### Phase tint

Focus is neutral. Breaks get a faint green tint on the canvas (`#10b981` at 4–6% opacity); never saturated.

## Typography

- Geist for all UI text.
- JetBrains Mono with tabular numerals for: the timer (72px, weight 400), all times, durations, counts, `Qn` labels and small uppercase section labels.

## Components

- **Tomato progress indicator**: a minimalist geometric line tomato, about 180px tall, centered above the timer, drawn with a single 1.5px stroke plus a small stem and leaf.
  - Idle: empty outline, muted.
  - Running focus: fills from the bottom, proportional to elapsed time, and the fill ripens from green to red as the block runs. The fill is one solid color interpolated along the ripening scale: 0% `#4ade80` (green), ~40% `#a3c94a` (yellow-green), ~60% `#f59e0b` (amber), 85–100% `#ef4444` (red). The fill never uses the quadrant color; the quadrant shows only on the selected quadrant card.
  - Paused: same fill at 50% opacity.
  - Break: static and muted.
- **Phase label**: `FOCUS · Block 1 of 4` (or `BREAK`, `LONG BREAK`), above the timer.
- **Quadrant cards**: four in one row (Q1 Do, Q2 Schedule, Q3 Delegate, Q4 Eliminate). Each has a colored `Qn` label, a dot and a muted descriptor.
  - Selected: 1px border in the quadrant color plus a 6% tint.
  - A muted hint "Choose a quadrant and role to start" sits right-aligned on the label row while nothing is selected.
- **Role select**: placeholder "Select a role"; the options end with "Manage roles…".
- **Intention input**: single line, placeholder "What will you work on?".
- **Today panel**: secondary, small text.
  - Heading "Today", a mono totals line `4 blocks · 3h20 focus`, then a divider.
  - Rows, oldest first:
    - Focus: `#3 · 09:40–10:30 · Focus 50m · Builder · [Q2] · "intention…"`, where `[Q2]` is a colored chip and the intention is truncated.
    - Break (muted): `#4 · 10:30–10:40 · Break 10m`.
  - Focus rows show a `⋯` menu on hover (Edit, Delete).
  - Empty state: "No blocks yet today. Start your first focus block."
- **Settings drawer** (right side), sections:
  - Theme: System / Light / Dark.
  - Sound toggle.
  - Notifications toggle (may show "Blocked in browser").
  - Roles: list with drag handle, rename, archive; "Add role"; collapsed "Archived" group with restore.
