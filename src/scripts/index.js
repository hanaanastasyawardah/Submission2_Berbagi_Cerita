import '../styles/styles.css';
import '../styles/map-style.css';
import App from './pages/app';

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
});