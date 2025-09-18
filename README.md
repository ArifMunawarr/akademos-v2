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

### 6. Konfigurasi Nginx untuk Production (Opsional)

Untuk menjalankan aplikasi ini di server production dengan domain dan SSL, Anda dapat menggunakan Nginx sebagai *reverse proxy*.

**Penting:** Browser modern membatasi akses ke perangkat seperti kamera dan mikrofon pada koneksi yang tidak aman (HTTP), kecuali untuk `localhost`. Oleh karena itu, untuk memastikan fungsionalitas audio dan video berjalan dengan baik di lingkungan production, Anda **wajib** menggunakan HTTPS. Konfigurasi di bawah ini akan memandu Anda untuk mengalihkan semua trafik HTTP ke HTTPS.

#### a. Buat Sertifikat SSL Self-Signed

Jika Anda belum memiliki sertifikat SSL, Anda bisa membuatnya sendiri (self-signed) untuk development atau testing.

1.  **Buat direktori untuk sertifikat:**
    ```bash
    sudo mkdir -p /etc/nginx/ssl
    ```

2.  **Buat sertifikat dan kunci pribadi:**
    ```bash
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/akademos.key \
    -out /etc/nginx/ssl/akademos.crt
    ```
    *Catatan: Isi informasi yang diminta atau tekan Enter untuk menggunakan nilai default.*

#### b. Konfigurasi Nginx

Buat file konfigurasi baru untuk situs Anda di `/etc/nginx/sites-available/akademos`.

```nginx
# /etc/nginx/sites-available/akademos

# Blok server untuk mengalihkan HTTP ke HTTPS
server {
    listen 80;
    listen [::]:80;

    server_name <your_ip>; # Ganti dengan domain atau IP server Anda

    # Alihkan semua permintaan HTTP ke HTTPS
    return 301 https://$host$request_uri;
}

# Blok server untuk menangani HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name <your_ip>; # Ganti dengan domain atau IP server Anda

    # Lokasi sertifikat SSL yang sudah dibuat
    ssl_certificate /etc/nginx/ssl/akademos.crt;
    ssl_certificate_key /etc/nginx/ssl/akademos.key;

    # Pengaturan SSL/TLS (opsional, tapi direkomendasikan untuk keamanan)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    location / {
        # Teruskan request ke aplikasi Next.js yang berjalan di port 3000
        proxy_pass http://localhost:3000;

        # Header penting untuk meneruskan informasi asli dari klien
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Header ini penting untuk koneksi WebSocket (digunakan oleh LiveKit)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### c. Aktifkan Konfigurasi

Setelah membuat file konfigurasi, buat symbolic link ke `sites-enabled` dan restart Nginx.

```bash
# Buat symlink
sudo ln -s /etc/nginx/sites-available/akademos /etc/nginx/sites-enabled/

# Tes konfigurasi Nginx
sudo nginx -t

# Jika tidak ada error, restart Nginx
sudo systemctl restart nginx
```

## Skrip yang Tersedia

- `npm run dev`: Menjalankan aplikasi dalam mode development.
- `npm run build`: Membuat build aplikasi untuk production.
- `npm run start`: Menjalankan aplikasi dari build production.
- `npm run lint`: Menjalankan linter untuk memeriksa kualitas kode.
- `npm run db:init`: Melakukan inisialisasi database SQLite.
