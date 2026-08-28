/**
 * Nyx Panel Cloudflare WARP Outbound & WireGuard Mesh Engine
 * Developed by Cynet Security Team (cynetx)
 */
import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

export interface WarpAccountConfig {
  privateKey: string;
  publicKey: string;
  ipv4: string;
  ipv6: string;
  peerPublicKey: string;
  endpoint: string;
  enabled: boolean;
  mode: 'ALL' | 'SANCTIONED';
}



function generateWgKeypair(): { privateKey: string; publicKey: string } {
  try {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('x25519');
    const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });
    const pubDer = publicKey.export({ type: 'spki', format: 'der' });
    const privRaw = privDer.subarray(privDer.length - 32);
    const pubRaw = pubDer.subarray(pubDer.length - 32);
    return {
      privateKey: privRaw.toString('base64'),
      publicKey: pubRaw.toString('base64')
    };
  } catch (e) {
    const privRaw = crypto.randomBytes(32);
    const pubRaw = crypto.randomBytes(32);
    return {
      privateKey: privRaw.toString('base64'),
      publicKey: pubRaw.toString('base64')
    };
  }
}

export class WarpService {
  /**
   * Registers a fresh Cloudflare WARP account via official Cloudflare Client API
   */
  static async registerWarpAccount(prisma: PrismaClient): Promise<WarpAccountConfig> {
    console.log('[WARP Service] Registering new Cloudflare WARP WireGuard account...');
    const keys = generateWgKeypair();

    const candidateApiEndpoints = [
      'https://api.cloudflareclient.com/v0a2158/reg',
      'https://api.cloudflareclient.com/v0a2405/reg',
      'https://api.cloudflareclient.com/v0a3160/reg',
      'https://api.cloudflareclient.com/v0a884/reg'
    ];

    let lastError: any = null;
    let registeredData: any = null;

    for (const endpointUrl of candidateApiEndpoints) {
      try {
        const response = await axios.post(
          endpointUrl,
          {
            install_id: '',
            fcm_token: '',
            tos: new Date().toISOString(),
            key: keys.publicKey,
            type: 'Android',
            locale: 'en_US'
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'okhttp/3.12.1'
            },
            timeout: 10000
          }
        );

        if (response.data && response.data.config) {
          registeredData = response.data.config;
          console.log(`[WARP Service] ✅ Cloudflare API registration succeeded via: ${endpointUrl}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[WARP Service] API attempt failed on ${endpointUrl}: ${err.message}`);
      }
    }

    if (!registeredData) {
      console.error('[WARP Service] ❌ All Cloudflare WARP API registration attempts failed!');
      throw new Error(`ثبت‌نام اکانت WARP در کلودفلر ناموفق بود (احتمالاً به دلیل تحریم یا اختلال شبکه به کلودفلر). جزییات: ${lastError?.message || 'Timeout'}`);
    }

    const v4 = (registeredData.interface?.addresses?.v4 || '172.16.0.2') + '/32';
    const v6 = (registeredData.interface?.addresses?.v6 || '2606:4700:110:8f43:86d7:e76a:be77:8a1') + '/128';
    const peerPub = registeredData.peers?.[0]?.public_key || 'bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=';
    const endpoint = registeredData.peers?.[0]?.endpoint?.v4 || 'engage.cloudflareclient.com:2408';

    const warpConfig: WarpAccountConfig = {
      privateKey: keys.privateKey,
      publicKey: keys.publicKey,
      ipv4: v4,
      ipv6: v6,
      peerPublicKey: peerPub,
      endpoint: endpoint,
      enabled: true,
      mode: 'ALL'
    };

    console.log(`[WARP Service] ✅ Successfully registered Cloudflare WARP account (Assigned IPv4: ${v4})`);

    // Save WARP account details in SystemSetting DB table
    await prisma.systemSetting.upsert({
      where: { key: 'WARP_CONFIG' },
      update: { value: JSON.stringify(warpConfig) },
      create: { key: 'WARP_CONFIG', value: JSON.stringify(warpConfig) }
    });

    return warpConfig;
  }

  /**
   * Gets active WARP configuration from DB
   */
  static async getWarpConfig(prisma: PrismaClient): Promise<WarpAccountConfig | null> {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'WARP_CONFIG' } });
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
    } catch (e) {}
    return null;
  }

  /**
   * Toggles WARP outbound on/off or updates routing mode ('ALL' | 'SANCTIONED')
   */
  static async updateWarpStatus(
    prisma: PrismaClient,
    enabled: boolean,
    mode: 'ALL' | 'SANCTIONED' = 'ALL'
  ): Promise<WarpAccountConfig> {
    let currentConfig = await this.getWarpConfig(prisma);
    if (!currentConfig && enabled) {
      currentConfig = await this.registerWarpAccount(prisma);
    }

    if (currentConfig) {
      currentConfig.enabled = enabled;
      currentConfig.mode = mode;

      await prisma.systemSetting.upsert({
        where: { key: 'WARP_CONFIG' },
        update: { value: JSON.stringify(currentConfig) },
        create: { key: 'WARP_CONFIG', value: JSON.stringify(currentConfig) }
      });
    }

    console.log(`[WARP Service] Updated WARP Outbound state: enabled=${enabled}, mode=${mode}`);
    return currentConfig || {
      privateKey: '',
      publicKey: '',
      ipv4: '',
      ipv6: '',
      peerPublicKey: '',
      endpoint: '',
      enabled: false,
      mode: 'ALL'
    };
  }
}
