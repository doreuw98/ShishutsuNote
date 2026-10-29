# Dukungan bahasa dan mata uang — ShishutsuNote

- Tanggal: 2026-10-29
- Status: menunggu persetujuan Drew
- Cakupan: pilihan bahasa dan mata uang aplikasi pada web responsif

## Tujuan

Memperluas ShishutsuNote dari aplikasi berbahasa Jepang/JPY menjadi aplikasi dengan bahasa Jepang, Inggris, dan Indonesia, serta mata uang JPY, USD, dan IDR. Pengaturan harus mudah dicoba saat presentasi dan tidak merusak catatan yang sudah tersimpan.

## Pendekatan yang dipertimbangkan

1. **Preset bahasa dan mata uang berpasangan:** Jepang/JPY, Inggris/USD, Indonesia/IDR; sederhana, tetapi pengguna yang memakai bahasa Inggris di Jepang tidak bisa mempertahankan JPY.
2. **Bahasa dan mata uang terpisah (dipilih Drew):** dua pengaturan independen. Pilihan awal tetap Jepang dan JPY; mengubah bahasa tidak otomatis mengubah mata uang. Ini sesuai dengan mahasiswa yang tinggal di Jepang dan mungkin ingin antarmuka Inggris atau Indonesia.

## Perilaku yang diusulkan

- Bahasa antarmuka: `ja`, `en`, `id`; default `ja`.
- Mata uang aplikasi: `JPY`, `USD`, `IDR`; default `JPY`.
- Pilihan bahasa dan mata uang disimpan bersama pengaturan aplikasi dan langsung berlaku pada semua halaman.
- Format nominal, kategori, navigasi, pesan validasi, status, tanggal, dan label aksesibilitas mengikuti bahasa serta mata uang pilihan.
- Aplikasi tidak mengambil kurs dan tidak mengonversi angka. Mengganti mata uang hanya mengubah format/label mata uang untuk nominal dan budget yang ada. Jika sudah ada catatan atau budget, minta konfirmasi dan jelaskan bahwa nilai tidak dikonversi.
- Data lama tanpa pengaturan bahasa/mata uang dibaca sebagai `ja`/`JPY`. Pengeluaran, budget, kategori ID, zona waktu Asia/Tokyo, dan status peringatan lama dipertahankan.

## Cakupan implementasi

- Tambah pilihan bahasa dan mata uang di halaman Pengaturan dengan nama yang mudah dipahami.
- Pusatkan teks antarmuka dalam kamus terjemahan per bahasa; gunakan ID kategori stabil untuk mengambil nama kategori yang sesuai.
- Format uang menggunakan `Intl.NumberFormat` sesuai locale dan kode mata uang, tanpa pecahan karena nominal aplikasi tetap bilangan bulat.
- Format label tanggal/bulan berdasarkan bahasa pilihan, tetapi tetap menghitung hari dan bulan memakai zona waktu Asia/Tokyo.
- Terjemahkan semua layar, navigasi, formulir catatan, dialog, empty state, notifikasi penyimpanan, peringatan anggaran, dan label aksesibilitas.
- Pertahankan React + TypeScript + Vite, localStorage, dan fitur yang sudah ada; tidak menambah layanan kurs, akun, server, atau dependensi.

## Batasan dan risiko

- Mata uang aplikasi adalah unit tampilan bersama untuk semua catatan dan budget; bukan mata uang berbeda per transaksi.
- Tanpa kurs, `¥700` yang diganti ke USD akan menjadi `$700`, bukan nilai setara hasil konversi. Dialog konfirmasi harus menyatakan hal ini dengan jelas.
- Jangan menghapus atau menulis ulang pengeluaran saat memigrasikan pengaturan lama.
- Pilihan disimpan lokal per browser dan tidak tersinkron antar perangkat.

## Pemeriksaan penerimaan

- Pengaturan bahasa dan mata uang bekerja secara independen dan tetap tersimpan setelah halaman dimuat ulang.
- Semua halaman, formulir, dialog, kategori, validasi, dan empty state tersedia dalam ketiga bahasa.
- Nominal dan tanggal memakai format locale terpilih serta mata uang terpilih; angka tetap bilangan bulat.
- Pengguna yang membuka localStorage lama mendapatkan `ja`/`JPY`; seluruh catatan dan budget lama tetap utuh.
- Perubahan mata uang saat data sudah ada menampilkan penjelasan tanpa kurs dan meminta konfirmasi; membatalkan tidak mengubah pengaturan.
- Tidak ada perubahan pada aturan budget, zona waktu, pencatatan, pencarian, pengeditan, penghapusan, atau analisis.

## Keputusan implementasi yang masih diusulkan

Rancangan menganggap bahasa dan mata uang terpisah, default `ja`/`JPY`, semua nominal memakai satu unit aplikasi, dan pergantian unit tidak menghitung konversi kurs. Konfirmasi Drew diperlukan sebelum implementasi.
