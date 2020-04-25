let delay = 500;
let prevDelay = 0;

export function useAutoReload() {
  const updateHandler = (event) =>
    JSON.parse(event.data).type === 'update' && document.location.reload();
  const eventSource = new EventSource(
    `/.nicessr/auto-refresh?page=${encodeURIComponent(
      document.location.pathname,
    )}`,
  );

  eventSource.addEventListener('message', updateHandler, false);
  eventSource.addEventListener('error', () => {
    eventSource.removeEventListener('message', updateHandler);
    eventSource.close();

    // Fibonacci backoff algorithm for reconnecting
    const newDelay = delay + prevDelay;
    prevDelay = delay;
    delay = newDelay;
    setTimeout(useAutoReload, newDelay);
  });
}
