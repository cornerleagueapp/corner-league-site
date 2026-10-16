/** One in-flight read per widget; clear stale scores on failures and on tab hiding. */
export function startWidgetPolling<T>({
  load,
  onData,
  onBusy,
  onError,
}: {
  load: (signal: AbortSignal) => Promise<T>;
  onData: (data: T | undefined) => void;
  onBusy: (busy: boolean) => void;
  onError: (message: string) => void;
}) {
  let active = true,
    busy = false,
    pending = false,
    failures = 0;
  let controller: AbortController | undefined,
    timer: ReturnType<typeof setTimeout> | undefined;
  async function refresh() {
    clearTimeout(timer);
    if (!active || document.hidden) return;
    if (busy) {
      pending = true;
      return;
    }
    busy = true;
    onBusy(true);
    controller = new AbortController();
    const current = controller;
    const timeout = setTimeout(() => current.abort(), 10000);
    try {
      const data = await load(current.signal);
      if (active && !document.hidden) {
        failures = 0;
        onData(data);
        onError("");
      }
    } catch (e) {
      if (active && !document.hidden) {
        failures++;
        onData(undefined);
        onError(
          e instanceof Error ? e.message : "Unable to refresh this widget.",
        );
      }
    } finally {
      clearTimeout(timeout);
      busy = false;
      if (active) {
        onBusy(false);
        if (!document.hidden) {
          if (pending) {
            pending = false;
            void refresh();
          } else
            timer = setTimeout(
              () => void refresh(),
              Math.min(300000, 60000 * 2 ** Math.min(failures, 3)) +
                Math.random() * 5000,
            );
        }
      }
    }
  }
  function visibility() {
    clearTimeout(timer);
    onData(undefined);
    if (document.hidden) {
      controller?.abort();
    } else void refresh();
  }
  document.addEventListener("visibilitychange", visibility);
  void refresh();
  return {
    refresh,
    stop() {
      active = false;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
