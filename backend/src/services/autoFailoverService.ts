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

  /**
   * Performs live health check on all enabled Inbounds and auto-switches blocked SNIs
   */
  async checkAndFailoverInbounds(prisma: PrismaClient, reloadXrayCore: () => Promise<void>): Promise<{
    checkedCount: number;
    switchedCount: number;
    events: FailoverEvent[];
  }> {
    const events: FailoverEvent[] = [];
    let switchedCount = 0;

    try {
      const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });

      for (const inbound of inbounds) {
        const currentSni = inbound.sni || 'yahoo.com';
        console.log(`[Auto-Failover] Testing live SNI "${currentSni}" for inbound "${inbound.remark}"...`);

        const currentHealth = await testSniDomain(currentSni, 3000);

        if (currentHealth.healthy) {
          console.log(`[Auto-Failover] ✅ SNI "${currentSni}" is healthy (${currentHealth.latencyMs}ms) for inbound "${inbound.remark}".`);
          continue;
        }

        console.warn(`[Auto-Failover] ⚠️ SNI "${currentSni}" FAILED on inbound "${inbound.remark}" (${currentHealth.error || 'Blocked'}). Searching for working fallback SNI...`);

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
   * Starts background monitoring daemon
   */
  startDaemon(prisma: PrismaClient, reloadXrayCore: () => Promise<void>, intervalMs: number = 60000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Auto-Failover] Daemon started (checking every ${intervalMs / 1000}s)...`);

    // Initial check on server startup
    setTimeout(() => {
      this.checkAndFailoverInbounds(prisma, reloadXrayCore).catch(() => {});
    }, 10000);

    this.intervalTimer = setInterval(() => {
      this.checkAndFailoverInbounds(prisma, reloadXrayCore).catch(() => {});
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
