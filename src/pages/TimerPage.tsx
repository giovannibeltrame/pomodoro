import { useState, type Dispatch } from 'react';
import * as timer from '../domain/timer';
import { QUADRANTS, QUADRANT_INFO, type Mode } from '../domain/types';
import { blocksInRange, dayRange, formatDuration } from '../domain/week';
import type { Action, AppState } from '../state/store';
import { Icon } from '../ui/Icon';
import { BREAK_STROKE, MODE_LABEL, QUADRANT_CLASS } from '../ui/theme';

const RADIUS = 140;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MODES: Mode[] = ['focus', 'short', 'long'];

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
  now: number;
  remainingMs: number;
  running: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onReset: () => void;
}

export function TimerPage({ state, dispatch, now, remainingMs, running, onToggle, onSkip, onReset }: Props) {
  const { mode } = state.timer;
  const total = timer.durationMs(mode, state.durations);
  const offset = CIRCUMFERENCE * (1 - remainingMs / total);
  const stroke = mode === 'focus' ? QUADRANT_CLASS[state.quadrant].stroke : BREAK_STROKE[mode];
  const started = state.timer.startedAt !== null;
  const info = QUADRANT_INFO[state.quadrant];

  return (
    <div className="max-w-7xl mx-auto w-full px-margin md:px-margin-desktop py-space-xl flex flex-col gap-space-xl">
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
            <div role="tablist" className="flex items-center gap-space-xs p-1 rounded-lg bg-surface-container-lowest mb-space-xl">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => dispatch({ type: 'setMode', mode: m })}
                  className={`px-space-md sm:px-space-lg py-1.5 rounded text-title-sm transition-all ${
                    mode === m ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {MODE_LABEL[m]} ({state.durations[m]}m)
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
                  {mode === 'focus' ? (
                    <>
                      <span className={`w-2 h-2 rounded-full ${QUADRANT_CLASS[state.quadrant].bg}`} />
                      <span className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider">
                        {info.label} • {info.title}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider">{MODE_LABEL[mode]}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-space-md mt-space-lg">
              <button
                type="button"
                onClick={onReset}
                title="Reiniciar ciclo (R)"
                aria-label="Reiniciar ciclo"
                className="w-12 h-12 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all"
              >
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
                className="w-12 h-12 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all"
              >
                <Icon name="skip_next" className="text-[22px]" />
              </button>
            </div>

            <div className="flex items-center gap-space-md mt-space-lg text-outline font-mono text-label-sm">
              <Kbd k="Espaço" label="Toggle" />
              <span className="text-surface-container-highest">•</span>
              <Kbd k="R" label="Reset" />
              <span className="text-surface-container-highest">•</span>
              <Kbd k="S" label="Pular" />
            </div>
          </section>

          <BlockSetup state={state} dispatch={dispatch} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          <DayBalance state={state} now={now} />
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

function Kbd({ k, label }: { k: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface">{k}</kbd> {label}
    </span>
  );
}

function BlockSetup({ state, dispatch }: { state: AppState; dispatch: Dispatch<Action> }) {
  const [newRole, setNewRole] = useState('');

  function addRole() {
    dispatch({ type: 'addRole', role: newRole });
    setNewRole('');
  }

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
              className="w-full bg-surface-container text-on-surface rounded-lg px-space-md py-2.5 text-body-md appearance-none focus:outline-none focus:ring-1 focus:ring-primary/60"
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
              addRole();
            }}
          >
            <input
              aria-label="Novo papel"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Novo papel…"
              className="flex-1 bg-surface-container-lowest rounded-lg px-space-md py-1.5 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary/60 placeholder:text-outline/60"
            />
            <button
              type="submit"
              disabled={!newRole.trim()}
              className="px-space-sm rounded-lg bg-white/[0.03] border border-white/[0.07] text-body-sm text-[#D4D4D8] hover:bg-white/[0.07] disabled:opacity-40"
            >
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
            className="w-full bg-surface-container text-on-surface rounded-lg px-space-md py-2.5 text-body-md focus:outline-none focus:ring-1 focus:ring-primary/60 placeholder:text-outline/50"
          />
        </div>
      </div>
    </section>
  );
}

function DayBalance({ state, now }: { state: AppState; now: number }) {
  const [from, to] = dayRange(now);
  const today = blocksInRange(state.blocks, from, to);
  const counts = QUADRANTS.map((q) => ({ q, n: today.filter((b) => b.quadrant === q).length }));
  const totalMs = today.reduce((n, b) => n + b.focusMs, 0);
  const q2 = counts.find((c) => c.q === 'q2')!.n;
  const ratio = today.length ? Math.round((q2 / today.length) * 1000) / 10 : 0;

  return (
    <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="analytics" className="text-[20px] text-primary" />
          <h2 className="text-title-md font-semibold">Balanço do Dia</h2>
        </div>
        <span className="font-mono text-label-sm text-on-surface-variant">
          {today.length} {today.length === 1 ? 'Bloco' : 'Blocos'} ({formatDuration(totalMs)})
        </span>
      </div>
      <div className="flex flex-col gap-space-sm">
        {counts.map(({ q, n }) => {
          const c = QUADRANT_CLASS[q];
          return (
            <div key={q} className="flex flex-col gap-1 p-space-sm rounded-lg bg-surface-container">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className={`w-2.5 h-2.5 rounded-sm ${c.bg}`} />
                  <span className="text-title-sm">
                    {QUADRANT_INFO[q].label}: {QUADRANT_INFO[q].title}
                  </span>
                </div>
                <span className={`font-mono text-label-md font-semibold ${c.text}`}>
                  {n} {n === 1 ? 'bloco' : 'blocos'}
                </span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className={`${c.bg} h-full rounded-full`} style={{ width: `${today.length ? (n / today.length) * 100 : 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-space-sm rounded-lg bg-surface-container-high flex items-center justify-between gap-space-sm">
        <div className="flex flex-col">
          <span className="font-mono text-label-sm text-on-surface-variant uppercase">Índice de Soberania (Q2 vs Geral)</span>
          <span className="text-headline-sm font-bold">{ratio}%</span>
        </div>
        {today.length > 0 && (
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
