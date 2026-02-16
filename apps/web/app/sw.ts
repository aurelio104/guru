import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }: { request: Request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

// Background Sync: al recuperar red, pedir a los clientes que envíen la cola de check-ins
self.addEventListener("sync", (event: ExtendableEvent & { tag?: string }) => {
  if (event.tag === "presence-checkin") {
    event.waitUntil(
      (self as unknown as ServiceWorkerGlobalScope).clients.matchAll().then((clients: readonly Client[]) => {
        clients.forEach((c) => (c as WindowClient).postMessage({ type: "FLUSH_PRESENCE_QUEUE" }));
      })
    );
  }
});

self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() as { title?: string; body?: string; tag?: string } | undefined;
  const title = data?.title ?? "GURU";
  const options: NotificationOptions = {
    body: data?.body ?? "",
    tag: data?.tag ?? "default",
    icon: "/icon.svg",
  };
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(title, options)
  );
});
