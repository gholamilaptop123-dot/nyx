/**
 * Nyx Panel Core API Server
 * Advanced Anti-Censorship Xray Management Backend
 * Developed by Cynet Security Team (cynetx)
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { ensureXrayBinary } from './xray/downloader';
import { generateXrayJsonConfig, saveXrayConfig, generateX25519Keypair, validateInboundCompatibility } from './xray/configGenerator';
import { SubscriptionService } from './services/subscriptionService';
import { TunnelManager } from './services/tunnelManager';
import { XrayStatsService } from './services/xrayStatsService';
import { initTelegramBot, stopTelegramBot } from './services/telegramBot';
import { autoFailoverService } from './services/autoFailoverService';
import { WarpService } from './services/warpService';
import { BackupService } from './services/backupService';
import { multiPathEngine } from './services/multiPathService';
import { panicModeManager } from './services/panicModeService';
import { loadBalancer } from './services/loadBalancerService';
import { SslService } from './services/sslService';
import { execFile, ChildProcess } from 'child_process';
import http from 'http';
import net from 'net';
import tls from 'tls';
import os from 'os';
import axios from 'axios';

dotenv.config();

// Ensure DATABASE_URL is set (supports persistent volumes like /data on Railway/Render)
if (process.env.DATA_DIR) {
  process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${path.join(process.env.DATA_DIR, 'nyx.db')}`;
} else {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
}

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SERVER_IP = process.env.SERVER_IP || '127.0.0.1';

// Auto-detect PaaS (Railway / Render / Fly.io / Koyeb)
export const isPaaS = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_STATIC_URL ||
  process.env.RAILWAY_PUBLIC_DOMAIN ||
  process.env.RENDER ||
  process.env.FLY_APP_NAME ||
  process.env.PAAS_MODE
);

let cachedPublicIp = '';

async function autoDetectPublicIp() {
  try {
    const res = await axios.get('https://api.ipify.org?format=json', { timeout: 4000 });
    if (res.data && res.data.ip) {
      cachedPublicIp = res.data.ip;
    }
  } catch (err) {
    // fallback
  }
}

autoDetectPublicIp();
setInterval(autoDetectPublicIp, 300000);

let cachedCustomDomain: string = '';
let cachedClientPublicIp: string = '';
let cachedSubscriptionUrl: string = '';
let cachedSubscriptionHost: string = '';
let cachedSubscriptionPort: string = '';
let cachedSubscriptionProto: string = '';

async function loadSystemDomainAndRelaySettings() {
  try {
    const s = await prisma.systemSetting.findUnique({ where: { key: 'CUSTOM_DOMAIN' } });
    if (s && s.value.trim()) {
      cachedCustomDomain = s.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    } else {
      cachedCustomDomain = '';
    }

    const relay = await prisma.systemSetting.findUnique({ where: { key: 'CLIENT_PUBLIC_IP' } }) ||
                  await prisma.systemSetting.findUnique({ where: { key: 'RELAY_IP' } });
    if (relay && relay.value.trim()) {
      cachedClientPublicIp = relay.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    } else if (process.env.CLIENT_PUBLIC_IP || process.env.RELAY_IP) {
      cachedClientPublicIp = (process.env.CLIENT_PUBLIC_IP || process.env.RELAY_IP || '').trim();
    } else {
      cachedClientPublicIp = '';
    }

    const subUrlSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUBSCRIPTION_URL' } });
    cachedSubscriptionUrl = subUrlSetting?.value?.trim() || process.env.SUBSCRIPTION_URL?.trim() || '';

    const subHostSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUBSCRIPTION_HOST' } });
    cachedSubscriptionHost = subHostSetting?.value?.trim() || process.env.SUBSCRIPTION_HOST?.trim() || '';

    const subPortSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUBSCRIPTION_PORT' } });
    cachedSubscriptionPort = subPortSetting?.value?.trim() || process.env.SUBSCRIPTION_PORT?.trim() || '';

    const subProtoSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUBSCRIPTION_PROTO' } });
    cachedSubscriptionProto = subProtoSetting?.value?.trim() || process.env.SUBSCRIPTION_PROTO?.trim() || '';
  } catch (e) {}
}

/**
 * Returns the destination Host/IP where VPN proxy clients connect for traffic.
 * In Iran Relay scenarios, this returns the Iran Relay IP/Domain (CLIENT_PUBLIC_IP)
 * so that all VLESS / Trojan / VMess / Shadowsocks nodes point to the Iran server.
 */
function getConfigHost(req: express.Request): string {
  // Priority 0: Client-facing Public IP / Iran Relay IP (For Iran Relay / Kharej Master Tunnel architectures)
  if (cachedClientPublicIp) {
    return cachedClientPublicIp;
  }

  // Priority 1: Custom Domain configured in panel settings
  if (cachedCustomDomain) {
    return cachedCustomDomain;
  }

  // Priority 2: Cloud/Railway/PaaS environment variables
  const paasDomain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || process.env.RENDER_EXTERNAL_HOSTNAME || process.env.PUBLIC_DOMAIN || '';
  if (paasDomain) {
    return paasDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }

  // Priority 3: X-Forwarded-Host Header from PaaS reverse proxy
  const fwdHost = (req.headers['x-forwarded-host'] as string) || '';
  if (fwdHost && !fwdHost.includes('localhost') && !fwdHost.startsWith('127.0.0.1')) {
    return fwdHost.split(':')[0];
  }

  const reqHost = req.headers.host ? req.headers.host.split(':')[0] : '';
  if (reqHost && reqHost !== 'localhost' && reqHost !== '127.0.0.1' && !reqHost.startsWith('192.168.') && !reqHost.startsWith('10.')) {
    return reqHost;
  }
  if (process.env.SERVER_IP && process.env.SERVER_IP !== '127.0.0.1' && process.env.SERVER_IP !== 'localhost') {
    return process.env.SERVER_IP;
  }
  if (cachedPublicIp) {
    return cachedPublicIp;
  }
  return reqHost || '127.0.0.1';
}

export const getPublicHost = getConfigHost;

/**
 * Returns the full base URL used by client apps (v2rayNG, Sing-Box, Clash) to query, fetch & update subscriptions.
 * In Iran Relay / Multi-Node scenarios, this allows the subscription endpoint to be completely decoupled
 * from the VPN config address (e.g. Master IP:3080 or a dedicated Iran sub tunnel port 8080 or a custom sub domain).
 */
function getSubscriptionBaseUrl(req: express.Request): string {
  // 1. Explicit Full Subscription URL Override (e.g. https://sub.mydomain.com or http://62.60.132.228:8080)
  if (cachedSubscriptionUrl) {
    return cachedSubscriptionUrl.replace(/\/+$/, '');
  }

  // 2. Explicit Subscription Host + Port + Protocol
  if (cachedSubscriptionHost) {
    const proto = cachedSubscriptionProto || (req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http');
    const portPart = cachedSubscriptionPort ? `:${cachedSubscriptionPort}` : '';
    return `${proto}://${cachedSubscriptionHost}${portPart}`;
  }

  // 3. PaaS Cloud environment (Railway/Render/Fly.io)
  const paasDomain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || process.env.RENDER_EXTERNAL_HOSTNAME || process.env.PUBLIC_DOMAIN || '';
  if (paasDomain) {
    return `https://${paasDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`;
  }

  // 4. Custom Domain setting (if set and no specific sub host override)
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const defaultProto = isHttps ? 'https' : 'http';

  if (cachedCustomDomain) {
    const portPart = (PORT && String(PORT) !== '80' && String(PORT) !== '443' && !isHttps) ? `:${PORT}` : '';
    return `${defaultProto}://${cachedCustomDomain}${portPart}`;
  }

  // 5. Default: Master Panel Host & Port (Where the panel server actually listens and responds)
  const fwdHost = (req.headers['x-forwarded-host'] as string) || '';
  if (fwdHost && !fwdHost.includes('localhost') && !fwdHost.startsWith('127.0.0.1')) {
    return `${defaultProto}://${fwdHost}`;
  }

  const reqHost = req.headers.host || '';
  if (reqHost && !reqHost.includes('localhost') && !reqHost.startsWith('127.0.0.1')) {
    return `${defaultProto}://${reqHost}`;
  }

  const masterIp = process.env.SERVER_IP && process.env.SERVER_IP !== '127.0.0.1' ? process.env.SERVER_IP : (cachedPublicIp || '127.0.0.1');
  const panelPort = PORT ? `:${PORT}` : '';
  return `${defaultProto}://${masterIp}${panelPort}`;
}

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'nyx2026!';
const activeTokens = new Set<string>();

let xrayBinaryPath: string = '';
let xrayProcess: ChildProcess | null = null;
let isXrayRunning: boolean = false;
let xrayLastError: string = '';

app.use(cors());
app.use(express.json());

// Fix BigInt JSON serialization in Express (prevents "Do not know how to serialize a BigInt")
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Serve static frontend build with no-cache headers so UI updates reflect immediately
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendBuildPath, {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// --- AUTHENTICATION MIDDLEWARE ---
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Only protect /api/ routes! Non-API routes are public frontend SPA pages or static assets.
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Exclude public API endpoints
  if (
    req.path === '/health' ||
    req.path === '/api/health' ||
    req.path === '/api/multipath/health' ||
    req.path === '/api/multipath/status' ||
    req.path.startsWith('/api/sub/') ||
    req.path.startsWith('/api/subinfo/') ||
    req.path === '/api/auth/login' ||
    req.path === '/api/sni/test'
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Please log in first.' });
  }

  next();
};

app.use(requireAuth);

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    return res.json({ success: true, token, username });
  }

  return res.status(401).json({ error: 'Invalid username or password.' });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ authenticated: true, username: ADMIN_USER });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token) activeTokens.delete(token);
  res.json({ success: true });
});

// --- HEALTH ENDPOINTS (FOR RAILWAY / PAAS MONITORING) ---
app.get(['/health', '/api/health', '/api/multipath/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Nyx Panel',
    uptimeSec: Math.floor(process.uptime()),
    isXrayRunning,
    isPaaS,
    timestamp: new Date().toISOString()
  });
});

// --- API ENDPOINTS ---

// 1. Dashboard Overview Stats
app.get('/api/stats/dashboard', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const expiredUsers = await prisma.user.count({ where: { status: 'EXPIRED' } });
    const nodes = await prisma.node.findMany();
    const inbounds = await prisma.inbound.findMany();
    const users = await prisma.user.findMany();

    let totalBytes = BigInt(0);
    users.forEach(u => { totalBytes += u.usedDataBytes; });

    const hostIp = getPublicHost(req);

    const totalMemGb = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
    const usedMemGb = ((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)).toFixed(1);
    const ramPercent = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    // Correct CPU load: normalise load-average[1min] by CPU core count → 0-100%
    const numCpus = os.cpus().length || 1;
    const cpuLoad = Math.min(Math.round((os.loadavg()[0] / numCpus) * 100), 100);
    const uptimeSec = os.uptime();
    const uptimeDays = Math.floor(uptimeSec / (3600 * 24));
    const uptimeHours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const uptimeText = uptimeDays > 0 ? `${uptimeDays} Days ${uptimeHours} Hours` : `${uptimeHours} Hours`;

    res.json({
      totalUsers,
      activeUsers,
      expiredUsers,
      totalNodes: nodes.length,
      totalInbounds: inbounds.length,
      totalTransferredGb: (Number(totalBytes) / (1024 * 1024 * 1024)).toFixed(2),
      serverIp: hostIp,
      systemHealth: {
        cpuPercent: cpuLoad,
        ramUsageGb: `${usedMemGb} / ${totalMemGb} GB`,
        ramPercent,
        uptimeText,
        xrayStatus: isXrayRunning ? 'Active & Online (ONLINE 🟢)' : `Inactive / Error (OFFLINE 🔴 ${xrayLastError ? '- ' + xrayLastError : ''})`,
        bypassEfficiency: isXrayRunning ? 'Active ✅' : 'Inactive 🔴'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// 2. Users Management APIs
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const formatted = users.map(u => ({
      ...u,
      usedDataBytes: u.usedDataBytes.toString()
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, dataLimitGb, expireDays, maxDevices, inboundIds } = req.body;

    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const existing = await prisma.user.findFirst({ where: { username: username.trim() } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this username already exists.' });
    }

    let expireDate: Date | null = null;
    if (expireDays && Number(expireDays) > 0) {
      expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + Number(expireDays));
    }

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        dataLimitGb: parseFloat(dataLimitGb || 0),
        expireDate,
        maxDevices: parseInt(maxDevices || 2),
        inboundIds: inboundIds ? (Array.isArray(inboundIds) ? inboundIds.join(',') : String(inboundIds)) : null,
        status: 'ACTIVE'
      }
    });

    try {
      await reloadXrayService();
    } catch (reloadErr: any) {
      // Rollback: remove the just-created user so the DB stays clean
      await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {});
      return res.status(500).json({ error: `کاربر ساخته شد اما پیکربندی Xray ناموفق بود و لغو شد: ${reloadErr.message}` });
    }

    res.status(201).json({
      ...newUser,
      usedDataBytes: newUser.usedDataBytes.toString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { status, dataLimitGb, expireDays, inboundIds, maxDevices } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (dataLimitGb !== undefined) updateData.dataLimitGb = parseFloat(dataLimitGb);
    if (maxDevices !== undefined) updateData.maxDevices = parseInt(maxDevices, 10);
    if (inboundIds !== undefined) {
      updateData.inboundIds = inboundIds ? (Array.isArray(inboundIds) ? inboundIds.join(',') : String(inboundIds)) : null;
    }
    if (expireDays !== undefined) {
      if (Number(expireDays) > 0) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + Number(expireDays));
        updateData.expireDate = expireDate;
      } else {
        updateData.expireDate = null;
      }
    }
    const updated = await prisma.user.update({ where: { id: req.params.id }, data: updateData });
    await reloadXrayService();
    res.json({ ...updated, usedDataBytes: updated.usedDataBytes.toString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    await reloadXrayService();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 3. VPN Config Generator — Full configs for a user (all formats)
app.get('/api/users/:id/configs', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });
    const configHost = getConfigHost(req);
    const subBase = getSubscriptionBaseUrl(req);
    const isp = (req.query.isp as string) || 'DEFAULT';

    const vlessLinks = inbounds.map(inbound =>
      SubscriptionService.generateVlessLink(user as any, inbound as any, configHost, isp)
    );
    const base64Sub = SubscriptionService.generateBase64Sub(user as any, inbounds as any[], configHost, isp);
    const singboxJson = SubscriptionService.generateSingBoxJson(user as any, inbounds as any[], configHost, isp);
    const clashYaml = SubscriptionService.generateClashYaml(user as any, inbounds as any[], configHost, isp);
    const subUrl = `${subBase}/api/sub/${user.uuid}?isp=${isp}`;

    res.json({ username: user.username, uuid: user.uuid, subUrl, base64Sub, vlessLinks, singboxJson, clashYaml, serverIp: configHost });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate configs' });
  }
});

// 4. Inbound Management APIs
app.get('/api/inbounds/keygen', (req, res) => {
  try {
    const keys = generateX25519Keypair(xrayBinaryPath);
    const shortId = Math.random().toString(16).substring(2, 10);
    res.json({ ...keys, shortId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate keypair' });
  }
});

app.get('/api/inbounds', async (req, res) => {
  try {
    const inbounds = await prisma.inbound.findMany();
    res.json(inbounds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list inbounds' });
  }
});

app.post('/api/inbounds', async (req, res) => {
  try {
    const { remark, protocol, port, network, security, sni, privateKey, publicKey, shortId, enableFragment, fragmentLength, fragmentInterval, customDomain, dataLimitGb, expireDays, maxDevices, ssPassword, ssCipher, fingerprint, certPath, keyPath } = req.body;
    const parsedPort = parseInt(port);

    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      return res.status(400).json({ error: 'Invalid port number (Must be between 1 and 65535).' });
    }

    const validation = validateInboundCompatibility({ protocol, network, security });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const generatedKeys = generateX25519Keypair(xrayBinaryPath);
    let expireDate: Date | null = null;
    if (expireDays && Number(expireDays) > 0) {
      expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + Number(expireDays));
    }

    const newInbound = await prisma.inbound.create({
      data: {
        remark: remark || `Port-${parsedPort}`,
        protocol: protocol || 'vless',
        port: parsedPort,
        network: network || 'tcp',
        security: security || 'reality',
        sni: sni || 'yahoo.com',
        privateKey: privateKey || generatedKeys.privateKey,
        publicKey: publicKey || generatedKeys.publicKey,
        shortId: shortId || '6ba7b810',
        enableFragment: enableFragment !== undefined ? Boolean(enableFragment) : true,
        fragmentLength: fragmentLength || '100-200',
        fragmentInterval: fragmentInterval || '10-20',
        customDomain: customDomain?.trim() || null,
        dataLimitGb: dataLimitGb ? parseFloat(dataLimitGb) : 0,
        expireDate,
        maxDevices: maxDevices ? parseInt(maxDevices, 10) : 2,
        ssPassword: ssPassword?.trim() || null,
        ssCipher: ssCipher?.trim() || 'chacha20-ietf-poly1305',
        fingerprint: fingerprint?.trim() || 'chrome',
        certPath: certPath?.trim() || null,
        keyPath: keyPath?.trim() || null
      }
    });

    try {
      await reloadXrayService();
    } catch (reloadErr: any) {
      // Rollback: remove the just-created inbound so the DB stays clean
      await prisma.inbound.delete({ where: { id: newInbound.id } }).catch(() => {});
      return res.status(500).json({ error: `اینباند ساخته شد اما پیکربندی Xray ناموفق بود و لغو شد: ${reloadErr.message}` });
    }

    res.status(201).json(newInbound);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create inbound' });
  }
});

app.patch('/api/inbounds/:id', async (req, res) => {
  try {
    const { remark, enabled, sni, enableFragment, fragmentLength, fragmentInterval, customDomain, network, protocol, security, port, dataLimitGb, expireDays, maxDevices, ssPassword, ssCipher, fingerprint, certPath, keyPath } = req.body;
    
    // Check compatibility if protocol, network or security are being updated
    const currentInbound = await prisma.inbound.findUnique({ where: { id: req.params.id } });
    if (currentInbound) {
      const checkProto = protocol || currentInbound.protocol;
      const checkNet = network || currentInbound.network;
      const checkSec = security || currentInbound.security;
      const validation = validateInboundCompatibility({ protocol: checkProto, network: checkNet, security: checkSec });
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    const allowedData: any = {};
    if (remark !== undefined) allowedData.remark = remark;
    if (enabled !== undefined) allowedData.enabled = Boolean(enabled);
    if (sni !== undefined) allowedData.sni = sni;
    if (enableFragment !== undefined) allowedData.enableFragment = Boolean(enableFragment);
    if (fragmentLength !== undefined) allowedData.fragmentLength = fragmentLength;
    if (fragmentInterval !== undefined) allowedData.fragmentInterval = fragmentInterval;
    if (customDomain !== undefined) allowedData.customDomain = customDomain?.trim() || null;
    if (network !== undefined) allowedData.network = network;
    if (protocol !== undefined) allowedData.protocol = protocol;
    if (security !== undefined) allowedData.security = security;
    if (port !== undefined) allowedData.port = parseInt(port);
    if (dataLimitGb !== undefined) allowedData.dataLimitGb = parseFloat(dataLimitGb);
    if (maxDevices !== undefined) allowedData.maxDevices = parseInt(maxDevices, 10);
    if (ssPassword !== undefined) allowedData.ssPassword = ssPassword ? ssPassword.trim() : null;
    if (ssCipher !== undefined) allowedData.ssCipher = ssCipher ? ssCipher.trim() : 'chacha20-ietf-poly1305';
    if (fingerprint !== undefined) allowedData.fingerprint = fingerprint ? fingerprint.trim() : 'chrome';
    if (certPath !== undefined) allowedData.certPath = certPath ? certPath.trim() : null;
    if (keyPath !== undefined) allowedData.keyPath = keyPath ? keyPath.trim() : null;
    if (expireDays !== undefined) {
      if (Number(expireDays) > 0) {
        const d = new Date();
        d.setDate(d.getDate() + Number(expireDays));
        allowedData.expireDate = d;
      } else {
        allowedData.expireDate = null;
      }
    }

    const updated = await prisma.inbound.update({ where: { id: req.params.id }, data: allowedData });
    await reloadXrayService();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update inbound' });
  }
});

app.delete('/api/inbounds/:id', async (req, res) => {
  try {
    await prisma.inbound.delete({ where: { id: req.params.id } });
    await reloadXrayService();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inbound' });
  }
});

// --- SSL CERTIFICATE MANAGEMENT APIS ---
app.get('/api/ssl/certificates', async (req, res) => {
  try {
    const certs = await SslService.listCertificates(prisma);
    res.json(certs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list certificates' });
  }
});

app.post('/api/ssl/check-dns', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || !domain.trim()) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    const hostIp = cachedPublicIp || process.env.SERVER_IP || '127.0.0.1';
    const result = await SslService.checkDomainDns(domain, hostIp);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'DNS check failed' });
  }
});

app.post('/api/ssl/request', async (req, res) => {
  try {
    const { domain, email, attachInboundId } = req.body;
    if (!domain || !domain.trim()) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    const hostIp = cachedPublicIp || process.env.SERVER_IP || '127.0.0.1';
    const certInfo = await SslService.requestLetsEncrypt(prisma, domain, hostIp, email);

    if (attachInboundId) {
      await prisma.inbound.update({
        where: { id: attachInboundId },
        data: {
          certPath: certInfo.certPath,
          keyPath: certInfo.keyPath,
          certIssuer: certInfo.issuer,
          certExpireDate: certInfo.expireDate,
          customDomain: certInfo.domain
        }
      });
    }

    await reloadXrayService();
    res.json({ success: true, certificate: certInfo });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'SSL issuance failed' });
  }
});

app.post('/api/ssl/save-custom', async (req, res) => {
  try {
    const { domain, certPem, keyPem, attachInboundId } = req.body;
    if (!domain || !certPem || !keyPem) {
      return res.status(400).json({ error: 'Domain, certificate and private key are required.' });
    }
    const certInfo = await SslService.saveCertificate(prisma, domain, certPem, keyPem);

    if (attachInboundId) {
      await prisma.inbound.update({
        where: { id: attachInboundId },
        data: {
          certPath: certInfo.certPath,
          keyPath: certInfo.keyPath,
          certIssuer: certInfo.issuer,
          certExpireDate: certInfo.expireDate,
          customDomain: certInfo.domain
        }
      });
    }

    await reloadXrayService();
    res.json({ success: true, certificate: certInfo });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save certificate' });
  }
});

// GET Output Configs for specific Inbound
app.get('/api/inbounds/:id/configs', async (req, res) => {
  try {
    const inbound = await prisma.inbound.findFirst({
      where: { OR: [{ id: req.params.id }, { uuid: req.params.id }] }
    });
    if (!inbound) {
      return res.status(404).json({ error: 'Inbound not found.' });
    }

    const configHost = getConfigHost(req);
    const subBase = getSubscriptionBaseUrl(req);
    const vlessLink = SubscriptionService.generateVlessLink(inbound as any, configHost);
    const subUrl = `${subBase}/api/sub/${inbound.uuid || inbound.id}`;
    const base64Sub = Buffer.from(vlessLink).toString('base64');
    const userInfoUrl = `${subBase}/subinfo/${inbound.uuid || inbound.id}`;

    res.json({
      inbound,
      vlessLink,
      subUrl,
      base64Sub,
      userInfoUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate inbound configs' });
  }
});

// Real SNI Connection Tester Endpoint
app.get('/api/sni/test', async (req, res) => {
  const domain = (req.query.domain as string || 'yahoo.com').trim().toLowerCase();
  const startTime = Date.now();

  try {
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: 4000,
      rejectUnauthorized: false
    }, () => {
      const latency = Date.now() - startTime;
      const cert = socket.getPeerCertificate();
      socket.destroy();
      return res.json({
        success: true,
        domain,
        latencyMs: latency,
        issuer: cert.issuer?.O || cert.issuer?.CN || 'Valid',
        message: `Connection Successful (Latency: ${latency} ms)`
      });
    });

    socket.on('error', (err) => {
      socket.destroy();
      res.json({
        success: false,
        domain,
        latencyMs: Date.now() - startTime,
        error: err.message,
        message: 'TLS Handshake Error (Possible Blocking or Filtering)'
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      res.json({
        success: false,
        domain,
        latencyMs: 4000,
        error: 'Timeout',
        message: 'Response Timeout (No packet received within 4 seconds)'
      });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-Failover SNI Endpoints
app.get('/api/sni/auto-failover/status', (req, res) => {
  res.json(autoFailoverService.getStatus());
});

app.post('/api/sni/auto-failover/trigger', async (req, res) => {
  try {
    const result = await autoFailoverService.checkAndFailoverInbounds(prisma, reloadXrayService);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Quantum MultiPath Engine Endpoints ──────────────────────────────────────

// GET current network health snapshot (all 4 paths)
app.get('/api/multipath/status', (req, res) => {
  res.json(multiPathEngine.getSnapshot());
});

// POST trigger an immediate full path check
app.post('/api/multipath/check', async (req, res) => {
  try {
    const snapshot = await multiPathEngine.checkAllPaths();
    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'MultiPath check failed' });
  }
});

// GET inbound health scores from load balancer
app.get('/api/loadbalancer/health', (req, res) => {
  res.json({
    inbounds: loadBalancer.getAllHealth(),
    sortedIds: loadBalancer.getSortedIds()
  });
});

// GET panic mode status and history
app.get('/api/panic/status', (req, res) => {
  res.json(panicModeManager.getStatus());
});

// Cloudflare WARP Outbound Endpoints
app.get('/api/warp/status', async (req, res) => {
  try {
    const warpConfig = await WarpService.getWarpConfig(prisma);
    res.json(warpConfig || { enabled: false, mode: 'ALL' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warp/toggle', async (req, res) => {
  try {
    const { enabled, mode } = req.body;
    const updatedConfig = await WarpService.updateWarpStatus(prisma, Boolean(enabled), mode || 'ALL');
    await reloadXrayService();
    res.json({ success: true, config: updatedConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warp/register', async (req, res) => {
  try {
    const newConfig = await WarpService.registerWarpAccount(prisma);
    await reloadXrayService();
    res.json({ success: true, config: newConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Database Backup & Restore Endpoints
app.get('/api/backup/download', async (req, res) => {
  try {
    const backup = await BackupService.createBackup(prisma);
    res.download(backup.filePath, backup.fileName);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup/telegram-now', async (req, res) => {
  try {
    const backup = await BackupService.sendBackupToTelegram(prisma);
    res.json({ success: true, backup });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// System Control & Maintenance APIs
app.post('/api/system/restart', (req, res) => {
  res.json({ success: true, message: 'Nyx Panel service is restarting...' });
  setTimeout(() => {
    console.log('[Nyx Server] 🔄 System restart requested via Web UI. Restarting process...');
    if (process.platform !== 'win32') {
      execFile('systemctl', ['restart', 'nyx'], (err) => {
        if (err) {
          process.exit(0);
        }
      });
    } else {
      process.exit(0);
    }
  }, 1000);
});

app.post('/api/system/reload-xray', async (req, res) => {
  try {
    await reloadXrayService();
    res.json({ success: true, message: 'Xray core reloaded successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Multi-Node & Tunnel Generator APIs
app.get('/api/nodes', async (req, res) => {
  try {
    const nodes = await prisma.node.findMany();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list nodes' });
  }
});

app.post('/api/nodes', async (req, res) => {
  try {
    const { name, type, ip, apiPort, isMaster, tunnelType, tunnelPort, tunnelSecret } = req.body;
    const node = await prisma.node.create({
      data: {
        name,
        type: type || 'KHAREJ',
        ip,
        apiPort: parseInt(apiPort || 10085),
        isMaster: Boolean(isMaster),
        tunnelType: tunnelType || 'NONE',
        tunnelPort: tunnelPort ? parseInt(tunnelPort) : null,
        tunnelSecret: tunnelSecret || null
      }
    });
    res.status(201).json(node);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create node' });
  }
});

app.delete('/api/nodes/:id', async (req, res) => {
  try {
    await prisma.node.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete node' });
  }
});

app.post('/api/nodes/tunnel-script', async (req, res) => {
  try {
    const { iranIp, kharejIp, tunnelPort, targetInboundPort, secret, tunnelType, whiteDnsServer, whiteDomain, lang } = req.body;
    const hostIp = (req.headers.host ? req.headers.host.split(':')[0] : SERVER_IP);
    const params = {
      iranIp: iranIp || 'IRAN_SERVER_IP',
      kharejIp: kharejIp || hostIp,
      tunnelPort: parseInt(tunnelPort || 8443),
      targetInboundPort: parseInt(targetInboundPort || 443),
      secret: secret || 'NyxSecret123',
      tunnelType: tunnelType || 'GOST',
      whiteDnsServer,
      whiteDomain,
      lang: lang || 'en'
    };

    const iranScript = TunnelManager.generateIranScript(params as any);
    const kharejScript = TunnelManager.generateKharejScript(params as any);
    const stepGuide = TunnelManager.generateStepByStepGuide(params as any);

    res.json({ iranScript, kharejScript, stepGuide });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate tunnel script' });
  }
});

// 5. Universal Subscription Endpoint (Public - Supports /api/sub/:uuid, /sub/:uuid, and /api/v1/client/subscribe)
const handleSubscriptionRequest = async (req: express.Request, res: express.Response) => {
  try {
    const rawUuid = (req.params.uuid || req.query.token || req.query.uuid || '') as string;
    let format = (req.query.format as string) || '';
    const isp = (req.query.isp as string) || 'DEFAULT';
    const configHost = getConfigHost(req);

    // Auto-detect format based on client User-Agent if format query is not explicitly specified
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    if (!format) {
      if (userAgent.includes('sing-box') || userAgent.includes('singbox') || userAgent.includes('sfa') || userAgent.includes('sfi') || userAgent.includes('nekobox')) {
        format = 'singbox';
      } else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('stash') || userAgent.includes('mihomo')) {
        format = 'clash';
      } else {
        format = 'base64';
      }
    }

    // Try finding by user first, then by inbound
    const user = await prisma.user.findUnique({ where: { uuid: rawUuid } });
    if (user) {
      if (user.status !== 'ACTIVE') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(403).send('Subscription disabled or expired');
      }

      // Standard Subscription Headers (v2rayNG, Sing-Box, Shadowrocket, Clash)
      const uploadBytes = 0;
      const downloadBytes = user.usedDataBytes || 0;
      const totalBytes = user.dataLimitGb ? BigInt(user.dataLimitGb) * BigInt(1073741824) : 0n;
      const expireEpoch = user.expireDate ? Math.floor(new Date(user.expireDate).getTime() / 1000) : 0;
      
      res.setHeader('Subscription-Userinfo', `upload=${uploadBytes}; download=${downloadBytes}; total=${totalBytes}; expire=${expireEpoch}`);
      res.setHeader('Profile-Update-Interval', '24');
      res.setHeader('Profile-Title', 'base64:' + Buffer.from(`Nyx - ${user.username}`).toString('base64'));

      // Sort inbounds by health score — best server first in every subscription
      const rawInbounds = await prisma.inbound.findMany({ where: { enabled: true } });
      const inbounds = loadBalancer.sortInbounds(rawInbounds);

      if (format === 'singbox') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.json(SubscriptionService.generateSingBoxJson(user as any, inbounds as any[], configHost, isp));
      }
      if (format === 'clash') {
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        return res.send(SubscriptionService.generateClashYaml(user as any, inbounds as any[], configHost, isp));
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(SubscriptionService.generateBase64Sub(user as any, inbounds as any[], configHost, isp));
    }

    // Check if UUID belongs to an Inbound
    const inbound = await prisma.inbound.findFirst({
      where: { OR: [{ uuid: rawUuid }, { id: rawUuid }] }
    });
    if (!inbound || !inbound.enabled) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(404).send('Inbound subscription not found or disabled');
    }

    const vlessLink = SubscriptionService.generateVlessLink(inbound as any, configHost, isp);
    if (format === 'singbox') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.json(SubscriptionService.generateSingBoxJson(inbound as any, [inbound] as any[], configHost, isp));
    }
    if (format === 'clash') {
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      return res.send(SubscriptionService.generateClashYaml(inbound as any, [inbound] as any[], configHost, isp));
    }

    const base64Sub = Buffer.from(vlessLink).toString('base64');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(base64Sub);
  } catch (error) {
    res.status(500).send('Error generating subscription');
  }
};

app.get('/api/sub/:uuid', handleSubscriptionRequest);
app.get('/sub/:uuid', handleSubscriptionRequest);
app.get('/api/v1/client/subscribe', handleSubscriptionRequest);

// 5.1 Public User Web Subscription Info API
app.get('/api/subinfo/:uuid', async (req, res) => {
  try {
    const configHost = getConfigHost(req);
    const subBase = getSubscriptionBaseUrl(req);
    const isp = (req.query.isp as string) || 'DEFAULT';

    const user = await prisma.user.findUnique({ where: { uuid: req.params.uuid } });
    if (user) {
      const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });
      const vlessLinks = inbounds.map(inbound =>
        SubscriptionService.generateVlessLink(user as any, inbound as any, configHost, isp)
      );
      const base64Sub = SubscriptionService.generateBase64Sub(user as any, inbounds as any[], configHost, isp);
      const singboxJson = SubscriptionService.generateSingBoxJson(user as any, inbounds as any[], configHost, isp);
      const clashYaml = SubscriptionService.generateClashYaml(user as any, inbounds as any[], configHost, isp);
      const subUrl = `${subBase}/api/sub/${user.uuid}?isp=${isp}`;

      const subBrandName = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_BRAND_NAME' } }))?.value || 'Nyx Panel';
      const subLogoUrl = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_LOGO_URL' } }))?.value || '/logo_trans.png';
      const subSupportLink = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_SUPPORT_LINK' } }))?.value || '';
      const subChannelLink = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_CHANNEL_LINK' } }))?.value || '';
      const subAnnouncement = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_ANNOUNCEMENT' } }))?.value || '';
      const subThemeColor = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_THEME_COLOR' } }))?.value || 'amber';
      const subShowApps = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_SHOW_APPS' } }))?.value !== 'false';

      return res.json({
        user: {
          username: user.username,
          uuid: user.uuid,
          status: user.status,
          dataLimitGb: user.dataLimitGb,
          usedDataBytes: user.usedDataBytes.toString(),
          expireDate: user.expireDate,
          createdAt: user.createdAt,
          maxDevices: user.maxDevices || 2
        },
        brandSettings: {
          brandName: subBrandName,
          logoUrl: subLogoUrl,
          supportLink: subSupportLink,
          channelLink: subChannelLink,
          announcement: subAnnouncement,
          themeColor: subThemeColor,
          showApps: subShowApps
        },
        subUrl,
        base64Sub,
        vlessLinks,
        singboxJson,
        clashYaml,
        serverIp: configHost
      });
    }

    // Check if UUID belongs to an Inbound
    const inbound = await prisma.inbound.findFirst({
      where: { OR: [{ uuid: req.params.uuid }, { id: req.params.uuid }] }
    });
    if (!inbound) {
      return res.status(404).json({ error: 'Subscription or inbound not found.' });
    }

    const vlessLink = SubscriptionService.generateVlessLink(inbound as any, configHost, isp);
    const base64Sub = Buffer.from(vlessLink).toString('base64');
    const singboxJson = SubscriptionService.generateSingBoxJson(inbound as any, [inbound] as any[], configHost, isp);
    const clashYaml = SubscriptionService.generateClashYaml(inbound as any, [inbound] as any[], configHost, isp);
    const subUrl = `${subBase}/api/sub/${inbound.uuid || inbound.id}?isp=${isp}`;

    const subBrandName = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_BRAND_NAME' } }))?.value || 'Nyx Panel';
    const subLogoUrl = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_LOGO_URL' } }))?.value || '/logo_trans.png';
    const subSupportLink = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_SUPPORT_LINK' } }))?.value || '';
    const subChannelLink = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_CHANNEL_LINK' } }))?.value || '';
    const subAnnouncement = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_ANNOUNCEMENT' } }))?.value || '';
    const subThemeColor = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_THEME_COLOR' } }))?.value || 'amber';
    const subShowApps = (await prisma.systemSetting.findUnique({ where: { key: 'SUB_SHOW_APPS' } }))?.value !== 'false';

    return res.json({
      user: {
        username: inbound.remark,
        uuid: inbound.uuid || inbound.id,
        status: inbound.enabled ? 'ACTIVE' : 'DISABLED',
        dataLimitGb: inbound.dataLimitGb,
        usedDataBytes: inbound.usedDataBytes.toString(),
        expireDate: inbound.expireDate,
        createdAt: inbound.createdAt,
        maxDevices: inbound.maxDevices || 2
      },
      brandSettings: {
        brandName: subBrandName,
        logoUrl: subLogoUrl,
        supportLink: subSupportLink,
        channelLink: subChannelLink,
        announcement: subAnnouncement,
        themeColor: subThemeColor,
        showApps: subShowApps
      },
      subUrl,
      base64Sub,
      vlessLinks: [vlessLink],
      singboxJson,
      clashYaml,
      serverIp: configHost
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch subscription info' });
  }
});

// 6. System & Telegram Bot Settings APIs
app.get('/api/settings', async (req, res) => {
  try {
    const botTokenSetting = await prisma.systemSetting.findUnique({ where: { key: 'BOT_TOKEN' } });
    const adminChatIdSetting = await prisma.systemSetting.findUnique({ where: { key: 'ADMIN_CHAT_ID' } });
    const customDomainSetting = await prisma.systemSetting.findUnique({ where: { key: 'CUSTOM_DOMAIN' } });
    const relayIpSetting = await prisma.systemSetting.findUnique({ where: { key: 'CLIENT_PUBLIC_IP' } }) ||
                           await prisma.systemSetting.findUnique({ where: { key: 'RELAY_IP' } });
    
    const subUrlSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUBSCRIPTION_URL' } });
    const subHostSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUBSCRIPTION_HOST' } });
    const subPortSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUBSCRIPTION_PORT' } });
    const subProtoSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUBSCRIPTION_PROTO' } });

    // Sub portal branding
    const subBrandNameSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUB_BRAND_NAME' } });
    const subLogoUrlSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUB_LOGO_URL' } });
    const subSupportLinkSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUB_SUPPORT_LINK' } });
    const subChannelLinkSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUB_CHANNEL_LINK' } });
    const subAnnouncementSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUB_ANNOUNCEMENT' } });
    const subThemeColorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUB_THEME_COLOR' } });
    const subShowAppsSetting = await prisma.systemSetting.findUnique({ where: { key: 'SUB_SHOW_APPS' } });
    const autoFailoverSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTO_FAILOVER_ENABLED' } });

    const botToken = botTokenSetting?.value || process.env.BOT_TOKEN || '';
    const adminChatId = adminChatIdSetting?.value || process.env.ADMIN_CHAT_ID || '';
    const customDomain = customDomainSetting?.value || '';
    const clientPublicIp = relayIpSetting?.value || process.env.CLIENT_PUBLIC_IP || process.env.RELAY_IP || '';
    const botEnabled = Boolean(botToken && botToken.trim() !== '');
    const autoFailoverEnabled = autoFailoverSetting?.value === 'true';

    const subUrl = subUrlSetting?.value || '';
    const subHost = subHostSetting?.value || '';
    const subPort = subPortSetting?.value || '';
    const subProto = subProtoSetting?.value || 'http';

    res.json({
      botToken,
      adminChatId,
      botEnabled,
      customDomain,
      clientPublicIp,
      autoFailoverEnabled,
      subUrl,
      subHost,
      subPort,
      subProto,
      masterIp: process.env.SERVER_IP || cachedPublicIp || '127.0.0.1',
      panelPort: String(PORT || 3080),
      subBrandName: subBrandNameSetting?.value || 'Nyx Panel',
      subLogoUrl: subLogoUrlSetting?.value || '/logo_trans.png',
      subSupportLink: subSupportLinkSetting?.value || '',
      subChannelLink: subChannelLinkSetting?.value || '',
      subAnnouncement: subAnnouncementSetting?.value || '',
      subThemeColor: subThemeColorSetting?.value || 'amber',
      subShowApps: subShowAppsSetting?.value !== 'false',
      serverIp: clientPublicIp || customDomain || cachedPublicIp || SERVER_IP
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const {
      botToken,
      adminChatId,
      customDomain,
      clientPublicIp,
      autoFailoverEnabled,
      subUrl,
      subHost,
      subPort,
      subProto,
      subBrandName,
      subLogoUrl,
      subSupportLink,
      subChannelLink,
      subAnnouncement,
      subThemeColor,
      subShowApps
    } = req.body;

    if (autoFailoverEnabled !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'AUTO_FAILOVER_ENABLED' },
        update: { value: autoFailoverEnabled ? 'true' : 'false' },
        create: { key: 'AUTO_FAILOVER_ENABLED', value: autoFailoverEnabled ? 'true' : 'false' }
      });
    }

    if (botToken !== undefined) {
      const cleanToken = (botToken || '').trim();
      await prisma.systemSetting.upsert({
        where: { key: 'BOT_TOKEN' },
        update: { value: cleanToken },
        create: { key: 'BOT_TOKEN', value: cleanToken }
      });
      process.env.BOT_TOKEN = cleanToken;
    }

    if (adminChatId !== undefined) {
      const cleanChatId = (adminChatId || '').trim();
      await prisma.systemSetting.upsert({
        where: { key: 'ADMIN_CHAT_ID' },
        update: { value: cleanChatId },
        create: { key: 'ADMIN_CHAT_ID', value: cleanChatId }
      });
      process.env.ADMIN_CHAT_ID = cleanChatId;
    }

    if (customDomain !== undefined) {
      const cleanDomain = (customDomain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      await prisma.systemSetting.upsert({
        where: { key: 'CUSTOM_DOMAIN' },
        update: { value: cleanDomain },
        create: { key: 'CUSTOM_DOMAIN', value: cleanDomain }
      });
      cachedCustomDomain = cleanDomain;
    }

    if (clientPublicIp !== undefined) {
      const cleanRelay = (clientPublicIp || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      await prisma.systemSetting.upsert({
        where: { key: 'CLIENT_PUBLIC_IP' },
        update: { value: cleanRelay },
        create: { key: 'CLIENT_PUBLIC_IP', value: cleanRelay }
      });
      cachedClientPublicIp = cleanRelay;
    }

    if (subUrl !== undefined) {
      const cleanSubUrl = (subUrl || '').trim();
      await prisma.systemSetting.upsert({
        where: { key: 'SUBSCRIPTION_URL' },
        update: { value: cleanSubUrl },
        create: { key: 'SUBSCRIPTION_URL', value: cleanSubUrl }
      });
      cachedSubscriptionUrl = cleanSubUrl;
    }

    if (subHost !== undefined) {
      const cleanSubHost = (subHost || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      await prisma.systemSetting.upsert({
        where: { key: 'SUBSCRIPTION_HOST' },
        update: { value: cleanSubHost },
        create: { key: 'SUBSCRIPTION_HOST', value: cleanSubHost }
      });
      cachedSubscriptionHost = cleanSubHost;
    }

    if (subPort !== undefined) {
      const cleanSubPort = (subPort || '').toString().trim();
      await prisma.systemSetting.upsert({
        where: { key: 'SUBSCRIPTION_PORT' },
        update: { value: cleanSubPort },
        create: { key: 'SUBSCRIPTION_PORT', value: cleanSubPort }
      });
      cachedSubscriptionPort = cleanSubPort;
    }

    if (subProto !== undefined) {
      const cleanSubProto = (subProto || 'http').trim().toLowerCase();
      await prisma.systemSetting.upsert({
        where: { key: 'SUBSCRIPTION_PROTO' },
        update: { value: cleanSubProto },
        create: { key: 'SUBSCRIPTION_PROTO', value: cleanSubProto }
      });
      cachedSubscriptionProto = cleanSubProto;
    }

    if (subBrandName !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'SUB_BRAND_NAME' },
        update: { value: (subBrandName || '').trim() },
        create: { key: 'SUB_BRAND_NAME', value: (subBrandName || '').trim() }
      });
    }

    if (subLogoUrl !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'SUB_LOGO_URL' },
        update: { value: (subLogoUrl || '').trim() },
        create: { key: 'SUB_LOGO_URL', value: (subLogoUrl || '').trim() }
      });
    }

    if (subSupportLink !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'SUB_SUPPORT_LINK' },
        update: { value: (subSupportLink || '').trim() },
        create: { key: 'SUB_SUPPORT_LINK', value: (subSupportLink || '').trim() }
      });
    }

    if (subChannelLink !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'SUB_CHANNEL_LINK' },
        update: { value: (subChannelLink || '').trim() },
        create: { key: 'SUB_CHANNEL_LINK', value: (subChannelLink || '').trim() }
      });
    }

    if (subAnnouncement !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'SUB_ANNOUNCEMENT' },
        update: { value: (subAnnouncement || '').trim() },
        create: { key: 'SUB_ANNOUNCEMENT', value: (subAnnouncement || '').trim() }
      });
    }

    if (subThemeColor !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'SUB_THEME_COLOR' },
        update: { value: subThemeColor },
        create: { key: 'SUB_THEME_COLOR', value: subThemeColor }
      });
    }

    if (subShowApps !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'SUB_SHOW_APPS' },
        update: { value: String(subShowApps) },
        create: { key: 'SUB_SHOW_APPS', value: String(subShowApps) }
      });
    }

    if (botToken !== undefined && botToken.trim()) {
      initTelegramBot(botToken.trim(), SERVER_IP, reloadXrayService, (adminChatId || '').trim());
    } else if (botToken !== undefined && !botToken.trim()) {
      stopTelegramBot();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      botEnabled: Boolean(process.env.BOT_TOKEN),
      customDomain: cachedCustomDomain
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save settings' });
  }
});

// Xray service process manager
async function reloadXrayService() {
  try {
    const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });
    const users = await prisma.user.findMany({ where: { status: 'ACTIVE' } });

    const formattedInbounds = inbounds.map(i => ({
      id: i.id,
      uuid: i.uuid,
      remark: i.remark,
      protocol: i.protocol,
      port: i.port,
      network: i.network,
      security: i.security,
      sni: i.sni || undefined,
      privateKey: i.privateKey || undefined,
      publicKey: i.publicKey || undefined,
      shortId: i.shortId || undefined,
      enableFragment: i.enableFragment,
      fragmentLength: i.fragmentLength || undefined,
      fragmentInterval: i.fragmentInterval || undefined,
      customDomain: i.customDomain || undefined,
      fingerprint: i.fingerprint || 'chrome',
      certPath: i.certPath || undefined,
      keyPath: i.keyPath || undefined,
      ssPassword: i.ssPassword || undefined,   // Shadowsocks password
      ssCipher: i.ssCipher || undefined          // Shadowsocks cipher method
    }));

    const formattedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      uuid: u.uuid,
      email: u.username,
      // CRITICAL: must pass inboundIds so configGenerator can enforce per-user inbound access control
      inboundIds: u.inboundIds || null
    }));

    const warpSetting = await WarpService.getWarpConfig(prisma);
    const warpOptions = warpSetting && warpSetting.enabled ? {
      enabled: true,
      mode: warpSetting.mode,
      secretKey: warpSetting.privateKey,
      address: [warpSetting.ipv4, warpSetting.ipv6],
      publicKey: warpSetting.peerPublicKey,
      endpoint: warpSetting.endpoint
    } : undefined;

    const jsonConfig = generateXrayJsonConfig(formattedInbounds, formattedUsers, warpOptions);
    const binDir = path.join(process.cwd(), 'bin');
    if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });

    const testConfigPath = path.join(binDir, 'config.test.json');
    const realConfigPath = path.join(binDir, 'config.json');
    const backupConfigPath = path.join(binDir, 'config.backup.json');

    // 1. Write candidate config to temporary test file
    fs.writeFileSync(testConfigPath, JSON.stringify(jsonConfig, null, 2));

    // 2. Perform Atomic Configuration Validation (-test)
    if (xrayBinaryPath && fs.existsSync(xrayBinaryPath)) {
      try {
        const { execSync } = require('child_process');
        execSync(`"${xrayBinaryPath}" -test -config "${testConfigPath}"`, { stdio: 'pipe' });
        console.log('[Nyx Server] ✅ Candidate Xray configuration passed atomic validation test (-test)!');
      } catch (testErr: any) {
        const testOutput = testErr.stderr?.toString() || testErr.stdout?.toString() || testErr.message;
        console.error('[Nyx Server] ❌ Candidate Xray configuration failed -test validation!\n', testOutput);
        throw new Error(`پیکربندی جدید Xray نامعتبر است و رد شد:\n${testOutput}`);
      }
    }

    // 3. Promote test config to real config & create backup snapshot
    if (fs.existsSync(realConfigPath)) {
      try {
        fs.copyFileSync(realConfigPath, backupConfigPath);
      } catch (e) { }
    }
    fs.copyFileSync(testConfigPath, realConfigPath);
    console.log(`[Nyx Server] Saved validated Xray configuration to: ${realConfigPath}`);

    // Unblock firewall ports for all active inbounds automatically
    if (process.platform !== 'win32') {
      const { execSync } = require('child_process');
      for (const inb of inbounds) {
        try {
          execSync(`iptables -I INPUT -p tcp --dport ${inb.port} -j ACCEPT 2>/dev/null || true`);
          execSync(`iptables -I INPUT -p udp --dport ${inb.port} -j ACCEPT 2>/dev/null || true`);
          execSync(`ufw allow ${inb.port}/tcp 2>/dev/null || true`);
          execSync(`ufw allow ${inb.port}/udp 2>/dev/null || true`);
        } catch (e) { }
      }
    }

    // Restart Xray-core child process safely
    if (xrayBinaryPath) {
      // Kill only the xray child we spawned (by PID) to avoid collateral kills
      if (xrayProcess) {
        try { xrayProcess.kill('SIGKILL'); } catch (e) { }
        xrayProcess = null;
      }
      if (process.platform !== 'win32') {
        const { execSync } = require('child_process');
        try {
          // Use 'xray run' pattern to avoid matching unrelated processes
          execSync('pkill -9 -f "xray run" 2>/dev/null || true');
          execSync('fuser -k -9 10085/tcp 2>/dev/null || true');
        } catch (e) { }
      }
      await new Promise(r => setTimeout(r, 400));

      xrayProcess = execFile(xrayBinaryPath, ['run', '-config', realConfigPath], (err, stdout, stderr) => {
        if (err && !err.killed) {
          isXrayRunning = false;
          xrayLastError = stderr || err.message;
          console.error('[Nyx Server] ❌ Xray process exited with error:', err.message);
          if (stderr) console.error('[Nyx Server] Xray stderr:', stderr);
        }
      });

      if (xrayProcess.stdout) {
        xrayProcess.stdout.on('data', (data) => console.log(`[Xray] ${data.toString().trim()}`));
      }
      if (xrayProcess.stderr) {
        xrayProcess.stderr.on('data', (data) => console.warn(`[Xray Log] ${data.toString().trim()}`));
      }

      setTimeout(() => {
        if (xrayProcess && xrayProcess.exitCode === null && !xrayProcess.killed) {
          isXrayRunning = true;
          xrayLastError = '';
          console.log(`[Nyx Server] ✅ Xray-core child process running smoothly on PID: ${xrayProcess.pid}`);
        } else {
          isXrayRunning = false;
          console.error('[Nyx Server] ❌ Xray-core process failed to start or crashed.');
        }
      }, 1000);
    }
  } catch (error: any) {
    console.error('[Nyx Server] Error reloading Xray configuration:', error.message);
    throw error;
  }
}

// 1-Click Rollback Xray Config API Endpoint
app.post('/api/system/rollback-xray', async (req, res) => {
  try {
    const binDir = path.join(process.cwd(), 'bin');
    const realConfigPath = path.join(binDir, 'config.json');
    const backupConfigPath = path.join(binDir, 'config.backup.json');

    if (!fs.existsSync(backupConfigPath)) {
      return res.status(400).json({ error: 'هیچ اسنپ‌شات بکاپی برای بازگردانی وجود ندارد.' });
    }

    fs.copyFileSync(backupConfigPath, realConfigPath);
    await reloadXrayService();
    res.json({ success: true, message: 'پیکربندی Xray با موفقیت به اسنپ‌شات قبلی بازگردانی شد.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Rollback failed' });
  }
});

// Default SPA Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      res.send('Nyx Backend API is live!');
    }
  });
});

// --- START SERVER ---
async function start() {
  try {
    xrayBinaryPath = await ensureXrayBinary();
    await loadSystemDomainAndRelaySettings();

    // Seed default inbound if none exists
    const inboundCount = await prisma.inbound.count();
    if (inboundCount === 0) {
      if (isPaaS) {
        console.log('[Nyx Server] ☁️ PaaS Cloud Environment Detected (Railway/Render)! Creating default VLESS-WS CDN Inbound on port 10001...');
        await prisma.inbound.create({
          data: {
            remark: '⚡ Railway-Cloud-WSS',
            protocol: 'vless',
            port: 10001,
            network: 'ws',
            security: 'none',
            sni: 'ebanking.banksepah.ir',
            enableFragment: false,
            maxDevices: 2
          }
        });
      } else {
        console.log('[Nyx Server] Creating default VLESS-REALITY inbound on port 443...');
        const keys = generateX25519Keypair(xrayBinaryPath);
        await prisma.inbound.create({
          data: {
            remark: '⚡ Cynet-Default-VIP',
            protocol: 'vless', port: 443, network: 'tcp', security: 'reality',
            sni: 'ebanking.banksepah.ir', privateKey: keys.privateKey, publicKey: keys.publicKey,
            shortId: '6ba7b810', enableFragment: true, maxDevices: 2
          }
        });
      }
    }

    // Refresh and guarantee valid X25519 keys for all REALITY inbounds
    const allInbounds = await prisma.inbound.findMany();
    for (const inbound of allInbounds) {
      if (inbound.security === 'reality' && (!inbound.privateKey || !inbound.publicKey || inbound.privateKey.length !== 43)) {
        const keys = generateX25519Keypair(xrayBinaryPath);
        await prisma.inbound.update({
          where: { id: inbound.id },
          data: { privateKey: keys.privateKey, publicKey: keys.publicKey }
        });
        console.log(`[Nyx Server] ✅ Refreshed valid X25519 REALITY keys for inbound: ${inbound.remark}`);
      }
    }

    await reloadXrayService();

    // Start live Xray traffic sync (pass shared prisma + reload callback so expired users are kicked immediately)
    XrayStatsService.startTrafficSyncLoop(xrayBinaryPath, prisma, 20000, reloadXrayService);

    // Start Auto-Failover background monitoring daemon (checks every 60 seconds)
    autoFailoverService.startDaemon(prisma, reloadXrayService, 60000);

    // Start Daily Automated Telegram Backup daemon (runs every 24 hours)
    BackupService.startBackupDaemon(prisma, 86400000);

    // Start Daily Automated SSL Certificate Renewal daemon (runs every 24 hours)
    SslService.startAutoRenewDaemon(prisma, reloadXrayService, 86400000);

    // ── Quantum MultiPath Engine — monitors 4 connection paths every 15s ──────
    const getSniDomain = async () => {
      try {
        const first = await prisma.inbound.findFirst({ where: { enabled: true }, orderBy: { createdAt: 'asc' } });
        return first?.sni || 'ebanking.banksepah.ir';
      } catch { return 'ebanking.banksepah.ir'; }
    };
    // Set dynamic SNI getter so multipath always uses the current active SNI
    multiPathEngine.setSniDomainGetter(() => 'ebanking.banksepah.ir');
    getSniDomain().then(sni => multiPathEngine.setSniDomainGetter(() => sni)).catch(() => { });
    multiPathEngine.startMonitoring(15000);

    // ── Panic Mode Emergency Detector — monitors for full internet blackouts ──
    panicModeManager.startMonitoring(15000);

    // ── Smart Load Balancer — health-scores inbounds every 30s ───────────────
    loadBalancer.startMonitoring(prisma, 30000);

    console.log('[Nyx Server] 🚀 Quantum MultiPath Engine + Panic Mode + Load Balancer → ARMED');

    // Start Telegram Bot if BOT_TOKEN is present in DB or ENV
    const dbBotToken = await prisma.systemSetting.findUnique({ where: { key: 'BOT_TOKEN' } });
    const dbAdminChatId = await prisma.systemSetting.findUnique({ where: { key: 'ADMIN_CHAT_ID' } });
    const activeToken = dbBotToken?.value || process.env.BOT_TOKEN || '';
    const activeAdminChatId = dbAdminChatId?.value || process.env.ADMIN_CHAT_ID || '';
    if (activeToken) {
      initTelegramBot(activeToken, SERVER_IP, reloadXrayService, activeAdminChatId);
    }

    // SPA fallback is handled by the global app.get('*') route registered above.

    // ── WebSocket Multiplexer for PaaS (Railway / Render / CDN / Single Port) ──
    server.on('upgrade', (req, socket, head) => {
      const url = req.url || '';
      if (
        url.startsWith('/nyx') ||
        url.startsWith('/ws') ||
        url.startsWith('/vless') ||
        url.startsWith('/vmess') ||
        url.startsWith('/trojan') ||
        url.startsWith('/xhttp') ||
        url.startsWith('/nyx-xhttp') ||
        url.startsWith('/grpc')
      ) {
        console.log(`[WS Bridge] 🔄 Proxying incoming WebSocket connection: ${url}`);
        const xraySocket = net.connect({ port: 10001, host: '127.0.0.1' }, () => {
          let rawHeaderStr = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
          if (req.rawHeaders && req.rawHeaders.length > 0) {
            for (let i = 0; i < req.rawHeaders.length; i += 2) {
              rawHeaderStr += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
            }
          } else {
            for (const [k, v] of Object.entries(req.headers)) {
              rawHeaderStr += `${k}: ${Array.isArray(v) ? v.join(', ') : v}\r\n`;
            }
          }
          rawHeaderStr += '\r\n';

          xraySocket.write(rawHeaderStr);
          if (head && head.length > 0) {
            xraySocket.write(head);
          }
          xraySocket.pipe(socket);
          socket.pipe(xraySocket);
        });

        xraySocket.on('error', (err) => {
          console.error('[WS Bridge] ❌ Error connecting to internal Xray port 10001:', err.message);
          try { socket.destroy(); } catch (e) { }
        });
        socket.on('error', () => {
          try { xraySocket.destroy(); } catch (e) { }
        });
      } else {
        socket.destroy();
      }
    });

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 [Nyx Panel] Server running on http://0.0.0.0:${PORT} (Cloud/PaaS Mode: ${isPaaS ? 'ENABLED ☁️' : 'DISABLED 💻'})`);
    });
  } catch (error) {
    console.error('Failed to start Nyx Server:', error);
  }
}

start();
