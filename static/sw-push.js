// Push notification service worker for GearGrab
const CACHE_NAME = 'geargrab-push-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Push service worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Push service worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);

  let notificationData = {
    title: 'GearGrab',
    body: 'You have a new message',
    icon: '/geargrab-logo.png',
    badge: '/geargrab-logo.png',
    tag: 'geargrab-message',
    data: {}
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Show notification
  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply.png'
        },
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view.png'
        }
      ],
      requireInteraction: false,
      silent: false
    }
  );

  event.waitUntil(notificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  let urlToOpen = '/messages';

  // Handle different actions
  if (action === 'reply') {
    urlToOpen = `/messages?conversation=${data.conversationId}&action=reply`;
  } else if (action === 'view' || !action) {
    urlToOpen = data.conversationId 
      ? `/messages?conversation=${data.conversationId}`
      : '/messages';
  }

  // Open or focus the app
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if app is already open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      const clientUrl = new URL(client.url);
      
      if (clientUrl.origin === self.location.origin) {
        // App is open, navigate to the right page
        client.navigate(urlToOpen);
        return client.focus();
      }
    }
    
    // App is not open, open new window
    return clients.openWindow(urlToOpen);
  });

  event.waitUntil(promiseChain);
});

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'send-message') {
    event.waitUntil(sendPendingMessages());
  }
});

// Function to send pending messages when back online
async function sendPendingMessages() {
  try {
    // Get pending messages from IndexedDB or localStorage
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/conversations/' + message.conversationId + '/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: message.content,
            type: message.type || 'text'
          })
        });

        if (response.ok) {
          // Remove from pending messages
          await removePendingMessage(message.id);
          console.log('✅ Pending message sent:', message.id);
        }
      } catch (error) {
        console.error('❌ Failed to send pending message:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendPendingMessages:', error);
  }
}

// Helper functions for pending messages (simplified)
async function getPendingMessages() {
  // In a real implementation, you'd use IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingMessage(messageId) {
  // In a real implementation, you'd remove from IndexedDB
  console.log('Removing pending message:', messageId);
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message from main thread:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection in service worker:', event.reason);
});
