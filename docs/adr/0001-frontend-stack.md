# ADR 0001: Frontend stack

## Context

Quadrantic Pomodoro is a single-page, desktop-only web app with no backend. All data stays in the browser and the app must not make network requests. The UI has several interactive states: a running timer, a settings drawer, row menus with inline edit and confirm, drag-to-reorder roles, and light/dark themes. The approved design is in Stitch, which exports screens as Tailwind HTML.

The timer has to be correct across reloads, hidden tabs and several open tabs, and the PRD requires unit tests for its logic.

The repo already holds an app for the previous design: React 18, npm and Tailwind 3, with a weekly plan panel. The redesign changes the scope, the layout and the data model, so little of its UI carries over.

## Decision

- **Preact + Vite + strict TypeScript**, with `@preact/signals` for UI state. No `preact/compat`.
- **The timer is a pure, framework-free state machine** (`state + event + now → state`). The UI only renders it and sends it events.
- **Tailwind v4.** The design tokens are CSS variables, and the theme is switched with a `data-theme` attribute so System, Light and Dark share one set of classes.
- **No network at runtime.** Fonts are self-hosted through `@fontsource` packages and icons are inline SVG.
- **localStorage** holds versioned JSON, one key per collection. Past days are kept; nothing is pruned.
- **Phase timing comes from stored timestamps.** The phase-end alarm runs in a Web Worker.
- **Tabs are kept in sync through the `storage` event.** Each phase is recorded once, keyed by its start timestamp.
- **The tomato is plain SVG.** The fill is clipped to the progress, and its color is interpolated along the ripening scale. The phase-end sound is a Web Audio chime.
- **Roles reorder with native HTML5 drag and drop**, plus Alt+↑/↓ on the keyboard.
- **Tooling:** pnpm, Vitest with Testing Library, ESLint with typescript-eslint, Prettier, and `tsc --noEmit`. GitHub Actions runs them on every PR. There is no hosting yet.

## Consequences

- The whole runtime fits in a few KB of framework code, and the app works offline from the first load.
- Timer rules are tested without a DOM or real clocks. Rendering bugs and timing bugs stay separate.
- Classes copy from the Stitch HTML with little translation. Theme changes are a single attribute swap.
- localStorage is synchronous, and each write rewrites a whole key. That is fine at about 20 rows a day, but it would need revisiting if history or sync ever grew large.
- Kept history costs nothing now and makes a future weekly view possible without a migration.
- Two tabs never record the same phase twice, but a write in one tab is visible in the other only after the `storage` event fires.
- Libraries that require `preact/compat`, such as dnd-kit, are excluded unless this decision is revisited.

## Alternatives rejected

- **Evolving the existing React app:** most of its UI and data model serve the dropped weekly plan, so refactoring would cost about as much as a rewrite and leave React's extra runtime behind. Its proven ideas are ported to the new code rather than kept: timestamp-based expiry, tab sync, falling back to memory when storage is blocked, and a shared AudioContext.
- **React:** it offers no feature this app needs that Preact lacks, at roughly ten times the runtime size.
- **Vanilla TS:** rendering the drawer, menus, inline edit and drag would be written by hand, producing more code and more bugs.
- **Svelte 5:** viable, but it adds a compiler and a component format that the team and agents use less reliably.
- **CSS Modules:** every Stitch class would have to be rewritten into hand-written CSS.
- **IndexedDB:** asynchronous and more code, with no benefit at this data size.
- **Google Fonts, an icon font or a CDN:** each one makes a network request, which FR-4 forbids.
- **Timing with main-thread `setTimeout` only:** Chrome throttles hidden tabs to about one timer per minute, which delays the phase-end sound and notification.
- **One active tab, with the others locked:** it blocks a common habit for no data-safety gain over idempotent recording.
- **Motion, GSAP, Lottie or Rive for the tomato:** a clip and a color interpolation need no library, and the PRD excludes decorative animation.
- **dnd-kit or SortableJS:** each adds a dependency for a list of a handful of rows.
- **Playwright end-to-end tests:** the PRD's gate is a manual check in Chrome and Firefox. They can be added once the UI is stable.
