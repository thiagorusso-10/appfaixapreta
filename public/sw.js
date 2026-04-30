// Service Worker — Faixa Preta PWA
const CACHE_NAME = 'faixa-preta-v4';
const STATIC_ASSETS = [
  '/icons/icon-192-v2.png',
  '/icons/icon-512-v2.png',
  '/manifest.json',
];

// Instala e cacheia assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Limpa caches antigos ao ativar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: Network First, fallback para cache
self.addEventListener('fetch', (event) => {
  // Ignora requests que não são GET
  if (event.request.method !== 'GET') return;

  // Ignora requests para APIs externas (Clerk, Supabase)
  const url = new URL(event.request.url);
  if (url.hostname.includes('clerk') || url.hostname.includes('supabase')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona e salva no cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Sem rede: tenta o cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Página offline genérica para navegação
          if (event.request.mode === 'navigate') {
            return new Response(
              `<!DOCTYPE html>
              <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
              <title>Faixa Preta - Offline</title>
              <style>
                body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff;text-align:center}
                .c{max-width:400px;padding:2rem}
                h1{font-size:1.5rem;margin-bottom:.5rem}
                p{color:#999;font-size:.9rem}
                .icon{font-size:3rem;margin-bottom:1rem}
                button{margin-top:1.5rem;padding:.75rem 2rem;border:none;border-radius:12px;background:#3b82f6;color:#fff;font-size:1rem;font-weight:600;cursor:pointer}
              </style></head>
              <body><div class="c">
                <div class="icon">📶</div>
                <h1>Sem conexão</h1>
                <p>Verifique sua internet e tente novamente.</p>
                <button onclick="location.reload()">Tentar Novamente</button>
              </div></body></html>`,
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
          return new Response('', { status: 408 });
        });
      })
  );
});
