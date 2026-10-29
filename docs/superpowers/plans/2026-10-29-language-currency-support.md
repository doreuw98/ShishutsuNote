# Dukungan Bahasa dan Mata Uang — Rencana Implementasi

> **Untuk pelaksana:** kerjakan tugas secara berurutan. Tandai kotak setelah langkah selesai.

**Tujuan:** Menambahkan bahasa Jepang, Inggris, Indonesia, serta pilihan mata uang JPY, USD, IDR yang dapat diubah secara independen tanpa merusak data localStorage lama.

**Arsitektur:** Simpan pilihan bahasa dan mata uang pada `AppSettings`. Kamus i18n menyediakan teks untuk tiap bahasa; helper domain memformat mata uang dan tanggal. Pengaturan lama dimigrasikan ke `ja`/`JPY`, sementara perubahan mata uang memakai konfirmasi bila sudah ada data dan tidak mengonversi nilai.

**Teknologi:** React 19, TypeScript, Vite, `Intl.NumberFormat`, localStorage yang sudah ada; tanpa dependensi baru.

**Rancangan:** `docs/superpowers/specs/2026-10-29-language-currency-support-design.md`

## Batasan global

- Bahasa yang tersedia adalah `ja`, `en`, dan `id`; default `ja`.
- Mata uang yang tersedia adalah `JPY`, `USD`, dan `IDR`; default `JPY`.
- Pilihan bahasa tidak mengubah pilihan mata uang, dan sebaliknya.
- Pergantian mata uang tidak memakai kurs; angka tersimpan tetap sama dan aplikasi menjelaskan perubahan unit.
- Data lama tanpa pengaturan bahasa/mata uang dibaca sebagai `ja`/`JPY` tanpa menghapus budget atau pengeluaran.
- Perhitungan tanggal tetap memakai `Asia/Tokyo`; format tanggal mengikuti bahasa.
- Tidak menambah backend, API kurs, akun, atau dependensi.
- Jangan menambah atau menjalankan automated test; jalankan lint, typecheck, build, dan inspeksi visual yang direncanakan.

## Fokus peninjauan

- LocalStorage `v1` yang valid tetapi belum memiliki pengaturan `language`/`currency` harus terbuka sebagai `ja`/`JPY`, mempertahankan seluruh expenses, budgets, dan warning months.
- Nilai bahasa/mata uang rusak atau tidak didukung tidak boleh menyebabkan crash atau menghapus data transaksi.
- Mengubah bahasa saat dialog transaksi terbuka tidak boleh mengosongkan nilai form.
- Mengubah mata uang dan membatalkan konfirmasi harus mempertahankan unit lama; menyetujui hanya mengganti format tanpa mengubah angka.
- Tanggal malam/akhir bulan tetap berdasarkan zona waktu Tokyo meski label ditampilkan dalam bahasa berbeda.

---

### Tugas 1: Tambahkan model lokal, label kategori, format tanggal/uang, dan migrasi data

**Berkas:**
- Ubah: `src/domain/types.ts`
- Ubah: `src/domain/categories.ts`
- Ubah: `src/domain/finance.ts`
- Ubah: `src/domain/dates.ts`
- Ubah: `src/lib/localStorage.ts`

**Antarmuka yang dihasilkan:**
- `AppLanguage = 'ja' | 'en' | 'id'`
- `CurrencyCode = 'JPY' | 'USD' | 'IDR'`
- `AppSettings.language: AppLanguage` dan `AppSettings.currency: CurrencyCode`
- `getCategory(categoryId: CategoryId, language: AppLanguage): Category & { label: string }`
- `formatCurrency(amount: number, currency: CurrencyCode, language: AppLanguage): string`
- `formatMonthLabel(monthKey: string, language: AppLanguage): string`
- `formatDateLabel(dateKey: string, language: AppLanguage): string`
- Kategori mempunyai label Jepang, Inggris, dan Indonesia dengan ID stabil yang sama.

- [ ] **Langkah 1:** Tambahkan tipe bahasa/mata uang dan label terjemahan untuk delapan kategori, sambil mempertahankan ID dan warna kategori yang sudah tersimpan.
- [ ] **Langkah 2:** Ganti formatter yen tetap dengan `formatCurrency`; gunakan locale `ja-JP`, `en-US`, `id-ID`, currency yang diminta, dan nol digit pecahan.
- [ ] **Langkah 3:** Parameterkan formatter tanggal/bulan berdasarkan `AppLanguage` tanpa mengubah `APP_TIME_ZONE = 'Asia/Tokyo'` atau date key internal.
- [ ] **Langkah 4:** Tambahkan default `ja`/`JPY` ke `EMPTY_APP_STATE` dan normalisasi settings lama yang belum memiliki kedua field itu; jangan mengubah expenses, monthlyBudgets, atau budgetWarningShownMonths.
- [ ] **Langkah 5:** Jalankan `npm run lint`, `npm run typecheck`, dan `npm run build`; semuanya harus lolos.

### Tugas 2: Tambahkan kamus teks dan pilihan preferensi yang tersimpan

**Berkas:**
- Buat: `src/i18n/messages.ts`
- Buat: `src/i18n/translate.ts`
- Ubah: `src/App.tsx`
- Ubah: `src/pages/SettingsPage.tsx`
- Ubah: `src/styles.css` untuk layout kontrol pengaturan bila diperlukan

**Antarmuka yang dihasilkan:**
- `translate(language: AppLanguage, key: MessageKey, values?: Record<string, string | number>): string`
- `SettingsPage` menerima `language: AppLanguage`, `currency: CurrencyCode`, `hasSavedData: boolean`, dan `onSavePreferences(preferences: Pick<AppSettings, 'language' | 'currency'>): boolean`, serta callback budget yang sudah ada.
- Simpan preferensi lewat `AppState.settings` dan fungsi `saveAppState` yang ada.

- [ ] **Langkah 1:** Buat kamus bertipe yang mewajibkan nilai lengkap untuk `ja`, `en`, dan `id`; masukkan string umum untuk pengaturan bahasa, pengaturan mata uang, serta konfirmasi unit.
- [ ] **Langkah 2:** Tambahkan kontrol `Language / 言語 / Bahasa` dan `Currency / 通貨 / Mata uang` pada pengaturan; keduanya mengubah satu nilai tanpa mengubah yang lain.
- [ ] **Langkah 3:** Terapkan perubahan bahasa seketika dan simpan ke localStorage; pilihan tetap tersimpan setelah reload.
- [ ] **Langkah 4:** Saat mata uang berbeda dipilih dan sudah ada expense atau budget, tampilkan `ConfirmDialog` terjemahan yang menjelaskan tidak ada konversi. Batal mengembalikan pilihan lama; konfirmasi menyimpan currency baru tanpa mengubah nilai.
- [ ] **Langkah 5:** Tampilkan peringatan ringkas bahwa currency aplikasi berlaku untuk semua angka dan kurs tidak diterapkan; format pilihan `Intl` currency tetap sesuai `JPY`, `USD`, atau `IDR`.
- [ ] **Langkah 6:** Jalankan lint, typecheck, dan build; semuanya harus lolos.

### Tugas 3: Terjemahkan kerangka aplikasi, navigasi, dan status bersama

**Berkas:**
- Ubah: `src/App.tsx`
- Ubah: `src/components/AppNavigation.tsx`
- Ubah: `src/components/ConfirmDialog.tsx`
- Ubah: `src/components/EmptyState.tsx`

**Antarmuka yang dikonsumsi:**
- `translate(language, key, values?)` dari Tugas 2.
- `App` membaca `language` dan `currency` dari `appState.settings` dan mengirimkannya ke halaman/komponen.

- [ ] **Langkah 1:** Terjemahkan nama aplikasi, tagline, navigasi desktop/mobile, label aksesibilitas navigasi, judul halaman, subtitle, dan tombol global.
- [ ] **Langkah 2:** Terjemahkan storage banner, budget warning, toast sukses/gagal, serta pesan saat data lokal direset.
- [ ] **Langkah 3:** Pastikan setiap screen mendapatkan bahasa dan currency aktif sebagai props; ubah format tanggal global dengan helper berbahasa.
- [ ] **Langkah 4:** Terjemahkan `ConfirmDialog` dan `EmptyState`, termasuk judul, deskripsi, aksi, serta aria label.
- [ ] **Langkah 5:** Jalankan lint, typecheck, dan build; semuanya harus lolos.

### Tugas 4: Terjemahkan halaman, kategori, transaksi, dan form

**Berkas:**
- Ubah: `src/pages/HomePage.tsx`
- Ubah: `src/pages/HistoryPage.tsx`
- Ubah: `src/pages/AnalysisPage.tsx`
- Ubah: `src/pages/SettingsPage.tsx`
- Ubah: `src/components/ExpenseRow.tsx`
- Ubah: `src/components/ExpenseForm.tsx`

**Antarmuka yang dikonsumsi:**
- `translate(language, key, values?)`, `formatCurrency(amount, currency, language)`, `formatDateLabel(dateKey, language)`, dan label kategori dari Tugas 1–3.

- [ ] **Langkah 1:** Terjemahkan semua teks beranda dan format nominal anggaran, progress, ringkasan harian/bulanan, transaksi terbaru, dan kategori memakai currency aktif.
- [ ] **Langkah 2:** Terjemahkan pencarian/filter, hasil kosong, label hitungan, edit/hapus, serta format nominal dan tanggal pada riwayat.
- [ ] **Langkah 3:** Terjemahkan header analisis, nama kategori, legenda, persentase, total, dan empty state; pertahankan arti persentase dan perhitungan kategori.
- [ ] **Langkah 4:** Terjemahkan field form transaksi, opsi kategori, validasi nominal, tanggal, memo, batal/simpan, dan mode edit; awalan currency serta currency yang tersimpan mengikuti pilihan aplikasi saat ini.
- [ ] **Langkah 5:** Terjemahkan label pengaturan budget, helper/error/sukses, catatan localStorage, dan ringkasan mata uang aktif.
- [ ] **Langkah 6:** Jalankan lint, typecheck, dan build; semuanya harus lolos.

### Tugas 5: Periksa hasil pada preview desktop dan ponsel

**Berkas:**
- Tidak ada perubahan perilaku baru; rapikan teks atau layout pada berkas Tugas 1–4 bila pemeriksaan memperlihatkan masalah.

- [ ] **Langkah 1:** Periksa seluruh halaman pada tiga bahasa dan tiga currency, termasuk tanggal, kategori, jumlah besar, dan label tombol.
- [ ] **Langkah 2:** Periksa perubahan mata uang dengan data tersimpan: konfirmasi muncul, batal tidak mengubah preferensi, konfirmasi mengubah format tanpa mengubah angka, dan bahasa tetap independen.
- [ ] **Langkah 3:** Periksa data localStorage lama: seluruh expense/budget dipertahankan dan preferensi baru menjadi `ja`/`JPY`.
- [ ] **Langkah 4:** Periksa responsive layout dan aksesibilitas fokus setelah teks lebih panjang dalam bahasa Inggris/Indonesia.
- [ ] **Langkah 5:** Jalankan kembali lint, typecheck, dan build; semuanya harus lolos.
- [ ] **Langkah 6:** Laporkan layar/berkas yang berubah, pilihan perilaku currency, serta hasil pemeriksaan.

## Pemeriksaan diri terhadap spesifikasi

- Seluruh requirement terkait pilihan independen, migrasi, tiga bahasa, tiga currency, peringatan tanpa konversi, label kategori, format tanggal, batas no-backend/no-dependency, dan data lama terpetakan ke Tugas 1–5.
- Perhitungan finansial tetap integer; formatter hanya mengubah representasi dan tidak mengubah nilai domain.
- Tidak ada automated test baru atau yang dijalankan; verifikasi yang direncanakan adalah lint, typecheck, build, dan inspeksi preview sesuai batasan sesi.
