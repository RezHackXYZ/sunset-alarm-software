self.addEventListener('push', function(event) {
    console.log('Push event received:', event);
    
    let notificationData = {
        title: 'Sunset Alarm',
        body: 'New notification',
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: 'sunset-alarm',
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Open App',
                icon: '/favicon.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/favicon.png'
            }
        ]
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                ...data
            };
        } catch (e) {
            console.log('Could not parse push data, using default');
        }
    }

    const promiseChain = self.registration.showNotification(
        notificationData.title,
        notificationData
    );

    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked:', event);
    
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('/app') && 'focus' in client) {
                    return client.focus();
                }
            }
            
            if (clients.openWindow) {
                return clients.openWindow('/app');
            }
        })
    );
});

self.addEventListener('notificationclose', function(event) {
    console.log('Notification closed:', event);
});

self.addEventListener('sync', function(event) {
    console.log('Background sync event:', event);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        console.log('Performing background sync');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

self.addEventListener('install', function(event) {
    console.log('Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activated');
    event.waitUntil(self.clients.claim());
}); 