<div align="center">

<p align="center">
  <img src="mainlogo.png" alt="Nyx Panel Main Banner" width="100%" />
</p>

# 🛡️ Nyx Panel
### Advanced Anti-Censorship Xray-core Management Panel Tailored for High-Restricted Networks
#### 🔐 Developed by Cynet Security Team

[![Version](https://img.shields.io/badge/version-2.3.0-blueviolet?style=for-the-badge&logo=shield)](https://github.com/icynetx/Nyx)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2Ficynetx%2FNyx)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://github.com/icynetx/Nyx)
[![Telegram](https://img.shields.io/badge/Telegram-cynetx-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/cynetx)
[![YouTube Video](https://img.shields.io/badge/Watch_Video-pFEeQrtCg14-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/pFEeQrtCg14)
[![Website](https://img.shields.io/badge/Website-cynetx.ir-cyberCyan?style=for-the-badge)](https://cynetx.ir)
[![License](https://img.shields.io/badge/license-MIT-cyberGreen?style=for-the-badge)](https://github.com/icynetx/Nyx/blob/main/LICENSE)

<p align="center">
  <b>Language Options:</b>
  <br />
  <a href="README.md">🇮🇷 Persian (فارسی)</a> • <b>🇺🇸 English</b>
</p>

<p align="center">
  Designed for dynamic DPI network blackouts, active SNI filtering, and cross-border intranet traffic relay
  <br />
  <code>VLESS + REALITY (X25519)</code> · <code>Packet Fragment</code> · <code>Auto-Failover SNI</code> · <code>Cloudflare WARP</code> · <code>Auto DB Backup</code>
</p>

<p align="center">
  <a href="https://youtu.be/pFEeQrtCg14" target="_blank">
    <img src="https://i.ytimg.com/vi/pFEeQrtCg14/hqdefault.jpg" alt="Nyx Panel YouTube Video Demo" width="85%" />
  </a>
  <br />
  <br />
  <a href="https://youtu.be/pFEeQrtCg14" target="_blank">
    <img src="https://img.shields.io/badge/YouTube-Watch_Full_Video_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch on YouTube" />
  </a>
</p>

[⚡ Quick Installation](#-quick-installation-guide-linux--windows) •
[⚛️ Quantum MultiPath Engine](#-quantum-multipath-engine-v230---the-core-breakthrough) •
[🚀 What's New in v2.3](#-whats-new-in-version-230-release-highlights) •
[📊 Comparison Table](#-feature-comparison-table) •
[🧩 Detailed Features](#-detailed-feature-breakdown) •
[🤖 Telegram Bot Guide](#-telegram-bot-configuration--usage-guide) •
[📱 Client Apps](#-client-application-setup-guide) •
[🗑️ Uninstallation](#-uninstallation-guide)

</div>

---

## ⚛️ Quantum MultiPath Engine v2.3.0 — The Core Breakthrough

> 🔥 **The ultimate anti-blackout innovation no other panel provides.**

### The Real Challenge:
During extreme ISP censorship in Iran (e.g., nationwide internet throttling by MCI/Irancell), even state-of-the-art protocols like `VLESS Reality` and `Packet Fragment` experience connection loss. Users are left disconnected with no fallback.

### The Solution — Nyx Quantum MultiPath Engine:
A **quantum multi-route engine** that simultaneously monitors **4 independent connection paths** in real time:

```
🛡️ Route 1 (Standard):    Direct VLESS + REALITY ──► Free Internet ✅
☁️ Route 2 (DPI Blocked): Domestic Iran CDN (ArvanCloud PoP) ──► Server ──► Internet ✅
🌐 Route 3 (Heavy Cut):   DNS Tunnel via Port 53 ──► Internet ✅  
📡 Route 4 (Emergency):   L3 ICMP Ping Tunnel ──► Internet ✅
```

### Key Pillars:

| Feature | Description |
|---|---|
| **🔄 Auto-Switch** | Concurrently tests all 4 paths every 15s. Selects optimal route automatically. |
| **📊 Smart Subscriptions** | Subscription links automatically deliver the healthiest server ranked #1. |
| **🚨 Panic Mode** | If 100% of routes go down, sends instant Telegram alert + auto-recovery notification. |
| **📡 Live Dashboard** | Real-time web UI showing path latencies, health scores, and operational status. |

---

## 🚀 What's New in Version 2.3.0 (Release Highlights)

> [!TIP]
> ### ⚛️ 1. Quantum MultiPath 4-Route Parallel Engine
> * **15-Second Parallel Health Benchmarking:** Continuously checks 4 distinct routing layers concurrently via non-blocking asynchronous promises (`Promise.allSettled`).
> * **Full Network Layer Coverage:** Route 1 (Direct VLESS Reality), Route 2 (Domestic ArvanCloud PoP CDN), Route 3 (Port 53 DNS Tunnel), and Route 4 (L3 ICMP Ping).
> * **Seamless Failover:** Traffic automatically switches to the best-performing path with zero user friction.

> [!IMPORTANT]
> ### ⚖️ 2. Health-Scored Smart Subscription Load Balancer
> * **Real-Time Dynamic Server Scoring:** All enabled inbounds receive an ongoing 0–100 health score computed from real-time TLS handshake latency, rolling uptime percentage, and historical stability.
> * **Best Server Delivered #1:** Whenever users or clients refresh their subscription link, the healthiest, lowest-latency server is automatically positioned at the top of the config list.

> [!CAUTION]
> ### 🚨 3. Panic Mode Total Blackout Detection & Telegram Alerts
> * **100% International Outage Detection:** Utilizes hysteresis logic (requires 3 consecutive failed checks to prevent false alarms).
> * **Instant Telegram Alerts:** Sends instant emergency notification to the Admin Telegram bot when blackout occurs, and dispatches a celebration/recovery summary with exact outage duration (minutes & seconds) once connectivity is restored.

> [!NOTE]
> ### 📊 4. Live MultiPath Health Dashboard UI
> * **Animated Real-Time Path Cards:** Live latency in milliseconds, dynamic color-coded score bars (green/yellow/red), and `★ BEST` badge for the optimal route.
> * **1-Click Force Recheck:** Admins can trigger an immediate multi-route diagnostic directly from the Web UI.

> [!TIP]
> ### 🎨 5. Warm Luxury Glassmorphism & Modern Soft UI/UX
> * **Warm Ergonomic Color Palette:** Replaced harsh neon glare with deep warm obsidian, gentle amber gold, soothing emerald, and rose accents alongside subtle ambient radial backlights.
> * **100% Mobile Responsive:** Redesigned responsive touch cards, mobile navigation bar, and modals tailored for seamless operation on phones, tablets, and desktops.

---

## 📦 Key Highlights from Version 2.2.0 (Previous Release)

> [!TIP]
> ### 💾 1. Automated Database Backup & 1-Click Instant Restore (Auto DB Backup & Restore)
> * **24-Hour Automated Backup:** Dispatches encrypted SQLite `.db` backups with SHA-256 integrity checksums straight to the Admin Telegram bot.
> * **3-Second 1-Click Server Migration:** Upload `.db` file to Telegram Bot to restore all users and configurations in under 3 seconds!

> [!IMPORTANT]
> ### 🛡️ 2. Smart Dynamic Anti-Blackout Auto-Failover SNI Daemon (Smart Auto-Failover)
> * Continuously monitors TLS 1.3 handshakes across inbounds and auto-switches blocked SNIs to Whitelist domains without modifying user links.

> [!NOTE]
> ### 🌐 3. 1-Click Cloudflare WARP Outbound & System Control
> * Complete unblocking for OpenAI, ChatGPT, Netflix, and VPS IP shielding, alongside 1-click panel restart from the web interface.

<br />

<p align="center">
  <img src="media_warp_backup.png" alt="Nyx Panel Dashboard" width="100%" />
  <br />
  <i>Nyx Panel Control Center: Cloudflare WARP Outbound & Database Backup modules</i>
</p>

---

## 📌 Why Nyx Panel?

Under extreme network censorship, Deep Packet Inspection (`DPI`) algorithms dynamically evolve. Traditional panels suffer from heavy memory consumption (300MB+ RAM), complex dependencies, or lack of automated monitoring tools during severe blackouts.

**Nyx Panel** is engineered as a lightweight (~70MB RAM), secure, cross-platform solution focused on modern `Xray` capabilities. It offers **100% button-driven Telegram Bot management**, **standalone user web portals**, **live TLS SNI benchmarking**, and **automated intranet tunnel generators**.

---

## 📊 Feature Comparison Table

| Feature / Capability | 🛡️ Nyx Panel v2.3 | 3x-ui (Sanaei) | Marzban |
|---|:---:|:---:|:---:|
| **⚛️ Quantum MultiPath 4-Route Engine** | **Yes (4 Parallel Live Routes)** | No | No |
| **⚖️ Smart Health Load Balancer for Subscriptions** | **Yes (Auto-sorts healthiest server)** | No | No |
| **🚨 Panic Mode Blackout Detection & Telegram Alert** | **Yes (Hysteresis-based)** | No | No |
| **🎨 Warm Luxury Glassmorphism & Soft UI** | **Yes (100% Responsive)** | Classic Dark | Basic Dashboard |
| **Cross-Platform (Linux + Windows Server)** | **Yes (Native PowerShell + Bash)** | Linux Only | Linux Only |
| **RAM Footprint (Memory)** | **Lightweight (~70 MB)** | Moderate (~250 MB) | Heavy (~400 MB+) |
| **Automated Telegram DB Backup & 1-Click Restore** | **Yes (Auto 24h & Telegram Upload)** | Complex Manual | Manual Script |
| **Smart Auto-Failover SNI Daemon** | **Yes (DPI Blackout Auto-Switch)** | No | No |
| **1-Click Cloudflare WARP Outbound** | **Yes (Anti-Sanction & IP Shield)** | Complex Manual | Complex Manual |
| **Token-based Authentication** | **Yes (Secure Auth)** | Yes | Yes |
| **Live Traffic Sync via gRPC** | **Yes (Every 20 seconds)** | Yes | Yes |
| **Live TLS SNI Handshake Tester** | **Built-in Panel Tool** | No | No |
| **100% Button-driven Telegram Bot** | **Yes (Step-by-step Wizard)** | Limited | Command-based |
| **Standalone User Web Page** | **Yes (`/subinfo/UUID`)** | No | Basic |
| **Intranet Tunnel Generator** | **Yes (Gost v3 / ICMP / DNS)** | No | No |
| **VLESS + REALITY Support** | **Yes (X25519 Keypair)** | Yes | Yes |

---

## 💻 Quick Installation Guide (Linux & Windows)

### 🐧 1. Linux Server Installation (Ubuntu / Debian / CentOS / AlmaLinux):
Run the following 1-line command as **root** in your terminal:

```bash
bash <(curl -Ls https://raw.githubusercontent.com/icynetx/Nyx/main/install.sh)
```
```

---

### 🪟 2. Windows Server Installation (Windows Server 2016-2022 / Windows 10/11):
Open **PowerShell** as **Run as Administrator** and execute:

```powershell
iwr -useb https://raw.githubusercontent.com/icynetx/Nyx/main/install.ps1 | iex
```

---

### ☁️ 3. Free Cloud PaaS Deployment (Railway / Render / Docker):

If you do not have a dedicated VPS or want to run Nyx Panel on free cloud container platforms like **Railway.app**:

#### 💡 Key Advantages of Cloud PaaS Deployment:
* 💸 **Zero VPS Hosting Costs:** Deploy and run full anti-censorship nodes without purchasing expensive dedicated servers.
* 🛡️ **Cloudflare CDN Edge Acceleration:** User traffic runs over **VLESS WebSocket on standard Port 443 with TLS** over Railway edge proxy (`*.up.railway.app`).
* ⚡ **High Reliability & Anti-Blocking:** Features smart HTTP/WS multiplexing to seamlessly route proxy traffic and avoid ISP IP bans.

---

#### 🚀 Step-by-Step Railway Deployment Guide (Under 1 Minute):

> [!NOTE]
> All you need is a free **GitHub account** to sign into Railway (no credit card required).

1. **Sign in to Railway:** Visit [railway.com](https://railway.com) and click **Login with GitHub**.
2. **Create New Project:** Click the purple **`+ New Project`** button in the dashboard.
3. **Deploy from GitHub:** Select the **`Deploy from GitHub repo`** option.
4. **Choose Nyx Repository:** Search for and select:
   ```text
   icynetx/Nyx
   ```
   *(or paste the repository URL `https://github.com/icynetx/Nyx`)*
5. **Start Deployment:** Click **`Deploy Now`**. Railway will automatically build the multi-stage Dockerfile and start Xray-core (takes ~60-90 seconds).
6. **Generate Free HTTPS Public Domain:**
   * Once the deployment status turns green (`Active 🟢`), click on the project box.
   * Go to the **Settings** tab.
   * Scroll down to the **Networking** section.
   * Click **Generate Domain**. Railway will instantly assign a free HTTPS URL (e.g. `nyx-production.up.railway.app`).
7. **Access Dashboard & Connect Users:**
   * Open the generated domain in your web browser.
   * Log in with default credentials:
     * **Username:** `admin`
     * **Password:** `nyx2026!`
   * Go to the **Users** tab, copy the subscription link, and import it into your client app (v2rayNG, Streisand, Shadowrocket, etc.).
   * The `⚡ Railway-Cloud-WSS` configuration is automatically ready to connect!

---

#### 🐳 Self-Hosted Docker / Docker Compose:

If you prefer running on your own VPS or local server with Docker:

```bash
# Quick start with Docker Compose
docker-compose up -d

# Or run directly with Docker CLI
docker run -d \
  --name nyx-panel \
  -p 3000:3000 \
  -p 443:443 \
  -v nyx_data:/data \
  --restart unless-stopped \
  ghcr.io/icynetx/nyx:latest
```

---

### 🔑 Interactive Setup Credentials:
During installation, the script prompts for initial credentials (press Enter for default values):
1. 👤 **Admin Username** (Default: `admin`)
2. 🔐 **Admin Password** (Default: `nyx2026!`)
3. 🌐 **Panel Port** (Default: `3000`)

Upon completion, your installation summary will be displayed:

```text
====================================================
✅ Nyx Panel Successfully Installed & Started!
====================================================
🌐 Dashboard Web UI: http://YOUR_SERVER_IP:3000
👤 Admin Username:  admin
🔐 Admin Password:  nyx2026!
🔒 Status: Active & Systemd Enabled (nyx.service)
====================================================
```

---

## 🧩 Detailed Feature Breakdown

### 📦 1. Automated Database Backup & 1-Click Instant Restore (v2.2)
- **24h Scheduled Backups:** Automatically dispatches SQLite database files (`.db`) with active users, quotas, and inbounds to Telegram.
- **1-Click Restore:** Upload any `.db` backup file to the Telegram bot to restore all users and reload Xray in 3 seconds.
- **SHA-256 Checksum:** Verifies data integrity to prevent corrupted file restores.

### 🛡️ 2. Smart Auto-Failover SNI Daemon (v2.1)
- **60s TLS 1.3 Probe:** Continuous background probing on port 443.
- **DPI Detection:** Automatically detects ISP domain bans.
- **Seamless Switch:** Auto-replaces blocked SNIs with Whitelist domains without altering user subscription URLs.

### 🌐 3. 1-Click Cloudflare WARP Outbound (v2.1)
- **Official Cloudflare API:** Auto-generates WireGuard keypairs and registers IPv4/IPv6 WARP addresses.
- **Anti-Sanction Shield:** Unlocks ChatGPT, OpenAI, Netflix, Spotify.
- **Dual Routing Modes:** Route 100% traffic (`ALL`) or Sanctioned sites only (`SANCTIONED`).

### 🔒 4. `VLESS + REALITY` with Custom `X25519` Keypairs
- **Domainless Architecture:** No need to buy domains or SSL certificates. Mimics TLS 1.3 handshakes to global sites (`yahoo.com`, `archive.ubuntu.com`, `ebanking.banksepah.ir`).
- **Dynamic X25519 Keys:** Automatically generates fresh 256-bit keypairs for every inbound.

### ⚡ 5. Xray Packet Fragment (`TLS Client Hello`)
- **DPI Evasion:** Splits initial TLS Client Hello packets to evade SNI detection.
- **ISP Profiles:** Pre-configured fragment sizes for MCI, Irancell, and Intranet networks.

### 🤖 6. 100% Button-driven Telegram Admin Bot
- **Passwordless Admin Auth:** Authenticates based on Telegram `Chat ID`.
- **Step-by-Step Wizards:** Create users, set bandwidth limits, choose duration, and fetch subscription links via inline buttons.
- **Database Management:** Download database backups or trigger instant restores directly inside Telegram chat.

### 🌐 7. Standalone User Web Portal (`/subinfo/:uuid`)
- **No Login Required:** Accessible at `http://SERVER_IP:3000/subinfo/UUID`.
- **Live Traffic Meter:** Visual progress bar showing consumed, remaining, and total GB.
- **1-Tap Copy & QR Code:** Copy VLESS, Clash Meta YAML, Sing-Box JSON, or Base64 links.

---

## 🤖 Telegram Bot Configuration & Usage Guide

```mermaid
graph LR
    A["1. Create Bot via @BotFather"] --> B["2. Get Chat ID via @userinfobot"]
    C["3. Save in Panel Settings"] --> D["🚀 Enjoy Button-driven Admin Bot!"]
```

1. Navigate to **"Bot & Settings"** tab in Nyx Web Dashboard.
2. Enter your bot token from [@BotFather](https://t.me/BotFather).
3. Enter your numerical Telegram Chat ID from [@userinfobot](https://t.me/userinfobot) and click **"Save & Start Bot"**.
4. Message `/start` to your bot to activate the interactive admin reply keyboard!

---

## 📱 Client Application Setup Guide

| Client Application | Platform | Input Configuration | How to Add |
|---|---|---|---|
| **v2rayNG** | Android | Base64 Subscription or VLESS Link | Import from Clipboard / Scan QR |
| **Streisand** | iOS (iPhone / iPad) | VLESS Link or Subscription | Scan QR Code or Paste Link |
| **Sing-Box** | Android / iOS / Windows | Subscription URL or JSON | Add Subscription / Remote |
| **V2rayN** | Windows | VLESS Link or Subscription | `Ctrl+V` or Add Subscription |
| **MahsaNG** | Android | VLESS Link / Subscription | Copy link and tap + |
| **Shadowrocket** | iOS (iPhone / iPad) | VLESS Link or QR Code | Scan QR Code or Paste Link |
| **Hiddify** | All Platforms | Subscription URL | Paste Subscription Link |
| **Clash Meta / Stash** | Windows / macOS / iOS | YAML File / Sub | Import YAML or Remote Sub |

---

## 🌐 Intranet Traffic Relay Setup Guide

If direct connection to your foreign VPS is disrupted, relay user traffic through an Iranian Intranet server via secure tunnels:

```mermaid
flowchart LR
    User["👤 Client (Iran)"] -->|VLESS/REALITY| IranServer["🇮🇷 Iran Server (Relay)"]
    IranServer -->|Gost v3 / ICMP Tunnel| KharejServer["🌐 Foreign VPS (Master)"]
    KharejServer -->|Uncensored Traffic| Internet["🌍 Free Internet"]
```

1. Open **"Intranet Tunnels"** tab in Nyx Panel.
2. Enter Foreign VPS IP, Inbound Port, and Tunnel Port.
3. Select tunnel protocol (Gost v3, Rathole, or ICMP Ping Tunnel) and click **"Generate Scripts"**.
4. Execute generated bash scripts on Iran and Foreign servers respectively.

---

## 🛠️ Linux Systemd Service Management

- **View Status:** `systemctl status nyx`
- **Restart Service:** `systemctl restart nyx`
- **View Live Logs:** `journalctl -u nyx -f`
- **Stop Service:** `systemctl stop nyx`

---

## 🗑️ Uninstallation Guide

### 🐧 1. Complete Uninstallation on Linux:
Run as **root**:

```bash
curl -sSL "https://raw.githubusercontent.com/icynetx/Nyx/main/uninstall.sh" | sudo bash
```

---

### 🪟 2. Complete Uninstallation on Windows Server:
Open **PowerShell** as **Run as Administrator**:

```powershell
Unregister-ScheduledTask -TaskName "NyxPanelService" -Confirm:$false -ErrorAction SilentlyContinue
Get-Process -Name "node", "xray" -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Path "C:\Nyx" -Recurse -Force -ErrorAction SilentlyContinue
```

---

## 📢 Cynet Security Team & Community

Developed with ❤️ by **Cynet Security Team**.

- 📢 **Telegram Support & Bug Reports:** [t.me/cynetx](https://t.me/cynetx)
- 🎥 **YouTube Channel:** [youtube.com/@cynetxir](https://www.youtube.com/@cynetxir)
- 🌐 **Official Website:** [cynetx.ir](https://cynetx.ir)

---

## 📄 License

Distributed under the open-source **MIT License**.
