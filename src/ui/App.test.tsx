import { act, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { settingsView, timer } from '../state/signals';
import { classes } from '../test/classes';
import { App } from './App';

const initial = timer.value;

beforeEach(() => {
  timer.value = initial;
  settingsView.value = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function openToday() {
  const button = screen.getByRole('button', { name: 'Today' });
  await act(() => {
    fireEvent.click(button);
  });
  return button;
}

function stubWidth(): { widen: () => void } {
  const listeners = new Set<() => void>();
  const media = {
    matches: false,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', (query: string) => {
    expect(query).toBe('(min-width: 64rem)');
    return media;
  });
  return {
    widen: () => {
      media.matches = true;
      for (const listener of listeners) listener();
    },
  };
}

test('renders the shell: top bar, center column and Today panel', () => {
  render(<App />);
  expect(screen.getByText('QUADRANTIC')).toBeTruthy();
  expect(screen.getByText('POMODORO')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
  expect(screen.getByRole('main', { name: 'Quadrantic Pomodoro' })).toBeTruthy();
  expect(classes(screen.getByRole('complementary', { name: 'Today' }))).toContain('w-[340px]');
});

test('the Today panel docks from 1024px; below it a Today button takes its place', () => {
  render(<App />);
  expect(classes(screen.getByRole('complementary', { name: 'Today' }))).toEqual(
    expect.arrayContaining(['hidden', 'lg:flex']),
  );
  const button = screen.getByRole('button', { name: 'Today' });
  expect(classes(button)).toContain('lg:hidden');
  expect(button.getAttribute('aria-haspopup')).toBe('dialog');
});

test('the Today button opens the Today list in a sheet: bottom on a phone, right side from 600px', async () => {
  render(<App />);
  await openToday();
  const sheet = screen.getByRole('dialog', { name: 'Today' }) as HTMLDialogElement;
  expect(sheet.open).toBe(true);
  expect(within(sheet).getByRole('heading', { name: 'Today' })).toBeTruthy();
  expect(classes(sheet)).toEqual(
    expect.arrayContaining(['mt-auto', 'w-full', 'h-[80dvh]', 'sm:ml-auto', 'sm:h-full', 'sm:w-[340px]']),
  );
});

test('Escape, the close button and the scrim close the Today sheet and focus returns to the button', async () => {
  render(<App />);
  const button = await openToday();
  await act(() => {
    fireEvent(screen.getByRole('dialog', { name: 'Today' }), new Event('cancel', { cancelable: true }));
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(button);

  await openToday();
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Close Today' }));
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(button);

  await openToday();
  await act(() => {
    fireEvent.mouseDown(screen.getByRole('dialog', { name: 'Today' }));
    fireEvent.click(screen.getByRole('dialog', { name: 'Today' }));
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(button);
});

test('the Today sheet closes when the window widens to dock the panel', async () => {
  const width = stubWidth();
  render(<App />);
  await openToday();
  await act(() => {
    width.widen();
  });
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the top bar fits a phone: the POMODORO word shows from 600px and padding tightens', () => {
  render(<App />);
  expect(classes(screen.getByText('POMODORO'))).toEqual(expect.arrayContaining(['hidden', 'sm:inline']));
  expect(classes(screen.getByRole('banner'))).toEqual(expect.arrayContaining(['px-4', 'sm:px-8']));
  expect(classes(screen.getByRole('main'))).toEqual(expect.arrayContaining(['px-4', 'sm:px-8']));
});
