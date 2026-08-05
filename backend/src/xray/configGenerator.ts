import fs from 'fs';
import path from 'path';

export interface InboundConfig {
  id: string;
  remark: string;
  protocol: string;
  port: number;
  network: string;
  security: string;
  sni?: string;
  privateKey?: string;
  publicKey?: string;
  shortId?: string;
  enableFragment?: boolean;
}

export interface UserConfig {
  id: string;
  username: string;
  uuid: string;
  email?: string;
}

export function generateX25519Keypair(xrayExecPath?: string): { privateKey: string; publicKey: string } {
  if (xrayExecPath && fs.existsSync(xrayExecPath)) {
    try {
      const output = require('child_process').execSync(`"${xrayExecPath}" x25519`).toString();
      const privMatch = output.match(/Private key:\s*([^\s]+)/i);
      const pubMatch = output.match(/Public key:\s*([^\s]+)/i);
      if (privMatch && pubMatch) {
        return { privateKey: privMatch[1], publicKey: pubMatch[1] };
      }
    } catch (e) {
      // Fallback below
    }
  }
  return {
    privateKey: "OPSM7JJgD7LWJxufOAT_rrte0LwD-luo2_63gDl70Fs",
    publicKey: "ROZ4xT1Mj_0-MmJCzHwqOyCSJnA3fwOdfZIpADbvyAg"
  };
}

export function generateXrayJsonConfig(inbounds: InboundConfig[], users: UserConfig[]) {
  const xrayInbounds: any[] = [
    // API Inbound for gRPC management
    {
      listen: "127.0.0.1",
      port: 10085,
      protocol: "dokodemo-door",
      settings: {
        address: "127.0.0.1"
      },
      tag: "api"
    }
  ];

  for (const inbound of inbounds) {
    const clients = users.map(u => ({
      id: u.uuid,
      flow: inbound.security === 'reality' ? 'xtls-rprx-vision' : '',
      email: u.username
    }));

    const streamSettings: any = {
      network: inbound.network || 'tcp',
      security: inbound.security || 'reality'
    };

    if (inbound.security === 'reality') {
      streamSettings.realitySettings = {
        show: false,
        dest: `${inbound.sni || 'yahoo.com'}:443`,
        xver: 0,
        serverNames: [inbound.sni || 'yahoo.com'],
        privateKey: inbound.privateKey || 'OPSM7JJgD7LWJxufOAT_rrte0LwD-luo2_63gDl70Fs',
        minClientVer: "",
        maxClientVer: "",
        maxTimeDiff: 0,
        shortIds: [inbound.shortId || '6ba7b810']
      };
    }

    if (inbound.enableFragment) {
      streamSettings.sockopt = {
        tcpKeepAliveInterval: 15,
        mark: 255
      };
    }

    xrayInbounds.push({
      tag: `inbound-${inbound.port}`,
      port: inbound.port,
      protocol: inbound.protocol || 'vless',
      settings: {
        clients: clients,
        decryption: "none"
      },
      streamSettings: streamSettings,
      sniffing: {
        enabled: true,
        destOverride: ["http", "tls", "quic"]
      }
    });
  }

  const fullConfig = {
    log: {
      loglevel: "warning"
    },
    stats: {},
    api: {
      tag: "api",
      services: ["HandlerService", "StatsService", "LoggerService"]
    },
    policy: {
      levels: {
        "0": {
          statsUserUplink: true,
          statsUserDownlink: true
        }
      },
      system: {
        statsInboundUplink: true,
        statsInboundDownlink: true,
        statsOutboundUplink: true,
        statsOutboundDownlink: true
      }
    },
    inbounds: xrayInbounds,
    outbounds: [
      {
        protocol: "freedom",
        tag: "direct"
      },
      {
        protocol: "blackhole",
        tag: "blocked"
      }
    ],
    routing: {
      domainStrategy: "IPIfNonMatch",
      rules: [
        {
          type: "field",
          inboundTag: ["api"],
          outboundTag: "api"
        },
        {
          type: "field",
          protocol: ["bittorrent"],
          outboundTag: "blocked"
        }
      ]
    }
  };

  return fullConfig;
}

export function saveXrayConfig(config: any): string {
  const binDir = path.join(process.cwd(), 'bin');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  const configPath = path.join(binDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}
