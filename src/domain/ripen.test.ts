import { expect, test } from 'vitest';
import { ripenColor } from './ripen';

test('returns the scale stops exactly', () => {
  expect(ripenColor(0)).toBe('#4ade80');
  expect(ripenColor(0.4)).toBe('#a3c94a');
  expect(ripenColor(0.6)).toBe('#f59e0b');
  expect(ripenColor(0.85)).toBe('#ef4444');
  expect(ripenColor(1)).toBe('#ef4444');
});

test('interpolates between stops', () => {
  expect(ripenColor(0.2)).toBe('#77d465');
  expect(ripenColor(0.725)).toBe('#f27128');
});

test('clamps out-of-range and invalid input', () => {
  expect(ripenColor(-1)).toBe('#4ade80');
  expect(ripenColor(2)).toBe('#ef4444');
  expect(ripenColor(Number.NaN)).toBe('#4ade80');
});
