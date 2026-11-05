/* Service worker: membuat aplikasi bisa dipakai offline.
   Naikkan angka VERSION setiap kali kamu mengubah file aplikasi,
   supaya HP mengunduh versi terbaru. */
const VERSION = "kp-v4";
const FILES = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./anim.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Font Google: simpan setelah diunduh pertama kali
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    e.respondWith(
      caches.open(VERSION + "-fonts").then((c) =>
        c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => { c.put(e.request, res.clone()); return res; }).catch(() => hit))
      )
    );
    return;
  }

  // File aplikasi: ambil dari cache dulu, perbarui di belakang layar
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((hit) => {
        const net = fetch(e.request).then((res) => {
          if (res && res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
          return res;
        }).catch(() => hit || caches.match("./index.html"));
        return hit || net;
      })
    );
  }
});
