// CAMBIO NUEVO: service worker para que el juego funcione sin internet despues de abrirlo
// una vez. Guarda en el dispositivo la pagina del juego y la libreria three.js (que se
// carga desde un CDN externo y es imprescindible para que el juego arranque). El resto del
// juego (texturas, menu, sonidos) ya va incluido dentro del index.html, asi que cachear esa
// pagina alcanza para tenerlo todo.
//
// Lo que NO se guarda ni funciona sin internet, a proposito: comprar personajes (necesita
// hablar con PayPal y con nuestro propio servidor) y los anuncios (necesitan a Google). El
// juego en si se puede jugar igual sin conexion.

const CACHE_NAME = 'vaca-lupita-v1'; // CAMBIO: subir este numero cuando se quiera forzar
                                       // que todos los celulares bajen una cache nueva
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nunca cachear llamadas a nuestra API (pagos) ni a servicios de anuncios: siempre tienen
  // que ir a buscar la respuesta real a internet, nunca una guardada de antes.
  if (url.pathname.startsWith('/api/') || url.hostname.includes('googlesyndication') ||
      url.hostname.includes('crazygames') || url.hostname.includes('paypal')) {
    return; // deja pasar la pedida tal cual, sin intervenir
  }

  if (req.method !== 'GET') return;

  // La pagina principal: primero intenta traer la version mas nueva de internet; si no hay
  // conexion, usa la guardada. Asi, cuando el usuario SI tiene internet, siempre juega con
  // la ultima version que subiste; y cuando no tiene, igual puede jugar con la anterior.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Todo lo demas (three.js, iconos, manifest): primero la copia guardada (mas rapido), y
  // de paso la actualiza de fondo por si cambio.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
