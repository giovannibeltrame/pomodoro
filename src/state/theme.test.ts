import { afterEach, expect, test } from 'vitest';
import { settings } from './signals';
import { startTheme } from './theme';

function fakeMedia(initial: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches: initial,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  return {
    match: () => media as unknown as MediaQueryList,
    set(matches: boolean) {
      media.matches = matches;
      listeners.forEach((fn) => fn());
    },
    listeners,
  };
}

afterEach(() => {
  settings.value = { ...settings.value, theme: 'system' };
});

test('system follows prefers-color-scheme live', () => {
  const root = document.createElement('html');
  const media = fakeMedia(true);
  settings.value = { ...settings.value, theme: 'system' };
  const stop = startTheme(root, media.match);
  expect(root.dataset.theme).toBe('dark');
  media.set(false);
  expect(root.dataset.theme).toBe('light');
  stop();
  expect(media.listeners.size).toBe(0);
});

test('an explicit theme ignores the system preference', () => {
  const root = document.createElement('html');
  const media = fakeMedia(true);
  settings.value = { ...settings.value, theme: 'light' };
  const stop = startTheme(root, media.match);
  expect(root.dataset.theme).toBe('light');
  media.set(false);
  settings.value = { ...settings.value, theme: 'dark' };
  expect(root.dataset.theme).toBe('dark');
  stop();
});
