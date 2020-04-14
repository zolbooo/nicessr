import { Response } from 'express';

const subscribers = new Map<string, Set<Response>>();

export function subscribeForPageUpdates(page: string, client: Response) {
  if (!subscribers.get(page)) {
    subscribers.set(page, new Set());
  }
  subscribers.get(page).add(client);
}
export function unsubscribe(page: string, client: Response) {
  subscribers.get(page)?.delete(client);
}

export function pushPageUpdate(page: string) {
  const id = Math.random();
  subscribers.get(page)?.forEach((client) => {
    client.write(`id: ${id}\n`);
    client.write('data: {"type": "update"}\n\n');
  });
}

process.on('SIGINT', () => {
  subscribers.forEach((clientList) =>
    clientList.forEach((client) => client.end()),
  );
});
