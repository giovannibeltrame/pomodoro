---
name: verify
description: Run the Quadrantic Pomodoro app in Chrome and drive the timer, Today list, roles, theme, tab sync, alarm and storage paths to observe a change.
---

# Verify Quadrantic Pomodoro

Every flow below was run in Chrome against the commit that last changed this file. Chrome is the supported browser; the iframe harnesses rely on its `document.open()` behaviour. Any
tool that opens tabs, clicks, types and runs JavaScript in a page works; Claude in Chrome is the one in use.

## Launch and stop

Storage is per origin, and the port is part of it. The skill uses only ports 5199 and 4199, so it never reads, seeds or
clears the data of someone using the app on Vite's default ports, 5173 and 4173. Never run these steps against another
port.

Run with the Bash tool's `run_in_background` option, without `&` or redirects:

```sh
mise exec -- pnpm dev --port 5199 --strictPort
```

Open `http://localhost:5199`. Stop it with TaskStop on the background task id, then check the port is free:
`ss -ltn 'sport = :5199'` lists no socket.

For the build: `mise exec -- pnpm build`, then `mise exec -- pnpm preview --port 4199 --strictPort` the same way, and open
`http://localhost:4199`. Stop it the same way. Close every tab you opened.

A non-app tab on the same origin hosts the harnesses and cross-tab writes. On the dev server use
`http://localhost:5199/src/domain/timer.ts`. Preview serves the app for any unknown path, so there use the built script,
the `src` of `script[type=module]` in an app tab.

## Wait for a condition

Never sleep for a fixed time. Define this in the page, and again after every reload, then await a condition:

```js
window.until = async (check, ms = 30000) => {
  for (const t = Date.now(); Date.now() - t < ms; await new Promise((r) => setTimeout(r, 200))) {
    const v = check();
    if (v) return v;
  }
  throw new Error('until: timed out');
};
window.read = (k) => JSON.parse(localStorage.getItem('quadrantic:v1:' + k) ?? 'null')?.data;
```

## Seed state

The keys and their shapes are defined by `KEYS` and the `is*` guards in `src/state/storage.ts`; update this skill when
they change. Each key holds `{ "v": 1, "data": … }`. Run in the only open app tab, then reload. Seed before the app
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
  start: now - 6 * M, activeMs: 0, segmentStart: now - 6 * M,
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
- `phases` holds one Focus block (Q1, Builder) and one Break. `start` is the unique key. Before 01:30 local time they
  fall on yesterday and the Today list hides them; shift them or wait.
- If `roles` is absent, the app seeds Builder, Manager and Learner. If `settings` is absent, it uses the defaults
  (`system`, sound and notifications on, `classic`).
- Clear state in the only open app tab, then reload. Remove only the app's keys:
  `Object.keys(localStorage).filter((k) => k.startsWith('quadrantic:v1:')).forEach((k) => localStorage.removeItem(k))`.
  Another open app tab writes `roles` back when it sees the removal.

## Flows

### Reload resume

Seed the running timer above and reload. `read('timer').status` stays `running` and `start` is unchanged.

A timer whose end passed while no tab was open is closed on load with the same record as Phase end, but with no chime
and no notification. The stubs must exist before the app loads, so use an iframe. With no app tab open, on a non-app
tab:

```js
const M = 60000, S = Date.now() - 40 * M;
const set = (k, d) => localStorage.setItem('quadrantic:v1:' + k, JSON.stringify({ v: 1, data: d }));
set('settings', { theme: 'dark', sound: true, notifications: true, preset: 'classic' });
set('phases', []);
set('timer', {
  preset: 'classic', kind: 'focus', status: 'running', position: 2, start: S, activeMs: 0, segmentStart: S,
  classification: { quadrant: 2, roleId: 'builder' },
});
const f = document.createElement('iframe');
document.body.append(f);
const w = f.contentWindow, snd = { ctors: 0, starts: 0 }, notes = [];
const A = w.AudioContext;
w.AudioContext = class extends A { constructor(...a) { super(...a); snd.ctors++; } };
const start = w.OscillatorNode.prototype.start;
w.OscillatorNode.prototype.start = function (...a) { snd.starts++; return start.apply(this, a); };
w.Notification = class {
  static permission = 'granted';
  static requestPermission = async () => 'granted';
  constructor(title, options) { notes.push([title, options?.body]); }
};
const html = await (await fetch('/')).text();
f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
await until(() => read('timer').status === 'idle');
```

Pass: `phases` holds one Focus record ending at `S + 25 * M`, the timer is an idle Break at position 3, and `snd`
and `notes` stay empty. As a control, write a running Break ending in 10 s to `timer` from the same tab: when it
closes through the alarm in the iframe, `starts` rises by 2 and `notes` gains one entry.

### Phase end

Seed a running Focus at position 2 with `start: now - 25 * M + 20000`, `segmentStart` the same, and reload. Note
`S = read('timer').start`, then `await until(() => read('phases').some((p) => p.start === S))`. The alarm worker
closes it: `phases` gains one Focus record ending at `S + 25 * M`, and the timer is an idle Break at position 3. After
the last Focus of a cycle (position 4 in Classic, 2 in Deep) it is an idle Long break at the same position.

The 20 s margin covers a slow reload: a phase that ends before the app loads closes on the reload path, with no chime
or notification.

### Start, pause, resume with Space

Select a quadrant and a role, press Space: the timer runs. Space again pauses, and again resumes. Check
`read('timer').status` after each press.

With the timer idle and Start enabled, Space must leave it idle:

- with focus in the intention input (the space goes into the input), on the role select (Shift+Tab from the input),
  and on a quadrant button;
- with the settings drawer open and focus on the dialog itself: click its plain text, not a control, or Space presses
  the focused button;
- with Ctrl, Meta or Alt held. Real presses of these can trigger the OS, so dispatch them on `document.body` as
  `KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true, cancelable: true, ctrlKey: true })`, and the
  same for `metaKey` and `altKey`. A plain dispatched Space then starts the timer, the control.

The handler also skips a textarea and a `contenteditable`, which the app does not have.

### Reset, Skip, End break

- Reset on a running or paused Focus: an idle Focus at the same position, no record.
- Skip on an idle Break: an idle Focus, no record.
- End break on a running Break: an idle Focus and one `break` record whose `activeMs` is the time it ran.

### Preset

With the timer idle, choose Deep in the Preset group: `read('settings').preset` and `read('timer').preset` are `deep`
and the clock shows 50:00; the timer goes back to block 1. The group does nothing while the timer runs.

### Today list

On a Focus row, open Block actions, then Edit: change the quadrant, role and intention, then Save. The record with that
`start` in `read('phases')` changes. Block actions, Delete, then Delete again removes it; Cancel keeps it. Break rows
have no actions.

### Roles

In Settings, Add role, type a name, press Enter: `read('roles')` gains it. A duplicate name, ignoring case, shows
"Name already in use". Rename with the pencil (`Edit <name>`, then the `Rename <name>` input); Archive moves a role
under Archived and Restore brings it back last. Alt+↑/↓ with focus on a row moves it. A role row shows its plain name;
the rename input exists only after the pencil is clicked, so find the Add role input as the last `input` in the dialog
after clicking Add role.

Rows reorder by native drag and drop, which `left_click_drag` did not trigger. Dispatch the events instead:

```js
const row = (n) => document.querySelector(`dialog[open] li[aria-label="${n}"]`);
const dt = new DataTransfer();
row('Manager').dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
row('Builder').dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
row('Builder').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
row('Manager').dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
```

Manager moves to Builder's place.

### Day rollover

At local midnight the Today list drops yesterday's rows without a reload. Load the app into an iframe whose clock reads
10 s before midnight. With no app tab open, on a non-app tab:

```js
const M = 60000, RealDate = Date;
const midnight = new RealDate();
midnight.setHours(24, 0, 0, 0);
const off = midnight.getTime() - 10000 - RealDate.now();
const fakeNow = RealDate.now() + off;
const set = (k, d) => localStorage.setItem('quadrantic:v1:' + k, JSON.stringify({ v: 1, data: d }));
set('timer', {
  preset: 'classic', kind: 'focus', status: 'idle', position: 1, start: null, activeMs: 0, segmentStart: null,
  classification: null,
});
set('phases', [
  { start: fakeNow - 30 * M, end: fakeNow - 5 * M, kind: 'focus', activeMs: 25 * M, quadrant: 1, roleId: 'builder' },
]);
const f = document.createElement('iframe');
document.body.append(f);
const w = f.contentWindow, WD = w.Date;
w.Date = class extends WD {
  constructor(...a) { if (a.length) super(...a); else super(WD.now() + off); }
  static now() { return WD.now() + off; }
};
const html = await (await fetch('/')).text();
f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
const rows = () => f.contentDocument.querySelectorAll('[aria-label=Today] li').length;
await until(() => rows() === 1);
await until(() => rows() === 0, 20000);
```

Pass: the Today list shows the row, then empties at the fake midnight, and `read('phases')` still holds the record.

### Two-tab sync

Open two app tabs and a non-app tab. From the non-app tab, write a running Focus ending in 20 s (`start: now - 25 * M +
20000`) to `quadrantic:v1:timer` with `localStorage.setItem`, wrapped in `{ v: 1, data }`. That fires `storage` in both
app tabs. `await until(() => read('timer').status === 'idle')`, then `phases` holds exactly one record for that `start`.
Both tabs may chime; the PRD allows one chime per tab.

### Theme

Set `settings.theme` to `light` or `dark` and reload: `document.documentElement.dataset.theme` equals it. The settings
drawer's Light and Dark buttons change it at once. Chrome cannot emulate `prefers-color-scheme` from the tools, so for
`system` load the app into an iframe with a fake `matchMedia`. With `settings.theme` set to `system`, run on a non-app
tab:

```js
const f = document.createElement('iframe');
document.body.append(f);
const w = f.contentWindow, mq = { matches: false, listeners: [] };
w.matchMedia = () => ({
  get matches() { return mq.matches; },
  addEventListener: (_, l) => mq.listeners.push(l),
  removeEventListener() {},
});
const html = await (await fetch('/')).text();
f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
const theme = () => f.contentDocument.documentElement.dataset.theme;
await until(() => theme() === 'light');
mq.matches = true; mq.listeners.forEach((l) => l({ matches: true }));
await until(() => theme() === 'dark');
```

The app reads `matches` from the query object, not from the event, so flip `mq.matches` before calling the listeners.
The iframe is an app tab: it reads and writes the same storage. Run every UI check in both themes.

### Sound

After the seed and reload of Phase end, in the same app tab:

```js
window.snd = { ctors: 0, starts: 0 };
const A = window.AudioContext;
window.AudioContext = class extends A { constructor(...a) { super(...a); snd.ctors++; } };
const start = OscillatorNode.prototype.start;
OscillatorNode.prototype.start = function (...a) { snd.starts++; return start.apply(this, a); };
```

With `sound: true`, each phase end adds 2 to `starts`, one per note. The tab creates its `AudioContext` once, at its first
Start or first chime, so `ctors` rises by one only then. With `sound: false` both stay at 0.

### Notification

After the seed and reload of Phase end, in the same app tab:

```js
window.notes = [];
window.Notification = class {
  static permission = 'granted';
  static requestPermission = async () => 'granted';
  constructor(title, options) { notes.push([title, options?.body]); }
};
```

`permission` must be static: the app reads `Notification.permission`. With `notifications: true`, a phase end pushes one
entry, `['Focus complete', 'Next: Break']`; with `false`, none.

### Blocked storage

The app must keep working from memory for the session: no thrown error, no crash. A browser that blocks storage throws
on reading `window.localStorage`, before the app script runs, so load the app into an iframe where that getter throws.
Run on a non-app tab:

```js
const f = document.createElement('iframe');
document.body.append(f);
const w = f.contentWindow, errs = [];
const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
Object.defineProperty(w, 'localStorage', { get: boom, configurable: true });
const html = await (await fetch('/')).text();
f.contentDocument.open();
w.addEventListener('error', (e) => errs.push(String(e.message)));
w.addEventListener('unhandledrejection', (e) => errs.push('rej ' + e.reason));
f.contentDocument.write(html); f.contentDocument.close();
const doc = f.contentDocument;
await until(() => doc.querySelector('main'));
```

Add the listeners after `document.open()`: it removes every listener already on the iframe's window, and errors would
go unseen. Then select a quadrant and a role, click Start and Pause inside the iframe, and check the clock changes and
`errs` stays empty.

### Zero requests

On `pnpm preview`, load the page, run a focus→break cycle, then in the page:

```js
performance.getEntriesByType('resource').map((r) => r.name)
```

Every URL must start with `http://localhost:4199/`. Expect one script, one stylesheet, three `.woff2` fonts, the alarm
worker and `favicon.ico`; the page itself is a navigation entry, not listed. Requests made from inside the worker go to the
worker's own timeline and do not show here; `src/state/alarm.worker.ts` makes none. The network-request tool reports
nothing if it was first called after the load, so prefer the list above.
