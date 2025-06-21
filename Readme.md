# Skydash.NET - Dasbor Monitoring MikroTik

![License](https://img.shields.io/badge/license-ISC-blue.svg)

Skydash.NET is a powerful *full-stack* web application for monitoring and managing MikroTik devices in *real-time*. Built with a modern technology stack, the dashboard provides an intuitive interface for network data visualization, user management, WhatsApp bot interaction, and asset mapping.

## ✨ Key Features

- **Real-time Dashboard:** Monitor CPU, Memory and network traffic (ethernet & PPPoE) usage in real time using interactive graphs updated via WebSockets.
- **PPPoE & Hotspot Management:**
    - View summaries of total, active, and inactive users for both services.
    - Manage users, including adding new ones with intelligent IP allocation (for PPPoE) and a **Voucher Generator UI** (for Hotspot).
    - View detailed information for each PPPoE user on a dedicated page.
- **Network Inspection Tools**:
    - View the router's live **ARP Table** to identify all connected devices on the network.
- **Asset Management & Mapping:**
    - Add, edit and delete physical network assets (ODC, ODP, JoinBox, Server).
    - Visualize the location of all assets on an interactive map (Leaflet) and import assets in bulk from `.kml` files.
- **Advanced WhatsApp Bot**:
    - **Remote Control**: Execute powerful commands like `.reboot`, `.backup`, and `.speedtest` directly from WhatsApp.
    - **Proactive Alarms**: Configure and receive automatic notifications for high **CPU load** and when a **device goes offline**.
- **Secure & Multi-Tenant System:**
    - Secure login with two-step verification (2FA) via WhatsApp OTP.
    - Manage multiple MikroTik devices and share workspace configurations with other users via a unique code.

## 🛠️ Tech Stack

| Part      | Technology                                                                                                  |
| :-------- | :---------------------------------------------------------------------------------------------------------- |
| **Backend** | Node.js, Express.js, MySQL, WebSocket (`ws`), JWT, Bcrypt.js, `node-routeros`, `@whiskeysockets/baileys`    |
| **Frontend**| React, Vite, Tailwind CSS, React Router, Chart.js, Leaflet, Lucide Icons                                    |
| **Database**| MySQL                                                                                                       |

---

## 🚀 Getting Started

To run this project on your local environment, please refer to our comprehensive **[[GitHub Wiki]]** for a full installation and configuration guide.