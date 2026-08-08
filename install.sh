#!/bin/bash
# ==============================================================================
# 🛡️ Nyx Panel - One-Line Auto Installer by Cynet Security Team
# Tailored for Iran Anti-Censorship & National Internet Blackout Bypass
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${PURPLE}"
echo "  ██████╗██╗   ██╗███╗   ██╗███████╗████████╗"
echo " ██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝╚══██╔══╝"
echo " ██║      ╚████╔╝ ██╔██╗ ██║█████╗     ██║   "
echo " ██║       ╚██╔╝  ██║╚██╗██║██╔══╝     ██║   "
echo " ╚██████╗   ██║   ██║ ╚████║███████╗   ██║   "
echo "  ╚═════╝   ╚═╝   ╚═╝  ╚═══╝╚══════╝   ╚═╝   "
echo -e "${NC}"
echo -e "${YELLOW}       🔥 CYNET SECURITY TEAM PRESENTS 🔥${NC}"
echo -e "${CYAN}       🚀 NYX PANEL v2.0 - NEXT-GEN VPN 🚀${NC}"
echo -e "${CYAN}====================================================${NC}"

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Error: Please run as root (use sudo bash install.sh).${NC}"
  exit 1
fi

# 2. Interactive Credentials Setup (Admin Username, Password & Web Port)
if [ -e /dev/tty ]; then
  echo -e "${YELLOW}🔑 Interactive Setup (Press Enter to use default values):${NC}"
  
  printf "${CYAN}👤 Admin Username [default: admin]: ${NC}" > /dev/tty 2>/dev/null || printf "👤 Admin Username [default: admin]: "
  read -r input_user < /dev/tty 2>/dev/null || read -r input_user || true
  ADMIN_USER=${input_user:-${ADMIN_USER:-admin}}

  printf "${CYAN}🔐 Admin Password [default: nyx2026!]: ${NC}" > /dev/tty 2>/dev/null || printf "🔐 Admin Password [default: nyx2026!]: "
  read -r input_pass < /dev/tty 2>/dev/null || read -r input_pass || true
  ADMIN_PASS=${input_pass:-${ADMIN_PASS:-nyx2026!}}

  printf "${CYAN}🌐 Web Panel Port [default: 3080]: ${NC}" > /dev/tty 2>/dev/null || printf "🌐 Web Panel Port [default: 3080]: "
  read -r input_port < /dev/tty 2>/dev/null || read -r input_port || true
  PANEL_PORT=${input_port:-${PORT:-3080}}
else
  ADMIN_USER=${ADMIN_USER:-admin}
  ADMIN_PASS=${ADMIN_PASS:-nyx2026!}
  PANEL_PORT=${PORT:-3080}
fi

echo -e "${CYAN}----------------------------------------------------${NC}"
echo -e "${GREEN}✅ Configured Credentials & Port:${NC}"
echo -e "   👤 Username: ${CYAN}${ADMIN_USER}${NC}"
echo -e "   🔐 Password: ${CYAN}${ADMIN_PASS}${NC}"
echo -e "   🌐 Fixed Port: ${CYAN}${PANEL_PORT}${NC}"
echo -e "${CYAN}----------------------------------------------------${NC}"

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

cd /tmp

git config --global --add safe.directory '*' 2>/dev/null || true

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

# 4.5 Pre-download and install Xray-core Binary
echo -e "${YELLOW}⚡ Downloading & Installing Xray-core Engine...${NC}"
mkdir -p ${INSTALL_DIR}/backend/bin
XRAY_BIN="${INSTALL_DIR}/backend/bin/xray"

ARCH=$(uname -m)
XRAY_ARCH="linux-64"
if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  XRAY_ARCH="linux-arm64-v8a"
fi

XRAY_TAG="v24.11.30"
XRAY_URL="https://github.com/XTLS/Xray-core/releases/download/${XRAY_TAG}/Xray-${XRAY_ARCH}.zip"
MIRROR_URL="https://ghproxy.net/${XRAY_URL}"

curl -sSL "$MIRROR_URL" -o /tmp/xray.zip || curl -sSL "$XRAY_URL" -o /tmp/xray.zip || true
if [ -f "/tmp/xray.zip" ]; then
  unzip -qo /tmp/xray.zip -d ${INSTALL_DIR}/backend/bin/ || true
  rm -f /tmp/xray.zip
fi

chmod +x ${INSTALL_DIR}/backend/bin/xray 2>/dev/null || true

if [ -f "$XRAY_BIN" ]; then
  echo -e "${GREEN}✅ Xray-core engine successfully installed at ${XRAY_BIN}!${NC}"
else
  echo -e "${YELLOW}⚠️ Xray binary will be auto-downloaded on backend startup.${NC}"
fi

cd ${INSTALL_DIR}
rm -rf ${INSTALL_DIR}/frontend/dist ${INSTALL_DIR}/backend/dist

# 5. Install Backend Dependencies & Database Setup
echo -e "${YELLOW}⚙️ Building Backend Service & Database...${NC}"
cd ${INSTALL_DIR}/backend
npm install
npx prisma db push
npm run build

cat <<EOF > ${INSTALL_DIR}/backend/.env
PORT=${PANEL_PORT}
ADMIN_USER=${ADMIN_USER}
ADMIN_PASS=${ADMIN_PASS}
NODE_ENV=production
EOF

# 6. Build Frontend Assets
echo -e "${YELLOW}🎨 Building Frontend Vue 3 Production App...${NC}"
cd ${INSTALL_DIR}/frontend
npm install
npm run build

# Copy build to dist fallback inside backend
mkdir -p ${INSTALL_DIR}/backend/dist/public
cp -r ${INSTALL_DIR}/frontend/dist/* ${INSTALL_DIR}/backend/dist/public/ 2>/dev/null || true

# 7. Setup Systemd Service
echo -e "${YELLOW}🚀 Creating Systemd Service (nyx.service)...${NC}"
NODE_BIN=$(command -v node || echo "/usr/bin/node")

cat <<EOF > /etc/systemd/system/nyx.service
[Unit]
Description=Nyx Panel Next-Gen Server Manager
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}/backend
ExecStart=${NODE_BIN} ${INSTALL_DIR}/backend/dist/index.js
Restart=always
RestartSec=3
SendSIGHUP=no
IgnoreSIGPIPE=true
KillMode=mixed
Environment=NODE_ENV=production
Environment=PORT=${PANEL_PORT}
Environment=ADMIN_USER=${ADMIN_USER}
Environment=ADMIN_PASS=${ADMIN_PASS}

[Install]
WantedBy=multi-user.target
EOF

loginctl enable-linger root 2>/dev/null || true

echo -e "${YELLOW}🧹 Terminating any stale processes on port ${PANEL_PORT} and freeing port 443 if occupied by Nginx/Apache/Caddy...${NC}"
fuser -k -9 ${PANEL_PORT}/tcp 2>/dev/null || true
pkill -9 -f "node.*backend" 2>/dev/null || true
pkill -9 -f "node.*index.js" 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true
systemctl stop caddy 2>/dev/null || true
systemctl disable caddy 2>/dev/null || true
fuser -k -9 443/tcp 2>/dev/null || true
sysctl -w net.ipv4.ip_forward=1 2>/dev/null || true
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf 2>/dev/null || true
sleep 1

# Safely detect SSH port from running sshd or default to 22
DETECTED_SSH_PORT=$(ss -tulpn 2>/dev/null | grep sshd | awk '{print $5}' | awk -F':' '{print $NF}' | head -n1)
SSH_PORT=${DETECTED_SSH_PORT:-22}

echo -e "${YELLOW}🛡️ Protecting SSH port (${SSH_PORT}) & opening traffic ports safely...${NC}"
iptables -P INPUT ACCEPT 2>/dev/null || true
iptables -P FORWARD ACCEPT 2>/dev/null || true
iptables -P OUTPUT ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -m state --state ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT 2>/dev/null || true
if [ -n "$SSH_PORT" ] && [ "$SSH_PORT" -ne 22 ] 2>/dev/null; then
  iptables -I INPUT 1 -p tcp --dport ${SSH_PORT} -j ACCEPT 2>/dev/null || true
fi
iptables -I INPUT 1 -p tcp --dport ${PANEL_PORT} -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 8443 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 2083 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 1010 -j ACCEPT 2>/dev/null || true
if command -v ufw &> /dev/null; then
  ufw allow 22/tcp 2>/dev/null || true
  if [ -n "$SSH_PORT" ] && [ "$SSH_PORT" -ne 22 ] 2>/dev/null; then
    ufw allow ${SSH_PORT}/tcp 2>/dev/null || true
  fi
  ufw allow ${PANEL_PORT}/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  ufw allow 443/udp 2>/dev/null || true
  ufw disable 2>/dev/null || true
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
echo -e "${CYAN}⚡ Default Inbound:${NC}  ${GREEN}VLESS REALITY Port 443 (Created Automatically)${NC}"
echo -e "${CYAN}🔒 Status:${NC} Active & Systemd Enabled (nyx.service)"
echo -e "${CYAN}----------------------------------------------------${NC}"
echo -e "${YELLOW}💬 پشتیبانی، فیدبک، نظرات و انتقادات تیم ساینت (Cynet):${NC}"
echo -e "   هرگونه سوال، باگ، پیشنهاد یا انتقادی داشتید در خدمت شما هستیم:"
echo -e "   📢 ${CYAN}کانال تلگرام:${NC} https://t.me/cynetx"
echo -e "   🌐 ${CYAN}وب‌سایت رسمی:${NC} https://cynetx.ir"
echo -e "   🎥 ${CYAN}یوتیوب:${NC}      https://www.youtube.com/@cynetxir"
echo -e "${GREEN}====================================================${NC}"
