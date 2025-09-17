# Akademos - Platform E-Learning Real-time

Akademos adalah aplikasi web yang dirancang untuk memfasilitasi kelas belajar online secara real-time. Aplikasi ini dibangun menggunakan Next.js dan mengintegrasikan LiveKit untuk menyediakan komunikasi audio dan video antara pengajar dan siswa.

## Fitur Utama

- **Kelas Virtual Real-time**: Sesi kelas interaktif dengan audio dan video.
- **Peran Pengguna**: Sistem membedakan antara peran Pengajar (Teacher) dan Siswa (Student).
- **Manajemen Sesi**: API untuk memulai dan mengakhiri sesi kelas.
- **Autentikasi**: Sistem autentikasi berbasis token (JWT).

## Teknologi yang Digunakan

- **Framework**: [Next.js](https://nextjs.org/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Komunikasi Real-time**: [LiveKit](https://livekit.io/)
- **Database**: [SQLite](https://www.sqlite.org/index.html) dengan `better-sqlite3`
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Autentikasi**: Implementasi kustom menggunakan `jose` (JWT) dan `cookies-next`.

## Persiapan dan Instalasi

Untuk menjalankan proyek ini di lingkungan lokal, ikuti langkah-langkah berikut.

### 1. Prasyarat

- [Node.js](https://nodejs.org/en) (versi 20 atau lebih baru)
- npm, yarn, atau pnpm

### 2. Instalasi Dependensi

Kloning repository ini, lalu instal semua dependensi yang dibutuhkan:

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Konfigurasi Lingkungan (.env.local)

Buat file baru di root proyek dengan nama `.env.local`. Salin konten di bawah ini ke dalam file tersebut dan isi nilainya sesuai dengan konfigurasi Anda.

```sh
# LiveKit Configuration

LIVEKIT_API_KEY="LK_..."
LIVEKIT_API_SECRET="your_livekit_secret"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_URL=


### 4. Inisialisasi Database

Sebelum menjalankan server, Anda perlu membuat dan mengisi tabel database. Jalankan skrip inisialisasi:

```bash
npm run db:init
```

Perintah ini akan membuat file `akademos.db` dan tabel-tabel yang diperlukan.

### 5. Jalankan Server Development

Setelah instalasi dan inisialisasi database selesai, jalankan server development:

```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

## Skrip yang Tersedia

- `npm run dev`: Menjalankan aplikasi dalam mode development.
- `npm run build`: Membuat build aplikasi untuk production.
- `npm run start`: Menjalankan aplikasi dari build production.
- `npm run lint`: Menjalankan linter untuk memeriksa kualitas kode.
- `npm run db:init`: Melakukan inisialisasi database SQLite.
