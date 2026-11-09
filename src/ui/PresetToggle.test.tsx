import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from 'vitest';
import { initialState } from '../domain/timer';
import { readSettings, readTimer, writeTimer } from '../state/storage';
import { settings, timer } from '../state/signals';
import { PresetToggle } from './PresetToggle';

beforeEach(() => {
  localStorage.clear();
  settings.value = readSettings();
  timer.value = initialState('classic');
});

const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

test('Classic is selected by default and both buttons are enabled while idle', () => {
  render(<PresetToggle />);
  expect(button('Classic').getAttribute('aria-pressed')).toBe('true');
  expect(button('Deep').getAttribute('aria-pressed')).toBe('false');
  expect(button('Deep').disabled).toBe(false);
});

test('switching to Deep prepares an idle 50-minute focus at block 1 and persists the preset', async () => {
  const user = userEvent.setup();
  const advanced = { ...initialState('classic'), position: 3 };
  writeTimer(advanced);
  timer.value = advanced;
  render(<PresetToggle />);
  await user.click(button('Deep'));
  expect(button('Deep').getAttribute('aria-pressed')).toBe('true');
  expect(timer.value).toEqual(initialState('deep'));
  expect(readTimer('classic')).toEqual(initialState('deep'));
  expect(readSettings().preset).toBe('deep');
});

test.each(['running', 'paused'] as const)('both buttons are disabled while %s', async (status) => {
  render(<PresetToggle />);
  await act(() => {
    timer.value = { ...initialState('classic'), status };
  });
  expect(button('Classic').disabled).toBe(true);
  expect(button('Deep').disabled).toBe(true);
});
