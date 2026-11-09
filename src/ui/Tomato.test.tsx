import { cleanup, render } from '@testing-library/preact';
import { afterEach, expect, test } from 'vitest';
import { Tomato, type TomatoProps } from './Tomato';

afterEach(cleanup);

function draw(props: TomatoProps) {
  const { container } = render(<Tomato {...props} />);
  const svg = container.querySelector('svg') as SVGSVGElement;
  const fill = container.querySelector('[data-slot="tomato-fill"]');
  return { svg, fill };
}

test('is a 180px inline SVG with a 1.5px stroke', () => {
  const { svg } = draw({ kind: 'focus', status: 'idle', progress: 0 });
  expect(svg.getAttribute('height')).toBe('180');
  const strokes = Array.from(svg.querySelectorAll('path[stroke]'));
  expect(strokes.length).toBe(3);
  for (const path of strokes) expect(path.getAttribute('stroke-width')).toBe('1.5');
});

test('idle focus has no fill', () => {
  const { svg, fill } = draw({ kind: 'focus', status: 'idle', progress: 0 });
  expect(fill).toBeNull();
  expect(svg.getAttribute('data-state')).toBe('idle');
});

test('running focus fills in proportion and ripens', () => {
  const { svg, fill } = draw({ kind: 'focus', status: 'running', progress: 0.5 });
  expect(svg.getAttribute('data-state')).toBe('running');
  expect(fill?.getAttribute('opacity')).toBe('1');
  expect((fill as SVGElement).style.transform).toBe('translateY(59px)');
  expect(fill?.getAttribute('fill')).toBe('#ccb42b');
});

test('the fill covers the whole body at 100% and is red', () => {
  const { fill } = draw({ kind: 'focus', status: 'running', progress: 1 });
  expect((fill as SVGElement).style.transform).toBe('translateY(0px)');
  expect(fill?.getAttribute('fill')).toBe('#ef4444');
});

test('paused focus keeps the fill at 50% opacity', () => {
  const { svg, fill } = draw({ kind: 'focus', status: 'paused', progress: 0.3 });
  expect(svg.getAttribute('data-state')).toBe('paused');
  expect(fill?.getAttribute('opacity')).toBe('0.5');
});

test('breaks are static with no fill', () => {
  for (const kind of ['break', 'longBreak'] as const) {
    for (const status of ['idle', 'running', 'paused'] as const) {
      const { svg, fill } = draw({ kind, status, progress: 0.7 });
      expect(fill).toBeNull();
      expect(svg.getAttribute('data-state')).toBe('break');
      cleanup();
    }
  }
});
