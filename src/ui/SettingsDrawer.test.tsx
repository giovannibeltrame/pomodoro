import { act, fireEvent, render, screen } from '@testing-library/preact';
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

test('the gear opens the drawer as a modal dialog', async () => {
  const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
  await open();
  const dialog = screen.getByRole('dialog', { name: 'Settings' }) as HTMLDialogElement;
  expect(showModal).toHaveBeenCalledTimes(1);
  expect(dialog.open).toBe(true);
  showModal.mockRestore();
});

test('Escape, the close button and the backdrop close it and focus returns to the gear', async () => {
  const gear = await open();
  await act(() => {
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
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
    fireEvent.click(screen.getByRole('dialog'));
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(gear);
});

test('a click inside the panel does not close it', async () => {
  await open();
  await act(() => {
    fireEvent.click(screen.getByRole('heading', { name: 'Settings' }));
  });
  expect(screen.getByRole('dialog')).toBeTruthy();
});

test('a press inside the panel released over the backdrop does not close it', async () => {
  await open();
  await act(() => {
    fireEvent.mouseDown(screen.getByRole('heading', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('dialog'));
  });
  expect(screen.getByRole('dialog')).toBeTruthy();
  await act(() => {
    fireEvent.mouseDown(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('dialog'));
  });
  expect(screen.queryByRole('dialog')).toBeNull();
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
