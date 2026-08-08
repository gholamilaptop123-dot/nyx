#!/bin/bash
# ====================================================
# 🛡️ Nyx Panel Complete Uninstaller by Cynet Security
# ====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Error: Please run as root (use sudo bash uninstall.sh).${NC}"
  exit 1
fi

echo -e "${RED}====================================================${NC}"
echo -e "${RED}🗑️ Starting Nyx Panel Complete Purge & Uninstall...${NC}"
echo -e "${RED}====================================================${NC}"

# 1. Stop & Disable Systemd Service
echo -e "${YELLOW}🛑 Stopping and disabling nyx.service...${NC}"
systemctl stop nyx 2>/dev/null || true
systemctl disable nyx 2>/dev/null || true
rm -f /etc/systemd/system/nyx.service
systemctl daemon-reload 2>/dev/null || true
systemctl reset-failed 2>/dev/null || true

# 2. Terminate background processes & release ports
echo -e "${YELLOW}🧹 Terminating background processes and releasing ports...${NC}"
fuser -k -9 3080/tcp 2>/dev/null || true
fuser -k -9 3000/tcp 2>/dev/null || true
fuser -k -9 10085/tcp 2>/dev/null || true
pkill -9 -f "node.*backend" 2>/dev/null || true
pkill -9 -f "node.*index.js" 2>/dev/null || true
pkill -9 -f "xray" 2>/dev/null || true

# 3. Purge installation directory and temp files
echo -e "${YELLOW}📂 Purging /opt/nyx directory and cached files...${NC}"
rm -rf /opt/nyx
rm -rf /tmp/nyx*
rm -rf /tmp/xray*

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}✅ Nyx Panel has been 100% completely uninstalled!${NC}"
echo -e "${GREEN}====================================================${NC}"
