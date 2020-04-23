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
    setTimeout(useAutoReload, 500);
  });
}
