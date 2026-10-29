# Kurs Mata Uang Per Jam — ShishutsuNote

- Tanggal: 2026-10-29
- Status: disetujui dan diimplementasikan
- Cakupan: konversi tampilan JPY, USD, dan IDR memakai data kurs terbaru Open Exchange Rates

## Tujuan

Saat Drew memilih mata uang tampilan, semua pengeluaran dan anggaran ditampilkan sebagai nilai setara menurut kurs terbaru, bukan sekadar mengganti simbol. Nilai tetap tersedia saat jaringan atau layanan kurs sedang tidak dapat dijangkau.

## Pendekatan

1. Kurs referensi harian tanpa API key: sederhana, tetapi tidak memenuhi kebutuhan pembaruan per jam.
2. **Open Exchange Rates Free per jam (dipilih Drew):** pembaruan per jam, perlu App ID, kuota 1.000 permintaan per bulan. Paket gratis hanya menyediakan basis USD; aplikasi mengambil USD, JPY, dan IDR lalu menghitung kurs silang.
3. **Proxy server lokal (dipilih untuk implementasi):** menjaga App ID di server tanpa biaya/dependensi baru; cukup untuk demo lokal, tetapi bukan layanan produksi publik yang dikelola.

Paket gratis menyebut pembaruan per jam dan 1.000 permintaan per bulan; nilai diperbarui sekitar menit 1–2 setiap jam. Paket gratis tidak mendukung basis selain USD. Respons menyediakan timestamp UTC. [Paket gratis](https://openexchangerates.org/signup/free), [FAQ pembaruan dan basis](https://openexchangerates.org/faq), [format respons](https://docs.openexchangerates.org/reference/api-introduction).

## Perilaku yang diusulkan

- Nilai domain/localStorage disimpan sebagai nominal JPY bulat, karena produk ini ditujukan untuk mahasiswa di Jepang.
- Formulir pengeluaran dan budget mengikuti mata uang tampilan. Ketika disimpan, input dikonversi ke JPY memakai kurs aktif dan dibulatkan ke 1 JPY terdekat.
- Semua tampilan, total, ringkasan kategori, dan sisa budget mengonversi nominal JPY ke mata uang pilihan memakai kurs terbaru. Nilai ekuivalen transaksi lama dapat berubah saat kurs diperbarui; nilai JPY sumber tidak berubah.
- Saat mata uang diganti, aplikasi mengambil kurs terbaru bila cache lebih lama dari satu jam. Preferensi langsung berlaku setelah kurs tersedia. Bahasa tetap independen. Dialog menjelaskan bahwa nominal memakai kurs terbaru.
- Ambil satu respons berisi USD, JPY, IDR; rumusnya `nilai target = nilai JPY / kurs JPY per USD × kurs target per USD`. Untuk USD, kurs target per USD adalah 1.
- Cache kurs beserta timestamp; segarkan paling banyak sekali per jam saat aplikasi dibuka/aktif, tanpa polling berulang. Pengaturan menampilkan waktu kurs.
- Jika permintaan gagal, pakai cache terakhir dan tandai waktu sebagai usang. Tanpa cache, jangan ubah mata uang dan tampilkan pesan kegagalan.
- USD memakai dua digit pecahan; JPY dan IDR tanpa pecahan. Nilai sumber tetap bilangan bulat JPY.

## Migrasi data lama

Catatan dan budget lama tidak menyimpan kode mata uang per nominal. Migrasi satu kali akan menganggap semua nominal memakai mata uang pilihan yang tersimpan di Pengaturan saat migrasi, mengonversinya ke JPY dengan kurs terbaru, lalu menandai migrasi selesai. Ini menjaga nilai ekuivalen dengan asumsi tersebut. Jika angka lama pernah dicatat memakai mata uang berbeda sebelum fitur kurs tersedia, unit aslinya tidak dapat diketahui dan hasil migrasinya mungkin tidak tepat. Bila kurs belum tersedia, data lama tetap dibuka dengan asumsi JPY dan status migrasinya dijelaskan; akses ke catatan tidak diblokir.

## Batasan dan keamanan

- Browser meminta `/api/rates` pada origin aplikasi. Middleware Vite melayani mode pengembangan, sedangkan `server.js` melayani hasil build untuk presentasi lokal.
- App ID disimpan di `.env.local` sebagai `OPEN_EXCHANGE_RATES_APP_ID`, dibaca di server, dan tidak pernah dikirim kembali ke browser. `.env.local` tetap diabaikan Git.
- Server ini untuk demo lokal dan belum memiliki autentikasi, pembatasan permintaan, atau pengelolaan hosting produksi. Jangan publikasikan langsung ke internet.
- Kurs adalah estimasi referensi per jam, bukan harga transaksi bank/forex yang dijamin. Tampilkan penyedia serta waktu kurs.
- Zona waktu Tokyo, tanggal transaksi, kategori, operasi CRUD, dan aturan budget tidak berubah selain representasi mata uang.

## Area perubahan

Tambahkan klien browser same-origin, proxy server, cache, validasi timestamp, dan migrasi nominal legacy. Ubah model/formatter domain agar menyimpan JPY kanonis. Perbarui `App.tsx`, halaman/komponen nominal, Pengaturan, status jaringan, dan dokumentasi `.env.local`; pastikan file lokal tidak masuk Git dan App ID tidak masuk ke bundle browser.

## Pemeriksaan penerimaan

- JPY/USD/IDR memakai kurs terkini dari satu respons; nilai JPY sumber tidak berubah saat mata uang/kurs berubah.
- Input expense/budget dalam USD atau IDR disimpan sebagai ekuivalen JPY; total dan analisis konsisten setelah pembulatan.
- Cache mencegah permintaan berulang dan refresh paling banyak tiap jam.
- Offline memakai cache berstatus usang; tanpa cache, mata uang tidak berubah dan ada pesan kegagalan.
- Timestamp UTC ditampilkan dalam waktu Tokyo; format dan digit pecahan sesuai mata uang.
- Data lama dimigrasi satu kali, tetap dapat diakses, dan asumsi migrasi dijelaskan.
- Lint, typecheck, build, dan pemeriksaan UI desktop/mobile berhasil; tidak ada automated test baru atau dijalankan.

## Persetujuan yang diperlukan

Mohon setujui asumsi migrasi: semua nominal lama menggunakan mata uang yang sedang tersimpan di Pengaturan ketika migrasi pertama berjalan, lalu dikonversi sekali ke JPY. Sistem lama tidak mencatat mata uang per transaksi, jadi angka yang pernah dimasukkan setelah mengganti simbol sebelumnya tidak bisa dipulihkan dengan pasti.
