import { afterEach, expect, test, vi } from 'vitest';
import './alarm.worker';

afterEach(() => {
  self.dispatchEvent(new MessageEvent('message', { data: { type: 'cancel' } }));
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('fires within a second once the wall clock passes the end, as after a system sleep', () => {
  vi.useFakeTimers();
  const post = vi.spyOn(self, 'postMessage').mockImplementation(() => undefined);
  const at = Date.now() + 10 * 60_000;
  self.dispatchEvent(new MessageEvent('message', { data: { type: 'schedule', at } }));
  vi.setSystemTime(at + 20 * 60_000);
  vi.advanceTimersByTime(1000);
  expect(post).toHaveBeenCalledWith({ type: 'fire', at });
});

test('does not fire before the end', () => {
  vi.useFakeTimers();
  const post = vi.spyOn(self, 'postMessage').mockImplementation(() => undefined);
  const at = Date.now() + 5000;
  self.dispatchEvent(new MessageEvent('message', { data: { type: 'schedule', at } }));
  vi.advanceTimersByTime(4999);
  expect(post).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(post).toHaveBeenCalledWith({ type: 'fire', at });
});
