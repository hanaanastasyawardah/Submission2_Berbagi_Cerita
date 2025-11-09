import '../styles/styles.css';
import '../styles/map-style.css';
import App from './pages/app';
import PushNotificationHelper from './utils/push-notification';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  // Initial render
  await app.renderPage();

  // Handle hash change for SPA navigation
  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // KRITERIA 4 ADVANCE: Keyboard navigation untuk skip link
  document.querySelector('.skip-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
      mainContent.tabIndex = -1;
      mainContent.focus();
      mainContent.removeAttribute('tabindex');
    }
  });
  try {
    const notificationToggle = document.getElementById('notification-toggle');
    const notificationStatus = document.getElementById('notification-status');

    await PushNotificationHelper.init(); 
    const isSubscribed = await PushNotificationHelper.isSubscribed();

    const updateUI = (subscribed) => {
      if (subscribed) {
        notificationStatus.textContent = 'Aktif';
        notificationToggle.setAttribute('aria-pressed', 'true');
      } else {
        notificationStatus.textContent = 'Nonaktif';
        notificationToggle.setAttribute('aria-pressed', 'false');
      }
    };
    
    updateUI(isSubscribed);

    notificationToggle.addEventListener('click', async () => {
      const subscribed = await PushNotificationHelper.isSubscribed();
      try {
        if (subscribed) {
          await PushNotificationHelper.unsubscribe();
        } else {
          await PushNotificationHelper.subscribe();
        }
      } catch (error) {
        console.error('Gagal toggle notifikasi:', error.message);
      }
      updateUI(!subscribed);
    });

  } catch (error) {
    console.error('Gagal menginisialisasi notifikasi:', error);
    const notificationStatus = document.getElementById('notification-status');
    if(notificationStatus) {
      notificationStatus.textContent = 'Gagal';
    }
  }
});