/**
 * Nyx Panel Smart Dynamic Anti-Blackout Auto-Failover SNI Engine
 * Developed by Cynet Security Team (cynetx)
 */
import tls from 'tls';
import { PrismaClient } from '@prisma/client';
import { sendAdminNotification } from './telegramBot';

// Curated list of high-reliability Whitelist & Fallback SNIs for Iran network conditions
export const FALLBACK_SNI_POOL = [
  { domain: 'ebanking.banksepah.ir', label: '💳 Shaparak / Bank Sepah (Whitelist)' },
  { domain: 'bmi.ir', label: '💳 Bank Melli (Whitelist)' },
  { domain: 'arvancloud.ir', label: '☁️ ArvanCloud CDN' },
  { domain: 'divar.ir', label: '🚗 Essential Apps' },
  { domain: 'digikala.com', label: '🛒 E-Commerce' },
  { domain: 'pypi.org', label: '📦 Software Repos' },
  { domain: 'archive.ubuntu.com', label: '📦 Ubuntu Repo' },
  { domain: 'yahoo.com', label: '🌐 Global Mask' }
];

export interface SniHealthResult {
  domain: string;
  healthy: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * Tests TLS 1.3 handshake on port 443 for a target SNI domain
 */
export function testSniDomain(domain: string, timeoutMs: number = 3000): Promise<SniHealthResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let isResolved = false;

    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        timeout: timeoutMs
      },
      () => {
        if (!isResolved) {
          isResolved = true;
          const latencyMs = Date.now() - startTime;
          socket.destroy();
          resolve({ domain, healthy: true, latencyMs });
        }
      }
    );

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ domain, healthy: false, latencyMs: 9999, error: err.message });
      }
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ domain, healthy: false, latencyMs: timeoutMs, error: 'Connection Timeout (>3s)' });
      }
    });
  });
}

export interface FailoverEvent {
  inboundId: string;
  remark: string;
  oldSni: string;
  newSni: string;
  latencyMs: number;
  timestamp: Date;
}

class AutoFailoverManager {
  private isRunning: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private lastCheckTime: Date | null = null;
  private failoverHistory: FailoverEvent[] = [];
  // Track consecutive failures per inbound to avoid flapping on single network glitch
  private failureCounts: Map<string, number> = new Map();
  private readonly CONSECUTIVE_FAIL_THRESHOLD = 5;

  /**
   * Performs live health check on all enabled Inbounds and auto-switches blocked SNIs
   */
  async checkAndFailoverInbounds(prisma: PrismaClient, reloadXrayCore: () => Promise<void>, force: boolean = false): Promise<{
    checkedCount: number;
    switchedCount: number;
    events: FailoverEvent[];
  }> {
    const events: FailoverEvent[] = [];
    let switchedCount = 0;

    try {
      // Check if Auto-Failover background switching is enabled in system settings
      if (!force) {
        const setting = await prisma.systemSetting.findUnique({ where: { key: 'AUTO_FAILOVER_ENABLED' } });
        if (setting?.value !== 'true') {
          return { checkedCount: 0, switchedCount: 0, events: [] };
        }
      }

      const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });

      for (const inbound of inbounds) {
        const currentSni = inbound.sni || 'yahoo.com';

        // Skip auto-failover check for cloud/PaaS domains or custom domains
        if (
          currentSni.includes('.app.github.dev') ||
          currentSni.includes('.railway.app') ||
          currentSni.includes('.onrender.com') ||
          currentSni.includes('.koyeb.app')
        ) {
          continue;
        }

        const currentHealth = await testSniDomain(currentSni, 3000);

        if (currentHealth.healthy) {
          this.failureCounts.set(inbound.id, 0);
          continue;
        }

        const fails = (this.failureCounts.get(inbound.id) || 0) + 1;
        this.failureCounts.set(inbound.id, fails);
        console.warn(`[Auto-Failover] ⚠️ SNI "${currentSni}" failed check (${fails}/${this.CONSECUTIVE_FAIL_THRESHOLD}) on inbound "${inbound.remark}".`);

        // Only trigger failover if threshold reached or forced by admin
        if (!force && fails < this.CONSECUTIVE_FAIL_THRESHOLD) {
          continue;
        }

        console.warn(`[Auto-Failover] 🚨 SNI "${currentSni}" reached failure threshold on inbound "${inbound.remark}". Searching for fallback SNI...`);

        // Search for the best working fallback SNI in the pool
        let candidateFound: SniHealthResult | null = null;
        for (const candidate of FALLBACK_SNI_POOL) {
          if (candidate.domain === currentSni) continue;
          const candidateHealth = await testSniDomain(candidate.domain, 2500);
          if (candidateHealth.healthy) {
            candidateFound = candidateHealth;
            break;
          }
        }

        if (candidateFound) {
          const oldSni = currentSni;
          const newSni = candidateFound.domain;
          this.failureCounts.set(inbound.id, 0);

          // Update Inbound SNI in Database
          await prisma.inbound.update({
            where: { id: inbound.id },
            data: { sni: newSni }
          });

          switchedCount++;
          const failoverEvent: FailoverEvent = {
            inboundId: inbound.id,
            remark: inbound.remark,
            oldSni,
            newSni,
            latencyMs: candidateFound.latencyMs,
            timestamp: new Date()
          };

          events.push(failoverEvent);
          this.failoverHistory.unshift(failoverEvent);
          if (this.failoverHistory.length > 50) this.failoverHistory.pop();

          console.log(`[Auto-Failover] ⚡ Auto-Switched inbound "${inbound.remark}" SNI: ${oldSni} -> ${newSni} (${candidateFound.latencyMs}ms)`);

          // Send immediate Telegram alert to Admin
          const alertMessage = `⚠️ <b>[Nyx Auto-Failover Alert / سوئیچ اتوماتیک SNI]</b>\n` +
            `🔹 <b>Inbound:</b> ${inbound.remark}\n` +
            `❌ <b>Blocked SNI:</b> <code>${oldSni}</code>\n` +
            `✅ <b>New Active SNI:</b> <code>${newSni}</code>\n` +
            `⚡ <b>Response Latency:</b> ${candidateFound.latencyMs}ms\n` +
            `📅 <b>Time:</b> ${new Date().toLocaleTimeString('fa-IR')}\n\n` +
            `<i>User subscriptions auto-updated without link changes!</i>`;

          sendAdminNotification(alertMessage).catch(() => {});
        } else {
          console.error(`[Auto-Failover] ❌ Critical: No healthy fallback SNIs responded for inbound "${inbound.remark}".`);
        }
      }

      // If any SNI was switched, reload Xray-core config immediately!
      if (switchedCount > 0) {
        console.log(`[Auto-Failover] Reloading Xray core configuration with ${switchedCount} new SNIs...`);
        await reloadXrayCore();
      }

      this.lastCheckTime = new Date();
    } catch (err) {
      console.error('[Auto-Failover] Error during failover execution:', err);
    }

    return {
      checkedCount: (await prisma.inbound.count({ where: { enabled: true } })),
      switchedCount,
      events
    };
  }

  /**
   * Starts background monitoring daemon (checks every 2 minutes with 5x hysteresis)
   */
  startDaemon(prisma: PrismaClient, reloadXrayCore: () => Promise<void>, intervalMs: number = 120000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Auto-Failover] Daemon started (checking every ${intervalMs / 1000}s with 5-check hysteresis)...`);

    this.intervalTimer = setInterval(() => {
      this.checkAndFailoverInbounds(prisma, reloadXrayCore, false).catch(() => {});
    }, intervalMs);
  }

  /**
   * Stops background monitoring daemon
   */
  stopDaemon() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
    console.log('[Auto-Failover] Daemon stopped.');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      failoverHistory: this.failoverHistory.slice(0, 10),
      fallbackPool: FALLBACK_SNI_POOL
    };
  }
}

export const autoFailoverService = new AutoFailoverManager();
