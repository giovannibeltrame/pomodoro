import { expect, test } from 'vitest';
import css from './theme.css?raw';
import { DOCKED } from './TodaySheet';

function coarseRules(): string {
  const start = css.indexOf('@media (pointer: coarse)');
  expect(start).toBeGreaterThan(-1);
  return css.slice(start);
}

test('on a touch screen every button and summary gets a hit area of at least 44px', () => {
  const rules = coarseRules();
  expect(rules).toMatch(
    /button::before,\s*summary::before\s*\{[^}]*width: max\(100%, 2\.75rem\);[^}]*height: max\(100%, 2\.75rem\);/,
  );
});

test('on a touch screen every input and select is at least 44px tall', () => {
  expect(coarseRules()).toMatch(/input,\s*select\s*\{\s*min-height: 2\.75rem;/);
});

test('the Today sheet closes at the same width where the lg breakpoint docks the panel', () => {
  const lg = /--breakpoint-lg:\s*([^;]+);/.exec(css)?.[1];
  expect(DOCKED).toBe(`(min-width: ${lg})`);
});
