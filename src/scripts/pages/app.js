import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._updateNavigation(); // Update navigasi saat pertama kali load
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', isOpen);
    });

    // Close drawer when clicking outside
    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && 
          !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }
    });

    // Close drawer when clicking nav links
    this.#navigationDrawer.addEventListener('click', (event) => {
      if (event.target.tagName === 'A') {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }
    });

    // KRITERIA 4 ADVANCE: Keyboard navigation
    this.#navigationDrawer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
        this.#drawerButton.focus();
      }
    });
  }

  _updateNavigation() {
    const navList = document.getElementById('nav-list');
    if (!navList) return;

    const token = localStorage.getItem('story_token');
    const isLoggedIn = !!token;

    if (isLoggedIn) {
      // User sudah login - tampilkan menu Logout
      navList.innerHTML = `
        <li role="none"><a href="#/" role="menuitem">Beranda</a></li>
        <li role="none"><a href="#/my-stories" role="menuitem">Jelajahi Cerita</a></li>
        <li role="none"><a href="#/add-story" role="menuitem">Tambah Cerita</a></li>
        <li role="none"><a href="#/about" role="menuitem">Tentang</a></li>
        <li role="none"><a href="#" id="logout-btn" role="menuitem">Logout</a></li>
      `;

      // Setup logout button
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('Apakah Anda yakin ingin logout?')) {
            localStorage.removeItem('story_token'); // Remove token saat logout
            this._updateNavigation();
            location.hash = '/';
          }
        });
      }
    } else {
      // User belum login - tampilkan menu Login & Daftar
      navList.innerHTML = `
        <li role="none"><a href="#/" role="menuitem">Beranda</a></li>
        <li role="none"><a href="#/my-stories" role="menuitem">Jelajahi Cerita</a></li>
        <li role="none"><a href="#/add-story" role="menuitem">Tambah Cerita</a></li>
        <li role="none"><a href="#/login" role="menuitem">Login</a></li>
        <li role="none"><a href="#/register" role="menuitem">Daftar</a></li>
        <li role="none"><a href="#/about" role="menuitem">Tentang</a></li>
      `;
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const Page = routes[url];

    if (!Page) {
      this.#content.innerHTML = '<div class="container"><h1>404 - Halaman tidak ditemukan</h1></div>';
      return;
    }

    // KRITERIA 1 ADVANCE: Custom View Transition
    if (document.startViewTransition) {
      await document.startViewTransition(async () => {
        const page = new Page();
        this.#content.innerHTML = await page.render();
        if (page.afterRender) {
          await page.afterRender();
        }
      }).finished;
    } else {
      // Fallback for browsers without View Transition API
      const page = new Page();
      this.#content.innerHTML = await page.render();
      if (page.afterRender) {
        await page.afterRender();
      }
    }

    // Update navigasi setelah render page (untuk handle login/register success)
    this._updateNavigation();

    // Scroll to top after page change
    window.scrollTo(0, 0);
  }
}

export default App;
