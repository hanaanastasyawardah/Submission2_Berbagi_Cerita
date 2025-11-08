import { postStory } from '../../data/story-api';

export default class AddStoryPage {
  constructor() {
    this.map = null;
    this.marker = null;
    this.stream = null;
    this.photoFile = null;
  }

  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Tambah Cerita Baru</h1>

        <form id="story-form" class="story-form" aria-label="Form tambah cerita" novalidate>
          <div class="field">
            <label for="name">Judul Cerita <span style="color: #d32f2f;">*</span></label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              required 
              aria-required="true"
              aria-describedby="name-help name-error"
              placeholder="Berikan judul yang menarik untuk cerita Anda"
            />
            <small id="name-help">Minimal 5 karakter</small>
            <span id="name-error" class="field-error" role="alert"></span>
          </div>

          <div class="field">
            <label for="description">Deskripsi Cerita <span style="color: #d32f2f;">*</span></label>
            <textarea 
              id="description" 
              name="description" 
              rows="5" 
              required 
              aria-required="true"
              aria-describedby="description-help description-error"
              placeholder="Ceritakan pengalaman Anda..."
            ></textarea>
            <small id="description-help">Minimal 10 karakter</small>
            <span id="description-error" class="field-error" role="alert"></span>
          </div>

          <div class="field">
            <label>Foto Cerita <span style="color: #d32f2f;">*</span></label>
            <div class="camera-area" id="camera-area">
              <video id="video" autoplay playsinline style="display:none; width:100%; max-height:300px;" aria-label="Video stream kamera"></video>
              <canvas id="canvas" style="display:none; width:100%;" aria-hidden="true"></canvas>
              <img id="preview" alt="" style="display:none; width:100%; border-radius:8px;" />
              <p id="photo-placeholder" style="color: #888;">Pilih foto atau buka kamera untuk mengambil foto</p>
            </div>
            <div class="camera-actions">
              <button id="start-camera" type="button" aria-label="Buka kamera untuk mengambil foto">📷 Buka Kamera</button>
              <button id="take-photo" type="button" disabled aria-label="Ambil foto dari kamera">📸 Ambil Foto</button>
              <button id="use-file" type="button" aria-label="Pilih file foto dari perangkat">📁 Pilih File</button>
              <input id="photo-file" type="file" accept="image/*" style="display:none;" aria-label="Input file foto" />
            </div>
            <span id="photo-error" class="field-error" role="alert"></span>
          </div>

          <fieldset class="field" aria-describedby="map-help">
            <legend>Lokasi Cerita <span style="color: #d32f2f;">*</span></legend>
            <p id="map-help">Klik peta untuk memilih titik lokasi cerita Anda.</p>
            <div id="mini-map" class="mini-map" role="application" aria-label="Peta untuk memilih lokasi"></div>
            <input type="hidden" id="lat" name="lat" aria-label="Latitude" />
            <input type="hidden" id="lon" name="lon" aria-label="Longitude" />
            <p class="coords" aria-live="polite">Koordinat: <span id="coords">belum dipilih</span></p>
            <span id="location-error" class="field-error" role="alert"></span>
          </fieldset>

          <div class="actions">
            <button type="submit" aria-label="Kirim cerita">Kirim Cerita</button>
          </div>

          <div id="msg" aria-live="polite" aria-atomic="true"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    // Check if user is logged in
    const token = localStorage.getItem('story_token');
    if (!token) {
      document.querySelector('.story-form').innerHTML = `
        <div class="error" role="alert" style="text-align: center;">
          <p>Anda harus login terlebih dahulu untuk menambah cerita.</p>
          <p style="margin-top: 1rem;">
            <a href="#/login" style="background: var(--dark-pink); color: white; padding: 0.7rem 1.2rem; border-radius: 10px; text-decoration: none; display: inline-block;">
              Login Sekarang
            </a>
          </p>
        </div>
      `;
      return;
    }

    this._initializeMap();
    this._initializeCamera();
    this._initializeForm();
  }

  _initializeMap() {
    const L = window.L;
    this.map = L.map('mini-map').setView([-2.5489, 118.0149], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById('lat').value = lat;
      document.getElementById('lon').value = lng;
      document.getElementById('coords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      document.getElementById('location-error').textContent = '';

      if (!this.marker) {
        this.marker = L.marker([lat, lng]).addTo(this.map);
      } else {
        this.marker.setLatLng([lat, lng]);
      }
    });
  }

  _initializeCamera() {
    const startBtn = document.getElementById('start-camera');
    const takeBtn = document.getElementById('take-photo');
    const useFileBtn = document.getElementById('use-file');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('preview');
    const photoFileInput = document.getElementById('photo-file');
    const placeholder = document.getElementById('photo-placeholder');

    // KRITERIA 3 ADVANCE: Buka kamera
    startBtn.addEventListener('click', async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Kamera tidak didukung di browser ini.');
        return;
      }

      try {
        this._stopCamera();

        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        
        video.srcObject = this.stream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
        preview.style.display = 'none';
        takeBtn.disabled = false;
        startBtn.textContent = '⏹️ Tutup Kamera';
        
      } catch (err) {
        console.error('Camera error:', err);
        alert('Gagal membuka kamera: ' + err.message);
      }
    });

    takeBtn.addEventListener('click', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.photoFile = file;
        
        const url = URL.createObjectURL(blob);
        preview.src = url;
        preview.alt = 'Preview foto yang diambil dari kamera';
        preview.style.display = 'block';
        video.style.display = 'none';
        placeholder.style.display = 'none';
        
        document.getElementById('photo-error').textContent = '';
        
        // KRITERIA 3 ADVANCE: Tutup stream setelah foto diambil
        this._stopCamera();
        startBtn.textContent = '📷 Buka Kamera';
        takeBtn.disabled = true;
      }, 'image/jpeg', 0.9);
    });

    useFileBtn.addEventListener('click', () => {
      photoFileInput.click();
    });

    photoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // KRITERIA 3 SKILLED: Validasi input
      if (!file.type.startsWith('image/')) {
        document.getElementById('photo-error').textContent = 'File harus berupa gambar';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        document.getElementById('photo-error').textContent = 'Ukuran file maksimal 5MB';
        return;
      }

      this.photoFile = file;
      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.alt = `Preview foto ${file.name}`;
      preview.style.display = 'block';
      video.style.display = 'none';
      placeholder.style.display = 'none';
      
      document.getElementById('photo-error').textContent = '';
      
      this._stopCamera();
      startBtn.textContent = '📷 Buka Kamera';
      takeBtn.disabled = true;
    });
  }

  _stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
  }

  _initializeForm() {
    const form = document.getElementById('story-form');
    const msg = document.getElementById('msg');
    const nameInput = document.getElementById('name');
    const descriptionInput = document.getElementById('description');

    // KRITERIA 3 SKILLED: Validasi real-time untuk JUDUL
    nameInput.addEventListener('input', () => {
      const value = nameInput.value.trim();
      const error = document.getElementById('name-error');
      
      if (value.length > 0 && value.length < 5) {
        error.textContent = `Minimal 5 karakter (saat ini: ${value.length})`;
        nameInput.classList.add('invalid');
      } else {
        error.textContent = '';
        nameInput.classList.remove('invalid');
      }
    });

    // KRITERIA 3 SKILLED: Validasi real-time untuk DESKRIPSI
    descriptionInput.addEventListener('input', () => {
      const value = descriptionInput.value.trim();
      const error = document.getElementById('description-error');
      
      if (value.length > 0 && value.length < 10) {
        error.textContent = `Minimal 10 karakter (saat ini: ${value.length})`;
        descriptionInput.classList.add('invalid');
      } else {
        error.textContent = '';
        descriptionInput.classList.remove('invalid');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // KRITERIA 3 SKILLED: Validasi sebelum submit
      const isValid = this._validateForm();
      if (!isValid) {
        msg.textContent = 'Mohon lengkapi semua field yang diperlukan';
        msg.style.background = '#ffebee';
        msg.style.borderColor = '#d32f2f';
        return;
      }

      msg.textContent = 'Mengirim cerita...';
      msg.style.background = '';
      msg.style.borderColor = '';

      const token = localStorage.getItem('story_token');
      if (!token) {
        msg.textContent = 'Silakan login terlebih dahulu.';
        msg.style.background = '#ffebee';
        msg.style.borderColor = '#d32f2f';
        setTimeout(() => {
          location.hash = '/login';
        }, 2000);
        return;
      }

      const name = form.name.value.trim();
      const description = form.description.value.trim();
      const lat = form.lat.value;
      const lon = form.lon.value;

      // Gabungkan judul dan deskripsi karena API hanya menerima description
      const fullDescription = `${name}\n\n${description}`;

      try {
        await postStory({ 
          token,
          description: fullDescription, 
          lat, 
          lon, 
          photoFile: this.photoFile 
        });
        
        // KRITERIA 3 SKILLED: Pesan sukses yang jelas
        msg.textContent = '✓ Cerita berhasil dikirim! Redirecting...';
        msg.style.background = '#e8f5e9';
        msg.style.borderColor = '#4caf50';
        
        form.reset();
        document.getElementById('preview').style.display = 'none';
        document.getElementById('photo-placeholder').style.display = 'block';
        document.getElementById('coords').textContent = 'belum dipilih';
        
        if (this.marker) {
          this.map.removeLayer(this.marker);
          this.marker = null;
        }
        
        this.photoFile = null;
        this._stopCamera();

        setTimeout(() => {
          location.hash = '/my-stories';
        }, 2000);
        
      } catch (err) {
        // KRITERIA 3 SKILLED: Pesan error yang jelas
        msg.textContent = `✗ Gagal mengirim cerita: ${err.message}`;
        msg.style.background = '#ffebee';
        msg.style.borderColor = '#d32f2f';
      }
    });
  }

  _validateForm() {
    let isValid = true;

    // Validate NAME (JUDUL)
    const name = document.getElementById('name').value.trim();
    const nameError = document.getElementById('name-error');
    if (name.length < 5) {
      nameError.textContent = 'Judul minimal 5 karakter';
      document.getElementById('name').classList.add('invalid');
      isValid = false;
    } else {
      nameError.textContent = '';
      document.getElementById('name').classList.remove('invalid');
    }

    // Validate description
    const description = document.getElementById('description').value.trim();
    const descriptionError = document.getElementById('description-error');
    if (description.length < 10) {
      descriptionError.textContent = 'Deskripsi minimal 10 karakter';
      document.getElementById('description').classList.add('invalid');
      isValid = false;
    } else {
      descriptionError.textContent = '';
      document.getElementById('description').classList.remove('invalid');
    }

    // Validate photo
    const photoError = document.getElementById('photo-error');
    if (!this.photoFile) {
      photoError.textContent = 'Foto harus dipilih';
      isValid = false;
    } else {
      photoError.textContent = '';
    }

    // Validate location
    const lat = document.getElementById('lat').value;
    const lon = document.getElementById('lon').value;
    const locationError = document.getElementById('location-error');
    if (!lat || !lon) {
      locationError.textContent = 'Lokasi harus dipilih di peta';
      isValid = false;
    } else {
      locationError.textContent = '';
    }

    return isValid;
  }
}