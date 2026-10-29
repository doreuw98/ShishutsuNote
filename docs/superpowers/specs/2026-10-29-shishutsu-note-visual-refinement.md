# ShishutsuNote — rancangan penyegaran UI/UX

- Tanggal: 2026-10-29
- Status: disetujui; arahan visual diperbarui setelah tinjauan preview
- Cakupan: penyegaran tampilan pada seluruh layar web responsif

## Tujuan

Membuat ShishutsuNote terasa lebih terarah dan dirancang untuk mahasiswa yang mencatat pengeluaran sehari-hari di Jepang. Tampilan harus lebih mudah dipindai saat presentasi kelas dan tetap nyaman pada ponsel.

## Pendekatan yang dipertimbangkan

1. **Memperhalus desain yang ada (pilihan awal):** pertahankan navy-oranye dari PRD dan struktur navigasi empat layar; kurangi panel yang berulang, kuatkan hierarki jumlah uang dan catatan terbaru.
2. **Gaya buku kas mahasiswa:** gunakan susunan editorial yang menyerupai buku catatan dan palet yang lebih hangat. Ini lebih berbeda, tetapi menjauh dari identitas warna yang sudah disetujui di PRD.

## Arahan visual yang diperbarui

- Setelah meninjau preview dan meminta perubahan yang lebih terlihat, Drew menyetujui arah baru: latar hijau embun `#EFF5F2`, tinta biru-hijau `#17364A`, panel anggaran mint `#DCEFE9`, serta oranye matang `#B64D23` untuk tindakan dan penanda.
- Sidebar memakai permukaan terang dan status aktif mint; dashboard mengandalkan panel anggaran mint sebagai elemen khas.
- Gunakan garis pemisah serta ruang kosong untuk mengelompokkan isi. Jangan membungkus setiap bagian dengan kartu dan bayangan yang sama.
- Gunakan satu tipografi sans-serif sistem yang cocok untuk bahasa Jepang. Tidak mengambil font dari jaringan.
- Jadikan sisa anggaran dan pemakaian bulan ini sebagai fokus dashboard; transaksi terbaru menyatu dengan daftar yang rapi dan mudah dipindai.
- Pertahankan antarmuka Jepang, yen, istilah yang jelas, dan ikon SVG yang sudah digunakan; hindari emoji serta label dekoratif yang tidak membantu.

## Cakupan layar dan perilaku

- **Beranda:** perjelas fokus pada sisa anggaran, progress bulanan, target harian, ringkasan, dan pengeluaran terbaru. Pertahankan tindakan tambah pengeluaran sebagai CTA paling jelas.
- **Riwayat:** tingkatkan keterbacaan tanggal, kategori, memo, dan nominal; pencarian, filter, edit, dan hapus tetap sama.
- **Analisis:** tampilkan peringkat kategori dan persentase dengan label serta nominal tetap terbaca tanpa mengandalkan warna saja.
- **Pengaturan:** tampilkan input anggaran, validasi, status simpan, dan penjelasan penyimpanan lokal dengan urutan yang lebih jelas.
- **Responsif:** mobile tetap satu kolom dengan navigasi bawah; desktop memakai sidebar dan area konten dengan lebar baca yang nyaman. Hindari scroll horizontal.
- **Interaksi:** fokus keyboard tetap terlihat, tombol sentuh cukup besar dan terpisah, keadaan hover/fokus/aktif jelas, dan preferensi reduced-motion dihormati.
- **Kontras:** teks putih pada tombol `#B64D23` memiliki rasio kontras sekitar 5.15:1; status tetap memakai label teks selain warna.

## Batasan

Tidak ada perubahan pada fitur, aturan hitung anggaran, format yen, bahasa, struktur data, localStorage, atau dependensi. Tidak menambahkan animasi dekoratif, font eksternal, gradient, atau komponen baru yang tidak dibutuhkan.

## Tanggung jawab implementasi

Implementer boleh menata ulang CSS dan komposisi visual komponen yang sudah ada selama perilaku produk tetap sama. Hasil harus diperiksa di preview desktop dan mobile, lalu lint, typecheck, serta build dijalankan.
