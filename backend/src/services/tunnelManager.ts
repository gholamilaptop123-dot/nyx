export interface TunnelParams {
  iranIp: string;
  kharejIp: string;
  tunnelPort: number;
  targetInboundPort: number;
  secret: string;
  tunnelType: 'GOST' | 'RATHOLE' | 'ICMP_TUNNEL' | 'WHITE_DNS_TUNNEL' | 'IPV6_RELAY';
  whiteDnsServer?: string;
  whiteDomain?: string;
  lang?: 'en' | 'fa';
}

export class TunnelManager {
  /**
   * Generates a 1-click Linux command script for setting up an Iran Relay Node with auto-restart service
   */
  static generateIranScript(params: TunnelParams): string {
    const { kharejIp, tunnelPort, targetInboundPort, secret, tunnelType, whiteDnsServer, whiteDomain } = params;

    if (tunnelType === 'GOST') {
      return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — Iran Relay Node Auto-Setup (Gost v3)
# ====================================================
set -e
echo "🚀 [1/3] Downloading & Installing Gost v3..."
curl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0

echo "⚙️  [2/3] Configuring Nyx Gost Relay Service..."
cat <<EOF > /etc/systemd/system/nyx-gost-relay.service
[Unit]
Description=Nyx Gost Relay Client Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/gost -L=tcp://:${targetInboundPort}/127.0.0.1:${targetInboundPort} -F=relay+mws://${kharejIp}:${tunnelPort}?secrets=${secret}
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

echo "⚡ [3/3] Starting & Enabling Systemd Service..."
systemctl daemon-reload
systemctl enable --now nyx-gost-relay.service

echo "===================================================="
echo "✅ Nyx Gost Relay Tunnel is ONLINE on Port ${targetInboundPort}!"
echo "📡 Traffic forwarded to Kharej (${kharejIp}:${tunnelPort})"
echo "📋 Status check: systemctl status nyx-gost-relay.service"
echo "===================================================="
`;
    }

    if (tunnelType === 'RATHOLE') {
      return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — Iran Relay Node (Rathole Client)
# ====================================================
set -e
echo "🚀 [1/3] Installing Rathole Client..."
mkdir -p /opt/rathole && cd /opt/rathole
apt-get update -qq && apt-get install -y -qq wget unzip
wget -q -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip
unzip -o -q rathole.zip && chmod +x rathole

echo "⚙️  [2/3] Creating Rathole Client Configuration..."
cat <<EOF > /opt/rathole/client.toml
[client]
remote_addr = "${kharejIp}:${tunnelPort}"
default_token = "${secret}"

[client.services.nyx_v2ray]
type = "tcp"
local_addr = "127.0.0.1:${targetInboundPort}"
EOF

cat <<EOF > /etc/systemd/system/nyx-rathole-client.service
[Unit]
Description=Nyx Rathole Client Tunnel
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/rathole
ExecStart=/opt/rathole/rathole /opt/rathole/client.toml
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

echo "⚡ [3/3] Starting Systemd Service..."
systemctl daemon-reload
systemctl enable --now nyx-rathole-client.service

echo "===================================================="
echo "✅ Nyx Rathole Client Tunnel is ONLINE!"
echo "📡 Connected to Kharej Server (${kharejIp})"
echo "===================================================="
`;
    }

    if (tunnelType === 'ICMP_TUNNEL') {
      return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — ICMP Ping Tunnel Client (Iran Node)
# ====================================================
set -e
echo "🚀 [1/3] Installing PingTunnel on Iran Server..."
mkdir -p /opt/pingtunnel && cd /opt/pingtunnel
apt-get update -qq && apt-get install -y -qq wget unzip
wget -q https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip
unzip -o -q pingtunnel_linux_amd64.zip && chmod +x pingtunnel

echo "⚙️  [2/3] Creating PingTunnel Systemd Service..."
cat <<EOF > /etc/systemd/system/nyx-pingtunnel-client.service
[Unit]
Description=Nyx ICMP PingTunnel Client
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/pingtunnel
ExecStart=/opt/pingtunnel/pingtunnel -type client -l :${targetInboundPort} -s ${kharejIp} -t 127.0.0.1:${targetInboundPort} -key ${secret}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "⚡ [3/3] Starting PingTunnel Client..."
systemctl daemon-reload
systemctl enable --now nyx-pingtunnel-client.service

echo "===================================================="
echo "✅ ICMP Ping Tunnel Client active on Port ${targetInboundPort}!"
echo "📡 Bypassing TCP/UDP filtering over ICMP Echo Pings"
echo "===================================================="
`;
    }

    if (tunnelType === 'WHITE_DNS_TUNNEL') {
      const dnsResolver = whiteDnsServer || '178.22.122.100';
      const domain = whiteDomain || 'tunnel.nyx.ir';
      return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — White DNS Tunnel Client (Port 53)
# ====================================================
set -e
echo "🚀 [1/3] Installing dnstt client..."
mkdir -p /opt/dnstt && cd /opt/dnstt
apt-get update -qq && apt-get install -y -qq wget
wget -q -O dnstt-client https://www.bamsoftware.com/software/dnstt/dnstt-client-linux-amd64
chmod +x dnstt-client

echo "⚙️  [2/3] Configuring DNS Tunnel Service..."
cat <<EOF > /etc/systemd/system/nyx-dnstt-client.service
[Unit]
Description=Nyx dnstt Client Tunnel
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/dnstt
ExecStart=/opt/dnstt/dnstt-client -doh https://${dnsResolver}/dns-query ${domain} 127.0.0.1:${targetInboundPort}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "⚡ [3/3] Starting dnstt client..."
systemctl daemon-reload
systemctl enable --now nyx-dnstt-client.service
echo "✅ DNS Port 53 Tunnel Client is ONLINE!"
`;
    }

    // Default Fallback: Native IPv6 / IPv4 IPTables Forwarding
    return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — Native Linux IPTables IP Forwarding
# ====================================================
set -e
echo "⚙️  Enabling Kernel IPv4 Forwarding..."
sysctl -w net.ipv4.ip_forward=1
sed -i '/net.ipv4.ip_forward/d' /etc/sysctl.conf
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf

echo "⚡ Configuring IPTables NAT Forwarding (Port ${targetInboundPort})..."
iptables -t nat -D PREROUTING -p tcp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort} 2>/dev/null || true
iptables -t nat -A PREROUTING -p tcp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort}
iptables -t nat -D POSTROUTING -p tcp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE 2>/dev/null || true
iptables -t nat -A POSTROUTING -p tcp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE

iptables -t nat -D PREROUTING -p udp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort} 2>/dev/null || true
iptables -t nat -A PREROUTING -p udp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort}
iptables -t nat -D POSTROUTING -p udp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE 2>/dev/null || true
iptables -t nat -A POSTROUTING -p udp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE

echo "===================================================="
echo "✅ Native IP Forwarding configured from Iran to Kharej (${kharejIp}:${targetInboundPort})!"
echo "===================================================="
`;
  }

  /**
   * Generates a 1-click Linux command script for setting up the Kharej End Node side of the tunnel
   */
  static generateKharejScript(params: TunnelParams): string {
    const { kharejIp, tunnelPort, targetInboundPort, secret, tunnelType, whiteDomain } = params;

    if (tunnelType === 'GOST') {
      return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — Kharej Server Tunnel Listener (Gost v3)
# ====================================================
set -e
echo "🚀 [1/3] Installing Gost v3 on Kharej Server..."
curl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0

echo "⚙️  [2/3] Configuring Nyx Gost Listener Service (Port ${tunnelPort})..."
cat <<EOF > /etc/systemd/system/nyx-gost-server.service
[Unit]
Description=Nyx Gost Listener Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/gost -L=relay+mws://:${tunnelPort}?secrets=${secret}
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

echo "⚡ [3/3] Starting & Enabling Systemd Service..."
systemctl daemon-reload
systemctl enable --now nyx-gost-server.service

echo "===================================================="
echo "✅ Kharej Gost Listener is ONLINE on Port ${tunnelPort}!"
echo "📡 Ready to receive encrypted connections from Iran"
echo "===================================================="
`;
    }

    if (tunnelType === 'RATHOLE') {
      return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — Kharej Server Listener (Rathole Server)
# ====================================================
set -e
echo "🚀 [1/3] Installing Rathole on Kharej Server..."
mkdir -p /opt/rathole && cd /opt/rathole
apt-get update -qq && apt-get install -y -qq wget unzip
wget -q -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip
unzip -o -q rathole.zip && chmod +x rathole

echo "⚙️  [2/3] Creating Rathole Server Configuration..."
cat <<EOF > /opt/rathole/server.toml
[server]
bind_addr = "0.0.0.0:${tunnelPort}"
default_token = "${secret}"

[server.services.nyx_v2ray]
type = "tcp"
bind_addr = "0.0.0.0:${targetInboundPort}"
EOF

cat <<EOF > /etc/systemd/system/nyx-rathole-server.service
[Unit]
Description=Nyx Rathole Server Tunnel
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/rathole
ExecStart=/opt/rathole/rathole /opt/rathole/server.toml
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

echo "⚡ [3/3] Starting Systemd Service..."
systemctl daemon-reload
systemctl enable --now nyx-rathole-server.service

echo "===================================================="
echo "✅ Nyx Rathole Server Listener is ONLINE on Port ${tunnelPort}!"
echo "===================================================="
`;
    }

    if (tunnelType === 'ICMP_TUNNEL') {
      return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — ICMP Ping Tunnel Server (Kharej Node)
# ====================================================
set -e
echo "🚀 [1/3] Installing PingTunnel on Kharej Server..."
mkdir -p /opt/pingtunnel && cd /opt/pingtunnel
apt-get update -qq && apt-get install -y -qq wget unzip
wget -q https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip
unzip -o -q pingtunnel_linux_amd64.zip && chmod +x pingtunnel

echo "⚙️  [2/3] Configuring Kernel ICMP..."
sysctl -w net.ipv4.icmp_echo_ignore_all=1
sed -i '/net.ipv4.icmp_echo_ignore_all/d' /etc/sysctl.conf
echo "net.ipv4.icmp_echo_ignore_all=1" >> /etc/sysctl.conf

cat <<EOF > /etc/systemd/system/nyx-pingtunnel-server.service
[Unit]
Description=Nyx ICMP PingTunnel Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/pingtunnel
ExecStart=/opt/pingtunnel/pingtunnel -type server -key ${secret}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "⚡ [3/3] Starting PingTunnel Server..."
systemctl daemon-reload
systemctl enable --now nyx-pingtunnel-server.service
echo "===================================================="
echo "✅ ICMP Ping Tunnel Server is ONLINE!"
echo "===================================================="
`;
    }

    if (tunnelType === 'WHITE_DNS_TUNNEL') {
      const domain = whiteDomain || 'tunnel.nyx.ir';
      return `#!/bin/bash
# ====================================================
# 🔥 Nyx Panel — White DNS Tunnel Server (Kharej Node)
# ====================================================
set -e
mkdir -p /opt/dnstt && cd /opt/dnstt
wget -q -O dnstt-server https://www.bamsoftware.com/software/dnstt/dnstt-server-linux-amd64
chmod +x dnstt-server

if [ ! -f key.priv ]; then
  ./dnstt-server -gen-key -privkey-file key.priv -pubkey-file key.pub
fi

cat <<EOF > /etc/systemd/system/nyx-dnstt-server.service
[Unit]
Description=Nyx dnstt Server Tunnel
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/dnstt
ExecStart=/opt/dnstt/dnstt-server -udp :53 -privkey-file key.priv ${domain} 127.0.0.1:${targetInboundPort}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now nyx-dnstt-server.service
echo "✅ DNS Port 53 Tunnel Server is ONLINE!"
`;
    }

    return `echo "✅ Kharej Server is natively ready on port ${targetInboundPort}. No extra service required."`;
  }

  /**
   * Generates a human-readable step-by-step guide for tunnel setup
   */
  static generateStepByStepGuide(params: TunnelParams): any {
    const { iranIp, kharejIp, tunnelPort, targetInboundPort, secret, tunnelType, lang } = params;
    const isEn = lang === 'en';

    const steps: { title: string; iranStep: string; kharejStep: string }[] = [];

    if (tunnelType === 'GOST') {
      steps.push({
        title: isEn ? '📦 Step 1 — Install Gost v3' : '📦 گام ۱ — نصب Gost v3',
        iranStep: isEn
          ? `Run on Iran Server (${iranIp}):\ncurl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0`
          : `روی سرور ایران (${iranIp}) دستور زیر را اجرا کنید:\ncurl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0`,
        kharejStep: isEn
          ? `Run on Kharej Server (${kharejIp}):\ncurl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0`
          : `روی سرور خارج (${kharejIp}) دستور زیر را اجرا کنید:\ncurl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0`
      });
      steps.push({
        title: isEn ? '🔌 Step 2 — Launch Tunnel' : '🔌 گام ۲ — راه‌اندازی تونل',
        iranStep: isEn
          ? `Run on Iran Server (${iranIp}) — Client mode:\nnohup gost -L="tcp://:${targetInboundPort}/127.0.0.1:${targetInboundPort}" -F="relay+mws://${kharejIp}:${tunnelPort}?secrets=${secret}" > /var/log/gost_iran.log 2>&1 &`
          : `روی سرور ایران (${iranIp}) — کلاینت:\nnohup gost -L="tcp://:${targetInboundPort}/127.0.0.1:${targetInboundPort}" -F="relay+mws://${kharejIp}:${tunnelPort}?secrets=${secret}" > /var/log/gost_iran.log 2>&1 &`,
        kharejStep: isEn
          ? `Run on Kharej Server (${kharejIp}) — Listener mode:\nnohup gost -L="relay+mws://:${tunnelPort}?secrets=${secret}" > /var/log/gost_kharej.log 2>&1 &`
          : `روی سرور خارج (${kharejIp}) — سرور:\nnohup gost -L="relay+mws://:${tunnelPort}?secrets=${secret}" > /var/log/gost_kharej.log 2>&1 &`
      });
      steps.push({
        title: isEn ? '✅ Step 3 — Verify Connection' : '✅ گام ۳ — تأیید اتصال',
        iranStep: isEn
          ? `Verify from Iran:\ncurl -v telnet://${iranIp}:${targetInboundPort}\nor check log:\ncat /var/log/gost_iran.log`
          : `از ایران تست کنید:\ncurl -v telnet://${iranIp}:${targetInboundPort}\nیا:\ncat /var/log/gost_iran.log`,
        kharejStep: isEn
          ? `Verify from Kharej:\ncat /var/log/gost_kharej.log\nor check listening port ${tunnelPort}`
          : `از خارج تست کنید:\ncat /var/log/gost_kharej.log\nیا با netstat پورت ${tunnelPort} را چک کنید`
      });
    } else if (tunnelType === 'RATHOLE') {
      steps.push({
        title: isEn ? '📦 Step 1 — Install Rathole' : '📦 گام ۱ — نصب Rathole',
        iranStep: isEn
          ? `Run on Iran Server (${iranIp}):\nmkdir -p /opt/rathole && cd /opt/rathole\nwget -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip\nunzip -o rathole.zip && chmod +x rathole`
          : `روی سرور ایران (${iranIp}):\nmkdir -p /opt/rathole && cd /opt/rathole\nwget -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip\nunzip -o rathole.zip && chmod +x rathole`,
        kharejStep: isEn
          ? `Run on Kharej Server (${kharejIp}):\nmkdir -p /opt/rathole && cd /opt/rathole\nwget -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip\nunzip -o rathole.zip && chmod +x rathole`
          : `روی سرور خارج (${kharejIp}):\nmkdir -p /opt/rathole && cd /opt/rathole\nwget -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip\nunzip -o rathole.zip && chmod +x rathole`
      });
      steps.push({
        title: isEn ? '🔌 Step 2 — Configure & Start Service' : '🔌 گام ۲ — پیکربندی و اجرا',
        iranStep: isEn
          ? `On Iran Server — Create client.toml:\n[client]\nremote_addr = "${kharejIp}:${tunnelPort}"\ndefault_token = "${secret}"\n[client.services.nyx_proxy]\ntype = "tcp"\nlocal_addr = "127.0.0.1:${targetInboundPort}"\n\nRun client: nohup ./rathole client.toml > /var/log/rathole_iran.log 2>&1 &`
          : `روی سرور ایران — ایجاد فایل client.toml:\n[client]\nremote_addr = "${kharejIp}:${tunnelPort}"\ndefault_token = "${secret}"\n[client.services.nyx_proxy]\ntype = "tcp"\nlocal_addr = "127.0.0.1:${targetInboundPort}"\n\nسپس اجرا: nohup ./rathole client.toml > /var/log/rathole_iran.log 2>&1 &`,
        kharejStep: isEn
          ? `On Kharej Server — Create server.toml:\n[server]\nbind_addr = "0.0.0.0:${tunnelPort}"\ndefault_token = "${secret}"\n[server.services.nyx_proxy]\ntype = "tcp"\nbind_addr = "0.0.0.0:${targetInboundPort}"\n\nRun server: nohup ./rathole server.toml > /var/log/rathole_kharej.log 2>&1 &`
          : `روی سرور خارج — ایجاد فایل server.toml:\n[server]\nbind_addr = "0.0.0.0:${tunnelPort}"\ndefault_token = "${secret}"\n[server.services.nyx_proxy]\ntype = "tcp"\nbind_addr = "0.0.0.0:${targetInboundPort}"\n\nسپس اجرا: nohup ./rathole server.toml > /var/log/rathole_kharej.log 2>&1 &`
      });
    } else if (tunnelType === 'ICMP_TUNNEL') {
      steps.push({
        title: isEn ? '⚡ Step 1 — Install PingTunnel' : '⚡ گام ۱ — نصب PingTunnel',
        iranStep: isEn
          ? `Run on Iran Server (${iranIp}):\nmkdir -p /opt/pingtunnel && cd /opt/pingtunnel\nwget https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip\nunzip -o pingtunnel_linux_amd64.zip && chmod +x pingtunnel`
          : `روی سرور ایران (${iranIp}):\nmkdir -p /opt/pingtunnel && cd /opt/pingtunnel\nwget https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip\nunzip -o pingtunnel_linux_amd64.zip && chmod +x pingtunnel`,
        kharejStep: isEn
          ? `Run on Kharej Server (${kharejIp}):\nmkdir -p /opt/pingtunnel && cd /opt/pingtunnel\nwget https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip\nunzip -o pingtunnel_linux_amd64.zip && chmod +x pingtunnel`
          : `روی سرور خارج (${kharejIp}):\nmkdir -p /opt/pingtunnel && cd /opt/pingtunnel\nwget https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip\nunzip -o pingtunnel_linux_amd64.zip && chmod +x pingtunnel`
      });
      steps.push({
        title: isEn ? '🔌 Step 2 — Start ICMP Server (Kharej Node First)' : '🔌 گام ۲ — راه‌اندازی سرور ICMP (خارج اول)',
        iranStep: isEn ? `Wait for Kharej server setup.` : `منتظر بمانید تا سرور خارج راه‌اندازی شود.`,
        kharejStep: isEn
          ? `Enable ICMP listener on Kharej (${kharejIp}):\nsysctl -w net.ipv4.icmp_echo_ignore_all=1\nnohup ./pingtunnel -type server -key ${secret} > /var/log/pingtunnel_kharej.log 2>&1 &`
          : `ابتدا روی سرور خارج (${kharejIp}) ICMP را فعال کنید:\nsysctl -w net.ipv4.icmp_echo_ignore_all=1\nnohup ./pingtunnel -type server -key ${secret} > /var/log/pingtunnel_kharej.log 2>&1 &`
      });
      steps.push({
        title: isEn ? '🔌 Step 3 — Start ICMP Client (Iran Node)' : '🔌 گام ۳ — راه‌اندازی کلاینت ICMP (ایران)',
        iranStep: isEn
          ? `Run on Iran Server (${iranIp}):\nnohup ./pingtunnel -type client -l :${targetInboundPort} -s ${kharejIp} -t 127.0.0.1:${targetInboundPort} -key ${secret} > /var/log/pingtunnel_iran.log 2>&1 &`
          : `روی سرور ایران (${iranIp}):\nnohup ./pingtunnel -type client -l :${targetInboundPort} -s ${kharejIp} -t 127.0.0.1:${targetInboundPort} -key ${secret} > /var/log/pingtunnel_iran.log 2>&1 &`,
        kharejStep: isEn
          ? `Kharej server is running. Check log:\ncat /var/log/pingtunnel_kharej.log`
          : `سرور خارج در حال اجرا است. لاگ را بررسی کنید:\ncat /var/log/pingtunnel_kharej.log`
      });
    } else if (tunnelType === 'IPV6_RELAY') {
      steps.push({
        title: isEn ? '🌐 Step 1 — Enable IP Forwarding (IPTables NAT)' : '🌐 گام ۱ — فعال‌سازی IP Forwarding',
        iranStep: isEn
          ? `Run on Iran Server (${iranIp}):\necho 1 > /proc/sys/net/ipv4/ip_forward\niptables -t nat -A PREROUTING -p tcp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort}\niptables -t nat -A POSTROUTING -p tcp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE\n\nTo make persistent:\necho "net.ipv4.ip_forward=1" >> /etc/sysctl.conf && sysctl -p`
          : `روی سرور ایران (${iranIp}):\necho 1 > /proc/sys/net/ipv4/ip_forward\niptables -t nat -A PREROUTING -p tcp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort}\niptables -t nat -A POSTROUTING -p tcp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE\n\nبرای دائمی کردن:\necho "net.ipv4.ip_forward=1" >> /etc/sysctl.conf && sysctl -p`,
        kharejStep: isEn
          ? `No special setup needed. Xray core continues listening on port ${targetInboundPort}.`
          : `هیچ تنظیمی لازم نیست. سرور Xray روی پورت ${targetInboundPort} فعال می‌ماند.`
      });
    } else {
      steps.push({
        title: isEn ? 'General Setup Guide' : 'راهنمای عمومی',
        iranStep: isEn ? `Execute script on Iran server.` : `اسکریپت سرور ایران را اجرا کنید.`,
        kharejStep: isEn ? `Execute script on Kharej server.` : `اسکریپت سرور خارج را اجرا کنید.`
      });
    }

    steps.push({
      title: isEn ? '🔄 Final Step — Configure User Client' : '🔄 گام نهایی — تنظیم کلاینت کاربر',
      iranStep: isEn
        ? `Users replace Kharej IP (${kharejIp}) with Iran IP (${iranIp}) in their V2ray client configs.\nPort: ${targetInboundPort}`
        : `کاربران به جای IP سرور خارج (${kharejIp})، آدرس IP سرور ایران (${iranIp}) را در کانفیگ وارد کنند.\nپورت: ${targetInboundPort}`,
      kharejStep: isEn
        ? `Kharej Xray Core listens natively. Iran relay node proxies all client traffic to it.`
        : `سرور Xray روی خارج همانطور که بود کار می‌کند. نودهای واسط ایران ترافیک را به آن هدایت می‌کنند.`
    });

    return {
      tunnelType,
      iranIp,
      kharejIp,
      tunnelPort,
      targetInboundPort,
      steps
    };
  }
}
