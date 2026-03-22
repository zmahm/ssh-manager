# SSH Manager

A web-based SSH management application with a live terminal, real-time server statistics dashboard, and encrypted multi-profile storage. Runs in the browser and deploys as a native Android/iOS app via Capacitor.

![License](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![React](https://img.shields.io/badge/react-18-61dafb)

---

## Features

### Security
- **Master password gate** — AES-256-GCM credential encryption with PBKDF2 key derivation (310,000 iterations). The decryption key never touches disk or the database
- **JWT sessions** — 15-minute access tokens with rotating 7-day refresh tokens (bcrypt-hashed at rest)
- **Auto-lock** — app locks when backgrounded on mobile (Capacitor `appStateChange`)

### SSH Profile Management
- Password, private key (PEM), and SSH agent authentication
- **Jump host / bastion chaining** — reference any stored profile as a proxy
- Port forwarding rules (local and remote)
- Environment variable injection on connect
- Per-profile: custom colour, tags, keepalive interval, connection timeout
- Last-connected timestamp

### Live Terminal
- Full xterm.js terminal over WebSocket → ssh2
- **Multi-tab** — open multiple connections simultaneously
- PTY resize (ResizeObserver + FitAddon)
- In-terminal search, clickable URLs
- Themes: Dracula, Nord, One Dark, Tokyo Night

### Real-Time Stats Dashboard
All stats run over a dedicated SSH exec channel (separate from the terminal shell) via a single compound `/proc` command per poll.

| Widget | Data source |
|---|---|
| CPU | `/proc/stat` — per-core usage gauges + rolling line chart, load averages |
| Memory | `/proc/meminfo` — usage gauge + **auto-scaling area chart** (Y-axis windows to actual usage range) |
| GPU | `nvidia-smi` — per-GPU utilisation, memory, temperature (absent if no NVIDIA GPU) |
| Disk I/O | `/proc/diskstats` — reads/writes per second (nvme, sd*, mmcblk* supported) |
| Network | `/proc/net/dev` — rx/tx bytes/sec per interface + aggregate |
| Uptime | `/proc/uptime` + `/proc/loadavg` |
| Processes | `ps aux` — top 10 by CPU |

**Poll intervals:** 0.25s / 0.5s / 1s / 2s / 5s (configurable per session)

> Stats require a Linux target with `/proc`. macOS/FreeBSD targets show a friendly unsupported message.

### Mobile (Capacitor)
One React build deploys to browser, Android APK, and iOS IPA. The Node.js backend runs on any always-on machine; the Capacitor app connects to it over the network.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| State | Zustand 4, TanStack Query 5 |
| Terminal | xterm.js 5 |
| Charts | Recharts 2, Framer Motion 11 |
| Mobile | Capacitor 6 |
| Backend | Node.js (ESM), Express 4 |
| SSH | ssh2 |
| WebSocket | ws 8 |
| Database | SQLite via better-sqlite3 |
| Auth | bcryptjs, jsonwebtoken, Node crypto (AES-256-GCM) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A Linux server to SSH into (for stats; terminal works on any SSH target)

### 1. Clone and install

```bash
git clone https://github.com/zmahm/ssh-manager.git
cd ssh-manager
npm install
cd server && npm install && cd ..
```

### 2. Configure the server

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```env
PORT=3001
JWT_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<another-long-random-string>
DB_PATH=./data/sshapp.db
NODE_ENV=development
```

Generate secure secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Run in development

```bash
# Start both server and frontend together
npm run dev
```

Or separately:
```bash
# Terminal 1 — backend (port 3001)
cd server && node --watch index.js

# Terminal 2 — frontend (port 5173)
npm run dev:client
```

Open **http://localhost:5173** — the first launch prompts you to create a master password.

---

## Project Structure

```
ssh-manager/
├── server/
│   ├── db/
│   │   ├── database.js              # SQLite init + migrations runner
│   │   └── migrations/
│   │       ├── 001_create_users.sql
│   │       ├── 002_create_profiles.sql
│   │       └── 003_create_sessions.sql
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js                  # /api/auth — setup, login, refresh, logout
│   │   └── profiles.js              # /api/profiles — CRUD
│   ├── services/
│   │   ├── crypto.js                # PBKDF2 + AES-256-GCM
│   │   ├── sshManager.js            # ssh2 connection pool, jump host chaining
│   │   ├── statsCollector.js        # /proc parsers + delta rate computation
│   │   └── sessionStore.js          # In-memory active session map
│   ├── ws/
│   │   ├── wsServer.js              # WebSocket upgrade router
│   │   ├── terminalHandler.js       # Terminal WS ↔ ssh2 shell bridge
│   │   └── statsHandler.js          # Stats poll loop over SSH exec
│   └── index.js                     # Express + WS server entry
│
├── src/
│   ├── api/                         # Axios client + auth/profile calls
│   ├── store/                       # Zustand: auth, profiles, sessions
│   ├── hooks/                       # useWebSocket, useTerminal, useStats, useProfiles
│   ├── components/
│   │   ├── auth/                    # SetupScreen, LoginScreen
│   │   ├── layout/                  # AppShell, Sidebar, TopBar, TabBar
│   │   ├── profiles/                # ProfileList, ProfileCard, ProfileModal, ProfileForm
│   │   ├── terminal/                # TerminalPane, TerminalToolbar, themes
│   │   ├── stats/                   # StatsPane + 7 stat widgets
│   │   └── shared/                  # Button, Input, Modal, Badge, ColorPicker, AnimatedNumber
│   └── utils/                       # formatBytes, formatUptime, getBaseUrl
│
├── capacitor.config.ts
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

---

## SSH Profile Configuration

All fields supported:

| Field | Description |
|---|---|
| Host / IP | Target server address |
| Port | Default: 22 |
| Username | SSH login user |
| Auth type | `password` / `private key` (PEM) / `SSH agent` |
| Private key | Paste PEM content directly |
| Key passphrase | Optional passphrase for encrypted keys |
| Jump host | Select another profile as a bastion/proxy |
| Port forwards | Local or remote, multiple rules per profile |
| Env vars | Exported into the shell on connect |
| Tags | For filtering/grouping in the sidebar |
| Colour | Accent colour for the profile card and tab |
| Keepalive | Interval in ms (default 10,000) |
| Timeout | Connection timeout in ms (default 15,000) |

---

## Mobile Deployment

### Build

```bash
npm run build          # builds React app into /dist
npx cap add android    # first time only
npx cap sync           # copy dist + sync plugins
npx cap open android   # open in Android Studio
```

### Backend address

The mobile app connects to the Node.js backend over the network. Before building, set `VITE_API_URL` in a `.env.local` file:

```env
VITE_API_URL=http://192.168.1.100:3001
```

Or uncomment and edit the `server.url` field in `capacitor.config.ts` for dev mode pointing at your machine.

### iOS

iOS builds require a Mac with Xcode. Run `npx cap add ios` and `npx cap open ios` on a Mac after setting `VITE_API_URL`.

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/status` | Check if master password has been set up |
| POST | `/api/auth/setup` | First-run: create master password |
| POST | `/api/auth/login` | Authenticate, receive tokens + derived key |
| POST | `/api/auth/refresh` | Rotate access + refresh tokens |
| POST | `/api/auth/logout` | Invalidate all refresh tokens |

### Profiles

All endpoints require `Authorization: Bearer <token>` and `X-Derived-Key: <hex>` headers.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profiles` | List all profiles |
| GET | `/api/profiles/:id` | Get profile with decrypted credentials |
| POST | `/api/profiles` | Create profile |
| PUT | `/api/profiles/:id` | Update profile |
| DELETE | `/api/profiles/:id` | Delete profile |

### WebSocket

| Path | Description |
|---|---|
| `/ws/terminal?token=&key=` | Live terminal session |
| `/ws/stats?token=&key=` | Real-time stats stream |

**Terminal message protocol:**
```json
// Client → Server
{ "type": "connect", "profileId": "...", "sessionId": "...", "cols": 220, "rows": 50 }
{ "type": "resize", "cols": 220, "rows": 50 }
{ "type": "disconnect" }
// (binary frames) → raw terminal input

// Server → Client
{ "type": "ready" }
{ "type": "closed" }
{ "type": "error", "message": "..." }
// (binary frames) → raw terminal output
```

---

## Security Notes

- The derived encryption key is held **only in memory** (Zustand store + sessionStorage). It is never written to the database or localStorage.
- On lock/logout the key is nulled and sessionStorage is cleared.
- `authStore` deliberately has no Zustand `persist` middleware to prevent accidental key persistence.
- SSH agent forwarding on Windows uses the OpenSSH agent named pipe (`\\.\pipe\openssh-ssh-agent`). Falls back gracefully if unavailable.
- Stats polling stops and the connection is cleaned up if the WebSocket closes for any reason, preventing orphaned SSH exec channels.

---

## License

Copyright (c) 2025 Zeshan Mahmood

Licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). Free to use, modify, and self-host for personal and non-commercial purposes. Commercial use requires a separate license — contact zeshan.mahmood313@gmail.com.
