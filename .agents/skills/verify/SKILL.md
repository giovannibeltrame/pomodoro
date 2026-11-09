---
name: verify
description: Run the Quadrantic Pomodoro app in Chrome and drive the timer, Today list, theme, tab sync, alarm and storage paths to observe a change.
---

# Verify Quadrantic Pomodoro

Status marks: **[works]** exercised against the app at US-007; **[needs US-0xx]** the UI it depends on is not built yet, so
the step is unexercised. Remove each mark when the step has been run against the real UI.

## Launch and stop

Run with the Bash tool's `run_in_background` option, without `&` or redirects:

```sh
mise exec -- pnpm dev --port 5199 --strictPort
```

Open `http://localhost:5199` with the Claude in Chrome tools. Stop it with TaskStop on the background task id.

For the build: `mise exec -- pnpm build`, then `mise exec -- pnpm preview --port 4173 --strictPort` the same way, and open
`http://localhost:4173`. Stop it the same way. Close every tab you opened.

## Seed state [works]

Each key holds `{ "v": 1, "data": … }`. Run in the page, then reload. Seed from an app tab, and seed before the app
writes: a running app overwrites `timer` on every dispatch.

```js
const now = Date.now(), M = 60000;
const set = (k, d) => localStorage.setItem('quadrantic:v1:' + k, JSON.stringify({ v: 1, data: d }));
set('settings', { theme: 'dark', sound: true, notifications: true, preset: 'classic' });
set('roles', [
  { id: 'builder', name: 'Builder', archived: false, order: 0 },
  { id: 'manager', name: 'Manager', archived: false, order: 1 },
  { id: 'learner', name: 'Learner', archived: false, order: 2 },
]);
set('timer', {
  preset: 'classic', kind: 'focus', status: 'running', position: 2,
  start: now - 6 * M, activeMs: 0, segmentStart: now - 6 * M, pausedAt: null,
  classification: { quadrant: 2, roleId: 'builder', intention: 'Draft the ADR' },
});
set('phases', [
  { start: now - 90 * M, end: now - 65 * M, kind: 'focus', activeMs: 25 * M, quadrant: 1, roleId: 'builder', intention: 'Fix login' },
  { start: now - 65 * M, end: now - 60 * M, kind: 'break', activeMs: 5 * M },
]);
location.reload();
```

- The timer above is a Focus started 6 minutes ago: 19 minutes remain. `status` is `idle`, `running` or `paused`; `kind` is
  `focus`, `break` or `longBreak`.
- `phases` is today's list: one Focus block (Q1, Builder) and one Break. `start` is the unique key.
- If `roles` is absent, the app seeds Builder, Manager and Learner. If `settings` is absent, it uses the defaults
  (`system`, sound and notifications on, `classic`).
- Read results back with `JSON.parse(localStorage['quadrantic:v1:phases']).data`.
- Clear state by closing app tabs, then `localStorage.clear()` from a same-origin non-app tab. A tab left open writes
  its state back.

## Flows

### Reload resume [works]

Seed the running timer above and reload. `timer.status` stays `running` and `start` is unchanged. A timer whose end passed
while no tab was open is closed on reload by the same path as Phase end; that case is covered by unit tests and was not
driven in the browser.

### Phase end [works]

Seed a running Focus with `start: now - 25 * M + 4000`, `segmentStart` the same, and reload. About 4 s later the alarm
worker fires: `phases` gains one record, and the timer is an idle Break (or Long break) with the cycle position advanced.
Wait 7 s before reading.

### Start, pause, resume with Space [works]

Select a quadrant and a role, press Space (focus not in an input, select, textarea or button): the timer runs. Space
again pauses, and again resumes. Check `timer.status` in `quadrantic:v1:timer` after each press, and that no other key
does anything.

### Two-tab sync [works]

Open two app tabs and a third same-origin tab that is not the app, for example `http://localhost:5199/src/domain/timer.ts`.
From the third tab, write a running Focus ending in 4 s (`start: now - 25 * M + 4000`) to `quadrantic:v1:timer` with
`localStorage.setItem`. That fires `storage` in both app tabs. After 7 s, `phases` holds exactly one record for that
`start`.

### Theme [works]

Set `settings.theme` to `light` or `dark` and reload: `document.documentElement.dataset.theme` equals it. The settings
drawer's Light and Dark buttons change it at once. With `system`, emulate `prefers-color-scheme` and check `data-theme`
changes without a reload. Chrome cannot emulate it from the tools, so load the app into a same-origin iframe (as in
Blocked storage) whose `matchMedia` is replaced before the page script runs with a fake `MediaQueryList` that records
`change` listeners; call them with `{ matches: true }` and read `data-theme` in the iframe. Run every UI check in both
themes.

### Sound [works]

Run it in the same iframe harness as Blocked storage, stubbing `AudioContext` on the iframe window before the app loads.
Before the phase ends, wrap `window.AudioContext` with a counter and `OscillatorNode.prototype.start` too, then let a
phase end in an app tab. With `sound: true` the counts rise by one in the tab that fires; with `sound: false` they stay
at zero.

### Notification [works]

Before the phase ends, replace `window.Notification` with a stub that records its constructor calls and has
`permission: 'granted'`. With `notifications: true`, a phase end records one call; with `false`, none.

### Blocked storage [works]

The app must keep working from memory for the session: no thrown error, no crash. Storage has to throw before the app
script runs, so load the app into a same-origin iframe whose `Storage` is already broken. Run on a same-origin non-app
tab, for example `http://localhost:5199/src/domain/timer.ts`:

```js
const f = document.createElement('iframe');
document.body.append(f);
const w = f.contentWindow, errs = [];
w.addEventListener('error', (e) => errs.push(String(e.message)));
w.addEventListener('unhandledrejection', (e) => errs.push('rej ' + e.reason));
const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
w.Storage.prototype.setItem = boom;
w.Storage.prototype.getItem = boom;
const html = await (await fetch('/')).text();
f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
await new Promise((r) => setTimeout(r, 2500));
({ errs, main: !!f.contentDocument.querySelector('main') })
```

Pass: `errs` is empty and `main` is `true`. Once the UI exists, also start and pause a timer inside the iframe and check
that the state changes with no entry in `errs`.

### Zero requests [works]

On `pnpm preview`, load the page, run a focus→break cycle, then in the page:

```js
performance.getEntriesByType('resource').map((r) => r.name)
```

Every URL must start with `http://localhost:4173/`. The list at US-007: the page, one script, one stylesheet, the alarm
worker and `favicon.ico`. The network-request tool reports nothing if it was first called after the load, so prefer the
list above.

## State of the UI

The full UI exists (US-009 to US-018). Drive it with real clicks and keys where a script cannot, for example the role
drag handle (`left_click_drag`) and Alt+↑/↓. A role row shows its plain name; the rename input exists only after the
pencil is clicked, so find the Add role input as the last `input` in the dialog after clicking Add role.
