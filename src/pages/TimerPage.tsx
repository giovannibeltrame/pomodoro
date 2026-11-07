import { useState, type Dispatch } from 'react';
import * as timer from '../domain/timer';
import { QUADRANTS, QUADRANT_INFO, quadrantName, type Mode } from '../domain/types';
import { formatDuration, type DaySummary } from '../domain/week';
import { DURATIONS, type Action, type AppState } from '../state/store';
import { Bar } from '../ui/Bar';
import { Icon } from '../ui/Icon';
import { Shortcuts } from '../ui/Shortcuts';
import { BREAK_STROKE, MODE_LABEL, PAGE, QUADRANT_CLASS, SECONDARY_BTN, TABS, pct, tabClass } from '../ui/theme';

const RADIUS = 140;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MODES: Mode[] = ['focus', 'short', 'long'];
const ICON_BTN =
  'w-12 h-12 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all';
const FIELD = 'focus:outline-none focus:ring-1 focus:ring-primary/60';

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
  today: DaySummary;
  remainingMs: number;
  running: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onReset: () => void;
}

export function TimerPage({ state, dispatch, today, remainingMs, running, onToggle, onSkip, onReset }: Props) {
  const { mode } = state.timer;
  const total = timer.durationMs(mode, DURATIONS);
  const offset = CIRCUMFERENCE * (1 - remainingMs / total);
  const stroke = mode === 'focus' ? QUADRANT_CLASS[state.quadrant].text : BREAK_STROKE[mode];
  const started = state.timer.startedAt !== null;

  return (
    <div className={PAGE}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-low shadow-sm">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
            <Icon name="all_inclusive" className="text-[22px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-title-md font-semibold">Protocolo de Foco Contínuo</span>
            <p className="text-body-sm text-on-surface-variant">Classifique intencionalmente antes de iniciar a contagem regressiva.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <section
            className="rounded-xl bg-surface-container-low p-space-xl shadow-md flex flex-col items-center transition-shadow"
            style={running && mode === 'focus' ? { boxShadow: '0 0 24px -4px rgba(99, 102, 241, 0.12)' } : undefined}
          >
            <div role="tablist" className={`${TABS} mb-space-xl`}>
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => dispatch({ type: 'setMode', mode: m })}
                  className={tabClass(mode === m)}
                >
                  {MODE_LABEL[m]} ({DURATIONS[m]}m)
                </button>
              ))}
            </div>

            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-space-sm">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 320 320" aria-hidden="true">
                <circle className="text-surface-container-highest" cx="160" cy="160" r={RADIUS} fill="transparent" stroke="currentColor" strokeWidth="6" />
                <circle
                  className={`${stroke} transition-[stroke-dashoffset] duration-300 ease-linear`}
                  cx="160"
                  cy="160"
                  r={RADIUS}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                <span role="timer" aria-live="off" className="font-mono text-display-timer-mobile sm:text-display-timer font-semibold">
                  {timer.formatClock(remainingMs)}
                </span>
                <div className="flex items-center gap-space-xs mt-space-xs">
                  {mode === 'focus' && <span className={`w-2 h-2 rounded-full ${QUADRANT_CLASS[state.quadrant].bg}`} />}
                  <span className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider">
                    {mode === 'focus' ? quadrantName(state.quadrant) : MODE_LABEL[mode]}
                  </span>
                </div>
              </div>
            </div>

            {mode === 'focus' && started && (
              <p className="font-mono text-label-md text-on-surface-variant">
                Registrando como <span className={QUADRANT_CLASS[state.quadrant].text}>{QUADRANT_INFO[state.quadrant].label}</span> · {state.role}
              </p>
            )}

            <div className="flex items-center gap-space-md mt-space-lg">
              <button type="button" onClick={onReset} title="Reiniciar ciclo (R)" aria-label="Reiniciar ciclo" className={ICON_BTN}>
                <Icon name="restart_alt" className="text-[22px]" />
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="h-14 px-space-xl rounded-lg bg-primary hover:brightness-95 text-on-primary text-headline-sm font-semibold flex items-center gap-space-sm shadow-md transition-all active:scale-[0.99]"
              >
                <Icon name={running ? 'pause' : 'play_arrow'} filled className="text-[28px]" />
                <span>{running ? 'Pausar' : started ? 'Continuar' : 'Iniciar Bloco'}</span>
              </button>
              <button
                type="button"
                onClick={onSkip}
                title="Completar & avançar bloco (S)"
                aria-label="Completar e avançar bloco"
                className={ICON_BTN}
              >
                <Icon name="skip_next" className="text-[22px]" />
              </button>
            </div>

            <div className="mt-space-lg">
              <Shortcuts />
            </div>
          </section>

          <BlockSetup state={state} dispatch={dispatch} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          <DayBalance today={today} />
          <div className="p-space-md rounded-xl bg-surface-container-lowest flex items-center gap-space-sm">
            <Icon name="security_update_good" className="text-[20px] text-primary" />
            <div className="flex flex-col">
              <span className="text-title-sm">Persistência Offline Local</span>
              <span className="font-mono text-label-sm text-on-surface-variant">Nenhum dado é perdido ao atualizar.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockSetup({ state, dispatch }: { state: AppState; dispatch: Dispatch<Action> }) {
  const [newRole, setNewRole] = useState('');

  return (
    <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="text-title-sm font-semibold">Classificação do Bloco (Matriz)</span>
          <span className="font-mono text-label-sm text-on-surface-variant">Taxonomia Eisenhower</span>
        </div>
        <div role="radiogroup" aria-label="Quadrante" className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
          {QUADRANTS.map((q) => {
            const info = QUADRANT_INFO[q];
            const active = state.quadrant === q;
            const c = QUADRANT_CLASS[q];
            return (
              <button
                key={q}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => dispatch({ type: 'selectQuadrant', quadrant: q })}
                className={`text-left p-space-md rounded-lg transition-all flex flex-col gap-1 ${
                  active ? `bg-surface-container-highest shadow-sm ring-1 ${c.ring}` : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                <span className="flex items-center justify-between gap-space-sm">
                  <span className={`font-mono text-label-md font-semibold flex items-center gap-1 ${c.text}`}>
                    <span className={`w-2 h-2 rounded-full ${c.bg}`} /> {info.label}
                  </span>
                  <span className={`font-mono text-label-sm ${active ? c.text : 'text-outline'}`}>{info.axis}</span>
                </span>
                <span className="text-title-sm mt-1">{info.title}</span>
                <span className="text-body-sm text-on-surface-variant line-clamp-1">{info.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <label htmlFor="block-role" className="text-title-sm flex items-center gap-space-xs">
            <Icon name="badge" className="text-[16px] text-primary" />
            Papel / Função no Bloco
          </label>
          <div className="relative">
            <select
              id="block-role"
              value={state.role}
              onChange={(e) => dispatch({ type: 'selectRole', role: e.target.value })}
              className={`w-full bg-surface-container text-on-surface rounded-lg px-space-md py-2.5 text-body-md appearance-none ${FIELD}`}
            >
              {state.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Icon name="expand_more" className="pointer-events-none absolute right-3 top-2.5 text-[20px] text-outline" />
          </div>
          <form
            className="flex gap-space-xs"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: 'addRole', role: newRole });
              setNewRole('');
            }}
          >
            <input
              aria-label="Novo papel"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Novo papel…"
              className={`flex-1 bg-surface-container-lowest rounded-lg px-space-md py-1.5 text-body-sm placeholder:text-outline/60 ${FIELD}`}
            />
            <button type="submit" disabled={!newRole.trim()} className={`px-space-sm text-body-sm disabled:opacity-40 ${SECONDARY_BTN}`}>
              Adicionar
            </button>
          </form>
        </div>
        <div className="flex flex-col gap-space-xs">
          <label htmlFor="session-goal" className="text-title-sm flex items-center gap-space-xs">
            <Icon name="flag" className="text-[16px] text-tertiary" />
            Objetivo Singular da Sessão
          </label>
          <input
            id="session-goal"
            value={state.goal}
            onChange={(e) => dispatch({ type: 'setGoal', goal: e.target.value })}
            placeholder="Ex: Escrever especificação técnica do microsserviço..."
            className={`w-full bg-surface-container text-on-surface rounded-lg px-space-md py-2.5 text-body-md placeholder:text-outline/50 ${FIELD}`}
          />
        </div>
      </div>
    </section>
  );
}

function DayBalance({ today }: { today: DaySummary }) {
  const ratio = pct(today.counts.q2, today.total);

  return (
    <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="analytics" className="text-[20px] text-primary" />
          <h2 className="text-title-md font-semibold">Balanço do Dia</h2>
        </div>
        <span className="font-mono text-label-sm text-on-surface-variant">
          {today.total} {today.total === 1 ? 'Bloco' : 'Blocos'} ({formatDuration(today.focusMs)})
        </span>
      </div>
      <div className="flex flex-col gap-space-sm">
        {QUADRANTS.map((q) => {
          const n = today.counts[q];
          const c = QUADRANT_CLASS[q];
          return (
            <div key={q} className="flex flex-col gap-1 p-space-sm rounded-lg bg-surface-container">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className={`w-2.5 h-2.5 rounded-sm ${c.bg}`} />
                  <span className="text-title-sm">{quadrantName(q)}</span>
                </div>
                <span className={`font-mono text-label-md font-semibold ${c.text}`}>
                  {n} {n === 1 ? 'bloco' : 'blocos'}
                </span>
              </div>
              <Bar value={pct(n, today.total)} className={c.bg} height="h-1.5" />
            </div>
          );
        })}
      </div>
      <div className="p-space-sm rounded-lg bg-surface-container-high flex items-center justify-between gap-space-sm">
        <div className="flex flex-col">
          <span className="font-mono text-label-sm text-on-surface-variant uppercase">Índice de Soberania (Q2 vs Geral)</span>
          <span className="text-headline-sm font-bold">{ratio}%</span>
        </div>
        {today.total > 0 && (
          <span
            className={`px-2 py-1 rounded font-mono text-label-sm ${ratio > 50 ? 'bg-primary-container/20 text-primary' : 'bg-tertiary/15 text-tertiary'}`}
          >
            {ratio > 50 ? 'Dentro da Meta (>50%)' : 'Abaixo da Meta (>50%)'}
          </span>
        )}
      </div>
    </section>
  );
}
