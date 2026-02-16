/**
 * APlat Presence — Cola offline para check-ins.
 * Cuando falla la conexión, los check-ins se encolan y se reintentan al recuperar red.
 */
const STORAGE_KEY = "aplat_presence_offline_queue";

type QueuedCheckIn = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  queued_at: string;
};

export function enqueueCheckIn(url: string, headers: Record<string, string>, body: object): void {
  if (typeof window === "undefined") return;
  const queue = getQueue();
  queue.push({
    url,
    method: "POST",
    headers: { ...headers },
    body: JSON.stringify(body),
    queued_at: new Date().toISOString(),
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* quota exceeded, drop oldest */
    if (queue.length > 1) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-5)));
    }
  }
}

function getQueue(): QueuedCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedCheckIn[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* ignore */
  }
}

export async function flushOfflineQueue(
  onSuccess?: () => void,
  onFailed?: (err: unknown) => void
): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;
  let sent = 0;
  const remaining: QueuedCheckIn[] = [];
  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        sent++;
        onSuccess?.();
      } else {
        remaining.push(item);
      }
    } catch (err) {
      remaining.push(item);
      onFailed?.(err);
    }
  }
  saveQueue(remaining);
  return sent;
}

export function getQueuedCount(): number {
  return getQueue().length;
}

/** Registra un Sync para que el SW dispare el flush al recuperar red (Background Sync). */
export function registerSyncForPresence(): void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.ready) return;
  navigator.serviceWorker.ready.then((reg) => {
    const r = reg as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } };
    if (r.sync) r.sync.register("presence-checkin").catch(() => {});
  });
}
