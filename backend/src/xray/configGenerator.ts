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
  fragmentLength?: string;
  fragmentInterval?: string;
  customDomain?: string;
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

export interface WarpConfigOptions {
  enabled: boolean;
  mode?: 'ALL' | 'SANCTIONED';
  secretKey?: string;
  address?: string[];
  publicKey?: string;
  endpoint?: string;
}

export function generateXrayJsonConfig(
  inbounds: InboundConfig[],
  users: UserConfig[],
  warpOptions?: WarpConfigOptions
) {
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
    const proto = (inbound.protocol || 'vless').toLowerCase();
    const net = (inbound.network || 'tcp').toLowerCase();
    const clientList: any[] = [];
    const addedUuids = new Set<string>();

    // 1. Always add Inbound's own UUID as a client
    const inboundUuid = inbound.uuid || inbound.id;
    if (inboundUuid) {
      if (proto === 'trojan') {
        clientList.push({ password: inboundUuid, email: inbound.remark });
      } else if (proto === 'vmess') {
        clientList.push({ id: inboundUuid, alterId: 0, email: inbound.remark });
      } else {
        // VLESS
        clientList.push({
          id: inboundUuid,
          ...(isReality && net === 'tcp' ? { flow: 'xtls-rprx-vision' } : {}),
          email: inbound.remark
        });
      }
      addedUuids.add(inboundUuid);
    }

    // 2. Add all active user UUIDs
    for (const u of users) {
      if (u.uuid && !addedUuids.has(u.uuid)) {
        if (proto === 'trojan') {
          clientList.push({ password: u.uuid, email: u.username });
        } else if (proto === 'vmess') {
          clientList.push({ id: u.uuid, alterId: 0, email: u.username });
        } else {
          // VLESS
          clientList.push({
            id: u.uuid,
            ...(isReality && net === 'tcp' ? { flow: 'xtls-rprx-vision' } : {}),
            email: u.username
          });
        }
        addedUuids.add(u.uuid);
      }
    }

    // Settings per protocol
    let protocolSettings: any = {};
    if (proto === 'trojan') {
      protocolSettings = {
        clients: clientList
      };
    } else if (proto === 'vmess') {
      protocolSettings = {
        clients: clientList
      };
    } else {
      // VLESS
      protocolSettings = {
        clients: clientList,
        decryption: 'none'
      };
    }

    // Stream Settings
    const streamSettings: any = {
      network: net === 'xhttp' ? 'splithttp' : net,
      security: inbound.security || 'reality'
    };

    if (isReality) {
      if (!inbound.privateKey) {
        console.warn(`[Nyx Config] ⚠️ Inbound ${inbound.remark} has no privateKey!`);
      }
      const targetSni = inbound.sni || 'yahoo.com';
      streamSettings.realitySettings = {
        show: false,
        dest: `${targetSni}:443`,
        xver: 0,
        serverNames: [targetSni],
        privateKey: inbound.privateKey || '',
        minClientVer: '',
        maxClientVer: '',
        maxTimeDiff: 0,
        shortIds: [inbound.shortId || '6ba7b810']
      };
    } else if (inbound.security === 'tls') {
      streamSettings.tlsSettings = {
        serverName: inbound.sni || '',
        alpn: ['http/1.1', 'h2']
      };
    }

    streamSettings.sockopt = {
      tcpKeepAliveIdle: 100
    };

    if (net === 'ws') {
      streamSettings.wsSettings = {
        path: '/nyx',
        headers: { Host: inbound.sni || '' }
      };
    } else if (net === 'xhttp' || net === 'splithttp') {
      streamSettings.splithttpSettings = {
        path: '/nyx-xhttp',
        mode: 'auto',
        headers: { Host: inbound.sni || '' }
      };
    } else if (net === 'grpc') {
      streamSettings.grpcSettings = {
        serviceName: 'nyx-grpc',
        multiMode: true
      };
    }

    xrayInbounds.push({
      listen: "0.0.0.0",
      tag: `inbound-${inbound.id}`,
      port: inbound.port,
      protocol: proto,
      settings: protocolSettings,
      streamSettings,
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls', 'quic']
      }
    });
  }

  // Always inject an internal WebSocket listener on 127.0.0.1:10001 for PaaS multiplexing (Railway/Render/Cloud reverse proxy)
  const hasWs10001 = inbounds.some(i => i.port === 10001);
  if (!hasWs10001) {
    const allClients: any[] = [];
    const addedAll = new Set<string>();
    for (const u of users) {
      if (u.uuid && !addedAll.has(u.uuid)) {
        allClients.push({ id: u.uuid, email: u.username });
        addedAll.add(u.uuid);
      }
    }
    if (allClients.length === 0) {
      allClients.push({ id: '11111111-2222-3333-4444-555555555555', email: 'default' });
    }
    xrayInbounds.push({
      listen: "127.0.0.1",
      tag: "inbound-internal-ws-bridge",
      port: 10001,
      protocol: "vless",
      settings: {
        clients: allClients,
        decryption: "none"
      },
      streamSettings: {
        network: "ws",
        security: "none",
        wsSettings: {
          path: "/nyx"
        }
      },
      sniffing: {
        enabled: true,
        destOverride: ["http", "tls", "quic"]
      }
    });
  }

  const outbounds: any[] = [
    {
      protocol: "freedom",
      tag: "direct"
    },
    {
      protocol: "blackhole",
      tag: "blocked"
    }
  ];

  const routingRules: any[] = [
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
  ];

  // If Cloudflare WARP Outbound is enabled, inject WireGuard outbound protocol & routing rules
  if (warpOptions && warpOptions.enabled && warpOptions.secretKey) {
    const warpOutbound = {
      protocol: "wireguard",
      settings: {
        secretKey: warpOptions.secretKey,
        address: warpOptions.address || ["172.16.0.2/32", "2606:4700:110:8f43:86d7:e76a:be77:8a1/128"],
        peers: [
          {
            publicKey: warpOptions.publicKey || "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
            endpoint: warpOptions.endpoint || "162.159.192.1:2408"
          }
        ]
      },
      tag: "warp"
    };

    if (warpOptions.mode === 'ALL') {
      // Place WARP as the primary default outbound
      outbounds.unshift(warpOutbound);
      console.log('[Nyx Config] 🌐 Cloudflare WARP activated as PRIMARY outbound (100% traffic routed through WARP)');
    } else {
      // Add WARP outbound & add specific routing rules for sanctioned services (ChatGPT, Netflix, Spotify)
      outbounds.push(warpOutbound);
      routingRules.push({
        type: "field",
        domain: [
          "domain:openai.com",
          "domain:chatgpt.com",
          "domain:ai.com",
          "domain:netflix.com",
          "domain:spotify.com",
          "domain:ipinfo.io",
          "domain:cloudflare.com",
          "geosite:openai",
          "geosite:netflix",
          "geosite:spotify"
        ],
        outboundTag: "warp"
      });
      console.log('[Nyx Config] 🌐 Cloudflare WARP activated for SANCTIONED & STREAMING services (OpenAI, ChatGPT, Netflix, Spotify)');
    }
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
    outbounds,
    routing: {
      domainStrategy: "IPIfNonMatch",
      rules: routingRules
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
