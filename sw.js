const CACHE="finanzas-familiares-v4";
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./index.html","./styles.css","./manifest.webmanifest","./icon.svg"]))));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).catch(()=>caches.match("./index.html"))))});