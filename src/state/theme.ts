import { effect } from '@preact/signals';
import { settings } from './signals';

const QUERY = '(prefers-color-scheme: dark)';

export function startTheme(
  root: HTMLElement = document.documentElement,
  match: (query: string) => MediaQueryList = (query) => window.matchMedia(query),
): () => void {
  const media = match(QUERY);
  const apply = (): void => {
    const theme = settings.value.theme;
    root.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
  };
  const stop = effect(apply);
  media.addEventListener('change', apply);
  return () => {
    stop();
    media.removeEventListener('change', apply);
  };
}
