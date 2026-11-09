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
