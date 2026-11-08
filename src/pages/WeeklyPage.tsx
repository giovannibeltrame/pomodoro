import { useMemo, useState, type Dispatch } from 'react';
import { QUADRANTS, QUADRANT_INFO, quadrantName, type Plan } from '../domain/types';
import { addWeeks, formatDuration, startOfWeek, summarizeWeek, weekKey, worstDay, type WeekSummary } from '../domain/week';
import { planFor, type Action, type AppState } from '../state/store';
import { Bar } from '../ui/Bar';
import { Icon } from '../ui/Icon';
import { PAGE, QUADRANT_CLASS, SECONDARY_BTN, pct } from '../ui/theme';

const DAY_FMT = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit' });
const RANGE_FMT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const WEEKDAY_FMT = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const CARD = 'bg-surface-container-low rounded-xl p-space-lg shadow-sm';

export function WeeklyPage({ state, dispatch, now }: { state: AppState; dispatch: Dispatch<Action>; now: number }) {
  const current = startOfWeek(now);
  const [weekStart, setWeekStart] = useState(current);
  const [editing, setEditing] = useState(false);
  const key = weekKey(weekStart);
  const plan = planFor(state, key);
  const summary = useMemo(() => summarizeWeek(state.blocks, weekStart, plan), [state.blocks, weekStart, plan]);
  const isCurrent = weekStart === current;
  const lastDay = addWeeks(weekStart, 1) - 1;

  return (
    <div className={PAGE}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
        <div>
          <span className="font-mono text-label-sm uppercase tracking-wider text-primary px-space-xs py-0.5 rounded bg-surface-container-high">
            Auditoria Semanal
          </span>
          <h1 className="text-headline-lg tracking-tight mt-space-xs">Painel Semanal</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Comparativo de alocação planejada vs. execução nos quadrantes de Eisenhower.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-md">
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-xl shadow-sm">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => setWeekStart(addWeeks(weekStart, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            >
              <Icon name="chevron_left" className="text-[18px]" />
            </button>
            <div className="flex items-center gap-space-xs px-space-md">
              <Icon name="calendar_month" className="text-[18px] text-primary" />
              <span className="text-title-sm font-semibold">
                {RANGE_FMT.format(weekStart)} — {RANGE_FMT.format(lastDay)}
              </span>
              {isCurrent && <span className="font-mono text-label-sm text-outline uppercase ml-1">(Atual)</span>}
            </div>
            <button
              type="button"
              aria-label="Próxima semana"
              disabled={isCurrent}
              onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-primary text-on-primary text-title-sm hover:brightness-105 active:scale-[0.99] transition-all shadow-sm"
          >
            <Icon name="tune" className="text-[18px]" />
            <span>Calibrar Plano da Semana</span>
          </button>
        </div>
      </div>

      {editing && (
        <PlanEditor
          key={key}
          plan={plan}
          past={weekStart < current}
          onCancel={() => setEditing(false)}
          onSave={(p) => {
            dispatch({ type: 'setPlan', weekKey: key, currentWeekKey: weekKey(current), plan: p });
            setEditing(false);
          }}
        />
      )}

      <Overview summary={summary} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-lg">
        <DailyChart summary={summary} now={now} />
        <Distribution summary={summary} />
      </div>

      <RoleTable summary={summary} />
    </div>
  );
}

function PlanEditor({ plan, past, onSave, onCancel }: { plan: Plan; past: boolean; onSave: (p: Plan) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Plan>(plan);
  return (
    <form
      className={`${CARD} flex flex-col gap-space-md`}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <div>
        <h2 className="text-title-md font-semibold">Plano da semana (blocos por quadrante)</h2>
        <p className="text-body-sm text-on-surface-variant">
          {past ? 'Semana passada: este plano vale só para ela.' : 'As semanas seguintes sem plano próprio herdam este plano.'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        {QUADRANTS.map((q) => (
          <label key={q} className="flex flex-col gap-space-xs">
            <span className={`font-mono text-label-md ${QUADRANT_CLASS[q].text}`}>{quadrantName(q)}</span>
            <input
              type="number"
              min={0}
              max={200}
              step={1}
              required
              value={draft[q]}
              onChange={(e) => setDraft({ ...draft, [q]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
              className="bg-surface-container rounded-lg px-space-md py-2 font-mono text-label-md focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-space-sm">
        <button type="button" onClick={onCancel} className={`px-space-md py-2 text-title-sm ${SECONDARY_BTN}`}>
          Cancelar
        </button>
        <button type="submit" className="px-space-md py-2 rounded-lg bg-primary text-on-primary text-title-sm hover:brightness-95">
          Salvar plano
        </button>
      </div>
    </form>
  );
}

function Overview({ summary }: { summary: WeekSummary }) {
  const overall = pct(summary.totalDone, summary.totalPlanned);
  const left = Math.max(0, summary.totalPlanned - summary.totalDone);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
      <div className={`${CARD} flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-mono text-label-sm uppercase tracking-wider text-outline">Aderência Geral</span>
            <span className="font-mono text-label-sm px-space-xs py-0.5 rounded bg-surface-container-high text-primary font-semibold">
              {overall}%
            </span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-mono text-display-timer-mobile leading-none">{summary.totalDone}</span>
            <span className="text-headline-sm text-outline">/ {summary.totalPlanned}</span>
            <span className="font-mono text-label-md text-on-surface-variant ml-space-xs">blocos</span>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-space-xs">
            Equivalente a <span className="text-on-surface font-medium">{formatDuration(summary.focusMs)}</span> de foco concluído.
          </p>
        </div>
        <div className="mt-space-lg pt-space-md">
          <div className="flex justify-between font-mono text-label-sm text-outline mb-1.5">
            <span>Planejado: {summary.totalPlanned}</span>
            <span className="text-primary">Faltam: {left} blocos</span>
          </div>
          <Bar value={overall} className="bg-primary" />
        </div>
      </div>
      {QUADRANTS.map((q) => {
        const { planned, done } = summary.byQuadrant[q];
        const c = QUADRANT_CLASS[q];
        const p = pct(done, planned);
        return (
          <div key={q} className={`${CARD} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                  <span className={`font-mono text-label-sm uppercase tracking-wider ${c.text}`}>{quadrantName(q)}</span>
                </div>
                <span className={`font-mono text-label-sm px-space-xs py-0.5 rounded font-semibold ${c.soft} ${c.text}`}>{p}%</span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-headline-lg font-bold">{done}</span>
                <span className="text-title-md text-outline">/ {planned}</span>
                <span className="font-mono text-label-sm text-on-surface-variant ml-space-xs">concluídos</span>
              </div>
            </div>
            <div className="mt-space-lg pt-space-md">
              <div className="flex justify-between font-mono text-label-sm mb-1.5">
                <span className="text-outline">Planejado</span>
                <span className={c.text}>
                  {done} de {planned} blocos
                </span>
              </div>
              <Bar value={p} className={c.bg} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyChart({ summary, now }: { summary: WeekSummary; now: number }) {
  const ideal = summary.totalPlanned / 7;
  const max = Math.max(1, Math.ceil(ideal), ...summary.days.map((d) => d.total));
  const worst = worstDay(summary, now);

  return (
    <div className={`xl:col-span-2 ${CARD} flex flex-col justify-between`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mb-space-lg">
        <div>
          <h2 className="text-title-md font-semibold">Comparativo Diário: Planejado vs. Realizado</h2>
          <p className="text-body-sm text-on-surface-variant">Blocos realizados por dia contra a meta diária ideal</p>
        </div>
        <div className="flex flex-wrap items-center gap-space-md font-mono text-label-sm text-outline">
          <span className="flex items-center gap-space-xs">
            <span className="w-3 border-t border-dashed border-outline" /> Meta diária
          </span>
          {QUADRANTS.map((q) => (
            <span key={q} className="flex items-center gap-space-xs">
              <span className={`w-3 h-3 rounded-sm ${QUADRANT_CLASS[q].bg}`} /> {QUADRANT_INFO[q].label}
            </span>
          ))}
        </div>
      </div>
      <div className="px-2 pt-6 pb-2 bg-surface-container-lowest/60 rounded-xl">
        <div className="relative h-44 flex items-end gap-2 sm:gap-6">
          {ideal > 0 && (
            <div
              className="absolute inset-x-0 border-t border-dashed border-outline/60 pointer-events-none"
              style={{ bottom: `${(ideal / max) * 100}%` }}
            />
          )}
          {summary.days.map((d) => (
            <div key={d.date} className="flex-1 h-full flex justify-center group">
              <div className="relative h-full w-4 sm:w-6 flex flex-col justify-end">
                <div
                  className="relative w-full"
                  style={{ height: `${(d.total / max) * 100}%` }}
                  title={QUADRANTS.map((q) => `${QUADRANT_INFO[q].label}: ${d.counts[q]}`).join(' · ')}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-label-sm bg-surface-container-high px-1 rounded">
                    {d.total}
                  </span>
                  <div className="h-full flex flex-col-reverse rounded-t overflow-hidden">
                    {QUADRANTS.map((q) =>
                      d.counts[q] ? (
                        <div key={q} className={QUADRANT_CLASS[q].bg} style={{ height: `${(d.counts[q] / d.total) * 100}%` }} />
                      ) : null,
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 sm:gap-6 mt-2">
          {summary.days.map((d) => (
            <span key={d.date} className="flex-1 text-center font-mono text-label-sm text-on-surface-variant uppercase">
              {DAY_FMT.format(d.date).replace('.', '')}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-space-sm pt-space-md mt-space-sm border-t border-outline-variant/10">
        <span className="flex items-center gap-space-xs text-body-sm text-on-surface-variant">
          <Icon name="lightbulb" className="text-[16px] text-tertiary" />
          {worst ? `${WEEKDAY_FMT.format(worst.date)} teve a maior distância da meta diária.` : 'Nenhum dia abaixo da meta diária até agora.'}
        </span>
        <span className="font-mono text-label-sm text-outline">Meta Diária Ideal: ~{ideal.toFixed(1)} blocos</span>
      </div>
    </div>
  );
}

function Distribution({ summary }: { summary: WeekSummary }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const total = summary.totalDone;
  let acc = 0;
  const segments = QUADRANTS.map((q) => {
    const n = summary.byQuadrant[q].done;
    const len = total ? (n / total) * circ : 0;
    const seg = { q, n, len, offset: -acc };
    acc += len;
    return seg;
  });

  return (
    <div className={`${CARD} flex flex-col`}>
      <h3 className="text-title-md font-semibold mb-space-md">Distribuição Estratégica</h3>
      <div className="relative w-44 h-44 mx-auto my-space-md">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="text-surface-container-highest" cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="12" />
          {segments.map((s) =>
            s.len > 0 ? (
              <circle
                key={s.q}
                className={QUADRANT_CLASS[s.q].text}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${s.len} ${circ}`}
                strokeDashoffset={s.offset}
              />
            ) : null,
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-headline-sm font-bold">{pct(summary.byQuadrant.q2.done, total)}%</span>
          <span className="font-mono text-label-sm text-outline uppercase">Foco Q2</span>
        </div>
      </div>
      <div className="flex flex-col gap-space-sm mt-space-md">
        {segments.map((s) => (
          <div key={s.q} className="flex items-center justify-between p-space-xs rounded bg-surface-container-lowest">
            <span className="flex items-center gap-space-sm text-body-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${QUADRANT_CLASS[s.q].bg}`} />
              {quadrantName(s.q)}
            </span>
            <span className="flex items-center gap-space-sm">
              <span className="font-mono text-label-md font-semibold">{s.n} blocos</span>
              <span className="font-mono text-label-sm text-outline">{pct(s.n, total)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleTable({ summary }: { summary: WeekSummary }) {
  return (
    <div className={CARD}>
      <h2 className="text-title-md font-semibold">Detalhamento por Papel / Função</h2>
      <p className="text-body-sm text-on-surface-variant mb-space-md">Esforço investido por papel na semana</p>
      {summary.roles.length === 0 ? (
        <p className="text-body-sm text-outline py-space-md">Nenhum bloco registrado nesta semana.</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/15 text-outline font-mono text-label-sm uppercase">
                <th className="py-space-sm px-space-md">Papel / Função</th>
                <th className="py-space-sm px-space-md">Tempo Total</th>
                <th className="py-space-sm px-space-md">Blocos</th>
                <th className="py-space-sm px-space-md">Mix de Quadrantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-body-sm">
              {summary.roles.map((r) => (
                <tr key={r.role} className="hover:bg-surface-container/60 transition-colors">
                  <td className="py-space-md px-space-md text-title-sm">{r.role}</td>
                  <td className="py-space-md px-space-md font-mono text-label-md">{formatDuration(r.focusMs)}</td>
                  <td className="py-space-md px-space-md font-mono text-label-md font-semibold">{r.blocks}</td>
                  <td className="py-space-md px-space-md">
                    <div className="w-48 sm:w-64">
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                        {QUADRANTS.map((q) => (
                          <div key={q} className={`h-full ${QUADRANT_CLASS[q].bg}`} style={{ width: `${pct(r.counts[q], r.blocks)}%` }} />
                        ))}
                      </div>
                      <div className="flex justify-between font-mono text-label-sm mt-1">
                        {QUADRANTS.map((q) => (
                          <span key={q} className={QUADRANT_CLASS[q].text}>
                            {QUADRANT_INFO[q].label}: {r.counts[q]}b
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
