import { getStories } from '../../data/story-api';
import { showFormattedDate } from '../../utils/index';

export default class HomePage {
  constructor() {
    this.map = null;
    this.markers = [];
    this.currentPage = 1;
    this.size = 20;
  }

  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Berbagi Cerita</h1>
        <div class="layout">
          <div class="list-panel">
            <h2>Daftar Cerita</h2>
            <ul id="stories-list" class="stories-list" role="list" aria-live="polite" aria-label="Daftar cerita">
              <li class="loading">Memuat cerita</li>
            </ul>
            <div class="pagination">
              <button id="prev-page" type="button" aria-label="Halaman sebelumnya">Sebelumnya</button>
              <span id="page-info" aria-live="polite">Halaman 1</span>
              <button id="next-page" type="button" aria-label="Halaman selanjutnya">Selanjutnya</button>
            </div>
          </div>

          <div class="map-panel">
            <h2>Peta Lokasi Cerita</h2>
            <div id="map" class="map" role="application" aria-label="Peta lokasi cerita"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this._initializeMap();
    await this._loadStories(this.currentPage);
    this._initializePagination();
  }

  async _initializeMap() {
    const L = window.L;
    
    this.map = L.map('map').setView([-2.5489, 118.0149], 5);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 19,
    });

    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap',
      maxZoom: 17,
    });

    streetLayer.addTo(this.map);

    const baseMaps = {
      'Peta Jalan': streetLayer,
      'Satelit': satelliteLayer,
      'Topografi': topoLayer,
    };

    L.control.layers(baseMaps, null, {
      position: 'topright',
    }).addTo(this.map);
  }

  async _loadStories(page) {
    const listEl = document.getElementById('stories-list');
    
    try {
      listEl.innerHTML = '<li class="loading">Memuat cerita</li>';
      
      // Cek token di localStorage untuk autentikasi
      const token = localStorage.getItem('story_token');
      if (!token) {
        listEl.innerHTML = `
          <li class="error" role="alert">
            <p>Anda belum login. Silakan login terlebih dahulu.</p>
            <p><a href="#/login" style="color: var(--dark-pink);">Login di sini</a></p>
          </li>
        `;
        return;
      }

      // Ambil cerita dengan token autentikasi
      const res = await getStories({ page, size: this.size, withLocation: 1, token });
      const stories = res.listStory || [];

      this.markers.forEach(m => this.map.removeLayer(m.marker));
      this.markers = [];

      if (!stories.length) {
        listEl.innerHTML = '<li>Tidak ada cerita untuk ditampilkan</li>';
        return;
      }

      listEl.innerHTML = '';

      stories.forEach((story, index) => {
        const li = this._createStoryListItem(story, index);
        listEl.appendChild(li);

        const lat = story.lat;
        const lon = story.lon;
        
        if (lat && lon) {
          this._createMarker(story, li, index);
        }
      });

      if (this.markers.length) {
        const group = L.featureGroup(this.markers.map(m => m.marker));
        this.map.fitBounds(group.getBounds().pad(0.1));
      }

      document.getElementById('page-info').textContent = `Halaman ${page}`;
    } catch (err) {
      console.error('Error loading stories:', err);
      listEl.innerHTML = `<li class="error" role="alert">Gagal memuat cerita: ${err.message}</li>`;
    }
  }

  _createStoryListItem(story, index) {
    const li = document.createElement('li');
    li.className = 'story-item';
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `Cerita ${story.name} oleh ${story.owner || 'Anonim'}`);
    li.dataset.storyIndex = index;

    const created = story.createdAt || new Date().toISOString();
    const description = story.description || '';
    
    let title = story.name || 'Tanpa Judul';
    let content = description;
    
    if (description.includes('\n\n')) {
      const parts = description.split('\n\n');
      title = parts[0];
      content = parts.slice(1).join('\n\n');
    }
    
    const excerpt = content.length > 140 ? content.slice(0, 140) + '…' : content;

    li.innerHTML = `
      <h3>${this._escapeHtml(title)}</h3>
      <p class="meta">oleh ${this._escapeHtml(story.owner || 'Anonim')} · ${showFormattedDate(created, 'id-ID')}</p>
      <p class="excerpt">${this._escapeHtml(excerpt)}</p>
    `;

    li.addEventListener('click', () => this._highlightStory(index));
    li.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._highlightStory(index);
      }
    });

    return li;
  }

  _createMarker(story, listItem, index) {
    const L = window.L;
    const lat = parseFloat(story.lat);
    const lon = parseFloat(story.lon);

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: #e89cae; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${index + 1}</div>`,
      iconSize: [30, 30],
    });

    const marker = L.marker([lat, lon], { icon }).addTo(this.map);

    const photoUrl = story.photoUrl || '';
    const description = (story.description || '').slice(0, 120);
    
    const popupContent = `
      <div style="min-width: 200px;">
        ${photoUrl ? `<img src="${this._escapeHtml(photoUrl)}" alt="Foto cerita ${this._escapeHtml(story.name)}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
        <strong style="color: #e89cae;">${this._escapeHtml(story.name || 'Tanpa Judul')}</strong><br/>
        <small>oleh ${this._escapeHtml(story.owner || 'Anonim')}</small><br/>
        <p style="margin: 8px 0 0 0; font-size: 0.9em;">${this._escapeHtml(description)}</p>
      </div>
    `;

    marker.bindPopup(popupContent);

    marker.on('click', () => {
      this._highlightStory(index);
      listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    this.markers.push({ marker, listItem, index });
  }

  _highlightStory(index) {
    document.querySelectorAll('.story-item').forEach(item => {
      item.classList.remove('active');
    });

    const selectedItem = document.querySelector(`[data-story-index="${index}"]`);
    if (selectedItem) {
      selectedItem.classList.add('active');
      selectedItem.focus();
    }

    const markerData = this.markers.find(m => m.index === index);
    if (markerData) {
      markerData.marker.openPopup();
      
      this.map.setView(markerData.marker.getLatLng(), 12, {
        animate: true,
        duration: 0.5,
      });
    }
  }

  _initializePagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    prevBtn.addEventListener('click', async () => {
      if (this.currentPage <= 1) return;
      this.currentPage -= 1;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      await this._loadStories(this.currentPage);
      prevBtn.disabled = false;
      nextBtn.disabled = false;
    });

    nextBtn.addEventListener('click', async () => {
      this.currentPage += 1;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      await this._loadStories(this.currentPage);
      prevBtn.disabled = false;
      nextBtn.disabled = false;
    });
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
