import { act, cleanup, render, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { PhaseRecord } from '../domain/timer';
import { now, phases, roles } from '../state/signals';
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

beforeEach(() => {
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
