export type AlarmCommand = { type: 'schedule'; at: number } | { type: 'cancel' };

const RECHECK_MS = 1000;

let handle: ReturnType<typeof setTimeout> | undefined;

function cancel(): void {
  if (handle !== undefined) clearTimeout(handle);
  handle = undefined;
}

function schedule(at: number): void {
  cancel();
  handle = setTimeout(
    () => {
      handle = undefined;
      if (Date.now() < at) {
        schedule(at);
        return;
      }
      self.postMessage({ type: 'fire', at });
    },
    Math.min(RECHECK_MS, Math.max(0, at - Date.now())),
  );
}

self.onmessage = (event: MessageEvent<AlarmCommand>) => {
  if (event.data.type === 'schedule') schedule(event.data.at);
  else cancel();
};
