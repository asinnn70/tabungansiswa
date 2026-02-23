# TabunganSiswa - Sistem Manajemen Tabungan Sekolah

Aplikasi manajemen tabungan siswa berbasis web yang menggunakan Google Sheets sebagai database dan Google Apps Script sebagai backend API.

## Fitur Utama
- **Dashboard**: Ringkasan statistik total siswa, total tabungan, dan setoran hari ini.
- **Manajemen Siswa**: Tambah dan kelola data siswa (NIS, Nama, Kelas, dll).
- **Transaksi**: Catat setoran (deposit) dan penarikan (withdraw) dengan validasi saldo.
- **Laporan**: Rekapitulasi saldo siswa per kelas dan ekspor ke format CSV.
- **Keamanan**: Login sederhana berbasis sesi.

## Cara Pengaturan Backend (Google Sheets & Apps Script)

1. **Buat Google Sheet Baru**:
   - Beri nama (misal: "Database Tabungan Siswa").
   - Salin **Spreadsheet ID** dari URL (bagian antara `/d/` dan `/edit`).

2. **Buka Apps Script**:
   - Di Google Sheets, klik menu **Extensions** > **Apps Script**.
   - Hapus kode yang ada dan tempelkan isi dari file `google-apps-script/Code.gs`.
   - Ganti `YOUR_SPREADSHEET_ID_HERE` dengan ID Spreadsheet Anda.

3. **Deploy sebagai Web App**:
   - Klik tombol **Deploy** > **New Deployment**.
   - Pilih type: **Web App**.
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Klik **Deploy** dan salin **Web App URL**.

4. **Konfigurasi Frontend**:
   - Masukkan Web App URL tersebut ke dalam variabel lingkungan `VITE_GAS_API_URL` di AI Studio.

## Kredensial Login Default
- **Username**: `admin`
- **Password**: `admin123`

## Teknologi
- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Google Apps Script (REST API).
- **Database**: Google Sheets.
