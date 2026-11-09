import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { roles, settingsView } from '../state/signals';
import { readRoles, resetMemory } from '../state/storage';
import { App } from './App';
import { RolesSection } from './RolesSection';

beforeEach(() => {
  localStorage.clear();
  resetMemory();
  roles.value = readRoles();
  settingsView.value = null;
});

afterEach(cleanup);

function names(): string[] {
  const list = screen.getByRole('region', { name: 'Roles' }).querySelector('ul');
  return Array.from(list?.querySelectorAll('li[data-role-id]') ?? []).map((li) => li.getAttribute('aria-label') ?? '');
}

async function press(el: HTMLElement, init: KeyboardEventInit) {
  await act(() => {
    fireEvent.keyDown(el, init);
  });
}

test('lists active roles in order with no delete action', () => {
  render(<RolesSection />);
  expect(names()).toEqual(['Builder', 'Manager', 'Learner']);
  expect(screen.queryByRole('button', { name: /delete|remove/i })).toBeNull();
});

test('Alt+ArrowDown and Alt+ArrowUp reorder a focused row and persist', async () => {
  render(<RolesSection />);
  const row = () => screen.getByRole('listitem', { name: 'Builder' });
  row().focus();
  await press(row(), { key: 'ArrowDown', altKey: true });
  expect(names()).toEqual(['Manager', 'Builder', 'Learner']);
  expect(readRoles().map((r) => r.name)).toEqual(['Manager', 'Builder', 'Learner']);
  await press(row(), { key: 'ArrowDown', altKey: true });
  await press(row(), { key: 'ArrowDown', altKey: true });
  expect(names()).toEqual(['Manager', 'Learner', 'Builder']);
  await press(row(), { key: 'ArrowUp', altKey: true });
  expect(names()).toEqual(['Manager', 'Builder', 'Learner']);
});

test('arrow keys without Alt do not reorder', async () => {
  render(<RolesSection />);
  await press(screen.getByRole('listitem', { name: 'Builder' }), { key: 'ArrowDown' });
  expect(names()).toEqual(['Builder', 'Manager', 'Learner']);
});

test('drag and drop reorders', async () => {
  render(<RolesSection />);
  await act(() => {
    fireEvent.dragStart(screen.getByRole('listitem', { name: 'Learner' }));
  });
  await act(() => {
    fireEvent.drop(screen.getByRole('listitem', { name: 'Builder' }));
  });
  expect(names()).toEqual(['Learner', 'Builder', 'Manager']);
});

test('archive moves a role to the Archived group and restore appends it last', async () => {
  render(<RolesSection />);
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Archive Builder' }));
  });
  expect(names()).toEqual(['Manager', 'Learner']);
  const group = screen.getByText('Archived (1)').closest('details') as HTMLElement;
  expect(group.hasAttribute('open')).toBe(false);
  await act(() => {
    fireEvent.click(within(group).getByRole('button', { name: 'Restore Builder' }));
  });
  expect(names()).toEqual(['Manager', 'Learner', 'Builder']);
  expect(screen.queryByText(/Archived/)).toBeNull();
});

async function startRename(name: string): Promise<HTMLInputElement> {
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: `Edit ${name}` }));
  });
  return screen.getByRole('textbox', { name: `Rename ${name}` }) as HTMLInputElement;
}

test('role rows show the plain name and an input only while renaming', async () => {
  render(<RolesSection />);
  expect(screen.queryByRole('textbox', { name: /Rename/ })).toBeNull();
  expect(within(screen.getByRole('listitem', { name: 'Builder' })).getByText('Builder')).toBeTruthy();
  const input = await startRename('Builder');
  expect(document.activeElement).toBe(input);
  await act(() => {
    fireEvent.keyDown(input, { key: 'Escape' });
  });
  expect(screen.queryByRole('textbox', { name: /Rename/ })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit Builder' }));
  expect(names()).toEqual(['Builder', 'Manager', 'Learner']);
});

test('rename persists and keeps the id', async () => {
  render(<RolesSection />);
  const input = await startRename('Builder');
  await act(() => {
    fireEvent.input(input, { target: { value: 'Maker' } });
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(names()).toEqual(['Maker', 'Manager', 'Learner']);
  expect(readRoles()[0]).toMatchObject({ id: 'builder', name: 'Maker' });
  expect(screen.queryByRole('textbox', { name: /Rename/ })).toBeNull();
});

test('rename rejects empty and duplicate names case-insensitively', async () => {
  render(<RolesSection />);
  const input = await startRename('Builder');
  await act(() => {
    fireEvent.input(input, { target: { value: '  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(screen.getByRole('alert').textContent).toBe('Name is required');
  await act(() => {
    fireEvent.input(input, { target: { value: 'manager' } });
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(screen.getByRole('alert').textContent).toBe('Name already in use');
  expect(readRoles()[0]?.name).toBe('Builder');
});

test('Add role appends an editable row, validates, then saves', async () => {
  render(<RolesSection />);
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Add role' }));
  });
  const input = screen.getByRole('textbox', { name: 'New role name' }) as HTMLInputElement;
  expect(document.activeElement).toBe(input);
  await act(() => {
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(screen.getByRole('alert').textContent).toBe('Name is required');
  await act(() => {
    fireEvent.input(input, { target: { value: 'LEARNER' } });
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(screen.getByRole('alert').textContent).toBe('Name already in use');
  await act(() => {
    fireEvent.input(input, { target: { value: ' Coach ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(names()).toEqual(['Builder', 'Manager', 'Learner', 'Coach']);
  expect(screen.queryByRole('textbox', { name: 'New role name' })).toBeNull();
  expect(readRoles().at(-1)?.name).toBe('Coach');
});

test('an archived role name still blocks a duplicate', async () => {
  render(<RolesSection />);
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Archive Builder' }));
  });
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Add role' }));
  });
  const input = screen.getByRole('textbox', { name: 'New role name' });
  await act(() => {
    fireEvent.input(input, { target: { value: 'builder' } });
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(screen.getByRole('alert').textContent).toBe('Name already in use');
});

test('the role picker follows the new order', async () => {
  render(<App />);
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  });
  await press(screen.getByRole('listitem', { name: 'Builder' }), { key: 'ArrowDown', altKey: true });
  const picker = screen.getByRole('combobox') as HTMLSelectElement;
  expect(Array.from(picker.options).map((o) => o.text)).toEqual([
    'Select a role',
    'Manager',
    'Builder',
    'Learner',
    'Manage roles…',
  ]);
});

test('"Manage roles…" opens the drawer and scrolls to Roles', async () => {
  const scroll = (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  let scrolled = 0;
  Element.prototype.scrollIntoView = () => {
    scrolled += 1;
  };
  try {
    render(<App />);
    const picker = screen.getByRole('combobox') as HTMLSelectElement;
    await act(() => {
      fireEvent.change(picker, { target: { value: '__manage__' } });
    });
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
    expect(scrolled).toBe(1);
  } finally {
    (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView = scroll;
  }
});

test('the gear opens the drawer without scrolling to Roles', async () => {
  let scrolled = 0;
  const original = (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  Element.prototype.scrollIntoView = () => {
    scrolled += 1;
  };
  try {
    render(<App />);
    await act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    });
    expect(scrolled).toBe(0);
  } finally {
    (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView = original;
  }
});
