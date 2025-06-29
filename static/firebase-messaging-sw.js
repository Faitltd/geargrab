// Firebase Messaging Service Worker
// This file handles background push notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs",
  authDomain: "geargrabco.firebaseapp.com",
  projectId: "geargrabco",
  storageBucket: "geargrabco.firebasestorage.app",
  messagingSenderId: "227444442028",
  appId: "1:227444442028:web:6eeaed1e136d07f5b73009"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const { notification, data } = payload;

  // Customize notification
  const notificationTitle = notification?.title || 'GearGrab';
  const notificationOptions = {
    body: notification?.body || 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: data?.type || 'general',
    data: {
      ...data,
      url: data?.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: data?.priority === 'high',
    silent: false
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const { action, notification } = event;
  const data = notification.data || {};

  // Close notification
  notification.close();

  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Handle view action or notification click
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Track notification dismissal if needed
  const data = event.notification.data || {};
  
  // You could send analytics data here
  console.log('Notification dismissed:', data);
});

// Handle push events (for custom push handling)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push payload:', payload);

    // Firebase Messaging handles most push events automatically,
    // but you can add custom logic here if needed
  } catch (error) {
    console.error('Error parsing push payload:', error);
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase Messaging Service Worker installed');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase Messaging Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
