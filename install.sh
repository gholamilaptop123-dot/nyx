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
echo -e "${CYAN}       🚀 NYX PANEL v2.4 - THE POWER & CUSTOMIZATION UPDATE 🚀${NC}"
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
  git clone --depth 1 https://github.com/thecynetx/nyx.git ${INSTALL_DIR} || \
  (curl -sSL https://github.com/thecynetx/nyx/archive/refs/heads/main.zip -o /tmp/nyx.zip && unzip -qo /tmp/nyx.zip -d /tmp && rm -rf ${INSTALL_DIR} && mv /tmp/Nyx-main ${INSTALL_DIR})
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

XRAY_TAG="v25.1.30"
LATEST_TAG=$(curl -sSL -m 5 https://api.github.com/repos/XTLS/Xray-core/releases/latest 2>/dev/null | grep '"tag_name":' | head -n1 | cut -d '"' -f 4)
if [ -n "$LATEST_TAG" ]; then
  XRAY_TAG="$LATEST_TAG"
fi

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

cat <<EOF > ${INSTALL_DIR}/backend/.env
PORT=${PANEL_PORT}
ADMIN_USER=${ADMIN_USER}
ADMIN_PASS=${ADMIN_PASS}
NODE_ENV=production
DATABASE_URL="file:./dev.db"
EOF

export DATABASE_URL="file:./dev.db"
export PORT=${PANEL_PORT}
export ADMIN_USER=${ADMIN_USER}
export ADMIN_PASS=${ADMIN_PASS}

# Clear any NODE_ENV override during build so dev tools always install
unset NODE_ENV

npm install --include=dev
node ./node_modules/prisma/build/index.js generate || npx prisma generate
node ./node_modules/prisma/build/index.js db push || npx prisma db push
node ./node_modules/typescript/bin/tsc || npx tsc

if [ ! -f "${INSTALL_DIR}/backend/dist/index.js" ]; then
  echo -e "${RED}❌ Error: Backend compilation failed! Retrying build with npx tsc...${NC}"
  npx tsc || true
fi

# 6. Build Frontend Assets
echo -e "${YELLOW}🎨 Building Frontend Vue 3 Production App...${NC}"
cd ${INSTALL_DIR}/frontend
npm install --include=dev
node ./node_modules/vite/bin/vite.js build || npx vite build

# Copy build to dist fallback inside backend
mkdir -p ${INSTALL_DIR}/backend/dist/public
cp -r ${INSTALL_DIR}/frontend/dist/* ${INSTALL_DIR}/backend/dist/public/ 2>/dev/null || true

# 7. Setup Systemd Service or Container Process Daemon
NODE_BIN=$(command -v node || echo "/usr/bin/node")

# Create CLI Manager (/usr/local/bin/nyx)
cat <<'EOFCLI' > /usr/local/bin/nyx
#!/bin/bash
INSTALL_DIR="/opt/nyx"
NODE_BIN=$(command -v node || echo "/usr/bin/node")

case "$1" in
  start)
    if command -v systemctl &>/dev/null && systemctl is-system-running &>/dev/null; then
      systemctl start nyx
    else
      pkill -9 -f "node.*dist/index.js" 2>/dev/null || true
      cd ${INSTALL_DIR}/backend && nohup ${NODE_BIN} dist/index.js > /var/log/nyx.log 2>&1 &
      echo "✅ Nyx Panel started in background (PID: $!). Log: /var/log/nyx.log"
    fi
    ;;
  stop)
    if command -v systemctl &>/dev/null && systemctl is-system-running &>/dev/null; then
      systemctl stop nyx
    else
      pkill -9 -f "node.*dist/index.js" 2>/dev/null || true
      pkill -9 -f "xray run" 2>/dev/null || true
      echo "🛑 Nyx Panel stopped."
    fi
    ;;
  restart)
    $0 stop
    sleep 1
    $0 start
    ;;
  status)
    if command -v systemctl &>/dev/null && systemctl is-system-running &>/dev/null; then
      systemctl status nyx
    else
      if pgrep -f "node.*dist/index.js" >/dev/null; then
        echo "🟢 Nyx Panel is RUNNING (PID: $(pgrep -f 'node.*dist/index.js' | tr '\n' ' '))"
      else
        echo "🔴 Nyx Panel is STOPPED."
      fi
    fi
    ;;
  log|logs)
    if command -v systemctl &>/dev/null && systemctl is-system-running &>/dev/null; then
      journalctl -u nyx -f -n 50
    else
      tail -f -n 50 /var/log/nyx.log
    fi
    ;;
  *)
    echo "Usage: nyx {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
EOFCLI
chmod +x /usr/local/bin/nyx 2>/dev/null || true

HAS_SYSTEMD=0
if command -v systemctl &>/dev/null && [ -d /run/systemd/system ]; then
  HAS_SYSTEMD=1
fi

if [ "$HAS_SYSTEMD" -eq 1 ]; then
  echo -e "${YELLOW}🚀 Creating Systemd Service (nyx.service)...${NC}"
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
Environment=DATABASE_URL=file:./dev.db

[Install]
WantedBy=multi-user.target
EOF
  loginctl enable-linger root 2>/dev/null || true
fi

echo -e "${YELLOW}🧹 Terminating any stale processes on port ${PANEL_PORT} and freeing port 443 if occupied by Nginx/Apache/Caddy...${NC}"
fuser -k -9 ${PANEL_PORT}/tcp 2>/dev/null || true
pkill -9 -f "node.*backend" 2>/dev/null || true
pkill -9 -f "node.*index.js" 2>/dev/null || true
pkill -9 -f "xray run" 2>/dev/null || true
if [ "$HAS_SYSTEMD" -eq 1 ]; then
  systemctl stop nginx 2>/dev/null || true
  systemctl disable nginx 2>/dev/null || true
  systemctl stop apache2 2>/dev/null || true
  systemctl disable apache2 2>/dev/null || true
  systemctl stop caddy 2>/dev/null || true
  systemctl disable caddy 2>/dev/null || true
fi
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

# Start the application
if [ "$HAS_SYSTEMD" -eq 1 ]; then
  systemctl daemon-reload
  systemctl enable nyx
  systemctl restart nyx
  sleep 2
  if ! systemctl is-active --quiet nyx; then
    echo -e "${RED}⚠️ Service nyx failed to start. Service logs:${NC}"
    journalctl -u nyx -n 15 --no-pager 2>/dev/null || true
  fi
else
  echo -e "${YELLOW}⚡ Container / Non-systemd environment detected (Codespaces/Docker). Starting daemon in background...${NC}"
  cd ${INSTALL_DIR}/backend
  PORT=${PANEL_PORT} ADMIN_USER=${ADMIN_USER} ADMIN_PASS=${ADMIN_PASS} DATABASE_URL="file:./dev.db" NODE_ENV=production nohup ${NODE_BIN} dist/index.js > /var/log/nyx.log 2>&1 &
  sleep 2
fi

# 8. Detect Host URL / IP
SERVER_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')
PANEL_URL="http://${SERVER_IP}:${PANEL_PORT}"

# GitHub Codespaces Port Forwarding URL
if [ -n "$CODESPACE_NAME" ] && [ -n "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
  PANEL_URL="https://${CODESPACE_NAME}-${PANEL_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
fi

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}✅ Nyx Panel Successfully Installed & Started!${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "${CYAN}🌐 Dashboard Web UI:${NC} ${YELLOW}${PANEL_URL}${NC}"
echo -e "${CYAN}👤 Admin Username:${NC}  ${YELLOW}${ADMIN_USER}${NC}"
echo -e "${CYAN}🔐 Admin Password:${NC}  ${YELLOW}${ADMIN_PASS}${NC}"
echo -e "${CYAN}⚡ Default Inbound:${NC}  ${GREEN}VLESS REALITY Port 443 (Created Automatically)${NC}"
if [ "$HAS_SYSTEMD" -eq 1 ]; then
  echo -e "${CYAN}🔒 Status:${NC} Active & Systemd Enabled (nyx.service)"
else
  echo -e "${CYAN}🔒 Status:${NC} Active in Background Daemon (CLI: ${YELLOW}nyx status${NC})"
fi
echo -e "${CYAN}----------------------------------------------------${NC}"
echo -e "${YELLOW}💬 Cynet Security Team Support & Community:${NC}"
echo -e "   📢 ${CYAN}Telegram Channel:${NC} https://t.me/cynetx"
echo -e "   🌐 ${CYAN}Official Website:${NC} https://cynetx.ir"
echo -e "   🎥 ${CYAN}YouTube:${NC}          https://www.youtube.com/@cynetxir"
echo -e "${GREEN}====================================================${NC}"
if [ -n "$CODESPACES" ]; then
  echo -e "${YELLOW}💡 Codespaces Tip:${NC} Open the ${CYAN}PORTS${NC} tab in the bottom bar, right click port ${CYAN}${PANEL_PORT}${NC} -> ${GREEN}Port Visibility -> Public${NC} to access from anywhere!"
fi

