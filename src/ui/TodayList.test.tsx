import { act, cleanup, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { PhaseRecord } from '../domain/timer';
import { now, phases, roles } from '../state/signals';
import { readPhases, recordPhase, resetMemory } from '../state/storage';
import { TodayList } from './TodayList';

const at = (h: number, m: number, day = 8) => new Date(2026, 10, day, h, m).getTime();

const focus: PhaseRecord = {
  start: at(9, 40),
  end: at(10, 30),
  kind: 'focus',
  activeMs: 50 * 60_000,
  quadrant: 2,
  roleId: 'builder',
  intention: 'Write the spec',
};
const pause: PhaseRecord = { start: at(10, 30), end: at(10, 40), kind: 'break', activeMs: 10 * 60_000 };
const long: PhaseRecord = { start: at(10, 40), end: at(10, 55), kind: 'longBreak', activeMs: 15 * 60_000 };

function seed(...records: PhaseRecord[]): void {
  for (const record of records) recordPhase(record);
  phases.value = readPhases();
}

beforeEach(() => {
  localStorage.clear();
  resetMemory();
  now.value = at(12, 0);
  phases.value = [];
  roles.value = [
    { id: 'builder', name: 'Builder', archived: false, order: 0 },
    { id: 'old', name: 'Retired', archived: true, order: 1 },
  ];
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test('empty day shows the heading, totals and the empty message', () => {
  render(<TodayList />);
  expect(screen.getByRole('heading', { name: 'Today' })).toBeTruthy();
  expect(screen.getByText('0 blocks · 0h00 focus')).toBeTruthy();
  expect(screen.getByText('No blocks yet today. Start your first focus block.')).toBeTruthy();
});

test('rows are oldest first and numbered from #1, with role, chip and intention', () => {
  phases.value = [long, focus, pause];
  render(<TodayList />);
  const rows = screen.getAllByRole('listitem');
  expect(rows).toHaveLength(3);
  expect(within(rows[0]!).getByText('#1 · 09:40–10:30 · Focus 50m')).toBeTruthy();
  expect(within(rows[0]!).getByText('Builder')).toBeTruthy();
  const chip = within(rows[0]!).getByTestId('chip');
  expect(chip.textContent).toBe('Q2');
  expect(chip.getAttribute('style')).toContain('var(--q2)');
  expect(within(rows[0]!).getByText('"Write the spec"')).toBeTruthy();
  expect(rows[1]!.textContent).toBe('#2 · 10:30–10:40 · Break 10m');
  expect(rows[2]!.textContent).toBe('#3 · 10:40–10:55 · Long break 15m');
  expect(screen.getByText('1 block · 0h50 focus')).toBeTruthy();
});

test('a row without an intention omits the quoted part', () => {
  phases.value = [{ ...focus, intention: undefined }];
  render(<TodayList />);
  expect(screen.getByRole('listitem').textContent).not.toContain('"');
});

test('an archived role still shows its name', () => {
  phases.value = [{ ...focus, roleId: 'old' }];
  render(<TodayList />);
  expect(screen.getByText('Retired')).toBeTruthy();
});

test('rows never wrap and the intention truncates', () => {
  phases.value = [focus];
  render(<TodayList />);
  const row = screen.getByRole('listitem');
  expect(within(row).getByText('#1 · 09:40–10:30 · Focus 50m').className).toContain('truncate');
  expect(within(row).getByText('"Write the spec"').className).toContain('truncate');
  expect(within(row).getByText('Builder').parentElement!.className).toContain('whitespace-nowrap');
});

test('phases from another day are not listed', () => {
  phases.value = [{ ...focus, start: at(9, 40, 7), end: at(10, 30, 7) }];
  render(<TodayList />);
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
});

test('the list rerenders when the local day changes', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(at(23, 59));
  phases.value = [focus];
  render(<TodayList />);
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  await act(() => {
    vi.advanceTimersByTime(61_000);
  });
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  expect(screen.getByText('No blocks yet today. Start your first focus block.')).toBeTruthy();
});

test('break rows have no actions menu', () => {
  seed(pause);
  render(<TodayList />);
  expect(screen.queryByRole('button', { name: 'Block actions' })).toBeNull();
});

test('the menu opens with Edit and Delete, and closes on Escape and on an outside click', async () => {
  const user = userEvent.setup();
  seed(focus);
  render(<TodayList />);
  await user.click(screen.getByRole('button', { name: 'Block actions' }));
  expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeTruthy();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('menu')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Block actions' }));
  await user.click(document.body);
  expect(screen.queryByRole('menu')).toBeNull();
});

test('editing saves quadrant, role and intention and keeps the times', async () => {
  const user = userEvent.setup();
  roles.value = [...roles.value, { id: 'writer', name: 'Writer', archived: false, order: 2 }];
  seed(focus);
  render(<TodayList />);
  await user.click(screen.getByRole('button', { name: 'Block actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
  await user.click(screen.getByRole('button', { name: 'Q4' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Role' }), 'writer');
  const input = screen.getByRole('textbox', { name: 'Intention' });
  await user.clear(input);
  await user.type(input, 'Fixed');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(readPhases()).toEqual([{ ...focus, quadrant: 4, roleId: 'writer', intention: 'Fixed' }]);
  expect(screen.getByText('"Fixed"')).toBeTruthy();
  expect(screen.getByText('Writer')).toBeTruthy();
  expect(screen.queryByTestId('edit-form')).toBeNull();
});

test('cancel leaves the record unchanged', async () => {
  const user = userEvent.setup();
  seed(focus);
  render(<TodayList />);
  await user.click(screen.getByRole('button', { name: 'Block actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
  await user.click(screen.getByRole('button', { name: 'Q1' }));
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(readPhases()).toEqual([focus]);
  expect(screen.queryByTestId('edit-form')).toBeNull();
});

test('the role list has active roles plus the row role even if archived', async () => {
  const user = userEvent.setup();
  roles.value = [...roles.value, { id: 'other', name: 'Other', archived: true, order: 2 }];
  seed({ ...focus, roleId: 'old' });
  render(<TodayList />);
  await user.click(screen.getByRole('button', { name: 'Block actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
  const names = within(screen.getByRole('combobox', { name: 'Role' }))
    .getAllByRole('option')
    .map((o) => o.textContent);
  expect(names).toEqual(['Builder', 'Retired']);
});

test('delete asks inline, never window.confirm, and removes the record', async () => {
  const user = userEvent.setup();
  const confirm = vi.spyOn(window, 'confirm');
  seed(focus, pause);
  render(<TodayList />);
  await user.click(screen.getByRole('button', { name: 'Block actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
  expect(screen.getByText('Delete this block?')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(readPhases()).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: 'Block actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(readPhases()).toEqual([pause]);
  expect(confirm).not.toHaveBeenCalled();
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
});
