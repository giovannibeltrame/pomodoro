import { PHASE_LABEL, type PhaseKind } from '../domain/timer';

const NOTES = [660, 880];
const NOTE_SECONDS = 0.3;
const PEAK_GAIN = 0.15;

let context: AudioContext | null = null;

export interface FeedbackSettings {
  sound: boolean;
  notifications: boolean;
}

export function resetFeedback(): void {
  context = null;
}

function audioContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  context ??= new AudioContext();
  return context;
}

export function primeFeedback(settings: FeedbackSettings): void {
  if (settings.sound) {
    const ctx = audioContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }
  if (settings.notifications && typeof Notification !== 'undefined' && Notification.permission === 'default') {
    void Promise.resolve(Notification.requestPermission()).catch(() => undefined);
  }
}

function chime(ctx: AudioContext): void {
  const begin = ctx.currentTime;
  NOTES.forEach((frequency, index) => {
    const at = begin + index * NOTE_SECONDS;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(PEAK_GAIN, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + NOTE_SECONDS);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + NOTE_SECONDS);
  });
}

export function announcePhaseEnd(ended: PhaseKind, next: PhaseKind, settings: FeedbackSettings): void {
  if (settings.sound) {
    const ctx = audioContext();
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      chime(ctx);
    }
  }
  if (settings.notifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(`${PHASE_LABEL[ended]} complete`, { body: `Next: ${PHASE_LABEL[next]}` });
  }
}
