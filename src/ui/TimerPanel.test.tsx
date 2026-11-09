import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { initialState, type TimerState } from '../domain/timer';
import { writeTimer } from '../state/storage';
import { quadrant, roleId, roles, timer } from '../state/signals';
import { TimerPanel } from './TimerPanel';

const classification = { quadrant: 2 as const, roleId: 'r1' };

function select(value: typeof classification | null): void {
  quadrant.value = value?.quadrant ?? null;
  roleId.value = value?.roleId ?? null;
}

function setState(patch: Partial<TimerState>): void {
  const state = { ...initialState('classic'), ...patch };
  writeTimer(state);
  timer.value = state;
}

const running: Partial<TimerState> = { status: 'running', start: Date.now(), segmentStart: Date.now() };
const paused: Partial<TimerState> = { status: 'paused', start: Date.now(), pausedAt: Date.now(), activeMs: 1000 };

beforeEach(() => {
  localStorage.clear();
  roles.value = [{ id: 'r1', name: 'Builder', archived: false, order: 0 }];
  select(classification);
  setState({});
});

afterEach(cleanup);

const names = () => screen.getAllByRole('button').map((b) => b.textContent);

test('idle focus shows the label, 25:00 and Start', () => {
  render(<TimerPanel />);
  expect(screen.getByText('FOCUS · Block 1 of 4')).toBeTruthy();
  expect(screen.getByText('25:00').className).toContain('tabular-nums');
  expect(names()).toEqual(['Start']);
  expect(document.title).toBe('Quadrantic Pomodoro');
});

test('Start is disabled without a selection', () => {
  select(null);
  render(<TimerPanel />);
  expect((screen.getByRole('button', { name: 'Start' }) as HTMLButtonElement).disabled).toBe(true);
});

test('controls per state', async () => {
  render(<TimerPanel />);
  const cases: [Partial<TimerState>, string[]][] = [
    [running, ['Pause', 'Reset']],
    [paused, ['Resume', 'Reset']],
    [{ kind: 'break' }, ['Start', 'Skip']],
    [{ kind: 'break', ...running }, ['Pause', 'End break']],
    [{ kind: 'break', ...paused }, ['Resume', 'End break']],
    [{ kind: 'longBreak', ...paused }, ['Resume', 'End break']],
  ];
  for (const [patch, expected] of cases) {
    await act(() => setState(patch));
    expect(names()).toEqual(expected);
  }
});

test('labels and tab title per kind', async () => {
  render(<TimerPanel />);
  await act(() => setState({ kind: 'break', ...running }));
  expect(screen.getByText('BREAK')).toBeTruthy();
  expect(document.title).toMatch(/^0[45]:\d\d · Break — Quadrantic Pomodoro$/);
  await act(() => setState({ kind: 'longBreak', ...paused }));
  expect(screen.getByText('LONG BREAK')).toBeTruthy();
  expect(document.title).toMatch(/^\d\d:\d\d · Long break — Quadrantic Pomodoro$/);
  await act(() => setState({ ...running }));
  expect(document.title).toMatch(/^\d\d:\d\d · Focus — Quadrantic Pomodoro$/);
});

test('Start, Pause, Resume and Reset drive the timer', async () => {
  const user = userEvent.setup();
  render(<TimerPanel />);
  await user.click(screen.getByRole('button', { name: 'Start' }));
  expect(timer.value.status).toBe('running');
  expect(timer.value.classification).toEqual(classification);
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  expect(timer.value.status).toBe('paused');
  await user.click(screen.getByRole('button', { name: 'Resume' }));
  expect(timer.value.status).toBe('running');
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(timer.value.status).toBe('idle');
});

test('Skip and End break advance to Focus', async () => {
  const user = userEvent.setup();
  render(<TimerPanel />);
  await act(() => setState({ kind: 'break', position: 2 }));
  await user.click(screen.getByRole('button', { name: 'Skip' }));
  expect(timer.value.kind).toBe('focus');
  await act(() => setState({ kind: 'break', position: 2, ...running }));
  await user.click(screen.getByRole('button', { name: 'End break' }));
  expect(timer.value.kind).toBe('focus');
  expect(timer.value.status).toBe('idle');
});

test('Space starts, pauses and resumes', async () => {
  render(<TimerPanel />);
  const press = () => act(() => void fireEvent.keyDown(document.body, { code: 'Space', key: ' ' }));
  await press();
  expect(timer.value.status).toBe('running');
  await press();
  expect(timer.value.status).toBe('paused');
  await press();
  expect(timer.value.status).toBe('running');
});

test('Space does nothing when Start is disabled', async () => {
  select(null);
  render(<TimerPanel />);
  await act(() => void fireEvent.keyDown(document.body, { code: 'Space', key: ' ' }));
  expect(timer.value.status).toBe('idle');
});

test('Space is ignored inside input, select, textarea and button', async () => {
  render(
    <div>
      <TimerPanel />
      <input aria-label="i" />
      <select aria-label="s" />
      <textarea aria-label="t" />
    </div>,
  );
  const targets = [
    screen.getByLabelText('i'),
    screen.getByLabelText('s'),
    screen.getByLabelText('t'),
    screen.getByRole('button', { name: 'Start' }),
  ];
  for (const target of targets) {
    await act(() => void fireEvent.keyDown(target, { code: 'Space', key: ' ' }));
    expect(timer.value.status).toBe('idle');
  }
});

test('other keys do nothing', async () => {
  render(<TimerPanel />);
  await act(() => void fireEvent.keyDown(document.body, { code: 'Enter', key: 'Enter' }));
  expect(timer.value.status).toBe('idle');
});
