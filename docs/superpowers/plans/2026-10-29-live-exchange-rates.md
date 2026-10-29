# Rencana Implementasi Kurs Per Jam

> **Untuk pelaksana:** kerjakan berurutan dan tandai setelah selesai.

Status: implementasi awal selesai; App ID dipindahkan ke proxy server lokal agar tidak terekspos di bundle browser.

**Tujuan:** konversi JPY, USD, dan IDR memakai kurs per jam terbaru Open Exchange Rates, dengan JPY sebagai nilai dasar yang stabil.

**Desain disetujui:** `docs/superpowers/specs/2026-10-29-live-exchange-rates-design.md`.

**Batas:** jangan tambah/run automated tests; gunakan lint, typecheck, build, dan inspeksi UI.

## Tugas 1 — Model nilai dasar, data kurs, dan kompatibilitas localStorage [x]

- Ubah tipe transaksi supaya `amount` merepresentasikan JPY kanonis (tetap nama field agar perhitungan yang ada sederhana).
- Definisikan model `ExchangeRates` untuk response USD-base, timestamp UTC, retrieved/cache state, dan validasi response.
- Tambahkan klien browser same-origin dan proxy server dengan `OPEN_EXCHANGE_RATES_APP_ID` server-only, timeout, validasi angka positif, `symbols=JPY,IDR`, dan USD implicit 1.
- Tambahkan cache lokal berumur satu jam dan helper konversi silang JPY↔JPY/USD/IDR serta pembulatan ke integer JPY.
- Tambahkan migrasi satu kali: nominal existing dianggap mata uang yang ada di settings, convert ke JPY jika ada rate, simpan penanda migrasi. Fallback tanpa rate memakai JPY dan tandai asumsi legacy.
- Pastikan `.env.local` tetap terabaikan dan tambahkan `.env.example` tanpa kredensial.

## Tugas 2 — Integrasikan fetch/cache ke siklus aplikasi [x]

- Muat cache saat boot, ambil rate saat cache kosong/usang bila App ID tersedia, dan refresh paling banyak hourly saat tab visible.
- Jangan menimpa cache valid dengan response invalid; jadikan mode online/stale/error eksplisit.
- Saat pengguna meminta mata uang lain, ambil rate jika perlu; ubah preferensi hanya bila ada rate atau mata uang sama.
- Sediakan format `last updated` dari UTC ke waktu lokal Tokyo dan status rate stale.

## Tugas 3 — Gunakan nilai konversi konsisten pada seluruh fitur [x]

- Ubah `ExpenseForm` dan budget Settings agar input adalah nominal mata uang tampilan lalu convert-to-JPY saat save.
- Saat edit, convert canonical JPY ke mata uang tampilan sebelum mengisi form.
- Konversi nilai sebelum format di row, Home, History, Analysis, budget, total, sisa budget, warning threshold, dan daily target.
- Gunakan dua pecahan untuk USD dan nol untuk JPY/IDR; pertahankan perhitungan/penyimpanan dalam integer JPY.
- Perbarui copy konfirmasi currency, error/no-rate, keterangan provider, waktu rate, dan bahasa ja/en/id.

## Tugas 4 — Verifikasi [x]

- `npm run lint`, `npm run typecheck`, `npm run build`.
- Periksa UI desktop/mobile, perubahan currency, input/edit, budget, cache/stale/error, dan tampilan timestamp.
- Jangan tampilkan atau commit App ID; jelaskan konfigurasi lokal yang diperlukan untuk fetch sungguhan.
- Catat keterbatasan migrasi angka lama yang kemungkinan pernah dimasukkan dalam lebih dari satu unit.

## Addendum — Proxy server lokal

- Middleware Vite dan `server.js` memakai handler kurs bersama; browser hanya memanggil `/api/rates`.
- `npm start` melayani build lokal untuk presentasi pada port 4173. App ID dibaca dari variabel lingkungan atau `.env.local` oleh server saja.

Preview lokal merespons HTTP 200. Pemeriksaan visual interaktif pada browser dan fetch rate aktual belum dapat dibuktikan di sesi ini karena App ID belum dikonfigurasi dan kontrol browser tidak tersedia.
