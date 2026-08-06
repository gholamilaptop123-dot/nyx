#!/bin/bash
# ==============================================================================
# 🛡️ Nyx Panel - One-Line Auto Installer for Any Linux Distribution
# Tailored for Iran Anti-Censorship & National Internet Blackout Bypass
# ==============================================================================

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
  echo -e "${RED}❌ Error: Please run as root (use sudo bash install.sh).${NC}"
  exit 1
fi

# 2. Interactive Credentials Setup
echo -e "${CYAN}----------------------------------------------------${NC}"
echo -e "${YELLOW}🔑 تنظیم اطلاعات ورود به پنل مدیریتی (Admin Setup):${NC}"
echo -e "${CYAN}----------------------------------------------------${NC}"

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
PANEL_PORT=${INPUT_PORT:-3080}

# 3. Check & Prepare System Dependencies
echo -e "${YELLOW}📦 Checking system dependencies...${NC}"
export DEBIAN_FRONTEND=noninteractive

if ! command -v git &> /dev/null; then
  (apt-get install -y --no-install-recommends git || yum install -y git || dnf install -y git) 2>/dev/null || true
fi

if ! command -v unzip &> /dev/null; then
  (apt-get install -y --no-install-recommends unzip || yum install -y unzip || dnf install -y unzip) 2>/dev/null || true
fi

if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}🟢 Installing Node.js LTS...${NC}"
  (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y --no-install-recommends nodejs) 2>/dev/null || true
fi

# 4. Setup Project Directory
INSTALL_DIR="/opt/nyx"
echo -e "${YELLOW}📂 Installing Nyx Panel to ${INSTALL_DIR}...${NC}"

# Always navigate out of /opt/nyx before doing git operations or rm -rf
cd /tmp

git config --global --add safe.directory '*' 2>/dev/null || true

# Force full update by fetching or re-cloning
UPDATE_SUCCESS=0
if [ -d "${INSTALL_DIR}/.git" ]; then
  echo -e "${YELLOW}🔄 Updating existing Nyx installation from GitHub...${NC}"
  (cd ${INSTALL_DIR} && git fetch --all && git reset --hard origin/main) && UPDATE_SUCCESS=1 || true
fi

if [ "$UPDATE_SUCCESS" -eq 0 ]; then
  rm -rf ${INSTALL_DIR}
  echo -e "${YELLOW}🔄 Performing fresh clone from GitHub...${NC}"
  git clone --depth 1 https://github.com/icynetx/Nyx.git ${INSTALL_DIR} || \
  (curl -sSL https://github.com/icynetx/Nyx/archive/refs/heads/main.zip -o /tmp/nyx.zip && unzip -qo /tmp/nyx.zip -d /tmp && rm -rf ${INSTALL_DIR} && mv /tmp/Nyx-main ${INSTALL_DIR})
fi

chmod +x ${INSTALL_DIR}/backend/bin/xray 2>/dev/null || true
cd ${INSTALL_DIR}

# Clean old dist builds to guarantee fresh compilation
rm -rf ${INSTALL_DIR}/frontend/dist ${INSTALL_DIR}/backend/dist

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

# Kill any stale node processes on port
echo -e "${YELLOW}🧹 Terminating any stale processes on port ${PANEL_PORT}...${NC}"
fuser -k -9 ${PANEL_PORT}/tcp 2>/dev/null || true
pkill -9 -f "node.*backend" 2>/dev/null || true
pkill -9 -f "node.*index.js" 2>/dev/null || true
sleep 1

# Allow panel port, SSH port 22, and xray default ports in ufw and iptables safely
echo -e "${YELLOW}🛡️ Configuring firewall rules for port ${PANEL_PORT} (preserving SSH port 22)...${NC}"
iptables -I INPUT -p tcp --dport 22 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp --dport ${PANEL_PORT} -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
if command -v ufw &> /dev/null; then
  ufw allow 22/tcp 2>/dev/null || true
  ufw allow ${PANEL_PORT}/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
fi

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
