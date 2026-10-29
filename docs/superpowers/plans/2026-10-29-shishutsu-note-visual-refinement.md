# ShishutsuNote — rencana penyegaran UI

> **Untuk pelaksana:** kerjakan tugas secara berurutan dan tandai setiap langkah setelah selesai.

**Tujuan:** Membuat seluruh layar ShishutsuNote lebih mudah dipindai dan terasa dirancang khusus untuk mahasiswa di Jepang, dengan palet hijau embun, biru-hijau, dan oranye matang, sambil mempertahankan perilaku yang sudah ada.

**Arsitektur:** Pertahankan komponen React, alur navigasi empat layar, data, serta logika domain. Perbarui token dan CSS bersama terlebih dahulu, lalu sesuaikan komposisi beranda dan gaya halaman bersama agar semua layar mengikuti hierarki visual yang sama.

**Teknologi:** React 19, TypeScript, Vite, CSS yang sudah ada; tanpa dependensi baru.

**Rancangan:** `docs/superpowers/specs/2026-10-29-shishutsu-note-visual-refinement.md`

## Batasan global

- Antarmuka tetap berbahasa Jepang dan menggunakan yen tanpa angka pecahan.
- Gunakan latar hijau embun `#EFF5F2`, tinta biru-hijau `#17364A`, panel anggaran mint `#DCEFE9`, dan aksen oranye matang `#B64D23`.
- Jangan ubah fitur, rumus anggaran, struktur data, localStorage, atau dependensi.
- Pertahankan font sistem Jepang; jangan menambah font jaringan.
- Hindari kartu seragam, dekorasi tidak bermakna, dan animasi yang tidak membantu.
- Pertahankan navigasi samping pada layar lebar dan navigasi bawah pada layar kecil.
- Pertahankan fokus keyboard yang terlihat, reduced-motion, dan kontrol yang mudah disentuh.
- Jangan menambahkan atau menjalankan automated test; validasi dengan lint, typecheck, build, dan pemeriksaan visual.

## Fokus peninjauan

- Layar sempit dapat membuat nominal yen atau kontrol riwayat saling bertumpuk; periksa pada 375 px dan 768 px.
- Kartu yang dikurangi tidak boleh mengaburkan kelompok informasi atau affordance tombol.
- Warna aksen untuk status anggaran harus tetap terbaca dan memiliki label teks.
- Daftar kosong, hasil pencarian kosong, peringatan anggaran, dan kegagalan penyimpanan tetap jelas setelah gaya diperbarui.
- Navigasi dan formulir tetap dapat dipakai dengan keyboard serta pembaca layar.

---

### Tugas 1: Rapikan token visual dan kerangka aplikasi

**Berkas:**
- Ubah: `src/styles/tokens.css`
- Ubah: `src/styles.css` (gaya global, header, sidebar, navigasi mobile, tombol, dan aturan responsif)
- Acuan: `docs/superpowers/specs/2026-10-29-shishutsu-note-visual-refinement.md`

**Antarmuka:**
- Pertahankan nama token warna yang dipakai komponen, perbarui nilainya hanya jika dibutuhkan untuk hierarki/kontras yang lebih baik.
- Pertahankan kelas `.sidebar`, `.mobile-nav`, `.main-frame`, `.topbar`, `.button`, dan `.page-content` sebagai dasar semua halaman.

- [x] **Langkah 1:** Perbarui token latar, permukaan, teks, batas, aksen, radius, dan bayangan agar memakai palet hijau embun, biru-hijau, dan oranye matang dengan tingkat penekanan yang berbeda.
- [x] **Langkah 2:** Atur ulang header, area konten, navigasi desktop/mobile, dan tombol melalui selector yang sudah ada; jangan menambah dekorasi umum atau shadow ke semua panel.
- [x] **Langkah 3:** Pastikan fokus terlihat, target interaktif tetap nyaman, reduced-motion aktif, dan aturan layout mempertahankan breakpoint 375, 768, 1024, dan 1440 px tanpa fixed-width content.
- [x] **Langkah 4:** Jalankan `npm run lint`, `npm run typecheck`, dan `npm run build`; semuanya berhasil.

### Tugas 2: Tonjolkan ringkasan beranda dan alur pencatatan

**Berkas:**
- Ubah: `src/pages/HomePage.tsx`
- Ubah: `src/styles.css` (gaya `.budget-panel`, `.summary-strip`, `.home-lower-grid`, `.recent-section`, `.category-section`, `.expense-row`, dan state kosong)
- Gunakan kembali: `src/components/ExpenseRow.tsx`, `src/components/EmptyState.tsx`

**Antarmuka:**
- Pertahankan props dan callback `HomePage`; tidak ada perubahan pada rumus atau format data.
- Pertahankan class hook publik internal yang dipakai komponen di halaman lain, khususnya `.expense-row` dan `.empty-state`.

- [x] **Langkah 1:** Jadikan sisa anggaran dan pemakaian bulanan fokus utama dengan label jelas, nominal menonjol, dan progress yang mudah dipahami.
- [x] **Langkah 2:** Kurangi rasa kumpulan kartu pada ringkasan hari ini/bulan ini dan bagian pengeluaran terbaru; gunakan alignment, jarak, serta pemisah untuk mengelompokkan informasi.
- [x] **Langkah 3:** Pertahankan aksi “Tambah pengeluaran” sebagai tindakan paling jelas dan pastikan state tanpa anggaran maupun tanpa catatan tetap memberi langkah berikutnya.
- [x] **Langkah 4:** Jalankan lint, typecheck, dan build; semuanya berhasil.

### Tugas 3: Samakan hierarki riwayat, analisis, pengaturan, dan dialog

**Berkas:**
- Ubah: `src/styles.css` (gaya halaman riwayat, analisis, pengaturan, filter, input, dialog, banner, dan toast)
- Ubah markup halaman hanya bila diperlukan: `src/pages/HistoryPage.tsx`, `src/pages/AnalysisPage.tsx`, `src/pages/SettingsPage.tsx`
- Acuan komponen: `src/components/ExpenseRow.tsx`, `src/components/ExpenseForm.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/EmptyState.tsx`

**Antarmuka:**
- Jangan mengubah nama props atau perilaku callback halaman maupun dialog.
- Nama kategori, label Jepang, nominal yen, konfirmasi hapus, dan pesan status tetap sama kecuali copy yang sudah disetujui rancangan memerlukan kejelasan.

- [x] **Langkah 1:** Rapikan baris riwayat agar tanggal, kategori, memo, nominal, dan aksi terbaca sebagai satu unit tanpa panel kecil berulang.
- [x] **Langkah 2:** Buat analisis kategori lebih mudah dipindai dengan label, nominal, persentase, dan track yang tidak mengandalkan warna saja.
- [x] **Langkah 3:** Kelompokkan input anggaran, validasi, status simpan, dan catatan privasi dengan urutan yang jelas; samakan treatment input dengan form pengeluaran.
- [x] **Langkah 4:** Periksa banner, toast, empty state, fokus keyboard, dan kontras setelah perubahan styling.
- [x] **Langkah 5:** Jalankan lint, typecheck, dan build; semuanya berhasil.

### Tugas 4: Pemeriksaan akhir melalui preview

**Berkas:**
- Tidak ada perubahan fitur yang direncanakan; perbaikan visual kecil boleh dilakukan pada berkas Tugas 1–3.

- [x] **Langkah 1:** Periksa beranda, riwayat, analisis, dan pengaturan pada preview ponsel dan desktop.
- [x] **Langkah 2:** Periksa tampilan kondisi kosong di semua layar; tidak ada data pribadi atau contoh transaksi yang disimpan.
- [x] **Langkah 3:** Ulangi `npm run lint`, `npm run typecheck`, dan `npm run build` setelah perbaikan visual akhir; semuanya berhasil.
- [x] **Langkah 4:** Catat perubahan, hasil verifikasi, serta batas pemeriksaan data yang terlihat.

## Pemeriksaan diri terhadap rancangan

- Semua arahan warna, pengurangan kartu berulang, prioritas dashboard, kejelasan halaman, responsivitas, aksesibilitas, dan batas tanpa perubahan fitur tercakup dalam Tugas 1–4.
- Rencana memakai pola kelas dan komponen yang memang ada di proyek; tidak memecah ulang komponen atau menambah dependensi.
- Tidak ada automated test baru atau yang dijalankan. Pemeriksaan yang direncanakan adalah lint, typecheck, build, serta inspeksi visual.
- **Ruling:** Inspeksi memakai keadaan kosong dan tidak menambahkan transaksi contoh ke localStorage — catatan contoh akan tersimpan di browser, sementara alur hapus aplikasi menyatakan penghapusan tidak bisa dibatalkan — konsekuensi jika keliru: jarak baris pada daftar berisi mungkin memerlukan penyesuaian saat data demo tersedia.
- **Final review:** inspeksi mandiri seluruh perubahan terhadap rancangan; empat layar dilihat pada preview ponsel dan desktop.
- **Iterasi visual:** setelah Drew menyampaikan warna sebelumnya terlalu mirip, desain diperjelas dengan sidebar terang, canvas hijau embun, dan panel anggaran mint. Palette baru lolos lint, typecheck, build, serta inspeksi visual di desktop dan ponsel dengan catatan transaksi yang sudah ada di browser.
