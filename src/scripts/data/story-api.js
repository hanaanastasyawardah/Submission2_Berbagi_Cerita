import CONFIG from './config'; // Mengimpor konfigurasi untuk BASE_URL

// GET /stories - PUBLIC, TIDAK PERLU TOKEN
export async function getStories({ page = 1, size = 20, withLocation = 0 } = {}) {
  console.log('Fetching stories with config BASE_URL:', CONFIG.BASE_URL);
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (withLocation) {
    params.append('location', '1');
  }

  // Menggunakan BASE_URL dari config.js
  const url = `${CONFIG.BASE_URL}/stories?${params.toString()}`;

  // Ambil token dari localStorage
  const token = localStorage.getItem('story_token');
  
  const headers = {};

  // Jika token ada, tambahkan header Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Mengirimkan request dengan atau tanpa Authorization header
  console.log(headers,token);
  const res = await fetch(url, { headers });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mengambil cerita');
  }

  return data;
}

export async function getStoryById(id) {
  const token = localStorage.getItem('story_token');
  
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Menggunakan BASE_URL dari config.js
  const url = `${CONFIG.BASE_URL}/stories/${id}`;

  const res = await fetch(url, { headers });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mengambil detail cerita');
  }

  return data;
}

export async function postStory({ description, lat, lon, photoFile }) {
  const formData = new FormData();

  if (photoFile) {
    formData.append('photo', photoFile);
  }

  if (description) {
    formData.append('description', description);
  }

  if (lat) {
    formData.append('lat', lat);
  }

  if (lon) {
    formData.append('lon', lon);
  }

  // Ambil token dari localStorage
  const token = localStorage.getItem('story_token');

  // Menggunakan BASE_URL dari config.js
  const url = `${CONFIG.BASE_URL}/stories`;

  // POST /stories PERLU TOKEN!
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mengirim cerita');
  }

  return data;
}
