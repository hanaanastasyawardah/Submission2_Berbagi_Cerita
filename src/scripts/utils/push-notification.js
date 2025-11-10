// VAPID Public Key dari Dicoding Story API
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

class PushNotificationHelper {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  // Convert VAPID key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if notification is supported
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check notification permission
  getPermission() {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notification tidak didukung di browser ini');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Register service worker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker tidak didukung');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    try {
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      // Get push subscription from browser
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      const subscriptionJSON = this.subscription.toJSON();

      console.log('Push subscription:', this.subscription);
      
      // Send subscription to Dicoding API
      await this._sendSubscriptionToServer(subscriptionJSON);
      
      // Save subscription status to localStorage
      localStorage.setItem('push_subscribed', 'true');
      localStorage.setItem('push_subscription', JSON.stringify(this.subscription));
      
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  }

  // Send subscription to Dicoding server
  async _sendSubscriptionToServer(subscription) {
    const token = localStorage.getItem('story_token');
    
    if (!token) {
      console.warn('No auth token, skipping server subscription');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            endpoint: subscription.endpoint, 
            keys: {
                auth: subscription.keys.auth,
                p256dh: subscription.keys.p256dh,
            }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register subscription to server');
      }

      console.log('Subscription registered to server:', data);
      return data;
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      // Don't throw error, subscription still works locally
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.registration) {
      return;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();
        
        // Unsubscribe from server
        await this._removeSubscriptionFromServer(subscription);
        
        console.log('Push unsubscribed');
      }

      localStorage.removeItem('push_subscribed');
      localStorage.removeItem('push_subscription');
      this.subscription = null;
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  // Remove subscription from Dicoding server
  async _removeSubscriptionFromServer(subscription) {
    const token = localStorage.getItem('story_token');
    
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscription
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unregister from server');
      }

      console.log('Subscription removed from server:', data);
      return data;
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      // Don't throw error
    }
  }

  // Get current subscription
  async getSubscription() {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    try {
      await navigator.serviceWorker.ready;
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  // Check if already subscribed
  async isSubscribed() {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  // Initialize push notification
  async init() {
    if (!this.isSupported()) {
      console.warn('Push notification tidak didukung');
      return false;
    }

    try {
      // Register service worker
      await this.registerServiceWorker();

      // Check if already subscribed
      const isSubscribed = await this.isSubscribed();
      
      // If was subscribed before (from localStorage), subscribe again
      const wasSubscribed = localStorage.getItem('push_subscribed') === 'true';
      
      if (wasSubscribed && !isSubscribed) {
        const permission = this.getPermission();
        if (permission === 'granted') {
          await this.subscribe();
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notification:', error);
      return false;
    }
  }

  // Send test notification (for development)
  async sendTestNotification(customTitle = 'Test Notification', customOptions = {}) {
    if (!this.isSupported()) {
      throw new Error('Notification tidak didukung');
    }

    const permission = this.getPermission();
    
    if (permission !== 'granted') {
      throw new Error('Permission notification belum diberikan');
    }

    // Opsi default
    const defaultOptions = {
      body: 'Ini adalah test notifikasi dari Berbagi Cerita',
      icon: '/images/icon-192x192.png',
      badge: '/images/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/'
      }
    };

    // Gabungkan opsi default dengan customOptions yang dikirim
    const options = { ...defaultOptions, ...customOptions };

    if (this.registration) {
      // Gunakan customTitle dan options yang sudah digabung
      await this.registration.showNotification(customTitle, options);
    } else {
      new Notification(customTitle, options);
    }
  }

  // Request push from server (for testing with real API)
  async requestPushFromServer() {
    const token = localStorage.getItem('story_token');
    
    if (!token) {
      throw new Error('Anda harus login terlebih dahulu');
    }

    try {
      // Note: Ini endpoint untuk testing, sebenarnya push dikirim otomatis dari server
      // ketika ada cerita baru atau event tertentu
      const response = await fetch(`${API_BASE_URL}/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send test push');
      }

      console.log('Test push notification sent from server');
      return true;
    } catch (error) {
      console.error('Error requesting push from server:', error);
      throw error;
    }
  }
}

export default new PushNotificationHelper();