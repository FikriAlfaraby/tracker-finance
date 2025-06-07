# Personal Finance Tracker - Setup Guide

Selamat datang di panduan setup Personal Finance Tracker, sebuah aplikasi manajemen keuangan pribadi yang dibangun menggunakan **Next.js**, **Payload CMS**, **pnpm** sebagai package manager, dan **MongoDB** sebagai database. Panduan ini dirancang untuk pengguna yang memulai dari nol dan mencakup langkah instalasi untuk macOS dan Windows.

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- Koneksi internet yang stabil
- Tidak perlu instalasi software sebelumnya—kami akan memandu Anda melalui semuanya

## 🚀 Step 1: Install Node.js dan npm

Personal Finance Tracker memerlukan Node.js, yang sudah termasuk npm (Node Package Manager). Ikuti langkah-langkah di bawah berdasarkan sistem operasi Anda.

### Untuk macOS

1. **Download Node.js**:

   - Kunjungi [nodejs.org](https://nodejs.org/) dan download versi LTS (Long Term Support) untuk macOS
   - Buka file `.pkg` yang telah didownload dan ikuti wizard instalasi
   - Klik "Continue" dan "Install" ketika diminta

2. **Verifikasi Instalasi**:
   - Buka **Terminal** (cari menggunakan Spotlight dengan `Cmd + Space` dan ketik "Terminal")
   - Ketik perintah berikut dan tekan Enter:
   ```bash
   node -v
   npm -v
   ```
   - Anda harus melihat nomor versi (contoh: v18.x.x untuk Node.js dan 9.x.x untuk npm)
   - Jika tidak, install ulang Node.js

### Untuk Windows

1. **Download Node.js**:

   - Kunjungi [nodejs.org](https://nodejs.org/) dan download versi LTS untuk Windows
   - Jalankan file `.msi` yang telah didownload
   - **Penting**: Centang kotak "Add to PATH" selama instalasi, kemudian klik "Next" dan "Install"

2. **Verifikasi Instalasi**:
   - Buka Command Prompt (cari "cmd" di Start menu)
   - Ketik perintah berikut dan tekan Enter:
   ```cmd
   node -v
   npm -v
   ```
   - Anda harus melihat nomor versi
   - Jika tidak, install ulang Node.js dan pastikan "Add to PATH" telah dipilih

## 📦 Step 2: Install pnpm

pnpm adalah package manager yang lebih cepat yang akan kita gunakan untuk Personal Finance Tracker.

### Untuk macOS

1. **Install pnpm**:

   - Di Terminal, jalankan:

   ```bash
   npm install -g pnpm
   ```

   - Ini akan menginstall pnpm secara global. Tunggu hingga proses selesai

2. **Verifikasi Instalasi**:
   - Jalankan:
   ```bash
   pnpm -v
   ```
   - Anda harus melihat nomor versi (contoh: 8.x.x)
   - Jika tidak, ulangi instalasi

### Untuk Windows

1. **Install pnpm**:

   - Di Command Prompt, jalankan:

   ```cmd
   npm install -g pnpm
   ```

   - Tunggu hingga instalasi selesai

2. **Verifikasi Instalasi**:
   - Jalankan:
   ```cmd
   pnpm -v
   ```
   - Anda harus melihat nomor versi
   - Jika tidak, coba ulangi perintah

## 🗄️ Step 3: Install MongoDB

Personal Finance Tracker menggunakan MongoDB sebagai database.

### Untuk macOS

1. **Install MongoDB**:

   - Buka Terminal dan install MongoDB via Homebrew:

   ```bash
   # Install Homebrew jika belum ada
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

   # Install MongoDB
   brew tap mongodb/brew
   brew install mongodb-community
   ```

   - Ikuti instruksi yang muncul di layar

2. **Start MongoDB**:
   - Jalankan:
   ```bash
   brew services start mongodb-community
   ```
   - Verifikasi dengan:
   ```bash
   mongod --version
   ```

### Untuk Windows

1. **Install MongoDB**:

   - Download MongoDB Community Server dari [mongodb.com](https://www.mongodb.com/try/download/community)
   - Jalankan installer `.msi`
   - Pilih "Complete" setup dan install sebagai service (centang kotak selama instalasi)

2. **Start MongoDB**:
   - Buka Command Prompt sebagai Administrator dan jalankan:
   ```cmd
   net start MongoDB
   ```
   - Verifikasi dengan:
   ```cmd
   mongo --version
   ```
   - Jika tidak bisa start, pastikan MongoDB service aktif di "Services" (cari "Services" di Start menu)

## 🏗️ Step 4: Setup Personal Finance Tracker

### 1. Clone atau Download Project

- Jika ini adalah Git repository, jalankan:

```bash
git clone <repository-url>
cd personal-finance-tracker
```

- Atau download file project dan extract ke folder, kemudian buka Terminal (macOS) atau Command Prompt (Windows) di folder tersebut

### 2. Install Dependencies

- Jalankan:

```bash
pnpm install
```

- Ini akan menginstall semua package yang diperlukan berdasarkan `package.json`

### 3. Setup Environment Variables

- Copy file `.env.example` menjadi `.env.local`:

```bash
# macOS/Linux
cp .env.example .env.local

# Windows
copy .env.example .env.local
```

- Edit file `.env.local` dan isi dengan konfigurasi berikut:

```env
# Database
DATABASE_URI=mongodb://localhost:27017/personal-finance-tracker

# Payload CMS
PAYLOAD_SECRET=your-super-secret-key-here
FRONTEND_URL=http://localhost:3000
PORT=3000

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Setup Database

- Pastikan MongoDB berjalan (dari Step 3)
- Database akan otomatis dibuat saat pertama kali menjalankan aplikasi

### 5. Run Development Server

- Start server development dengan:

```bash
pnpm dev
```

- Buka browser dan kunjungi [http://localhost:3000](http://localhost:3000)
- Anda akan melihat interface Personal Finance Tracker

### 6. Setup Admin Panel (Payload CMS)

- Kunjungi [http://localhost:3000/admin](http://localhost:3000/admin)
- Buat akun admin pertama kali
- Gunakan admin panel untuk mengelola data jika diperlukan

## 🎯 Fitur Utama Aplikasi

### 💰 Manajemen Kantong (Pocket Management)

- Buat kantong untuk berbagai tujuan (Utama, Tabungan, Dana Darurat, dll.)
- Transfer antar kantong
- Monitor saldo real-time

### 📝 Pencatatan Transaksi

- Catat pemasukan dan pengeluaran
- Setiap transaksi harus terkait dengan kantong
- Validasi saldo otomatis

### 📊 Evaluasi Keuangan

- Sistem scoring keuangan
- Analisis rasio keuangan
- Tracking progress keuangan

### 🎨 Interface Modern

- Responsive design
- Dark/Light mode support
- Intuitive user experience

## 🔧 Troubleshooting

### Node.js/npm/pnpm tidak ditemukan

- Install ulang Node.js dan pastikan ditambahkan ke system PATH
- Restart terminal/command prompt setelah instalasi

### MongoDB tidak bisa connect

- Pastikan MongoDB service berjalan
- Cek apakah `DATABASE_URI` di `.env.local` sudah benar
- Untuk Windows, pastikan service MongoDB aktif di Services

### Error saat pnpm install

- Pastikan koneksi internet stabil
- Hapus folder `node_modules` dan file `pnpm-lock.yaml`, kemudian jalankan `pnpm install` lagi
- Coba gunakan `pnpm install --force`

### Port 3000 sudah digunakan

- Ubah PORT di `.env.local` ke port lain (contoh: 3001)
- Atau stop aplikasi yang menggunakan port 3000

### Payload CMS Admin tidak bisa diakses

- Pastikan `PAYLOAD_SECRET` sudah diset di `.env.local`
- Cek apakah database connection berhasil
- Restart development server

## 📚 Struktur Project

```
personal-finance-tracker/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── src/
│   ├── collections/        # Payload CMS collections
│   └── payload.config.ts   # Payload configuration
├── lib/                    # Utility functions
├── hooks/                  # Custom React hooks
├── contexts/               # React contexts
├── .env.example           # Environment variables template
├── package.json           # Dependencies
└── README.md              # This file
```

## 🚀 Next Steps

1. **Eksplorasi Interface**: Jelajahi dashboard dan fitur-fitur yang tersedia
2. **Buat Kantong Pertama**: Mulai dengan membuat kantong utama
3. **Tambah Transaksi**: Catat transaksi pertama Anda
4. **Evaluasi Keuangan**: Isi data keuangan untuk mendapat skor
5. **Customization**: Sesuaikan kantong dan kategori sesuai kebutuhan

## 📞 Support

Jika mengalami masalah atau butuh bantuan:

- Baca dokumentasi troubleshooting di atas
- Check issue yang sudah ada di repository
- Buat issue baru jika diperlukan

---

**Selamat menggunakan Personal Finance Tracker! 🎉**

_Kelola keuangan Anda dengan lebih baik dan capai tujuan finansial impian._

```

Ini adalah README.md yang komprehensif dan detail untuk Personal Finance Tracker, mencakup semua langkah instalasi dari nol untuk pengguna macOS dan Windows, plus penjelasan fitur dan troubleshooting yang lengkap.
```
