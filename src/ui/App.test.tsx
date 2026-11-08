import { render, screen } from '@testing-library/preact';
import { expect, test } from 'vitest';
import { App } from './App';

test('renders the empty app shell', () => {
  render(<App />);
  expect(screen.getByRole('main', { name: 'Quadrantic Pomodoro' })).toBeTruthy();
});
