---
name: verify
description: Run the Pomodoro tracker in a browser and drive the timer, weekly panel, tab sync and storage paths to observe a change.
---

# Verify the Pomodoro tracker

## Launch

```sh
npx vite --port 5199 --strictPort   # run in background; stop with pkill -f "vite --port 5199"
```

Open `http://localhost:5199` with the Claude in Chrome tools.

## Drive

- Keyboard: Space start/pause, `S` skip, `R` reset (sent to the document, not a text field).
- Seed state by writing `pomodoro:v1:state` / `pomodoro:v1:blocks` in `localStorage`, then `location.reload()`. Example running timer started 6 min ago:
  `{timer:{mode:'focus',completedFocus:3,startedAt:now-6*60000,endsAt:now+19*60000,remainingMs:25*60000}}`.
- Read results from `localStorage` and `document.querySelector('header').innerText` (cycle, mode, `META: done/planned`).
- Weekly panel: "Painel Semanal" tab; "Calibrar Plano da Semana" opens the plan editor; the next-week arrow is inert on the current week.

## Multi-tab sync

Open two app tabs plus a third same-origin tab that is not the app (`http://localhost:5199/src/domain/types.ts`). A `localStorage.setItem` from the third tab fires `storage` in both app tabs, so both expire the same segment. Write a timer with `endsAt: now+4000`.

## Beep

Wrap `window.AudioContext` and `OscillatorNode.prototype.start` with counters in each app tab before the expiry. For a late expiry, after the timeout is scheduled, override `Date.now = () => real() + 120000`.

## Blocked storage

Real Chrome with site data blocked, in a throwaway profile:

```sh
P=$(mktemp -d); mkdir -p $P/Default
echo '{"profile":{"default_content_setting_values":{"cookies":2}}}' > $P/Default/Preferences
google-chrome --headless=new --user-data-dir=$P --no-first-run --window-size=1400,900 \
  --virtual-time-budget=4000 --screenshot=out.png http://localhost:5199/
```

## Gotchas

- `localStorage.clear()` while an app tab is open is undone: the tab's sync merges its blocks back. Close app tabs, or clear from the non-app tab after closing them.
