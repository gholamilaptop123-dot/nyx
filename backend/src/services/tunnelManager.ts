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
nohup gost -L=tcp://:${targetInboundPort}/:${targetInboundPort} -F="relay+mws://${kharejIp}:${tunnelPort}?secrets=${secret}" > /var/log/gost_iran.log 2>&1 &
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

    // Default Fallback: Native IPv6 Forwarding
    return `#!/bin/bash
# Nyx Panel - Native IPv6 / Intranet Relay Setup
sysctl -w net.ipv4.ip_forward=1
iptables -t nat -A PREROUTING -p tcp --dport ${targetInboundPort} -j DNAT --to-destination ${kharejIp}:${targetInboundPort}
iptables -t nat -A POSTROUTING -p tcp -d ${kharejIp} --dport ${targetInboundPort} -j MASQUERADE
echo "✅ Native IP Forwarding configured from Iran to Kharej!"
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

echo "=== Starting dnstt DNS Server Listener ==="
nohup ./dnstt-server -udp :53 -privkey-file key.priv ${domain} 127.0.0.1:${targetInboundPort} > /var/log/dnstt_kharej.log 2>&1 &
echo "✅ DNS Tunnel Server active on UDP port 53!"
`;
    }

    return `# Kharej Node is ready to accept incoming connections on port ${targetInboundPort}`;
  }
}
