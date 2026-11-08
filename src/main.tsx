import { render } from 'preact';
import { App } from './ui/App';
import { startAlarm } from './state/alarm';
import { restoreTimer, startSync } from './state/signals';
import './index.css';

restoreTimer();
startSync();
startAlarm();

render(<App />, document.getElementById('app')!);
