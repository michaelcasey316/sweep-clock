"use strict";

const CACHE = "sweep-clock-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

// Precache everything on install.
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE)
            .then((c) => c.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Drop caches from older versions on activate.
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Page loads: network-first (so updates arrive automatically when online),
// falling back to cache (so it opens offline). Other assets: cache-first.
self.addEventListener("fetch", (e) => {
    const req = e.request;
    if (req.mode === "navigate") {
        e.respondWith(
            fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
                return res;
            }).catch(() =>
                caches.match(req, { ignoreSearch: true })
                    .then((r) => r || caches.match("./"))
            )
        );
    } else {
        e.respondWith(
            caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req))
        );
    }
});
