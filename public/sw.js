// ClimACT Service Worker - PWA Offline Support
// FASE 5 - Finalização e Polimento

const CACHE_NAME = 'climact-v1.0.0';
const STATIC_CACHE = 'climact-static-v1.0.0';
const API_CACHE = 'climact-api-v1.0.0';

// Recursos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/map',
  '/dashboard/report',
  '/dashboard/education',
  '/dashboard/alerts',
  '/dashboard/news',
  '/dashboard/profile',
  '/login',
  '/signup',
  '/anonymous-report',
  '/manifest.json',
  '/favicon.ico'
];

// URLs de API para cache
const API_ENDPOINTS = [
  '/api/',
  'https://firestore.googleapis.com',
  'https://us-central1-climact.cloudfunctions.net'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache de recursos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache de API
      caches.open(API_CACHE).then((cache) => {
        console.log('[SW] API cache created...');
        return cache;
      })
    ]).then(() => {
      console.log('[SW] Installation completed');
      return self.skipWaiting();
    })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Assumir controle de todas as páginas
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation completed');
    })
  );
});

// Interceptação de requisições (Cache Strategy)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorar requisições não HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estratégias diferentes por tipo de recurso
  if (request.method === 'GET') {
    
    // 1. Recursos estáticos - Cache First
    if (STATIC_ASSETS.some(asset => url.pathname === asset) || 
        request.destination === 'image' || 
        request.destination === 'script' || 
        request.destination === 'style') {
      
      event.respondWith(cacheFirst(request));
      
    // 2. APIs do Firebase - Network First com fallback
    } else if (url.hostname.includes('firebase') || 
               url.hostname.includes('cloudfunctions') ||
               url.pathname.startsWith('/api/')) {
      
      event.respondWith(networkFirstWithFallback(request));
      
    // 3. Páginas HTML - Stale While Revalidate
    } else if (request.destination === 'document') {
      
      event.respondWith(staleWhileRevalidate(request));
      
    // 4. Outros recursos - Network First
    } else {
      
      event.respondWith(networkFirst(request));
    }
  }
  
  // POST/PUT/DELETE - Sempre tentar rede primeiro
  else {
    event.respondWith(networkOnlyWithOfflineSupport(request));
  }
});

// Estratégia Cache First - Para recursos estáticos
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache First failed:', error);
    return await caches.match('/offline.html') || new Response('Offline');
  }
}

// Estratégia Network First - Para APIs
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Estratégia Network First com Fallback específico
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback para APIs específicas
    if (request.url.includes('/reports') || request.url.includes('/alerts')) {
      return new Response(JSON.stringify({ 
        error: 'Offline', 
        data: [], 
        cached: true 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    return new Response('Service Offline', { status: 503 });
  }
}

// Estratégia Stale While Revalidate - Para páginas HTML
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Buscar atualização em background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    console.log('[SW] Network failed for page');
    return null;
  });
  
  // Retornar cache se disponível, senão aguardar rede
  return cachedResponse || await fetchPromise || await caches.match('/offline.html');
}

// Estratégia Network Only com suporte offline
async function networkOnlyWithOfflineSupport(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Network failed for mutation:', error);
    
    // Para operações críticas, armazenar para sync posterior
    if (request.url.includes('/reports') || request.url.includes('/emergency')) {
      await storeForBackgroundSync(request);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Request queued for when online',
      queued: true 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 202
    });
  }
}

// Armazenar requisições para sincronização posterior
async function storeForBackgroundSync(request) {
  try {
    const body = await request.clone().text();
    const syncData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    };
    
    const syncStore = await caches.open('sync-requests');
    await syncStore.put(
      new Request(`sync-${Date.now()}`),
      new Response(JSON.stringify(syncData))
    );
    
    console.log('[SW] Request stored for background sync:', request.url);
  } catch (error) {
    console.error('[SW] Failed to store request for sync:', error);
  }
}

// Background Sync para requisições offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'climact-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Sincronizar requisições offline
async function syncOfflineRequests() {
  try {
    const syncStore = await caches.open('sync-requests');
    const requests = await syncStore.keys();
    
    for (const request of requests) {
      try {
        const response = await syncStore.match(request);
        const syncData = await response.json();
        
        // Tentar executar a requisição
        const fetchResponse = await fetch(syncData.url, {
          method: syncData.method,
          headers: syncData.headers,
          body: syncData.body
        });
        
        if (fetchResponse.ok) {
          await syncStore.delete(request);
          console.log('[SW] Synced offline request:', syncData.url);
        }
      } catch (error) {
        console.log('[SW] Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push Notifications para alertas de emergência
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = { title: 'ClimACT', body: event.data.text() };
    }
  }
  
  const options = {
    title: data.title || 'ClimACT - Alerta',
    body: data.body || 'Nova atualização disponível',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: data.image,
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'Visualizar'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ],
    tag: data.tag || 'climact-notification',
    renotify: true,
    requireInteraction: data.severity === 'critical',
    silent: false,
    vibrate: data.severity === 'critical' ? [200, 100, 200, 100, 200] : [100, 50, 100]
  };
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Ações de notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  let url = '/dashboard';
  
  if (event.action === 'view') {
    if (event.notification.data.url) {
      url = event.notification.data.url;
    } else if (event.notification.data.type === 'alert') {
      url = '/dashboard/alerts';
    } else if (event.notification.data.type === 'report') {
      url = '/dashboard/map';
    }
  } else if (event.action === 'dismiss') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já tem uma janela aberta, focar nela
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Senão, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (event.data.type === 'CACHE_REPORT') {
    // Cache específico para reports importantes
    const reportData = event.data.report;
    cacheReport(reportData);
  }
});

// Cache específico para reports críticos
async function cacheReport(reportData) {
  try {
    const cache = await caches.open('critical-reports');
    const response = new Response(JSON.stringify(reportData));
    await cache.put(`report-${reportData.id}`, response);
    console.log('[SW] Critical report cached:', reportData.id);
  } catch (error) {
    console.error('[SW] Failed to cache report:', error);
  }
}

console.log('[SW] ClimACT Service Worker loaded successfully');
