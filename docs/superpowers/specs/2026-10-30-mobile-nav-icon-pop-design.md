# Animasi Ikon Navigasi Bawah

- Tanggal: 2026-10-30
- Status: disetujui Drew dan diimplementasikan
- Cakupan: memberi feedback gerak singkat pada ikon navigasi mobile saat berpindah layar

## Tujuan

Membuat navigasi bawah terasa lebih responsif dan menarik tanpa mengganggu fokus utama aplikasi expense tracker.

## Pendekatan

1. **Pop CSS singkat pada ikon yang baru aktif (dipilih):** ikon sedikit naik dan membesar, lalu kembali normal. Ringan, tidak memerlukan dependency, dan sesuai permintaan.
2. Pop disertai gerakan label: lebih terlihat, tetapi membuat navigasi lebih ramai.
3. Animasi spring dengan library: gerak lebih kaya, tetapi menambah dependency untuk satu microinteraction.

## Perilaku yang dipilih

- Saat tab berbeda dipilih, hanya ikon pada tab aktif yang menjalankan animasi pop sekitar 200 ms.
- Tombol navigasi tetap dapat digunakan selama animasi.
- Preferensi sistem `prefers-reduced-motion` menonaktifkan animasi.
- Tidak mengubah navigasi desktop/sidebar, data, atau perilaku perpindahan halaman.

## Batasan

Gunakan CSS pada ikon SVG `nav-icon` di dalam `.mobile-nav-item`; jangan menambahkan library animasi atau mengubah struktur navigasi.
