import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from 'vitest';
import { initialState, type TimerState } from '../domain/timer';
import { readSettings, writeTimer } from '../state/storage';
import { dispatch, intention, quadrant, roleId, roles, settings, settingsView, timer } from '../state/signals';
import { ClassificationControls } from './ClassificationControls';
import { TimerPanel } from './TimerPanel';

const builder = { id: 'r1', name: 'Builder', archived: false, order: 0 };
const manager = { id: 'r2', name: 'Manager', archived: false, order: 1 };

function setState(patch: Partial<TimerState>): void {
  const state = { ...initialState('classic'), ...patch };
  writeTimer(state);
  timer.value = state;
}

function App() {
  return (
    <div>
      <TimerPanel />
      <ClassificationControls />
    </div>
  );
}

const start = () => screen.getByRole('button', { name: 'Start' }) as HTMLButtonElement;
const role = () => screen.getByLabelText('Role') as HTMLSelectElement;
const hint = 'Choose a quadrant and role to start';

beforeEach(() => {
  localStorage.clear();
  roles.value = [builder, manager, { id: 'r3', name: 'Learner', archived: true, order: 2 }];
  quadrant.value = null;
  roleId.value = null;
  intention.value = '';
  settingsView.value = null;
  settings.value = readSettings();
  setState({});
});

test('Start needs a quadrant and a role, and the hint shows meanwhile', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(start().disabled).toBe(true);
  expect(screen.getByText(hint)).toBeTruthy();
  await user.click(screen.getByRole('button', { name: /Q2/ }));
  expect(start().disabled).toBe(true);
  await user.selectOptions(role(), 'r1');
  expect(start().disabled).toBe(false);
  expect(screen.queryByText(hint)).toBeNull();
});

test('the selected card is pressed and the others are not', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Q3/ }));
  expect(screen.getByRole('button', { name: /Q3/ }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: /Q1/ }).getAttribute('aria-pressed')).toBe('false');
});

test('the role select lists active roles in order, then Manage roles', () => {
  render(<App />);
  expect(Array.from(role().options).map((o) => o.textContent)).toEqual([
    'Select a role',
    'Builder',
    'Manager',
    'Manage roles…',
  ]);
});

test('Manage roles opens settings and keeps the selection', async () => {
  const user = userEvent.setup();
  roleId.value = 'r2';
  render(<App />);
  await user.selectOptions(role(), '__manage__');
  expect(settingsView.value).toBe('roles');
  expect(roleId.value).toBe('r2');
  expect(role().value).toBe('r2');
});

test('the intention is sent with Start and cleared after', async () => {
  const user = userEvent.setup();
  quadrant.value = 1;
  roleId.value = 'r1';
  render(<App />);
  await user.type(screen.getByPlaceholderText('What will you work on?'), 'Write the spec');
  await user.click(start());
  expect(timer.value.classification).toEqual({ quadrant: 1, roleId: 'r1', intention: 'Write the spec' });
  expect(intention.value).toBe('');
});

test('controls are locked with a lock icon while running or paused', async () => {
  quadrant.value = 1;
  roleId.value = 'r1';
  render(<App />);
  expect(screen.queryByTestId('lock')).toBeNull();
  for (const status of ['running', 'paused'] as const) {
    await act(() => {
      dispatch({ type: 'reset' });
      dispatch({ type: 'start', classification: { quadrant: 1, roleId: 'r1', intention: 'x' } });
      if (status === 'paused') dispatch({ type: 'pause' });
    });
    expect(screen.getAllByTestId('lock')).toHaveLength(2);
    expect(role().disabled).toBe(true);
    expect((screen.getByPlaceholderText('What will you work on?') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Q1/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByPlaceholderText('What will you work on?') as HTMLInputElement).value).toBe('x');
  }
});

test('controls are hidden during breaks', async () => {
  render(<App />);
  await act(() => setState({ kind: 'break' }));
  expect(screen.queryByLabelText('Role')).toBeNull();
  expect(screen.queryByRole('button', { name: /Q1/ })).toBeNull();
});

test('an archived role is not selected even if it was the last one', () => {
  quadrant.value = 2;
  roleId.value = 'r3';
  render(<App />);
  expect(role().value).toBe('');
  expect(start().disabled).toBe(true);
});

test('a completed focus block stores lastClassification', () => {
  const t0 = 1_700_000_000_000;
  setState({});
  dispatch({ type: 'start', classification: { quadrant: 4, roleId: 'r2' } }, t0);
  dispatch({ type: 'tick' }, t0 + 25 * 60_000);
  expect(readSettings().lastClassification).toEqual({ quadrant: 4, roleId: 'r2' });
  expect(settings.value.lastClassification).toEqual({ quadrant: 4, roleId: 'r2' });
});
