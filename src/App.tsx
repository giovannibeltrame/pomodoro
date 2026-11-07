import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as timer from './domain/timer';
import { dayOfWeek, startOfWeek, summarizeWeek, weekKey } from './domain/week';
import { QUADRANT_INFO } from './domain/types';
import { BLOCKS_KEY, DURATIONS, STATE_KEY, initialState, load, openStorage, planFor, reducer, save, type AppState } from './state/store';
import { beep } from './ui/beep';
import { Shortcuts } from './ui/Shortcuts';
import { useClock } from './ui/useClock';
import { MODE_LABEL, QUADRANT_CLASS, TABS, tabClass } from './ui/theme';
import { TimerPage } from './pages/TimerPage';
import { WeeklyPage } from './pages/WeeklyPage';

type Page = 'timer' | 'weekly';

const NAV: { id: Page; label: string }[] = [
  { id: 'timer', label: 'Timer & Sessão Ativa' },
  { id: 'weekly', label: 'Painel Semanal' },
];

const TEXT_ENTRY = 'input, textarea, select, [contenteditable="true"]';
const ACTIVATABLE = 'button, a, [role="button"], [role="radio"], [role="tab"]';

const storage = openStorage(() => window.localStorage);

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => (storage ? load(storage) : initialState()));
  const [page, setPage] = useState<Page>('timer');
  const { endsAt, mode } = state.timer;
  const now = useClock(endsAt);
  const running = endsAt !== null;

  const saved = useRef<AppState>();
  useEffect(() => {
    if (storage && save(storage, state, saved.current)) saved.current = state;
  }, [state]);

  useEffect(() => {
    if (!storage) return;
    const area = storage;
    function onStorage(e: StorageEvent) {
      if (e.storageArea === area && (e.key === null || e.key === STATE_KEY || e.key === BLOCKS_KEY)) {
        dispatch({ type: 'sync', state: load(area) });
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (endsAt === null) return;
    const expire = (now: number) => dispatch({ type: 'expire', now });
    if (endsAt <= Date.now()) {
      expire(Date.now());
      return;
    }
    const id = setTimeout(() => {
      expire(Math.max(Date.now(), endsAt));
      beep();
    }, endsAt - Date.now());
    return () => clearTimeout(id);
  }, [endsAt]);

  const remainingMs = timer.remaining(state.timer, now);
  const title = running ? `${timer.formatClock(remainingMs)} · ${MODE_LABEL[mode]}` : 'Pomodoro';
  useEffect(() => {
    document.title = title;
  }, [title]);

  const toggle = useCallback(() => {
    dispatch(running ? { type: 'pause', now: Date.now() } : { type: 'start', now: Date.now() });
  }, [running]);
  const skip = useCallback(() => dispatch({ type: 'skip', now: Date.now() }), []);
  const resetTimer = useCallback(() => dispatch({ type: 'reset' }), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest(TEXT_ENTRY)) return;
      if (e.code === 'Space') {
        if (el?.closest(ACTIVATABLE)) return;
        e.preventDefault();
        toggle();
      } else if (e.key.toLowerCase() === 'r') {
        resetTimer();
      } else if (e.key.toLowerCase() === 's') {
        skip();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggle, resetTimer, skip]);

  const thisWeek = startOfWeek(now);
  const plan = planFor(state, weekKey(thisWeek));
  const week = useMemo(() => summarizeWeek(state.blocks, thisWeek, plan), [state.blocks, thisWeek, plan]);
  const cycle = timer.cycleNumber(state.timer, DURATIONS);
  const qc = QUADRANT_CLASS[state.quadrant];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
        <div className="h-16 max-w-7xl mx-auto px-margin md:px-margin-desktop flex items-center justify-between gap-space-lg">
          <div className="flex items-center gap-space-lg shrink-0">
            <div className="flex items-center gap-space-sm">
              <span className="text-title-md font-semibold tracking-tight">Pomodoro</span>
              <span className="font-mono text-label-sm text-on-surface-variant uppercase px-space-xs py-0.5 rounded bg-surface-container-high">
                Quadrantes
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-space-sm px-space-sm py-1 rounded bg-surface-container-low">
              <span className={`w-2 h-2 rounded-full ${running ? `${qc.bg} animate-pulse` : 'bg-outline-variant'}`} />
              <span className={`font-mono text-label-md ${qc.text}`}>
                Ciclo {cycle} de {DURATIONS.longEvery}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-mono text-label-md">
                {MODE_LABEL[mode]}
                {mode === 'focus' ? ` (${QUADRANT_INFO[state.quadrant].label})` : ''}
              </span>
            </div>
          </div>
          <nav className={TABS}>
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                aria-current={page === n.id ? 'page' : undefined}
                onClick={() => setPage(n.id)}
                className={tabClass(page === n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-surface-container-low shrink-0">
            <span className="font-mono text-label-sm text-on-surface-variant uppercase">Meta:</span>
            <span className="font-mono text-label-md text-primary">
              {week.totalDone}/{week.totalPlanned}
            </span>
            <span className="font-mono text-label-sm text-outline">blocos</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {!storage && (
          <div role="alert" className="max-w-7xl mx-auto mt-space-md px-margin md:px-margin-desktop">
            <p className="px-space-md py-space-sm rounded-lg bg-surface-container-low text-body-sm text-error">
              Seu navegador bloqueou o armazenamento — nada será salvo ao fechar ou recarregar a página.
            </p>
          </div>
        )}
        {page === 'timer' ? (
          <TimerPage
            state={state}
            dispatch={dispatch}
            today={week.days[dayOfWeek(now)]}
            remainingMs={remainingMs}
            running={running}
            onToggle={toggle}
            onSkip={skip}
            onReset={resetTimer}
          />
        ) : (
          <WeeklyPage state={state} dispatch={dispatch} now={now} />
        )}
      </main>

      <footer className="w-full bg-surface-container-lowest py-space-xl">
        <div className="max-w-7xl mx-auto px-margin md:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-body-sm text-on-surface-variant">Dados salvos localmente neste navegador</span>
          </div>
          <Shortcuts />
        </div>
      </footer>
    </div>
  );
}
