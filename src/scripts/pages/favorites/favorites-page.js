import indexedDBHelper from '../../utils/indexeddb';
import { showFormattedDate } from '../../utils/index';

export default class FavoritesPage {
  constructor() {
    this.favorites = [];
    this.currentSort = 'createdAt';
    this.currentOrder = 'desc';
  }

  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Cerita Favorit Saya</h1>
        <p style="text-align: center; color: #888; margin-bottom: 1rem;">
          Cerita yang disimpan di perangkat Anda (offline storage)
        </p>

        <div class="favorites-toolbar">
          <div class="search-box">
            <input 
              type="search" 
              id="search-input" 
              placeholder="🔍 Cari cerita favorit..." 
              aria-label="Cari cerita favorit"
            />
          </div>
          
          <div class="sort-controls">
            <label for="sort-by">Urutkan:</label>
            <select id="sort-by" aria-label="Urutkan berdasarkan">
              <option value="createdAt">Tanggal</option>
              <option value="name">Judul</option>
            </select>
            
            <button id="sort-order" type="button" aria-label="Ubah urutan" title="Ubah urutan">
              ⬇️ Terbaru
            </button>
          </div>
        </div>
        
        <div class="my-stories-container">
          <div id="favorites-grid" class="stories-grid" role="list" aria-live="polite">
            <div class="loading">Memuat favorit...</div>
          </div>
          
          <div id="empty-state" class="empty-state" style="display: none;">
            <p style="text-align: center; color: #888; padding: 3rem 1rem;">
              📚 Belum ada cerita favorit.<br/>
              Kunjungi <a href="#/" style="color: var(--dark-pink); font-weight: 600;">Beranda</a> 
              atau <a href="#/my-stories" style="color: var(--dark-pink); font-weight: 600;">Jelajahi Cerita</a> 
              untuk menambahkan favorit.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this._loadFavorites();
    this._initializeSearch();
    this._initializeSort();
  }

  async _loadFavorites() {
    const gridEl = document.getElementById('favorites-grid');
    const emptyState = document.getElementById('empty-state');
    
    try {
      this.favorites = await indexedDBHelper.getAllFavorites();
      
      if (!this.favorites.length) {
        gridEl.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      gridEl.style.display = 'grid';
      emptyState.style.display = 'none';
      
      await this._renderFavorites(this.favorites);
      
    } catch (err) {
      console.error('Error loading favorites:', err);
      gridEl.innerHTML = `
        <div class="error" role="alert">
          <p>Gagal memuat favorit: ${err.message}</p>
        </div>
      `;
    }
  }

  async _renderFavorites(favorites) {
    const gridEl = document.getElementById('favorites-grid');
    gridEl.innerHTML = '';

    if (!favorites.length) {
      document.getElementById('empty-state').style.display = 'block';
      gridEl.style.display = 'none';
      return;
    }

    favorites.forEach((story) => {
      const card = this._createFavoriteCard(story);
      gridEl.appendChild(card);
    });
  }

  _createFavoriteCard(story) {
    const card = document.createElement('div');
    card.className = 'story-card favorite-card';
    card.setAttribute('role', 'article');
    card.dataset.storyId = story.id;

    const photoUrl = story.photoUrl || '';
    const description = story.description || '';
    const created = story.createdAt || new Date().toISOString();
    const owner = story.owner || story.name || 'Anonim';
    const lat = story.lat;
    const lon = story.lon;

    // Parse judul dan deskripsi
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
        <div class="favorite-badge">⭐ Favorit</div>
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
        <div class="card-actions">
          <button class="btn-remove-favorite" data-id="${story.id}" aria-label="Hapus dari favorit">
            🗑️ Hapus
          </button>
        </div>
      </div>
    `;

    // Add remove button event
    const removeBtn = card.querySelector('.btn-remove-favorite');
    removeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this._removeFavorite(story.id);
    });

    return card;
  }

  async _removeFavorite(id) {
    if (!confirm('Hapus cerita ini dari favorit?')) {
      return;
    }

    try {
      await indexedDBHelper.deleteFavorite(id);
      
      // Remove from current array
      this.favorites = this.favorites.filter(f => f.id !== id);
      
      // Re-render
      await this._renderFavorites(this.favorites);
      
      // Show toast notification
      this._showToast('Cerita dihapus dari favorit');
      
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Gagal menghapus favorit: ' + err.message);
    }
  }

  _initializeSearch() {
    const searchInput = document.getElementById('search-input');
    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(async () => {
        const query = e.target.value.trim();
        
        if (query) {
          const results = await indexedDBHelper.searchFavorites(query);
          await this._renderFavorites(results);
        } else {
          await this._loadFavorites();
        }
      }, 300);
    });
  }

  _initializeSort() {
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderBtn = document.getElementById('sort-order');

    sortBySelect.addEventListener('change', async (e) => {
      this.currentSort = e.target.value;
      await this._applySorting();
    });

    sortOrderBtn.addEventListener('click', async () => {
      this.currentOrder = this.currentOrder === 'desc' ? 'asc' : 'desc';
      
      // Update button text
      if (this.currentSort === 'createdAt') {
        sortOrderBtn.textContent = this.currentOrder === 'desc' ? '⬇️ Terbaru' : '⬆️ Terlama';
      } else {
        sortOrderBtn.textContent = this.currentOrder === 'desc' ? '⬇️ Z-A' : '⬆️ A-Z';
      }
      
      await this._applySorting();
    });
  }

  async _applySorting() {
    try {
      const sorted = await indexedDBHelper.sortFavorites(this.currentSort, this.currentOrder);
      this.favorites = sorted;
      await this._renderFavorites(sorted);
    } catch (err) {
      console.error('Error sorting:', err);
    }
  }

  _showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--dark-pink);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}