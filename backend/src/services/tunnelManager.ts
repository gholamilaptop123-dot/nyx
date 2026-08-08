export interface TunnelParams {
  iranIp: string;
  kharejIp: string;
  tunnelPort: number;
  targetInboundPort: number;
  secret: string;
  tunnelType: 'GOST' | 'RATHOLE' | 'ICMP_TUNNEL' | 'WHITE_DNS_TUNNEL' | 'IPV6_RELAY';
  whiteDnsServer?: string;
  whiteDomain?: string;
}

export class TunnelManager {
  /**
   * Generates a 1-click Linux command script for setting up an Iran Relay Node
   */
  static generateIranScript(params: TunnelParams): string {
    const { kharejIp, tunnelPort, targetInboundPort, secret, tunnelType, whiteDnsServer, whiteDomain } = params;

    if (tunnelType === 'GOST') {
      return `#!/bin/bash
# Nyx Panel - Iran Relay Node Auto-Tunnel Setup (Gost v3)
echo "=== Installing Gost v3 on Iran Server ==="
curl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0

echo "=== Launching Encrypted Tunnel to Kharej (${kharejIp}) ==="
# Forwarding Iran inbound port ${targetInboundPort} to Kharej Server
nohup gost -L="tcp://:${targetInboundPort}/127.0.0.1:${targetInboundPort}" -F="relay+mws://${kharejIp}:${tunnelPort}?secrets=${secret}" > /var/log/gost_iran.log 2>&1 &
echo "✅ Nyx Gost Relay Tunnel is active on port ${targetInboundPort}!"
`;
    }

    if (tunnelType === 'RATHOLE') {
      return `#!/bin/bash
# Nyx Panel - Iran Relay Node (Rathole Client)
echo "=== Installing Rathole on Iran Server ==="
mkdir -p /opt/rathole && cd /opt/rathole
wget -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip
unzip -o rathole.zip && chmod +x rathole

cat <<EOF > client.toml
[client]
remote_addr = "${kharejIp}:${tunnelPort}"
default_token = "${secret}"

[client.services.nyx_v2ray]
type = "tcp"
local_addr = "127.0.0.1:${targetInboundPort}"
EOF

nohup ./rathole client.toml > /var/log/rathole_iran.log 2>&1 &
echo "✅ Nyx Rathole Intranet Client is active!"
`;
    }

    if (tunnelType === 'ICMP_TUNNEL') {
      return `#!/bin/bash
# Nyx Panel - ICMP Ping Tunnel Setup (Bypasses TCP/UDP Blackouts)
echo "=== Installing PingTunnel (ICMP Tunneling) on Iran Server ==="
mkdir -p /opt/pingtunnel && cd /opt/pingtunnel
wget https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip
unzip -o pingtunnel_linux_amd64.zip && chmod +x pingtunnel

echo "=== Starting PingTunnel Client (Forwarding TCP ${targetInboundPort} over ICMP Ping) ==="
# Client listens locally on port ${targetInboundPort} and forwards to Kharej via ICMP pings
nohup ./pingtunnel -type client -l :${targetInboundPort} -s ${kharejIp} -t 127.0.0.1:${targetInboundPort} -key ${secret} > /var/log/pingtunnel_iran.log 2>&1 &
echo "✅ ICMP Ping Tunnel Client active on port ${targetInboundPort}!"
`;
    }

    if (tunnelType === 'WHITE_DNS_TUNNEL') {
      const dnsResolver = whiteDnsServer || '178.22.122.100'; // Whitelisted Iranian DNS or 8.8.8.8
      const domain = whiteDomain || 'tunnel.nyx.ir';
      return `#!/bin/bash
# Nyx Panel - White DNS Tunnel Setup (dnstt)
echo "=== Installing dnstt (DNS Tunneling) on Iran Server ==="
mkdir -p /opt/dnstt && cd /opt/dnstt
wget -O dnstt-client https://www.bamsoftware.com/software/dnstt/dnstt-client-linux-amd64
chmod +x dnstt-client

echo "=== Starting DNS Tunnel Client via Whitelisted DNS (${dnsResolver}) ==="
nohup ./dnstt-client -doh https://${dnsResolver}/dns-query ${domain} 127.0.0.1:${targetInboundPort} > /var/log/dnstt_iran.log 2>&1 &
echo "✅ DNS Tunnel Client active!"
`;
    }

    // Default Fallback: Native IPv6 / IPv4 Forwarding
    return `#!/bin/bash
# Nyx Panel - Native IPv6 / Intranet Relay Setup
sysctl -w net.ipv4.ip_forward=1
iptables -t nat -A PREROUTING -p tcp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort}
iptables -t nat -A POSTROUTING -p tcp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE
iptables -t nat -A PREROUTING -p udp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort}
iptables -t nat -A POSTROUTING -p udp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE
echo "✅ Native IP Forwarding (TCP & UDP) configured from Iran to Kharej!"
`;
  }

  /**
   * Generates a 1-click Linux command script for setting up the Kharej End Node side of the tunnel
   */
  static generateKharejScript(params: TunnelParams): string {
    const { kharejIp, tunnelPort, targetInboundPort, secret, tunnelType, whiteDomain } = params;

    if (tunnelType === 'GOST') {
      return `#!/bin/bash
# Nyx Panel - Kharej Server Tunnel Listener (Gost v3)
echo "=== Installing Gost v3 on Kharej Server ==="
curl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0

echo "=== Starting Gost Listener on Port ${tunnelPort} ==="
nohup gost -L="relay+mws://:${tunnelPort}?secrets=${secret}" > /var/log/gost_kharej.log 2>&1 &
echo "✅ Kharej Gost Listener active on port ${tunnelPort}!"
`;
    }

    if (tunnelType === 'RATHOLE') {
      return `#!/bin/bash
# Nyx Panel - Kharej Server Tunnel Listener (Rathole Server)
echo "=== Installing Rathole on Kharej Server ==="
mkdir -p /opt/rathole && cd /opt/rathole
wget -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip
unzip -o rathole.zip && chmod +x rathole

cat <<EOF > server.toml
[server]
bind_addr = "0.0.0.0:${tunnelPort}"
default_token = "${secret}"

[server.services.nyx_v2ray]
type = "tcp"
bind_addr = "0.0.0.0:${targetInboundPort}"
EOF

nohup ./rathole server.toml > /var/log/rathole_kharej.log 2>&1 &
echo "✅ Nyx Rathole Server Listener active on port ${tunnelPort}!"
`;
    }

    if (tunnelType === 'ICMP_TUNNEL') {
      return `#!/bin/bash
# Nyx Panel - ICMP Ping Tunnel Server (Kharej Node)
echo "=== Installing PingTunnel Server on Kharej Server ==="
mkdir -p /opt/pingtunnel && cd /opt/pingtunnel
wget https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip
unzip -o pingtunnel_linux_amd64.zip && chmod +x pingtunnel

echo "=== Starting PingTunnel ICMP Server Listener ==="
# Disable OS ICMP response to avoid conflict
sysctl -w net.ipv4.icmp_echo_ignore_all=1
nohup ./pingtunnel -type server -key ${secret} > /var/log/pingtunnel_kharej.log 2>&1 &
echo "✅ ICMP Ping Tunnel Server active!"
`;
    }

    if (tunnelType === 'WHITE_DNS_TUNNEL') {
      const domain = whiteDomain || 'tunnel.nyx.ir';
      return `#!/bin/bash
# Nyx Panel - White DNS Tunnel Server (Kharej Node)
echo "=== Installing dnstt-server on Kharej Server ==="
mkdir -p /opt/dnstt && cd /opt/dnstt
wget -O dnstt-server https://www.bamsoftware.com/software/dnstt/dnstt-server-linux-amd64
chmod +x dnstt-server

echo "=== Generating DNS Keypair if missing ==="
if [ ! -f key.priv ]; then
  ./dnstt-server -gen-key -privkey-file key.priv -pubkey-file key.pub
fi

echo "=== Starting dnstt DNS Server Listener ==="
nohup ./dnstt-server -udp :53 -privkey-file key.priv ${domain} 127.0.0.1:${targetInboundPort} > /var/log/dnstt_kharej.log 2>&1 &
echo "✅ DNS Tunnel Server active on UDP port 53!"
`;
    }

    return `# Kharej Node is ready to accept incoming connections on port ${targetInboundPort}`;
  }

  /**
   * Generates a human-readable step-by-step guide for tunnel setup
   */
  static generateStepByStepGuide(params: TunnelParams): any {
    const { iranIp, kharejIp, tunnelPort, targetInboundPort, secret, tunnelType } = params;

    const steps: { title: string; iranStep: string; kharejStep: string }[] = [];

    if (tunnelType === 'GOST') {
      steps.push({
        title: '📦 گام ۱ — نصب Gost v3',
        iranStep: `روی سرور ایران (${iranIp}) دستور زیر را اجرا کنید:\ncurl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0`,
        kharejStep: `روی سرور خارج (${kharejIp}) دستور زیر را اجرا کنید:\ncurl -s https://raw.githubusercontent.com/go-gost/gost/master/install.sh | bash -s -- --version 3.0.0`
      });
      steps.push({
        title: '🔌 گام ۲ — راه‌اندازی تونل',
        iranStep: `روی سرور ایران (${iranIp}) — کلاینت:\nnohup gost -L=tcp://:${targetInboundPort}/:${targetInboundPort} -F="relay+mws://${kharejIp}:${tunnelPort}?secrets=${secret}" > /var/log/gost_iran.log 2>&1 &`,
        kharejStep: `روی سرور خارج (${kharejIp}) — سرور:\nnohup gost -L="relay+mws://:${tunnelPort}?secrets=${secret}" > /var/log/gost_kharej.log 2>&1 &`
      });
      steps.push({
        title: '✅ گام ۳ — تأیید اتصال',
        iranStep: `از ایران تست کنید:\ncurl -v telnet://${iranIp}:${targetInboundPort}\nیا:\ncat /var/log/gost_iran.log`,
        kharejStep: `از خارج تست کنید:\ncat /var/log/gost_kharej.log\nیا با netstat پورت ${tunnelPort} را چک کنید`
      });
    } else if (tunnelType === 'RATHOLE') {
      steps.push({
        title: '📦 گام ۱ — نصب Rathole',
        iranStep: `روی سرور ایران (${iranIp}):\nmkdir -p /opt/rathole && cd /opt/rathole\nwget -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip\nunzip -o rathole.zip && chmod +x rathole`,
        kharejStep: `روی سرور خارج (${kharejIp}):\nmkdir -p /opt/rathole && cd /opt/rathole\nwget -O rathole.zip https://github.com/rapiz1/rathole/releases/latest/download/rathole-x86_64-unknown-linux-gnu.zip\nunzip -o rathole.zip && chmod +x rathole`
      });
      steps.push({
        title: '🔌 گام ۲ — پیکربندی و اجرا',
        iranStep: `روی سرور ایران — ایجاد فایل client.toml:\n[client]\nremote_addr = "${kharejIp}:${tunnelPort}"\ndefault_token = "${secret}"\n[client.services.nyx_proxy]\ntype = "tcp"\nlocal_addr = "127.0.0.1:${targetInboundPort}"\n\nسپس اجرا: nohup ./rathole client.toml > /var/log/rathole_iran.log 2>&1 &`,
        kharejStep: `روی سرور خارج — ایجاد فایل server.toml:\n[server]\nbind_addr = "0.0.0.0:${tunnelPort}"\ndefault_token = "${secret}"\n[server.services.nyx_proxy]\ntype = "tcp"\nbind_addr = "0.0.0.0:${targetInboundPort}"\n\nسپس اجرا: nohup ./rathole server.toml > /var/log/rathole_kharej.log 2>&1 &`
      });
    } else if (tunnelType === 'ICMP_TUNNEL') {
      steps.push({
        title: '⚡ گام ۱ — نصب PingTunnel',
        iranStep: `روی سرور ایران (${iranIp}):\nmkdir -p /opt/pingtunnel && cd /opt/pingtunnel\nwget https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip\nunzip -o pingtunnel_linux_amd64.zip && chmod +x pingtunnel`,
        kharejStep: `روی سرور خارج (${kharejIp}):\nmkdir -p /opt/pingtunnel && cd /opt/pingtunnel\nwget https://github.com/esrrhs/pingtunnel/releases/latest/download/pingtunnel_linux_amd64.zip\nunzip -o pingtunnel_linux_amd64.zip && chmod +x pingtunnel`
      });
      steps.push({
        title: '🔌 گام ۲ — راه‌اندازی سرور ICMP (خارج اول)',
        iranStep: `منتظر بمانید تا سرور خارج راه‌اندازی شود.`,
        kharejStep: `ابتدا روی سرور خارج (${kharejIp}) ICMP را فعال کنید:\nsysctl -w net.ipv4.icmp_echo_ignore_all=1\nnohup ./pingtunnel -type server -key ${secret} > /var/log/pingtunnel_kharej.log 2>&1 &`
      });
      steps.push({
        title: '🔌 گام ۳ — راه‌اندازی کلاینت ICMP (ایران)',
        iranStep: `روی سرور ایران (${iranIp}):\nnohup ./pingtunnel -type client -l :${targetInboundPort} -s ${kharejIp} -t 127.0.0.1:${targetInboundPort} -key ${secret} > /var/log/pingtunnel_iran.log 2>&1 &`,
        kharejStep: `سرور خارج در حال اجرا است. لاگ را بررسی کنید:\ncat /var/log/pingtunnel_kharej.log`
      });
    } else if (tunnelType === 'IPV6_RELAY') {
      steps.push({
        title: '🌐 گام ۱ — فعال‌سازی IP Forwarding',
        iranStep: `روی سرور ایران (${iranIp}):\necho 1 > /proc/sys/net/ipv4/ip_forward\niptables -t nat -A PREROUTING -p tcp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort}\niptables -t nat -A POSTROUTING -p tcp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE\n\nبرای دائمی کردن:\necho "net.ipv4.ip_forward=1" >> /etc/sysctl.conf && sysctl -p`,
        kharejStep: `هیچ تنظیمی لازم نیست. سرور Xray روی پورت ${targetInboundPort} فعال می‌ماند.`
      });
    } else {
      steps.push({
        title: 'راهنمای عمومی',
        iranStep: `اسکریپت سرور ایران را اجرا کنید.`,
        kharejStep: `اسکریپت سرور خارج را اجرا کنید.`
      });
    }

    steps.push({
      title: '🔄 گام نهایی — تنظیم کلاینت کاربر',
      iranStep: `کاربران به جای IP سرور خارج (${kharejIp})، آدرس IP سرور ایران (${iranIp}) را در کانفیگ وارد کنند.\nپورت: ${targetInboundPort}`,
      kharejStep: `سرور Xray روی خارج همانطور که بود کار می‌کند. نودهای واسط ایران ترافیک را به آن هدایت می‌کنند.`
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
