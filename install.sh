#!/bin/bash
set -Eeuo pipefail
umask 077

# Nyx Panel - hardened installer
# Installs the selected Nyx fork and runs the backend as a dedicated user.

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'

INSTALL_DIR="/opt/nyx"
NYX_USER="nyx"
NYX_GROUP="nyx"
PANEL_PORT="${PANEL_PORT:-3080}"
ADMIN_USER="${ADMIN_USER:-admin}"
NYX_REPO="${NYX_REPO:-https://github.com/gholamilaptop123-dot/nyx.git}"
NYX_BRANCH="${NYX_BRANCH:-security-hardening}"

echo -e "${CYAN}====================================================${NC}"
echo -e "${GREEN}Nyx Panel - Hardened Installer${NC}"
echo -e "${CYAN}====================================================${NC}"

if [ "${EUID}" -ne 0 ]; then
  echo -e "${RED}Run this installer as root.${NC}"
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo -e "${RED}This hardened installer currently supports Debian/Ubuntu only.${NC}"
  exit 1
fi

# Never use a built-in/default admin password.
if [ -z "${ADMIN_PASS:-}" ]; then
  if [ -t 0 ]; then
    read -r -s -p "Admin password (minimum 16 characters): " ADMIN_PASS
    echo
    read -r -s -p "Confirm admin password: " ADMIN_PASS_CONFIRM
    echo
    if [ "${ADMIN_PASS}" != "${ADMIN_PASS_CONFIRM}" ]; then
      echo -e "${RED}Passwords do not match.${NC}"
      exit 1
    fi
  else
    echo -e "${RED}ADMIN_PASS must be supplied when running non-interactively.${NC}"
    exit 1
  fi
fi

if [ "${#ADMIN_PASS}" -lt 16 ]; then
  echo -e "${RED}ADMIN_PASS must contain at least 16 characters.${NC}"
  exit 1
fi

if ! [[ "${PANEL_PORT}" =~ ^[0-9]+$ ]] || [ "${PANEL_PORT}" -lt 1024 ] || [ "${PANEL_PORT}" -gt 65535 ]; then
  echo -e "${RED}PANEL_PORT must be between 1024 and 65535.${NC}"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl git unzip nodejs npm build-essential

if ! command -v systemctl >/dev/null 2>&1 || [ ! -d /run/systemd/system ]; then
  echo -e "${RED}systemd is required for the hardened installation.${NC}"
  exit 1
fi

# Dedicated service account.
if ! getent group "${NYX_GROUP}" >/dev/null; then
  groupadd --system "${NYX_GROUP}"
fi
if ! id -u "${NYX_USER}" >/dev/null 2>&1; then
  useradd --system --gid "${NYX_GROUP}" --home-dir "${INSTALL_DIR}" --shell /usr/sbin/nologin "${NYX_USER}"
fi

mkdir -p /opt
chown root:root /opt
chmod 0755 /opt

# Clone/update ONLY the user's security-hardening branch.
if [ -d "${INSTALL_DIR}/.git" ]; then
  git -C "${INSTALL_DIR}" remote set-url origin "${NYX_REPO}"
  git -C "${INSTALL_DIR}" fetch --depth 1 origin "${NYX_BRANCH}"
  git -C "${INSTALL_DIR}" checkout -B "${NYX_BRANCH}" "origin/${NYX_BRANCH}"
  git -C "${INSTALL_DIR}" reset --hard "origin/${NYX_BRANCH}"
  git -C "${INSTALL_DIR}" clean -fdx
else
  rm -rf "${INSTALL_DIR}"
  git clone --depth 1 --branch "${NYX_BRANCH}" "${NYX_REPO}" "${INSTALL_DIR}"
fi

# Do not execute arbitrary repository hooks/scripts as root.
git -C "${INSTALL_DIR}" config --local core.hooksPath /dev/null

# Install/build as the dedicated user.
chown -R "${NYX_USER}:${NYX_GROUP}" "${INSTALL_DIR}"
chmod 0750 "${INSTALL_DIR}"

cd "${INSTALL_DIR}/backend"

cat > .env <<EOF
PORT=${PANEL_PORT}
ADMIN_USER=${ADMIN_USER}
ADMIN_PASS=${ADMIN_PASS}
NODE_ENV=production
DATABASE_URL="file:./dev.db"
EOF
chown "${NYX_USER}:${NYX_GROUP}" .env
chmod 0600 .env

# Do not run npm lifecycle scripts as root.
runuser -u "${NYX_USER}" -- env HOME="${INSTALL_DIR}" npm install --include=dev
runuser -u "${NYX_USER}" -- node ./node_modules/prisma/build/index.js generate
runuser -u "${NYX_USER}" -- node ./node_modules/prisma/build/index.js db push
runuser -u "${NYX_USER}" -- node ./node_modules/typescript/bin/tsc

cd "${INSTALL_DIR}/frontend"
runuser -u "${NYX_USER}" -- env HOME="${INSTALL_DIR}" npm install --include=dev
runuser -u "${NYX_USER}" -- node ./node_modules/vite/bin/vite.js build

mkdir -p "${INSTALL_DIR}/backend/dist/public"
cp -r "${INSTALL_DIR}/frontend/dist/." "${INSTALL_DIR}/backend/dist/public/"
chown -R "${NYX_USER}:${NYX_GROUP}" "${INSTALL_DIR}"

NODE_BIN="$(command -v node)"

# Systemd service: no root execution and strong sandboxing.
cat > /etc/systemd/system/nyx.service <<EOF
[Unit]
Description=Nyx Panel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${NYX_USER}
Group=${NYX_GROUP}
WorkingDirectory=${INSTALL_DIR}/backend
ExecStart=${NODE_BIN} ${INSTALL_DIR}/backend/dist/index.js
Restart=on-failure
RestartSec=5
EnvironmentFile=${INSTALL_DIR}/backend/.env

NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectKernelLogs=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true
MemoryDenyWriteExecute=true
RestrictRealtime=true
RestrictNamespaces=true
SystemCallArchitectures=native
UMask=0077

ReadWritePaths=${INSTALL_DIR}/backend
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
EOF

chmod 0644 /etc/systemd/system/nyx.service
systemctl daemon-reload
systemctl enable nyx
systemctl restart nyx

sleep 3
if ! systemctl is-active --quiet nyx; then
  echo -e "${RED}Nyx failed to start. Run: journalctl -u nyx -n 50 --no-pager${NC}"
  exit 1
fi

# Local-only management helper.
cat > /usr/local/bin/nyx <<'EOF'
#!/bin/bash
set -e
case "${1:-}" in
  start) systemctl start nyx ;;
  stop) systemctl stop nyx ;;
  restart) systemctl restart nyx ;;
  status) systemctl status nyx --no-pager ;;
  logs) journalctl -u nyx -n 50 --no-pager ;;
  *) echo "Usage: nyx {start|stop|restart|status|logs}"; exit 1 ;;
esac
EOF
chmod 0755 /usr/local/bin/nyx

# IMPORTANT: do not destroy or reconfigure SSH, web servers, or existing firewall rules.
# The panel port should be protected externally/reverse-proxied; this installer does not
# blindly open ports or flush firewall rules.

SERVER_IP="$(curl -4fsS --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')"

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}Nyx installed successfully.${NC}"
echo -e "${CYAN}Panel:${NC} http://${SERVER_IP}:${PANEL_PORT}"
echo -e "${CYAN}User:${NC} ${ADMIN_USER}"
echo -e "${YELLOW}Password is intentionally NOT printed.${NC}"
echo -e "${CYAN}Branch:${NC} ${NYX_BRANCH}"
echo -e "${GREEN}Service:${NC} systemctl status nyx"
echo -e "${GREEN}====================================================${NC}"
