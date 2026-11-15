import { render } from 'preact';
import { App } from './ui/App';
import { startAlarm } from './state/alarm';
import { restoreTimer, startDayWatch, startSync } from './state/signals';
import { startTheme } from './state/theme';
import './index.css';

startTheme();
restoreTimer();
startSync();
startAlarm();
startDayWatch();

render(<App />, document.getElementById('app')!);

if (import.meta.env.DEV) {
  void import('./ui/prototype/ThemeLab').then(({ ThemeLab }) => {
    const host = document.createElement('div');
    document.body.append(host);
    render(<ThemeLab />, host);
  });
}
