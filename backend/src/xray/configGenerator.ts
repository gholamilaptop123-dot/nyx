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
      // Exec error fallback
    }
  }

  // Fallback: Generate URL-safe random keypair string if Xray binary unavailable during initial bootstrap
  const crypto = require('crypto');
  const randBytes = crypto.randomBytes(32).toString('base64url');
  const pubBytes = crypto.randomBytes(32).toString('base64url');
  return {
    privateKey: randBytes,
    publicKey: pubBytes
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
    const isReality = inbound.security === 'reality';

    const clients = users.map(u => ({
      id: u.uuid,
      // flow is only valid for REALITY+TCP, empty string causes error in other modes
      ...(isReality && inbound.network === 'tcp' ? { flow: 'xtls-rprx-vision' } : {}),
      email: u.username
    }));

    const streamSettings: any = {
      network: inbound.network || 'tcp',
      security: inbound.security || 'reality'
    };

    if (isReality) {
      if (!inbound.privateKey) {
        console.warn(`[Nyx Config] ⚠️ Inbound ${inbound.remark} has no privateKey! Skipping REALITY config for this inbound.`);
      }
      streamSettings.realitySettings = {
        show: false,
        dest: `${inbound.sni || 'yahoo.com'}:443`,
        xver: 0,
        serverNames: [inbound.sni || 'yahoo.com'],
        privateKey: inbound.privateKey || '',
        minClientVer: '',
        maxClientVer: '',
        maxTimeDiff: 0,
        shortIds: [inbound.shortId || '6ba7b810']
      };
    } else if (inbound.security === 'tls') {
      streamSettings.tlsSettings = {
        serverName: inbound.sni || '',
        alpn: ['http/1.1']
      };
    }

    // Fragment sockopt — enables kernel-level packet fragmentation on the server
    if (inbound.enableFragment && inbound.network === 'tcp') {
      streamSettings.sockopt = {
        tcpKeepAliveIdle: 100,
        fragment: {
          packets: 'tlshello',
          length: '100-200',
          interval: '10-20'
        }
      };
    }

    // Add network-specific settings
    if (inbound.network === 'ws') {
      streamSettings.wsSettings = {
        path: '/nyx',
        headers: { Host: inbound.sni || '' }
      };
    } else if (inbound.network === 'grpc') {
      streamSettings.grpcSettings = {
        serviceName: 'nyx'
      };
    }

    xrayInbounds.push({
      tag: `inbound-${inbound.port}`,
      port: inbound.port,
      protocol: inbound.protocol || 'vless',
      settings: {
        clients,
        decryption: 'none'
      },
      streamSettings,
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls', 'quic']
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
