import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { MoreIcon } from './icons';

export interface RowMenuItem {
  label: string;
  icon: ComponentChildren;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface RowMenuProps {
  label: string;
  items: RowMenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revealOnHover?: boolean;
}

const reveal = 'can-hover:opacity-0 can-hover:group-hover:opacity-100 focus:opacity-100';

export function RowMenu({ label, items, open, onOpenChange, revealOnHover = false }: RowMenuProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) menuRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
    };
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, onOpenChange]);

  const select = (item: RowMenuItem): void => {
    onOpenChange(false);
    triggerRef.current?.focus();
    item.onSelect();
  };

  return (
    <span ref={ref} class="relative flex shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        class={`touch-target flex items-center justify-center rounded p-0.5 text-on-surface-variant hover:text-on-surface ${revealOnHover && !open ? reveal : ''}`}
      >
        <MoreIcon />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          class="absolute top-full right-0 z-20 mt-1 flex w-[140px] flex-col rounded-md border border-menu-border bg-menu-bg py-1 text-[13px] shadow-menu"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => select(item)}
              class={`touch-target flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors pointer-coarse:py-3 enabled:hover:bg-outline-variant disabled:cursor-not-allowed disabled:opacity-50 ${item.danger ? 'text-q1' : 'text-on-surface'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
