# SkydashNET - Dasbor Monitoring MikroTik

![License](https://img.shields.io/badge/license-ISC-blue.svg)

SkydashNET adalah aplikasi web *full-stack* yang canggih untuk memantau dan mengelola perangkat MikroTik secara *real-time*. Dibangun dengan tumpukan teknologi modern, dasbor ini menyediakan antarmuka yang intuitif untuk visualisasi data jaringan, manajemen pengguna, dan pemetaan aset.

_Catatan: Tambahkan screenshot aplikasi Anda di sini untuk daya tarik visual!_
---

## ✨ Fitur Utama

-   **Dasbor Real-time:** Pantau penggunaan CPU, Memori, dan lalu lintas jaringan (ethernet & PPPoE) secara langsung menggunakan grafik interaktif yang diperbarui melalui WebSockets.
-   **Manajemen PPPoE:**
    -   Lihat ringkasan total, pengguna aktif, dan tidak aktif.
    -   Daftar lengkap semua *secrets* PPPoE dengan status koneksi.
    -   Tambah pengguna PPPoE baru dengan alokasi IP otomatis yang cerdas.
-   **Manajemen Hotspot:**
    -   Lihat ringkasan total dan pengguna Hotspot yang aktif.
    -   Lihat daftar semua pengguna Hotspot terdaftar beserta total pemakaian data.
    -   Pantau lalu lintas *live* (upload/download) untuk setiap pengguna yang aktif.
-   **Manajemen Aset & Pemetaan:**
    -   Tambahkan, edit, dan hapus aset jaringan fisik (ODC, ODP, JoinBox, Server).
    -   Visualisasikan lokasi semua aset pada peta interaktif (Leaflet).
    -   Impor aset secara massal dari file `.kml` (Google Earth).
    -   Hubungkan ODP ke ODC dan pengguna PPPoE ke ODP.
-   **Sistem Otentikasi & Keamanan:**
    -   Login aman dengan verifikasi dua langkah (2FA) melalui OTP WhatsApp.
    -   Manajemen sesi aktif, memungkinkan pengguna untuk keluar dari perangkat lain.
    -   Pembaruan profil, ganti password, dan hapus akun.
-   **Sistem Workspace & Perangkat:**
    -   Dukungan untuk beberapa perangkat MikroTik dalam satu workspace.
    -   Pilih perangkat mana yang ingin dipantau secara aktif.
    -   Bagikan seluruh konfigurasi workspace (aset, perangkat) ke pengguna lain dengan kode unik.

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Bagian    | Teknologi                                                                                                  |
| :-------- | :--------------------------------------------------------------------------------------------------------- |
| **Backend** | Node.js, Express.js, MySQL, WebSocket (`ws`), JWT, Bcrypt.js, `node-routeros`, `@whiskeysockets/baileys` |
| **Frontend**| React, Vite, Tailwind CSS, React Router, Chart.js, Leaflet, Lucide Icons                                   |
| **Database**| MySQL                                                                                                      |

---

## 🚀 Memulai

Untuk menjalankan proyek ini di lingkungan lokal Anda, ikuti langkah-langkah berikut.

### Prasyarat

-   [Node.js](https://nodejs.org/) (v18 atau lebih tinggi direkomendasikan)
-   [pnpm](https://pnpm.io/installation) sebagai manajer paket (`npm install -g pnpm`)
-   Server Database [MySQL](https://www.mysql.com/)
-   Perangkat MikroTik yang dapat diakses dari server backend.

### Instalasi & Konfigurasi

1.  **Clone Repositori**
    ```bash
    git clone [https://github.com/username_anda/skydash-monitoring.git](https://github.com/username_anda/skydash-monitoring.git)
    cd skydash-monitoring
    ```

2.  **Instal Dependensi di Seluruh Proyek**
    Jalankan dari direktori root untuk menginstal dependensi backend dan frontend sekaligus.
    ```bash
    pnpm install
    ```

3.  **Konfigurasi Backend**
    -   Pindah ke direktori backend: `cd backend`
    -   Buat file `.env` dari contoh yang ada. Anda bisa membuat file `.env.example` terlebih dahulu.
        ```
        # backend/.env.example
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=password_database_anda
        DB_NAME=skydashnet
        JWT_SECRET=kunci_rahasia_jwt_yang_panjang_dan_aman
        ```
    -   Salin isinya ke file `.env` baru dan sesuaikan dengan konfigurasi database Anda.
    -   **Setup Database:** Buat database MySQL dengan nama yang Anda tentukan di `.env` (misal: `skydashnet`). Import skema tabel yang dibutuhkan (Anda perlu membuat file SQL untuk ini).

4.  **Konfigurasi Frontend**
    -   Frontend sudah dikonfigurasi di `frontend/vite.config.js` untuk melakukan proxy permintaan API ke backend (`http://192.168.1.2:3001`). Pastikan alamat IP dan port ini sesuai dengan alamat server backend Anda saat pengembangan.

### Menjalankan Aplikasi

Jalankan perintah berikut dari direktori **root** proyek:

```bash
pnpm run dev
```

Perintah ini akan menjalankan server backend dan server development frontend secara bersamaan menggunakan `concurrently`.

-   Backend akan berjalan di `http://localhost:3001` (atau port yang Anda tentukan).
-   Frontend akan dapat diakses di `http://localhost:5173` (atau port lain yang ditampilkan oleh Vite).

Setelah aplikasi berjalan, buka browser dan akses URL frontend. Anda harus melakukan registrasi, lalu login, dan kemudian mengkonfigurasi detail koneksi perangkat MikroTik Anda di halaman **Pengaturan**.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi ISC.