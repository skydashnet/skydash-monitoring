# SkydashNET - Dasbor Monitoring MikroTik

![License](https://img.shields.io/badge/license-ISC-blue.svg)

SkydashNET is a powerful *full-stack* web application for monitoring and managing MikroTik devices in *real-time*. Built with a modern technology stack, the dashboard provides an intuitive interface for network data visualization, user management, whatsapp-bot interaction, and asset mapping.


## ✨ Key Features

 **Real-time Dashboard:** Monitor CPU, Memory and network traffic (ethernet & PPPoE) usage in real time using interactive graphs updated via WebSockets.
- **PPPoE Management:**
    - View a summary of total, active and inactive users.
    - Complete list of all PPPoE *secrets* with connection status.
    - Add new PPPoE users with intelligent automatic IP allocation.
- **Hotspot Management:**
    - View a summary of total and active Hotspot users.
    - View a list of all registered Hotspot users along with total data usage.
    - Monitor *live* traffic (upload/download) for each active user.
- **Asset Management & Mapping:**
    - Add, edit and delete physical network assets (ODC, ODP, JoinBox, Server).
    - Visualize the location of all assets on an interactive map (Leaflet).
    - Bulk import assets from `.kml` files (Google Earth).
    - Connect ODP to ODC and PPPoE users to ODP.
- **Authentication & Security System:**
    - Secure login with two-step verification (2FA) via WhatsApp OTP.
    - Active session management, allowing users to log out from other devices.
    - Profile updates, change passwords, and delete accounts.
- **Workspace & Device System:**
    - Support for multiple MikroTik devices in one workspace.
    - Select which devices to actively monitor.
    - Share the entire workspace configuration (assets, devices) to other users with a unique code.

## 🛠️ Tech Stack

| Part    | Technology                                                                                                  |
| :-------- | :--------------------------------------------------------------------------------------------------------- |
| **Backend** | Node.js, Express.js, MySQL, WebSocket (`ws`), JWT, Bcrypt.js, `node-routeros`, `@whiskeysockets/baileys` |
| **Frontend**| React, Vite, Tailwind CSS, React Router, Chart.js, Leaflet, Lucide Icons                                   |
| **Database**| MySQL                                                                                                      |

---

## 🚀 Getting Started

To run this project on your local environment, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/installation) as a package manager (`npm install -g pnpm`)
- [MySQL](https://www.mysql.com/) Database Server
- MikroTik device accessible from the backend server.

### Installation & Configuration

1. **Clone Repository**
```bash
git clone https://github.com/skydashnet/skydash-monitoring.git
cd skydash-monitoring
```

2. **Install Dependencies Across Projects**
Run from the root directory to install both backend and frontend dependencies.
```bash
pnpm install
```

3. **Backend Configuration**
- Move to the backend directory: `cd backend`
- Create a `.env` file from the existing example. You can create a `.env.example` file first.

```
# backend/.env.example
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=skydashnet
JWT_SECRET=long_and_secure_jwt_secret_key
```
- Copy the contents to a new `.env` file and adjust it to your database configuration.
- **Database Setup:** Create a MySQL database with the name you specified in `.env`. Import the required table schemas. You can see the commands in the [Database wiki](https://github.com/skydashnet/skydash-monitoring/wiki/Database-Structure)

4. **Frontend Configuration**
- The frontend is already configured in `frontend/vite.config.js` to proxy API requests to the backend (`http://192.168.1.2:3001`). Make sure that this IP address and port match your backend server address during development.

### Running the Application

Run the following command from the project's **root** directory:

```bash
pnpm run dev
```

This command will run the backend server and the frontend development server simultaneously using `concurrently`.

- The backend will run on `http://localhost:3001` (or the port you specify).
- The frontend will be accessible on `http://localhost:5173` (or another port displayed by Vite).

Once the application is running, open a browser and access the frontend URL. You will need to register, then login, and then configure your MikroTik device connection details on the **Settings** page.

---

## 📄 License

This project is licensed under the ISC License.