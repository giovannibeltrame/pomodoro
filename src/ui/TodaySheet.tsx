import { useEffect } from 'preact/hooks';
import { CloseButton, Sheet } from './Sheet';
import { TodayList } from './TodayList';

export const DOCKED = '(min-width: 64rem)';

export function TodaySheet({
  returnFocus,
  onClose,
}: {
  returnFocus: { current: HTMLElement | null };
  onClose: () => void;
}) {
  useEffect(() => {
    const media = window.matchMedia(DOCKED);
    const onChange = () => {
      if (media.matches) onClose();
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [onClose]);

  return (
    <Sheet
      label="Today"
      returnFocus={returnFocus}
      onClose={onClose}
      class="mt-auto mb-0 h-[80dvh] w-full rounded-t-lg border-t border-menu-border bg-surface-container-low sm:m-0 sm:ml-auto sm:h-full sm:w-[340px] sm:rounded-none sm:border-t-0 sm:border-l"
    >
      <div class="relative flex h-full flex-col p-6">
        <span class="absolute top-5 right-5">
          <CloseButton label="Close Today" onClose={onClose} />
        </span>
        <TodayList />
      </div>
    </Sheet>
  );
}
