import fs from 'fs';
import path from 'path';

export interface InboundConfig {
  id: string;
  uuid?: string;
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
  const candidatePaths = [
    xrayExecPath,
    path.join(__dirname, '../../bin/xray'),
    path.join(__dirname, '../bin/xray'),
    '/opt/nyx/backend/bin/xray',
    '/usr/local/bin/xray',
    '/usr/bin/xray'
  ].filter(Boolean) as string[];

  for (const binPath of candidatePaths) {
    if (fs.existsSync(binPath)) {
      try {
        const output = require('child_process').execSync(`"${binPath}" x25519`).toString();
        const privMatch = output.match(/Private key:\s*([^\s]+)/i);
        const pubMatch = output.match(/Public key:\s*([^\s]+)/i);
        if (privMatch && pubMatch) {
          return { privateKey: privMatch[1].trim(), publicKey: pubMatch[1].trim() };
        }
      } catch (e) {
        // Continue fallback
      }
    }
  }

  // Fallback using Node.js crypto native x25519 keypair generation
  try {
    const crypto = require('crypto');
    const { privateKey, publicKey } = crypto.generateKeyPairSync('x25519');
    const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });
    const pubDer = publicKey.export({ type: 'spki', format: 'der' });
    const privRaw = privDer.subarray(privDer.length - 32);
    const pubRaw = pubDer.subarray(pubDer.length - 32);
    return {
      privateKey: privRaw.toString('base64url'),
      publicKey: pubRaw.toString('base64url')
    };
  } catch (e) {
    const crypto = require('crypto');
    return {
      privateKey: crypto.randomBytes(32).toString('base64url'),
      publicKey: crypto.randomBytes(32).toString('base64url')
    };
  }
}

export function generateXrayJsonConfig(inbounds: InboundConfig[], users: UserConfig[]) {
  const xrayInbounds: any[] = [
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

    const clients = users.length > 0 ? users.map(u => ({
      id: u.uuid,
      ...(isReality && inbound.network === 'tcp' ? { flow: 'xtls-rprx-vision' } : {}),
      email: u.username
    })) : [{
      id: inbound.uuid || inbound.id,
      ...(isReality && inbound.network === 'tcp' ? { flow: 'xtls-rprx-vision' } : {}),
      email: inbound.remark
    }];

    const streamSettings: any = {
      network: inbound.network || 'tcp',
      security: inbound.security || 'reality'
    };

    if (isReality) {
      if (!inbound.privateKey) {
        console.warn(`[Nyx Config] ⚠️ Inbound ${inbound.remark} has no privateKey!`);
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

    streamSettings.sockopt = {
      tcpKeepAliveIdle: 100
    };

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
      tag: `inbound-${inbound.id}`,
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
