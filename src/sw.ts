import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | PrecacheEntry)[];
};
declare const __SPRITE_HASH__: string;
const cacheName = `pokegenius-sprites-${__SPRITE_HASH__}`;
const readyKey = new URL("/__pokegenius_sprites_ready__", self.location.origin)
  .href;
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

async function cacheSprites() {
  const cache = await caches.open(cacheName);
  if (await cache.match(readyKey)) return;
  // One static download avoids a thousand network round trips on a phone.
  const response = await fetch(`/sprites.pack?v=${__SPRITE_HASH__}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Sprite pack download failed");
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (
    buffer.byteLength < 8 ||
    new TextDecoder().decode(bytes.slice(0, 4)) !== "PKG1"
  )
    throw new Error("Invalid sprite pack");
  const view = new DataView(buffer);
  const count = view.getUint32(4);
  if (count !== 1025) throw new Error("Incomplete sprite pack");
  const records: { id: number; start: number; length: number }[] = [];
  const ids = new Set<number>();
  let cursor = 8;
  for (let i = 0; i < count; i++) {
    if (cursor + 8 > bytes.length) throw new Error("Truncated sprite pack");
    const id = view.getUint32(cursor);
    const length = view.getUint32(cursor + 4);
    cursor += 8;
    if (
      id < 1 ||
      id > count ||
      ids.has(id) ||
      length < 8 ||
      cursor + length > bytes.length
    )
      throw new Error("Invalid sprite record");
    ids.add(id);
    records.push({ id, start: cursor, length });
    cursor += length;
  }
  if (cursor !== bytes.length) throw new Error("Invalid sprite pack length");
  for (let i = 0; i < records.length; i += 48) {
    await Promise.all(
      records.slice(i, i + 48).map(({ id, start, length }) =>
        cache.put(
          new URL(`/sprites/${id}.png`, self.location.origin),
          new Response(buffer.slice(start, start + length), {
            headers: { "Content-Type": "image/png" },
          }),
        ),
      ),
    );
  }
  await cache.put(readyKey, new Response(String(count)));
}
self.addEventListener("install", (event) => event.waitUntil(cacheSprites()));
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("pokegenius-sprites-") && key !== cacheName,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});
registerRoute(
  ({ url }) =>
    url.origin === self.location.origin &&
    /^\/sprites\/\d+\.png$/.test(url.pathname),
  async ({ request }) =>
    (await (
      await caches.open(cacheName)
    ).match(request, { ignoreSearch: true })) ?? fetch(request),
);
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/sprites\//, /^\/icons\//, /^\/assets\//],
  }),
);
