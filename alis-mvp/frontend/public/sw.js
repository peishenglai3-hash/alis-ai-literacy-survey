/* ALIS Service Worker（点2·PWA）
 * ============================================================================
 * 目的：让采集端"像 App 一样安装"、断网也能打开外壳、局域网抖动不白屏。
 * 策略（无需构建期预缓存清单、零依赖、可控）：
 *   · 导航请求（打开页面）→ 网络优先，断网回退缓存的 index.html（"/"）。
 *   · 同源静态资源（/assets 下的 hash 化 JS/CSS、图标、manifest）→ 缓存优先、回填。
 *   · API 请求（/session/* /probe/* /export 等，含所有 POST）→ 一律直连网络、绝不缓存。
 *     采集数据的"离线暂存/重放"由前端 IndexedDB 队列（offline/commitQueue.ts）负责，
 *     不在 SW 层缓存业务响应，避免读到过期数据。
 * 更新：install 即 skipWaiting、activate 即 claim + 清理旧缓存 → 部署新版自动接管。
 * ============================================================================ */
const CACHE = "alis-shell-v1";
const CORE = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .catch(() => {}) // 首次离线安装容错
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url, req) {
  if (["script", "style", "font", "image"].includes(req.destination)) return true;
  return (
    url.pathname.startsWith("/assets/") ||
    /\.(js|mjs|css|svg|png|jpg|jpeg|webp|ico|woff2?|webmanifest)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // POST/PUT（如 /session/commit）→ 不拦截，直连网络
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 跨源 → 直连

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => {});
          }
          return resp;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match(req))),
    );
    return;
  }

  if (isStaticAsset(url, req)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((resp) => {
            if (resp && resp.ok) {
              const copy = resp.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return resp;
          }),
      ),
    );
    return;
  }
  // 其余（API GET：/health /sessions /stats /export 等）→ 默认直连网络，不缓存
});
