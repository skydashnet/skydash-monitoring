# SkydashNET - Dasbor Monitoring MikroTik

![License](https://img.shields.io/badge/license-ISC-blue.svg)

SkydashNET adalah aplikasi web *full-stack* yang canggih untuk memantau dan mengelola perangkat MikroTik secara *real-time*. Dibangun dengan tumpukan teknologi modern, dasbor ini menyediakan antarmuka yang intuitif untuk visualisasi data jaringan, manajemen pengguna, dan pemetaan aset.


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
    -   **Setup Database:** Buat database MySQL dengan nama yang Anda tentukan di `.env` (misal: `skydashnet`). Import skema tabel yang dibutuhkan 
```bash
CREATE DATABASE IF NOT EXISTS `skydashnet_db`;

USE `skydashnet_db`;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `password_hash` varchar(255) NULL,
  `profile_picture_url` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL UNIQUE,
  `google_id` varchar(255) DEFAULT NULL UNIQUE,
  `whatsapp_number` varchar(25) DEFAULT NULL,
  `workspace_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `workspaces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `active_device_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `whatsapp_bot_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `workspaces_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `users` 
ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE SET NULL;

CREATE TABLE `mikrotik_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) NOT NULL,
  `host` varchar(255) NOT NULL,
  `user` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `port` int(11) DEFAULT 8728,
  PRIMARY KEY (`id`),
  KEY `workspace_id` (`workspace_id`),
  CONSTRAINT `mikrotik_devices_ibfk_1` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `network_assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('ODC','ODP','JoinBox','Server') NOT NULL,
  `latitude` varchar(50) NOT NULL,
  `longitude` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `splitter_count` int(11) DEFAULT NULL,
  `parent_asset_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `workspace_id` (`workspace_id`),
  KEY `parent_asset_id` (`parent_asset_id`),
  CONSTRAINT `network_assets_ibfk_1` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `network_assets_ibfk_2` FOREIGN KEY (`parent_asset_id`) REFERENCES `network_assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `odp_user_connections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `pppoe_secret_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `workspace_secret_unique` (`workspace_id`,`pppoe_secret_name`),
  KEY `asset_id` (`asset_id`),
  CONSTRAINT `odp_user_connections_ibfk_1` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `odp_user_connections_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `network_assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_id` varchar(255) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `last_seen` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_id` (`token_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `workspace_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `workspace_id` (`workspace_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `workspace_invites_ibfk_1` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workspace_invites_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `pending_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `whatsapp_number` varchar(25) NOT NULL,
  `username` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `whatsapp_number_unique` (`whatsapp_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `login_otps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `login_otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `whatsapp_updates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `new_whatsapp_number` varchar(25) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `whatsapp_updates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE ip_pools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  profile_name VARCHAR(255) NOT NULL,
  ip_start VARCHAR(45) NOT NULL,
  ip_end VARCHAR(45) NOT NULL,
  gateway VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Pastikan setiap profil dalam satu workspace hanya punya satu pool IP
  UNIQUE KEY `workspace_profile_unique` (`workspace_id`, `profile_name`),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE alarms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g., 'PPPOE_TRAFFIC'
  threshold_mbps INT NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE' or 'MUTED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
```


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