import type { ComponentChildren, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { MoreIcon } from './icons';
import { iconButton } from './styles';

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  revealOnHover?: boolean;
  class?: string;
}

const reveal = 'can-hover:opacity-0 can-hover:group-hover:opacity-100 focus:opacity-100';

export function RowMenu({
  label,
  items,
  open: controlled,
  onOpenChange,
  triggerRef,
  revealOnHover = false,
  class: className = '',
}: RowMenuProps) {
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const setOpen = useRef<(open: boolean) => void>(setOwn);
  setOpen.current = onOpenChange ?? setOwn;
  const ref = useRef<HTMLSpanElement>(null);
  const ownTrigger = useRef<HTMLButtonElement>(null);
  const trigger = triggerRef ?? ownTrigger;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.scrollIntoView?.({ block: 'nearest' });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const modal = document.querySelector('dialog[open]');
      if (modal && !modal.contains(ref.current)) return;
      event.preventDefault();
      setOpen.current(false);
      trigger.current?.focus();
    };
    const onPointer = (event: Event) => {
      if (!ref.current?.contains(event.target as Node)) setOpen.current(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, trigger]);

  const select = (item: RowMenuItem): void => {
    setOpen.current(false);
    trigger.current?.focus();
    item.onSelect();
  };

  return (
    <span ref={ref} class={`relative flex shrink-0 ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen.current(!open)}
        class={`${iconButton} p-0.5 ${revealOnHover && !open ? reveal : ''}`}
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
              class={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors pointer-coarse:py-3 enabled:hover:bg-outline-variant disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-3.5 ${item.danger ? 'text-q1' : 'text-on-surface'}`}
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
