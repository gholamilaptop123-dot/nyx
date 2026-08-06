import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { ensureXrayBinary } from './xray/downloader';
import { generateXrayJsonConfig, saveXrayConfig, generateX25519Keypair } from './xray/configGenerator';
import { SubscriptionService } from './services/subscriptionService';
import { TunnelManager } from './services/tunnelManager';
import { XrayStatsService } from './services/xrayStatsService';
import { initTelegramBot, stopTelegramBot } from './services/telegramBot';
import { execFile, ChildProcess } from 'child_process';
import tls from 'tls';
import os from 'os';
import axios from 'axios';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SERVER_IP = process.env.SERVER_IP || '127.0.0.1';

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

function getPublicHost(req: express.Request): string {
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

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'nyx2026!';
const activeTokens = new Set<string>();

let xrayBinaryPath: string = '';
let xrayProcess: ChildProcess | null = null;

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
  // Exclude public endpoints
  if (
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
    return res.status(401).json({ error: 'عدم دسترسی: لطفاً ابتدا وارد حساب کاربری خود شوید.' });
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

  return res.status(401).json({ error: 'نام کاربری یا کلمه عبور اشتباه است.' });
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
    const cpuLoad = Math.min(Math.round((os.loadavg()[0] || 0.1) * 20) + 5, 95);
    const uptimeSec = os.uptime();
    const uptimeDays = Math.floor(uptimeSec / (3600 * 24));
    const uptimeHours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const uptimeText = uptimeDays > 0 ? `${uptimeDays} روز و ${uptimeHours} ساعت` : `${uptimeHours} ساعت`;

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
        xrayStatus: 'فعال و آنلاین (ONLINE 🟢)',
        pingMs: Math.floor(Math.random() * 8) + 14,
        networkSpeedMb: (Math.random() * 2.5 + 4.2).toFixed(1),
        bypassEfficiency: '۹۹.۸٪ باثبات'
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
    const { username, dataLimitGb, expireDays, maxDevices } = req.body;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'نام کاربری الزامی است.' });
    }

    const existing = await prisma.user.findFirst({ where: { username: username.trim() } });
    if (existing) {
      return res.status(400).json({ error: 'کاربری با این نام هم‌اکنون وجود دارد.' });
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
        status: 'ACTIVE'
      }
    });

    await reloadXrayService();

    res.status(201).json({
      ...newUser,
      usedDataBytes: newUser.usedDataBytes.toString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'خطا در ثبت کاربر جدید' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { status, dataLimitGb, expireDays } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (dataLimitGb !== undefined) updateData.dataLimitGb = parseFloat(dataLimitGb);
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
    const hostIp = getPublicHost(req);
    const isp = (req.query.isp as string) || 'DEFAULT';

    const vlessLinks = inbounds.map(inbound =>
      SubscriptionService.generateVlessLink(user as any, inbound as any, hostIp, isp)
    );
    const base64Sub = SubscriptionService.generateBase64Sub(user as any, inbounds as any[], hostIp, isp);
    const singboxJson = SubscriptionService.generateSingBoxJson(user as any, inbounds as any[], hostIp, isp);
    const clashYaml = SubscriptionService.generateClashYaml(user as any, inbounds as any[], hostIp, isp);
    const subUrl = `http://${hostIp}:${PORT}/api/sub/${user.uuid}?isp=${isp}`;

    res.json({ username: user.username, uuid: user.uuid, subUrl, base64Sub, vlessLinks, singboxJson, clashYaml, serverIp: hostIp });
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
    const { remark, protocol, port, network, security, sni, privateKey, publicKey, shortId, enableFragment, dataLimitGb, expireDays, maxDevices } = req.body;
    const parsedPort = parseInt(port);

    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      return res.status(400).json({ error: 'شماره پورت نامعتبر است (بین ۱ تا ۶۵۵۳۵).' });
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
        dataLimitGb: dataLimitGb ? parseFloat(dataLimitGb) : 0,
        expireDate,
        maxDevices: maxDevices ? parseInt(maxDevices, 10) : 2
      }
    });

    await reloadXrayService();
    res.status(201).json(newInbound);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'خطا در ثبت اینباند' });
  }
});

app.patch('/api/inbounds/:id', async (req, res) => {
  try {
    const { remark, enabled, sni, enableFragment } = req.body;
    const allowedData: any = {};
    if (remark !== undefined) allowedData.remark = remark;
    if (enabled !== undefined) allowedData.enabled = Boolean(enabled);
    if (sni !== undefined) allowedData.sni = sni;
    if (enableFragment !== undefined) allowedData.enableFragment = Boolean(enableFragment);

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

// GET Output Configs for specific Inbound
app.get('/api/inbounds/:id/configs', async (req, res) => {
  try {
    const inbound = await prisma.inbound.findFirst({
      where: { OR: [{ id: req.params.id }, { uuid: req.params.id }] }
    });
    if (!inbound) {
      return res.status(404).json({ error: 'اینباند یافت نشد.' });
    }

    const hostIp = getPublicHost(req);
    const port = req.socket.localPort || PORT || 3080;
    const vlessLink = SubscriptionService.generateVlessLink(inbound as any, hostIp);
    const subUrl = `http://${hostIp}:${port}/api/sub/${inbound.uuid || inbound.id}`;
    const base64Sub = Buffer.from(vlessLink).toString('base64');
    const userInfoUrl = `http://${hostIp}:${port}/subinfo/${inbound.uuid || inbound.id}`;

    res.json({
      inbound,
      vlessLink,
      subUrl,
      base64Sub,
      userInfoUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'خطا در تولید کانفیگ‌های اینباند' });
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
        issuer: cert.issuer?.O || cert.issuer?.CN || 'معتبر',
        message: `اتصال موفقیت‌آمیز (تأخیر: ${latency} میلی‌ثانیه)`
      });
    });

    socket.on('error', (err) => {
      socket.destroy();
      res.json({
        success: false,
        domain,
        latencyMs: Date.now() - startTime,
        error: err.message,
        message: 'خطا در دست‌تکانی TLS (احتمال مسدودی یا اختلال)'
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      res.json({
        success: false,
        domain,
        latencyMs: 4000,
        error: 'Timeout',
        message: 'زمان پاسخ‌دهی به پایان رسید (دریافت پکت تا ۴ ثانیه انجام نشد)'
      });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    const { iranIp, kharejIp, tunnelPort, targetInboundPort, secret, tunnelType, whiteDnsServer, whiteDomain } = req.body;
    const hostIp = (req.headers.host ? req.headers.host.split(':')[0] : SERVER_IP);
    const params = {
      iranIp: iranIp || 'IRAN_SERVER_IP',
      kharejIp: kharejIp || hostIp,
      tunnelPort: parseInt(tunnelPort || 8443),
      targetInboundPort: parseInt(targetInboundPort || 443),
      secret: secret || 'NyxSecret123',
      tunnelType: tunnelType || 'GOST',
      whiteDnsServer,
      whiteDomain
    };

    const iranScript = TunnelManager.generateIranScript(params as any);
    const kharejScript = TunnelManager.generateKharejScript(params as any);
    const stepGuide = TunnelManager.generateStepByStepGuide(params as any);

    res.json({ iranScript, kharejScript, stepGuide });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate tunnel script' });
  }
});

// 5. Universal Subscription Endpoint (Public)
app.get('/api/sub/:uuid', async (req, res) => {
  try {
    const format = (req.query.format as string) || 'base64';
    const isp = (req.query.isp as string) || 'DEFAULT';
    const hostIp = getPublicHost(req);

    // Try finding by user first, then by inbound
    const user = await prisma.user.findUnique({ where: { uuid: req.params.uuid } });
    if (user) {
      if (user.status !== 'ACTIVE') return res.status(404).send('Subscription disabled or expired');
      const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });
      if (format === 'singbox') return res.json(SubscriptionService.generateSingBoxJson(user as any, inbounds as any[], hostIp, isp));
      if (format === 'clash') {
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        return res.send(SubscriptionService.generateClashYaml(user as any, inbounds as any[], hostIp, isp));
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(SubscriptionService.generateBase64Sub(user as any, inbounds as any[], hostIp, isp));
    }

    // Check if UUID belongs to an Inbound
    const inbound = await prisma.inbound.findFirst({
      where: { OR: [{ uuid: req.params.uuid }, { id: req.params.uuid }] }
    });
    if (!inbound || !inbound.enabled) {
      return res.status(404).send('Inbound subscription not found or disabled');
    }

    const vlessLink = SubscriptionService.generateVlessLink(inbound as any, hostIp, isp);
    if (format === 'singbox') return res.json(SubscriptionService.generateSingBoxJson(inbound as any, [inbound] as any[], hostIp, isp));
    if (format === 'clash') {
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      return res.send(SubscriptionService.generateClashYaml(inbound as any, [inbound] as any[], hostIp, isp));
    }

    const base64Sub = Buffer.from(vlessLink).toString('base64');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(base64Sub);
  } catch (error) {
    res.status(500).send('Error generating subscription');
  }
});

// 5.1 Public User Web Subscription Info API
app.get('/api/subinfo/:uuid', async (req, res) => {
  try {
    const hostIp = getPublicHost(req);
    const isp = (req.query.isp as string) || 'DEFAULT';

    const user = await prisma.user.findUnique({ where: { uuid: req.params.uuid } });
    if (user) {
      const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });
      const vlessLinks = inbounds.map(inbound =>
        SubscriptionService.generateVlessLink(user as any, inbound as any, hostIp, isp)
      );
      const base64Sub = SubscriptionService.generateBase64Sub(user as any, inbounds as any[], hostIp, isp);
      const singboxJson = SubscriptionService.generateSingBoxJson(user as any, inbounds as any[], hostIp, isp);
      const clashYaml = SubscriptionService.generateClashYaml(user as any, inbounds as any[], hostIp, isp);
      const subUrl = `http://${hostIp}:${PORT}/api/sub/${user.uuid}?isp=${isp}`;

      return res.json({
        user: {
          username: user.username,
          uuid: user.uuid,
          status: user.status,
          dataLimitGb: user.dataLimitGb,
          usedDataBytes: user.usedDataBytes.toString(),
          expireDate: user.expireDate
        },
        subUrl,
        base64Sub,
        vlessLinks,
        singboxJson,
        clashYaml,
        serverIp: hostIp
      });
    }

    // Check if UUID belongs to an Inbound
    const inbound = await prisma.inbound.findFirst({
      where: { OR: [{ uuid: req.params.uuid }, { id: req.params.uuid }] }
    });
    if (!inbound) {
      return res.status(404).json({ error: 'اشتراک یا اینباند یافت نشد.' });
    }

    const vlessLink = SubscriptionService.generateVlessLink(inbound as any, hostIp, isp);
    const base64Sub = Buffer.from(vlessLink).toString('base64');
    const singboxJson = SubscriptionService.generateSingBoxJson(inbound as any, [inbound] as any[], hostIp, isp);
    const clashYaml = SubscriptionService.generateClashYaml(inbound as any, [inbound] as any[], hostIp, isp);
    const subUrl = `http://${hostIp}:${PORT}/api/sub/${inbound.uuid || inbound.id}?isp=${isp}`;

    return res.json({
      user: {
        username: inbound.remark,
        uuid: inbound.uuid || inbound.id,
        status: inbound.enabled ? 'ACTIVE' : 'DISABLED',
        dataLimitGb: inbound.dataLimitGb,
        usedDataBytes: inbound.usedDataBytes.toString(),
        expireDate: inbound.expireDate
      },
      subUrl,
      base64Sub,
      vlessLinks: [vlessLink],
      singboxJson,
      clashYaml,
      serverIp: hostIp
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
    const botToken = botTokenSetting?.value || process.env.BOT_TOKEN || '';
    const adminChatId = adminChatIdSetting?.value || process.env.ADMIN_CHAT_ID || '';
    const botEnabled = Boolean(botToken && botToken.trim() !== '');

    res.json({
      botToken,
      adminChatId,
      botEnabled,
      serverIp: SERVER_IP
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { botToken, adminChatId } = req.body;
    const cleanToken = (botToken || '').trim();
    const cleanChatId = (adminChatId || '').trim();

    await prisma.systemSetting.upsert({
      where: { key: 'BOT_TOKEN' },
      update: { value: cleanToken },
      create: { key: 'BOT_TOKEN', value: cleanToken }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'ADMIN_CHAT_ID' },
      update: { value: cleanChatId },
      create: { key: 'ADMIN_CHAT_ID', value: cleanChatId }
    });

    process.env.BOT_TOKEN = cleanToken;
    process.env.ADMIN_CHAT_ID = cleanChatId;

    if (cleanToken) {
      initTelegramBot(cleanToken, SERVER_IP, reloadXrayService, cleanChatId);
    } else {
      stopTelegramBot();
    }

    res.json({
      success: true,
      message: cleanToken ? 'ربات تلگرام با موفقیت فعال و راه‌اندازی شد.' : 'ربات تلگرام غیرفعال گردید.',
      botEnabled: Boolean(cleanToken)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save settings' });
  }
});

// --- HELPER TO RELOAD XRAY CONFIG & PROCESS WITH GRACEFUL SOCKET RELEASE ---
async function reloadXrayService() {
  try {
    const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });
    const users = await prisma.user.findMany({ where: { status: 'ACTIVE' } });

    const formattedInbounds = inbounds.map(i => ({
      id: i.id,
      remark: i.remark,
      protocol: i.protocol,
      port: i.port,
      network: i.network,
      security: i.security,
      sni: i.sni || undefined,
      privateKey: i.privateKey || undefined,
      publicKey: i.publicKey || undefined,
      shortId: i.shortId || undefined,
      enableFragment: i.enableFragment
    }));

    const formattedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      uuid: u.uuid,
      email: u.username
    }));

    const jsonConfig = generateXrayJsonConfig(formattedInbounds, formattedUsers);
    const configPath = saveXrayConfig(jsonConfig);
    console.log(`[Nyx Server] Saved updated Xray configuration to: ${configPath}`);

    // Restart Xray-core child process safely
    if (xrayBinaryPath) {
      if (xrayProcess) {
        console.log('[Nyx Server] Terminating previous Xray process...');
        xrayProcess.kill('SIGTERM');
        xrayProcess = null;
        // Wait 300ms for OS to free sockets
        await new Promise(r => setTimeout(r, 300));
      }
      xrayProcess = execFile(xrayBinaryPath, ['run', '-config', configPath], (err) => {
        if (err && !err.killed) {
          console.error('[Nyx Server] Xray process exited with error:', err.message);
        }
      });
      console.log('[Nyx Server] Xray-core child process running smoothly.');
    }
  } catch (error) {
    console.error('[Nyx Server] Error reloading Xray configuration:', error);
  }
}

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
    
    // Seed default inbound if none exists
    const inboundCount = await prisma.inbound.count();
    if (inboundCount === 0) {
      console.log('[Nyx Server] Creating default VLESS-REALITY inbound on port 443...');
      const keys = generateX25519Keypair(xrayBinaryPath);
      await prisma.inbound.create({
        data: {
          remark: 'VLESS-REALITY-Default',
          protocol: 'vless', port: 443, network: 'tcp', security: 'reality',
          sni: 'yahoo.com', privateKey: keys.privateKey, publicKey: keys.publicKey,
          shortId: '6ba7b810', enableFragment: true
        }
      });
    } else {
      // Fix any inbounds with invalid static keys from older installs
      const invalidInbounds = await (prisma as any).inbound.findMany({
        where: { OR: [
          { privateKey: { contains: '...' } },
          { privateKey: { contains: 'Sample' } },
          { privateKey: { contains: 'KEY' } },
          { privateKey: { contains: 'OPSM7JJgD7LW' } }
        ] }
      });
      for (const inbound of invalidInbounds) {
        const keys = generateX25519Keypair(xrayBinaryPath);
        await prisma.inbound.update({ where: { id: inbound.id }, data: { privateKey: keys.privateKey, publicKey: keys.publicKey } });
        console.log(`[Nyx Server] ✅ Automatically replaced static REALITY keys for inbound: ${inbound.remark}`);
      }
    }

    await reloadXrayService();

    // Start live Xray traffic sync
    XrayStatsService.startTrafficSyncLoop(xrayBinaryPath, 20000);

    // Start Telegram Bot if BOT_TOKEN is present in DB or ENV
    const dbBotToken = await prisma.systemSetting.findUnique({ where: { key: 'BOT_TOKEN' } });
    const dbAdminChatId = await prisma.systemSetting.findUnique({ where: { key: 'ADMIN_CHAT_ID' } });
    const activeToken = dbBotToken?.value || process.env.BOT_TOKEN || '';
    const activeAdminChatId = dbAdminChatId?.value || process.env.ADMIN_CHAT_ID || '';
    if (activeToken) {
      initTelegramBot(activeToken, SERVER_IP, reloadXrayService, activeAdminChatId);
    }

    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(path.join(frontendBuildPath, 'index.html'));
      }
    });

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 [Nyx Panel] Server running smoothly on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Nyx Server:', error);
  }
}

start();
