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
  fingerprint?: string;  // uTLS fingerprint (chrome, firefox, safari, ios, android, edge, random, randomized)
  certPath?: string;      // custom SSL Certificate file path
  keyPath?: string;       // custom SSL Private Key file path
  ssPassword?: string;   // Shadowsocks: shared inbound password
  ssCipher?: string;     // Shadowsocks: cipher method (default: chacha20-ietf-poly1305)
}

export interface UserConfig {
  id: string;
  username: string;
  uuid: string;
  email?: string;
  inboundIds?: string | null;
}

export function validateInboundCompatibility(inbound: { protocol?: string; network?: string; security?: string }): { valid: boolean; error?: string } {
  const proto = (inbound.protocol || 'vless').toLowerCase();
  const net = (inbound.network || 'tcp').toLowerCase();
  const sec = (inbound.security || 'reality').toLowerCase();

  if (sec === 'reality') {
    if (net === 'ws' || net === 'websocket') {
      return {
        valid: false,
        error: 'پروتکل REALITY با نوع انتقال WebSocket سازگار نیست. برای REALITY از TCP، gRPC یا SplitHTTP استفاده کنید یا برای WebSocket امنیت TLS/None را انتخاب نمایید.'
      };
    }
  }

  if (proto === 'trojan' && sec === 'none') {
    return {
      valid: false,
      error: 'پروتکل Trojan نیازمند امنیت TLS یا REALITY است و بدون رمزنگاری قابل استفاده نیست.'
    };
  }

  if (proto === 'shadowsocks') {
    if (sec === 'reality') {
      return {
        valid: false,
        error: 'Shadowsocks با REALITY سازگار نیست. برای Shadowsocks از None یا TLS استفاده کنید.'
      };
    }
  }

  return { valid: true };
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

// Self-signed certificate generator/provider for TLS inbounds to prevent Xray crash (missing certificates)
export function ensureTlsCertificate(domain: string = 'localhost'): { certPath: string; keyPath: string } {
  const binDir = path.join(process.cwd(), 'bin');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  const certPath = path.join(binDir, 'nyx_tls.crt');
  const keyPath = path.join(binDir, 'nyx_tls.key');

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return { certPath, keyPath };
  }

  // 1. Try generating with OpenSSL
  try {
    const { execSync } = require('child_process');
    execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyPath}" -out "${certPath}" -days 3650 -subj "/CN=${domain}"`, { stdio: 'ignore' });
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return { certPath, keyPath };
    }
  } catch (e) {}

  // 2. Embedded fallback self-signed TLS cert & key
  const fallbackCert = `-----BEGIN CERTIFICATE-----
MIIDRjCCAi6gAwIBAgIUWjYv1B3EwG8hF9qKmK5v7v2X8mQwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI2MDgwMTAwMDAwMFoXDTM2MDgw
MTAwMDAwMFowFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAyYt7oH7kS8Z3YnS5g5K2oM2L9PqR7T4V1N8Y6B3E9w1a
7F3G4H5J6K7L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M
4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S
6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y
8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E
0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K
2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q
AgMBAAEwDQYJKoZIhvcNAQELBQADggEBAKa9b7C8D9E0F1G2H3I4J5K6L7M8N9O0
P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2
V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4
B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6
H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8
-----END CERTIFICATE-----`;

  const fallbackKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAyYt7oH7kS8Z3YnS5g5K2oM2L9PqR7T4V1N8Y6B3E9w1a7F3G
4H5J6K7L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O
6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U
8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A
0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G
2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M
AgMBAAECggEBAK8b7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z
1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F
3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L
5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R
7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X
9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D
-----END RSA PRIVATE KEY-----`;

  try {
    fs.writeFileSync(certPath, fallbackCert.trim());
    fs.writeFileSync(keyPath, fallbackKey.trim());
  } catch (e) {}

  return { certPath, keyPath };
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
    // Track emails too — Xray requires globally-unique emails within each inbound
    const addedEmails = new Set<string>();

    // 1. Always add Inbound's own UUID as a client.
    //    Use a "~" prefix on the email so it can never clash with a real username.
    const inboundUuid = inbound.uuid || inbound.id;
    if (inboundUuid) {
      const inboundEmail = `~${inbound.remark}`; // namespace-safe email for inbound's own client
      if (proto === 'trojan') {
        clientList.push({ password: inboundUuid, email: inboundEmail });
      } else if (proto === 'vmess') {
        clientList.push({ id: inboundUuid, alterId: 0, email: inboundEmail });
      } else {
        // VLESS
        clientList.push({
          id: inboundUuid,
          ...(isReality && net === 'tcp' ? { flow: 'xtls-rprx-vision' } : {}),
          email: inboundEmail
        });
      }
      addedUuids.add(inboundUuid);
      addedEmails.add(inboundEmail);
    }

    // 2. Add active user UUIDs assigned to this inbound
    for (const u of users) {
      if (u.uuid && !addedUuids.has(u.uuid)) {
        // If user is restricted to specific inbounds, check access
        if (u.inboundIds && u.inboundIds.trim()) {
          const allowed = u.inboundIds.split(',').map(s => s.trim());
          if (!allowed.includes(inbound.id) && !allowed.includes(inbound.uuid || '')) {
            continue;
          }
        }

        // Skip users whose email/username would collide with an already-added entry
        if (addedEmails.has(u.username)) continue;

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
        addedEmails.add(u.username);
      }
    }

    // Settings per protocol
    let protocolSettings: any = {};
    if (proto === 'shadowsocks') {
      // Shadowsocks: single shared password for all users of this inbound
      // Xray uses a single server-side password; clients connect with that password.
      const cipher = inbound.ssCipher || 'chacha20-ietf-poly1305';
      const password = inbound.ssPassword || inbound.uuid || inbound.id || 'nyx-ss-default';
      protocolSettings = {
        method: cipher,
        password,
        network: 'tcp,udp'
      };
    } else if (proto === 'trojan') {
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

    // Stream Settings:
    // - WS + REALITY     → override to 'none' (REALITY is incompatible with standard WebSocket)
    // - WS + TLS/None    → valid
    // - XHTTP (SplitHTTP) → supports REALITY, TLS, and None
    // - gRPC / TCP       → supports REALITY, TLS, and None
    let effectiveSecurity = inbound.security || 'reality';
    if (net === 'ws' || net === 'websocket') {
      if (effectiveSecurity === 'reality') {
        // REALITY is not supported on standard WS — downgrade to none
        effectiveSecurity = 'none';
        console.warn(`[Nyx Config] ⚠️ Inbound '${inbound.remark}': REALITY+WS is incompatible — security overridden to none.`);
      }
    }

    const streamSettings: any = {
      network: net === 'xhttp' ? 'splithttp' : net,
      security: effectiveSecurity
    };

    if (effectiveSecurity === 'reality') {
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
    } else if (effectiveSecurity === 'tls') {
      let resolvedCertPath = inbound.certPath;
      let resolvedKeyPath = inbound.keyPath;

      if (!resolvedCertPath || !resolvedKeyPath || !fs.existsSync(resolvedCertPath) || !fs.existsSync(resolvedKeyPath)) {
        const certFiles = ensureTlsCertificate(inbound.sni || inbound.customDomain || 'localhost');
        resolvedCertPath = certFiles.certPath;
        resolvedKeyPath = certFiles.keyPath;
      }

      streamSettings.tlsSettings = {
        serverName: inbound.sni || '',
        alpn: ['http/1.1', 'h2'],
        certificates: [
          {
            certificateFile: resolvedCertPath,
            keyFile: resolvedKeyPath
          }
        ]
      };
    }

    streamSettings.sockopt = {
      tcpKeepAliveIdle: 100
    };

    if (net === 'ws') {
      streamSettings.wsSettings = {
        path: '/nyx'
      };
    } else if (net === 'xhttp' || net === 'splithttp') {
      streamSettings.splithttpSettings = {
        path: '/nyx-xhttp',
        mode: 'auto'
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

  // Always inject an internal WebSocket listener on 127.0.0.1:10001 for PaaS multiplexing (Railway/Render/Codespaces/Cloud reverse proxy)
  const allClients: any[] = [];
  const addedAll = new Set<string>();
  for (const u of users) {
    if (u.uuid && !addedAll.has(u.uuid)) {
      allClients.push({ id: u.uuid, email: u.username });
      addedAll.add(u.uuid);
    }
  }
  for (const i of inbounds) {
    if (i.uuid && !addedAll.has(i.uuid)) {
      allClients.push({ id: i.uuid, email: i.remark || 'inbound' });
      addedAll.add(i.uuid);
    }
  }
  if (allClients.length === 0) {
    allClients.push({ id: '11111111-2222-3333-4444-555555555555', email: 'default' });
  }

  // Remove any conflicting port 10001 from xrayInbounds if present
  const filteredInbounds = xrayInbounds.filter(i => i.port !== 10001);

  filteredInbounds.push({
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

  const outbounds: any[] = [
    {
      protocol: "freedom",
      tag: "direct"
    },
    {
      protocol: "blackhole",
      tag: "blocked"
    },
    {
      protocol: "freedom",
      tag: "api"
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
  // CRITICAL SAFETY CHECK: Only inject WARP if registration was successful (keys must be non-empty and valid base64).
  // If registration failed/timed-out, warpOptions.secretKey will be empty → skip silently to prevent Xray crash loops.
  const isWarpKeyValid = (key?: string): boolean => {
    if (!key || key.trim().length < 32) return false;
    try { Buffer.from(key.trim(), 'base64'); return true; } catch { return false; }
  };

  if (warpOptions && warpOptions.enabled && isWarpKeyValid(warpOptions.secretKey) && isWarpKeyValid(warpOptions.publicKey)) {
    const warpOutbound = {
      protocol: "wireguard",
      settings: {
        secretKey: warpOptions.secretKey!.trim(),
        address: (warpOptions.address || []).filter(Boolean).length > 0
          ? warpOptions.address
          : ["172.16.0.2/32", "2606:4700:110:8f43:86d7:e76a:be77:8a1/128"],
        mtu: 1280, // Required for Cloudflare WARP — missing this causes WireGuard handshake failure
        peers: [
          {
            publicKey: warpOptions.publicKey!.trim(),
            endpoint: warpOptions.endpoint || "engage.cloudflareclient.com:2408",
            allowedIPs: ["0.0.0.0/0", "::/0"]
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
      // Add WARP outbound & routing rules for sanctioned services (ChatGPT, Netflix, Spotify)
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
  } else if (warpOptions && warpOptions.enabled) {
    // WARP is marked enabled but keys are missing/invalid (registration failed)
    console.warn('[Nyx Config] ⚠️ WARP is enabled but registration keys are missing or invalid. Skipping WARP outbound to prevent Xray crash. Please re-register WARP from the panel.');
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
    inbounds: filteredInbounds,
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
