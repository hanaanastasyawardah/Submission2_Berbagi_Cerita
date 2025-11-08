export default class AboutPage {
  async render() {
    return `
      <section class="about-page container">
        <h1>Tentang Berbagi Cerita</h1>
        
        <h2>Pembuat</h2>
        <p>
          <strong>Hana Anastasya Wardah</strong><br/>
          ID: F269D5X0727
        </p>
        
        <h2>Cerita di Balik Layar</h2>
        <p>
          Meskipun tema aplikasi ini adalah "berbagi cerita", izinkan saya bercerita secara private di sini.
          Ini adalah submission tersulit yang pernah saya kerjakan. Bahkan, saya tidak tahu apakah ini akan 
          di-ACC atau tidak.
        </p>
        <p>
          Saya mengerjakan submission ini selama 4 hari. Bahkan tidur pun tidak tenang karena masih ada 
          assignment lain di kampus yang harus diselesaikan. Tapi jujur, saya sangat senang dengan 
          pengetahuan baru yang saya dapatkan dalam mengerjakan submission kelas Intermediate ini.
        </p>
        <p>
          Semoga jika ini di-ACC, submission kedua saya bisa mengerjakan dengan lebih baik lagi. Aamiin. >⩊<
        </p>
        
        <h2>Fitur Utama</h2>
        <p>
          Aplikasi ini dilengkapi dengan berbagai fitur menarik:
        </p>
        
        <h3>Registrasi dan Login</h3>
        <p>
          Buat akun baru atau masuk dengan akun yang sudah ada untuk mulai berbagi cerita Anda.
        </p>
        
        <h3>Tambah Cerita</h3>
        <p>
          Bagikan cerita Anda dengan menambahkan judul, deskripsi, foto (dari kamera atau file), 
          dan menandai lokasi di peta interaktif.
        </p>
        
        <h3>Beranda</h3>
        <p>
          Lihat cerita dari pengguna lain dalam daftar yang mudah dinavigasi 
          dan visualisasikan lokasinya pada peta digital dengan berbagai pilihan tampilan peta.
        </p>
        
        <h3>Jelajahi Cerita</h3>
        <p>
          Tampilan grid card yang menampilkan semua cerita dengan foto, 
          judul, pembuat, dan deskripsi singkat.
        </p>
        
        <h3>Interaksi Peta</h3>
        <p>
          Klik cerita di daftar untuk melihat lokasinya di peta, 
          atau klik marker di peta untuk membaca detailnya.
        </p>
        
        <h2>Teknologi</h2>
        <p>
          Aplikasi ini dibangun menggunakan teknologi modern web:
        </p>
        
        <h3>Frontend</h3>
        <p>
          Vanilla JavaScript dengan arsitektur Single Page Application (SPA) menggunakan pola MVP (Model-View-Presenter)
          dan View Transition API untuk pengalaman yang smooth.
        </p>
        
        <h3>Peta</h3>
        <p>
          Leaflet.js untuk menampilkan peta interaktif dengan berbagai tile layer 
          (Peta Jalan, Satelit, Topografi).
        </p>
        
        <h3>Styling</h3>
        <p>
          CSS3 dengan desain responsif untuk tampilan optimal di berbagai perangkat 
          (mobile 375px, tablet 768px, desktop 1024px).
        </p>
        
        <h3>Build Tool</h3>
        <p>
          Webpack untuk bundling dan optimasi kode.
        </p>
        
        <h3>API</h3>
        <p>
          Dicoding Story API untuk backend services.
        </p>
        
        <h2>Aksesibilitas</h2>
        <p>
          Kami berkomitmen untuk membuat aplikasi yang dapat diakses oleh semua orang. 
          Aplikasi ini mendukung navigasi keyboard, screen reader, skip to content, 
          dan telah dioptimasi untuk berbagai ukuran layar.
        </p>
        
        <h2>Kriteria yang Dipenuhi</h2>
        
        <h3>Kriteria 1 - SPA & Transisi (ADVANCE 4 pts)</h3>
        <p>
          Implementasi SPA dengan hash routing, arsitektur MVP (Model-View-Presenter), 
          dan custom View Transition API.
        </p>
        
        <h3>Kriteria 2 - Peta & Data (ADVANCE 4 pts)</h3>
        <p>
          Menampilkan data dengan marker & popup, fitur interaktif (highlight marker, sinkronisasi list-peta), 
          dan multiple tile layers.
        </p>
        
        <h3>Kriteria 3 - Tambah Data (ADVANCE 4 pts)</h3>
        <p>
          Form lengkap dengan validasi, upload file, pemilihan lokasi via peta, 
          dan fitur kamera langsung dengan proper stream management.
        </p>
        
        <h3>Kriteria 4 - Aksesibilitas (ADVANCE 4 pts)</h3>
        <p>
          Alt text, semantic HTML dengan hierarki heading yang benar (h1 → h2 → h3), label input, 
          responsive design (375px, 768px, 1024px), skip to content, dan full keyboard navigation.
        </p>
        
        <p style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid var(--pink); text-align: center;">
          <em>Dibuat dengan ❤️ & perjuangan untuk memenuhi submission Kelas Intermediate<br/>
          "Belajar Pengembangan Web Intermediate"</em>
        </p>
      </section>
    `;
  }

  async afterRender() {
  }
}