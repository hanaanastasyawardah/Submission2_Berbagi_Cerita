import { getStories } from '../../data/story-api';
import { showFormattedDate } from '../../utils/index';

export default class MyStoriesPage {
  constructor() {
    this.currentPage = 1;
    this.size = 12;
  }

  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Jelajahi Cerita</h1>
        <p style="text-align: center; color: #888; margin-bottom: 2rem;">
          Lihat cerita-cerita menarik dari pengguna lain
        </p>
        
        <div class="my-stories-container">
          <div id="stories-grid" class="stories-grid" role="list" aria-live="polite">
            <div class="loading">Memuat cerita...</div>
          </div>
          
          <div class="pagination">
            <button id="prev-page" type="button" aria-label="Halaman sebelumnya">Sebelumnya</button>
            <span id="page-info" aria-live="polite">Halaman 1</span>
            <button id="next-page" type="button" aria-label="Halaman selanjutnya">Selanjutnya</button>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this._loadStories(this.currentPage);
    this._initializePagination();
  }

  async _loadStories(page) {
    const gridEl = document.getElementById('stories-grid');
    
    try {
      gridEl.innerHTML = '<div class="loading">Memuat cerita...</div>';
      
      // Ambil token dari localStorage
      const token = localStorage.getItem('story_token');
      if (!token) {
        gridEl.innerHTML = `
          <div class="error" role="alert">
            <p>Anda belum login. Silakan login terlebih dahulu.</p>
            <p style="margin-top: 1rem;">
              <button onclick="location.href='#/login'" style="background: var(--dark-pink); color: white; padding: 0.5rem 1rem; border: none; border-radius: 8px; cursor: pointer;">
                Login
              </button>
            </p>
          </div>
        `;
        return;
      }

      // GET /stories dengan token autentikasi
      const res = await getStories({ page, size: this.size, withLocation: 0, token });
      const stories = res.listStory || [];
      
      if (!stories.length) {
        gridEl.innerHTML = ` 
          <div class="empty-state">
            <p style="text-align: center; color: #888; padding: 2rem;">
              Tidak ada cerita untuk ditampilkan.
            </p>
          </div>
        `;
        return;
      }

      gridEl.innerHTML = '';

      stories.forEach((story) => {
        const card = this._createStoryCard(story);
        gridEl.appendChild(card);
      });

      document.getElementById('page-info').textContent = `Halaman ${page}`;
      
    } catch (err) {
      console.error('Error loading stories:', err);
      gridEl.innerHTML = ` 
        <div class="error" role="alert">
          <p>Gagal memuat cerita: ${err.message}</p>
          <p style="margin-top: 1rem;">
            <button onclick="location.reload()" style="background: var(--dark-pink); color: white; padding: 0.5rem 1rem; border: none; border-radius: 8px; cursor: pointer;">
              Muat Ulang
            </button>
          </p>
        </div>
      `;
    }
  }

  _createStoryCard(story) {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.setAttribute('role', 'article');

    const photoUrl = story.photoUrl || '';
    const description = story.description || '';
    const created = story.createdAt || new Date().toISOString();
    const owner = story.owner || story.name || 'Anonim';
    const lat = story.lat;
    const lon = story.lon;

    // Parse judul dan deskripsi (judul adalah baris pertama sebelum \n\n)
    let title = 'Tanpa Judul';
    let content = description;
    
    if (description.includes('\n\n')) {
      const parts = description.split('\n\n');
      title = parts[0];
      content = parts.slice(1).join('\n\n');
    } else if (description) {
      title = description.slice(0, 50) + (description.length > 50 ? '...' : '');
      content = description;
    }

    const excerpt = content.length > 150 
      ? content.slice(0, 150) + '...' 
      : content;

    card.innerHTML = `
      ${photoUrl ? `<img src="${this._escapeHtml(photoUrl)}" alt="Foto cerita ${this._escapeHtml(title)}" class="story-card-image" />` : '<div class="story-card-no-image">📷 Tanpa Foto</div>'}
      
      <div class="story-card-content">
        <h3>${this._escapeHtml(title)}</h3>
        <p class="story-meta">
          <span>👤 ${this._escapeHtml(owner)}</span>
          <span>📅 ${showFormattedDate(created, 'id-ID')}</span>
        </p>
        ${excerpt ? `<p class="story-description">${this._escapeHtml(excerpt)}</p>` : ''}
        ${lat && lon ? `
          <div class="story-location">
            <small>📍 ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}</small>
          </div>
        ` : ''}
      </div>
    `;

    return card;
  }

  _initializePagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (!prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', async () => {
      if (this.currentPage <= 1) return;
      this.currentPage -= 1;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      await this._loadStories(this.currentPage);
      prevBtn.disabled = false;
      nextBtn.disabled = false;
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', async () => {
      this.currentPage += 1;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      await this._loadStories(this.currentPage);
      prevBtn.disabled = false;
      nextBtn.disabled = false;
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
