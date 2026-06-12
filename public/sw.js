const CACHE_NAME = "argos-pwa-v2";
const OFFLINE_URL = new URL("offline.html", self.registration.scope).toString();
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");

const PRIVATE_PATH_PREFIXES = [
  "/pedidos",
  "/inventario",
  "/calidad",
  "/mantenimiento",
  "/admin",
  "/asistente-rag",
];

const PUBLIC_CACHEABLE_PATHS = new Set(["/", "/login", "/offline.html"]);

const toScopeRelativeUrl = (path) => new URL(path.replace(/^\//, ""), self.registration.scope).toString();

const CORE_ASSETS = [
  toScopeRelativeUrl("/"),
  toScopeRelativeUrl("/login"),
  toScopeRelativeUrl("/manifest.webmanifest"),
  toScopeRelativeUrl("/icons/argos-192.png"),
  toScopeRelativeUrl("/icons/argos-512.png"),
  OFFLINE_URL,
];

const normalizePathname = (pathname) => {
  if (!pathname) return "/";

  if (SCOPE_PATH && pathname.startsWith(SCOPE_PATH)) {
    const trimmed = pathname.slice(SCOPE_PATH.length);
    if (!trimmed) return "/";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  return pathname;
};

const isPrivatePath = (pathname) => {
  const normalized = normalizePathname(pathname);
  return PRIVATE_PATH_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

const isPublicCacheablePath = (pathname) => {
  const normalized = normalizePathname(pathname);
  return PUBLIC_CACHEABLE_PATHS.has(normalized);
};

const rebuildCoreCache = async () => {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    CORE_ASSETS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch {
        // Keep best-effort strategy without blocking runtime.
      }
    }),
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "ARGOS_CLEAR_CACHE") return;

  event.waitUntil(
    caches
      .delete(CACHE_NAME)
      .then(() => rebuildCoreCache())
      .catch(() => undefined),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (request.mode === "navigate") {
    if (isPrivatePath(requestUrl.pathname)) {
      event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
      return;
    }

    const shouldCacheNavigation = isPublicCacheablePath(requestUrl.pathname);

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (shouldCacheNavigation && response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => undefined);
          }

          return response;
        })
        .catch(async () => {
          if (shouldCacheNavigation) {
            const cachedPage = await caches.match(request);
            if (cachedPage) return cachedPage;
          }
          return caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  if (isSameOrigin && ["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    );
  }
});
