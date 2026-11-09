import { act, render, screen } from '@testing-library/preact';
import { beforeEach, expect, test } from 'vitest';
import { timer } from '../state/signals';
import { App } from './App';

const initial = timer.value;

beforeEach(() => {
  timer.value = initial;
});

test('renders the shell: top bar, center column and Today panel', () => {
  render(<App />);
  expect(screen.getByText('QUADRANTIC')).toBeTruthy();
  expect(screen.getByText('POMODORO')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
  expect(screen.getByRole('main', { name: 'Quadrantic Pomodoro' })).toBeTruthy();
  expect(screen.getByRole('complementary', { name: 'Today' }).className).toContain('w-[300px]');
});

test('the break tint is active only outside Focus', async () => {
  render(<App />);
  const active = () => screen.getByTestId('break-tint').dataset.active;
  expect(active()).toBe('false');
  for (const [kind, expected] of [
    ['break', 'true'],
    ['longBreak', 'true'],
    ['focus', 'false'],
  ] as const) {
    await act(() => {
      timer.value = { ...timer.value, kind };
    });
    expect(active()).toBe(expected);
  }
});
