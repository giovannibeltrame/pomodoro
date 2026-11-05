import { useCallback, useEffect, useReducer, useState } from 'react';
import * as timer from './domain/timer';
import { startOfWeek, summarizeWeek, weekKey } from './domain/week';
import { QUADRANT_INFO } from './domain/types';
import { load, planFor, reducer, save } from './state/store';
import { beep } from './ui/beep';
import { MODE_LABEL, QUADRANT_CLASS } from './ui/theme';
import { TimerPage } from './pages/TimerPage';
import { WeeklyPage } from './pages/WeeklyPage';

type Page = 'timer' | 'weekly';

const NAV: { id: Page; label: string }[] = [
  { id: 'timer', label: 'Timer & Sessão Ativa' },
  { id: 'weekly', label: 'Painel Semanal' },
];

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => load(localStorage));
  const [page, setPage] = useState<Page>('timer');
  const [now, setNow] = useState(() => Date.now());
  const { endsAt } = state.timer;

  useEffect(() => save(localStorage, state), [state]);

  useEffect(() => {
    if (endsAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  useEffect(() => {
    if (endsAt === null || now < endsAt) return;
    dispatch({ type: 'finish', now, id: crypto.randomUUID(), endsAt });
    if (now - endsAt < 5_000) beep();
  }, [now, endsAt]);

  const remainingMs = timer.remaining(state.timer, now);
  const running = timer.isRunning(state.timer);

  useEffect(() => {
    document.title = running ? `${timer.formatClock(remainingMs)} · ${MODE_LABEL[state.timer.mode]}` : 'Pomodoro';
  }, [running, remainingMs, state.timer.mode]);

  const toggle = useCallback(() => {
    const t = Date.now();
    setNow(t);
    dispatch(running ? { type: 'pause', now: t } : { type: 'start', now: t });
  }, [running]);

  const skip = useCallback(() => {
    const t = Date.now();
    setNow(t);
    dispatch({ type: 'finish', now: t, id: crypto.randomUUID(), endsAt });
  }, [endsAt]);

  const resetTimer = useCallback(() => dispatch({ type: 'reset' }), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(el.tagName)) return;
      if (e.code === 'Space') {
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
  const week = summarizeWeek(state.blocks, thisWeek, planFor(state, weekKey(thisWeek)));
  const cycle = timer.cycleNumber(state.timer, state.durations);
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
                Ciclo {cycle} de {state.durations.longEvery}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-mono text-label-md">
                {MODE_LABEL[state.timer.mode]}
                {state.timer.mode === 'focus' ? ` (${QUADRANT_INFO[state.quadrant].label})` : ''}
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-space-xs p-1 rounded-xl bg-surface-container-lowest">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                aria-current={page === n.id ? 'page' : undefined}
                onClick={() => setPage(n.id)}
                className={`px-space-md py-1.5 rounded text-title-sm transition-all ${
                  page === n.id
                    ? 'bg-surface-container-high text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
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
        {page === 'timer' ? (
          <TimerPage
            state={state}
            dispatch={dispatch}
            now={now}
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
          <div className="flex items-center gap-space-lg font-mono text-label-sm text-outline">
            <span>
              [Espaço] <span className="text-on-surface-variant">Play/Pausa</span>
            </span>
            <span>
              [R] <span className="text-on-surface-variant">Reset</span>
            </span>
            <span>
              [S] <span className="text-on-surface-variant">Pular</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
