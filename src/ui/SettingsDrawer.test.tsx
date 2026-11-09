import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { settings, settingsView } from '../state/signals';
import { readSettings } from '../state/storage';
import { App } from './App';

beforeEach(() => {
  localStorage.clear();
  settings.value = readSettings();
  settingsView.value = null;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function open() {
  render(<App />);
  const gear = screen.getByRole('button', { name: 'Settings' });
  await act(() => {
    fireEvent.click(gear);
  });
  return gear;
}

test('the gear opens the drawer and focus moves to the close button', async () => {
  await open();
  expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close settings' }));
});

test('the close button shows no focus ring on open, only once a key is pressed', async () => {
  await open();
  const close = screen.getByRole('button', { name: 'Close settings' });
  expect(close.className).not.toContain('focus-visible:ring');
  await act(() => {
    fireEvent.keyDown(document, { key: 'Tab' });
  });
  expect(close.className).toContain('focus-visible:ring');
});

test('focusing the close button does not scroll the drawer, so Manage roles can scroll to Roles', async () => {
  const focus = vi.spyOn(HTMLElement.prototype, 'focus');
  await open();
  const closeCall = focus.mock.instances.findIndex(
    (el) => (el as HTMLElement).getAttribute('aria-label') === 'Close settings',
  );
  expect(closeCall).toBeGreaterThanOrEqual(0);
  expect(focus.mock.calls[closeCall]?.[0]).toEqual({ preventScroll: true });
  focus.mockRestore();
});

test('Escape, the close button and the backdrop close it and focus returns to the gear', async () => {
  const gear = await open();
  await act(() => {
    fireEvent.keyDown(document, { key: 'Escape' });
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(gear);

  await act(() => {
    fireEvent.click(gear);
  });
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(gear);

  await act(() => {
    fireEvent.click(gear);
  });
  await act(() => {
    fireEvent.click(screen.getByTestId('drawer-backdrop'));
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(gear);
});

test('the theme control applies immediately and persists', async () => {
  await open();
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
  });
  expect(settings.value.theme).toBe('dark');
  expect(screen.getByRole('button', { name: 'Dark' }).getAttribute('aria-pressed')).toBe('true');
  expect(readSettings().theme).toBe('dark');
});

test('the sound and notification toggles persist', async () => {
  vi.stubGlobal('Notification', { permission: 'default' });
  await open();
  const sound = screen.getByRole('switch', { name: 'Sound' });
  expect(sound.getAttribute('aria-checked')).toBe('true');
  await act(() => {
    fireEvent.click(sound);
  });
  await act(() => {
    fireEvent.click(screen.getByRole('switch', { name: 'Notifications' }));
  });
  const stored = readSettings();
  expect(stored.sound).toBe(false);
  expect(stored.notifications).toBe(false);
  expect(screen.getByRole('switch', { name: 'Sound' }).getAttribute('aria-checked')).toBe('false');
});

test('notifications are disabled and read "Blocked in browser" when permission is denied', async () => {
  vi.stubGlobal('Notification', { permission: 'denied' });
  await open();
  const toggle = screen.getByRole('switch', { name: 'Notifications' }) as HTMLButtonElement;
  expect(toggle.disabled).toBe(true);
  expect(screen.getByText('Blocked in browser')).toBeTruthy();
});
