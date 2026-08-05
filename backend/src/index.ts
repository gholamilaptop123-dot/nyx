import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ensureXrayBinary } from './xray/downloader';
import { generateXrayJsonConfig, saveXrayConfig, generateX25519Keypair } from './xray/configGenerator';
import { SubscriptionService } from './services/subscriptionService';
import { TunnelManager } from './services/tunnelManager';
import { initTelegramBot } from './services/telegramBot';
import { execFile, ChildProcess } from 'child_process';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SERVER_IP = process.env.SERVER_IP || '127.0.0.1';

let xrayBinaryPath: string = '';
let xrayProcess: ChildProcess | null = null;

app.use(cors());
app.use(express.json());

// Serve static frontend build if present
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendBuildPath));

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

    const hostIp = (req.headers.host ? req.headers.host.split(':')[0] : SERVER_IP);

    res.json({
      totalUsers,
      activeUsers,
      expiredUsers,
      totalNodes: nodes.length,
      totalInbounds: inbounds.length,
      totalTransferredGb: (Number(totalBytes) / (1024 * 1024 * 1024)).toFixed(2),
      serverIp: hostIp
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
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    let expireDate: Date | null = null;
    if (expireDays && Number(expireDays) > 0) {
      expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + Number(expireDays));
    }

    const newUser = await prisma.user.create({
      data: {
        username,
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
    res.status(500).json({ error: error.message || 'Failed to create user' });
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
    const hostIp = (req.headers.host ? req.headers.host.split(':')[0] : SERVER_IP);
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
    const { remark, protocol, port, network, security, sni, privateKey, publicKey, shortId, enableFragment } = req.body;
    const generatedKeys = generateX25519Keypair(xrayBinaryPath);

    const newInbound = await prisma.inbound.create({
      data: {
        remark: remark || `Port-${port}`,
        protocol: protocol || 'vless',
        port: parseInt(port),
        network: network || 'tcp',
        security: security || 'reality',
        sni: sni || 'yahoo.com',
        privateKey: privateKey || generatedKeys.privateKey,
        publicKey: publicKey || generatedKeys.publicKey,
        shortId: shortId || '6ba7b810',
        enableFragment: enableFragment !== undefined ? Boolean(enableFragment) : true
      }
    });

    await reloadXrayService();
    res.status(201).json(newInbound);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create inbound' });
  }
});

app.patch('/api/inbounds/:id', async (req, res) => {
  try {
    const updated = await prisma.inbound.update({ where: { id: req.params.id }, data: req.body });
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
    const { name, type, ip, tunnelType, tunnelPort } = req.body;
    const node = await prisma.node.create({
      data: {
        name,
        type: type || 'KHAREJ',
        ip,
        tunnelType: tunnelType || 'NONE',
        tunnelPort: tunnelPort ? parseInt(tunnelPort) : null
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

// 5. Universal Subscription Endpoint
app.get('/api/sub/:uuid', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { uuid: req.params.uuid } });
    if (!user || user.status !== 'ACTIVE') {
      return res.status(404).send('Subscription disabled or expired');
    }

    const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });
    const format = (req.query.format as string) || 'base64';
    const isp = (req.query.isp as string) || 'DEFAULT';
    const hostIp = (req.headers.host ? req.headers.host.split(':')[0] : SERVER_IP);

    if (format === 'singbox') {
      const jsonConfig = SubscriptionService.generateSingBoxJson(user as any, inbounds as any[], hostIp, isp);
      return res.json(jsonConfig);
    }
    if (format === 'clash') {
      const yaml = SubscriptionService.generateClashYaml(user as any, inbounds as any[], hostIp, isp);
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      return res.send(yaml);
    }

    const base64Sub = SubscriptionService.generateBase64Sub(user, inbounds, hostIp, isp);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(base64Sub);
  } catch (error) {
    res.status(500).send('Error generating subscription');
  }
});

// --- HELPER TO RELOAD XRAY CONFIG & PROCESS ---
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
      email: u.email || undefined
    }));

    const jsonConfig = generateXrayJsonConfig(formattedInbounds, formattedUsers);
    const configPath = saveXrayConfig(jsonConfig);
    console.log(`[Nyx Server] Saved updated Xray configuration to: ${configPath}`);

    // Restart Xray-core child process if binary is available
    if (xrayBinaryPath) {
      if (xrayProcess) {
        console.log('[Nyx Server] Restarting Xray-core child process...');
        xrayProcess.kill();
        xrayProcess = null;
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
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      res.send('Nyx Anti-Censorship Backend API is live!');
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
      // Fix any inbounds with invalid placeholder keys from old installs
      const invalidInbounds = await (prisma as any).inbound.findMany({
        where: { OR: [{ privateKey: { contains: '...' } }, { privateKey: { contains: 'Sample' } }, { privateKey: { contains: 'KEY' } }] }
      });
      for (const inbound of invalidInbounds) {
        const keys = generateX25519Keypair(xrayBinaryPath);
        await prisma.inbound.update({ where: { id: inbound.id }, data: { privateKey: keys.privateKey, publicKey: keys.publicKey } });
        console.log(`[Nyx Server] Fixed invalid REALITY keys for inbound: ${inbound.remark}`);
      }
    }

    await reloadXrayService();

    // Start Telegram Bot if BOT_TOKEN is present
    if (process.env.BOT_TOKEN) {
      initTelegramBot(process.env.BOT_TOKEN, SERVER_IP);
    }

    app.listen(PORT, () => {
      console.log(`🚀 [Nyx Panel] Server running smoothly on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Nyx Server:', error);
  }
}

start();
