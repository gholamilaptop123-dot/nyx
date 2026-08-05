#!/bin/bash
# ==============================================================================
# 🛡️ Nyx Panel - One-Line Auto Installer for Any Linux Distribution
# Tailored for Iran Anti-Censorship & National Internet Blackout Bypass
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}🚀 Starting Nyx Panel Automated Installation...${NC}"
echo -e "${CYAN}====================================================${NC}"

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run as root (use sudo or su).${NC}"
  exit 1
fi

# 2. Interactive Admin Credentials & Port Setup
echo -e "${CYAN}----------------------------------------------------${NC}"
echo -e "${YELLOW}🔑 تنظیم اطلاعات ورود به پنل مدیریتی (Admin Setup):${NC}"
echo -e "${CYAN}----------------------------------------------------${NC}"

# Read from TTY if piped via curl | bash
exec 3<>&1
if [ -t 0 ]; then
  read -p "👤 نام کاربری ادمین (پیش‌فرض: admin): " INPUT_ADMIN_USER
  read -sp "🔐 کلمه عبور ادمین (پیش‌فرض: nyx2026!): " INPUT_ADMIN_PASS
  echo ""
  read -p "🌐 پورت اجرای پنل (پیش‌فرض: 3000): " INPUT_PORT
elif [ -e /dev/tty ]; then
  read -p "👤 نام کاربری ادمین (پیش‌فرض: admin): " INPUT_ADMIN_USER < /dev/tty
  read -sp "🔐 کلمه عبور ادمین (پیش‌فرض: nyx2026!): " INPUT_ADMIN_PASS < /dev/tty
  echo "" < /dev/tty
  read -p "🌐 پورت اجرای پنل (پیش‌فرض: 3000): " INPUT_PORT < /dev/tty
fi

ADMIN_USER=${INPUT_ADMIN_USER:-admin}
ADMIN_PASS=${INPUT_ADMIN_PASS:-nyx2026!}
PANEL_PORT=${INPUT_PORT:-3000}

# 3. Update System & Install Dependencies
echo -e "${YELLOW}📦 Updating system packages & installing dependencies...${NC}"
if command -v apt-get &> /dev/null; then
  apt-get update -y
  apt-get install -y curl wget git unzip build-essential nodejs npm iptables
elif command -v yum &> /dev/null; then
  yum update -y
  yum install -y curl wget git unzip gcc-c++ make nodejs npm iptables
elif command -v dnf &> /dev/null; then
  dnf update -y
  dnf install -y curl wget git unzip gcc-c++ make nodejs npm iptables
fi

# 4. Setup Project Directory
INSTALL_DIR="/opt/nyx"
echo -e "${YELLOW}📂 Installing Nyx Panel to ${INSTALL_DIR}...${NC}"

if [ -d "${INSTALL_DIR}/.git" ]; then
  echo -e "${YELLOW}🔄 Updating existing Nyx installation from GitHub...${NC}"
  git config --global --add safe.directory ${INSTALL_DIR} 2>/dev/null || true
  cd ${INSTALL_DIR} && git fetch --all && git reset --hard origin/main || true
else
  rm -rf ${INSTALL_DIR}
  echo -e "${YELLOW}🔄 Cloning repository from GitHub / Anti-Block Mirror...${NC}"
  git clone --depth 1 https://github.com/icynetx/Nyx.git ${INSTALL_DIR} 2>/dev/null || \
  git clone --depth 1 https://ghproxy.net/https://github.com/icynetx/Nyx.git ${INSTALL_DIR} 2>/dev/null || \
  git clone --depth 1 https://mirror.ghproxy.com/https://github.com/icynetx/Nyx.git ${INSTALL_DIR} 2>/dev/null || \
  (curl -sSL https://ghproxy.net/https://github.com/icynetx/Nyx/archive/refs/heads/main.zip -o /tmp/nyx.zip && unzip -q /tmp/nyx.zip -d /tmp && mv /tmp/Nyx-main ${INSTALL_DIR})
fi

chmod +x ${INSTALL_DIR}/backend/bin/xray 2>/dev/null || true
cd ${INSTALL_DIR}

# 5. Install Backend Dependencies & Database Setup
echo -e "${YELLOW}⚙️ Building Backend Service & Database...${NC}"
cd ${INSTALL_DIR}/backend
npm install
npx prisma db push
npm run build

# Create .env file with chosen credentials
cat <<EOF > ${INSTALL_DIR}/backend/.env
PORT=${PANEL_PORT}
ADMIN_USER=${ADMIN_USER}
ADMIN_PASS=${ADMIN_PASS}
EOF

# 6. Install & Build Frontend
echo -e "${YELLOW}🎨 Building Modern Frontend Dashboard...${NC}"
cd ${INSTALL_DIR}/frontend
npm install
npm run build

# 7. Create Systemd Service for Nyx
echo -e "${YELLOW}⚙️ Configuring Systemd Background Service...${NC}"
cat <<EOF > /etc/systemd/system/nyx.service
[Unit]
Description=Nyx Anti-Censorship Xray Management Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}/backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=${PANEL_PORT}
Environment=ADMIN_USER=${ADMIN_USER}
Environment=ADMIN_PASS=${ADMIN_PASS}

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nyx
systemctl restart nyx

# 8. Get Public IP
SERVER_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}✅ Nyx Panel Successfully Installed & Started!${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "${CYAN}🌐 Dashboard Web UI:${NC} http://${SERVER_IP}:${PANEL_PORT}"
echo -e "${CYAN}👤 Admin Username:${NC}  ${YELLOW}${ADMIN_USER}${NC}"
echo -e "${CYAN}🔐 Admin Password:${NC}  ${YELLOW}${ADMIN_PASS}${NC}"
echo -e "${CYAN}🔒 Status:${NC} Active & Systemd Enabled (nyx.service)"
echo -e "${CYAN}📌 Commands:${NC}"
echo -e "   - Check Status: ${YELLOW}systemctl status nyx${NC}"
echo -e "   - Restart Panel: ${YELLOW}systemctl restart nyx${NC}"
echo -e "   - View Logs:    ${YELLOW}journalctl -u nyx -f${NC}"
echo -e "${GREEN}====================================================${NC}"
