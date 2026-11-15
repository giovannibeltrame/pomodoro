import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { CloseIcon } from './icons';

export interface SheetProps {
  label: string;
  returnFocus: { current: HTMLElement | null };
  onClose: () => void;
  class: string;
  children: ComponentChildren;
}

export function Sheet({ label, returnFocus, onClose, class: className, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedInside = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const target = returnFocus;
    return () => {
      dialog?.close();
      target.current?.focus();
    };
  }, [returnFocus]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        pressedInside.current = event.target !== event.currentTarget;
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pressedInside.current) onClose();
      }}
      class={`max-h-none max-w-none border-0 p-0 text-on-surface backdrop:bg-scrim ${className}`}
    >
      {children}
    </dialog>
  );
}

export function CloseButton({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClose}
      class="touch-target flex items-center justify-center rounded-[4px] p-1 text-on-surface-variant transition-colors duration-150 hover:text-on-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-outline"
    >
      <CloseIcon />
    </button>
  );
}
