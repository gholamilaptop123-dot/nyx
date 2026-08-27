/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║         Nyx Panel — Smart Load Balancer Service                     ║
 * ║  Health-based intelligent inbound scoring & traffic distribution    ║
 * ║  Ensures subscription links always deliver the best server first    ║
 * ║  Developed by Cynet Security Team (cynetx.ir)                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { PrismaClient } from '@prisma/client';
import tls from 'tls';
import net from 'net';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InboundHealth {
  id: string;
  remark: string;
  port: number;
  sni: string;
  latencyMs: number;
  healthy: boolean;
  score: number;
  lastChecked: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  uptime: number; // 0–100 rolling percentage
  checksTotal: number;
  checksHealthy: number;
}

// ─── Real Port & TLS Health Test ──────────────────────────────────────────────

function testLocalInboundPort(port: number, timeoutMs = 1500): Promise<boolean> {
  return new Promise(resolve => {
    const s = net.connect({ host: '127.0.0.1', port, timeout: timeoutMs }, () => {
      s.destroy();
      resolve(true);
    });
    s.on('error', () => { s.destroy(); resolve(false); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
  });
}

function testInboundTls(
  sni: string,
  timeoutMs = 3500
): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  return new Promise(resolve => {
    const t0 = Date.now();
    const sock = tls.connect(
      { host: sni, port: 443, servername: sni, rejectUnauthorized: false, timeout: timeoutMs },
      () => { const ms = Date.now() - t0; sock.destroy(); resolve({ healthy: true, latencyMs: ms }); }
    );
    sock.on('error', err => { sock.destroy(); resolve({ healthy: false, latencyMs: Date.now() - t0, error: err.message }); });
    sock.on('timeout', () => { sock.destroy(); resolve({ healthy: false, latencyMs: timeoutMs, error: 'TLS Timeout' }); });
  });
}

function calcInboundScore(healthy: boolean, latencyMs: number, cf: number, uptime: number): number {
  if (!healthy) return 0;
  let base: number;
  if (latencyMs < 80)   base = 100;
  else if (latencyMs < 180) base = 92;
  else if (latencyMs < 350) base = 80;
  else if (latencyMs < 600) base = 62;
  else if (latencyMs < 1000) base = 42;
  else base = 22;

  // Uptime weight: a server with 95%+ uptime gets a bonus
  const uptimeBonus = uptime >= 95 ? 8 : uptime >= 80 ? 4 : uptime >= 60 ? 0 : -5;
  // Recent stability penalty
  const stabilityPenalty = cf === 0 ? 3 : 0;

  return Math.max(0, Math.min(100, base + uptimeBonus + stabilityPenalty));
}

// ─── Load Balancer Class ──────────────────────────────────────────────────────

class LoadBalancerService {
  private healthMap = new Map<string, InboundHealth>();
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  /** Run a full health check on all enabled inbounds (verifying process port & TLS) */
  async refreshHealth(prisma: PrismaClient): Promise<void> {
    let inbounds: { id: string; remark: string; port: number; sni?: string | null }[] = [];
    try {
      inbounds = await prisma.inbound.findMany({
        where: { enabled: true },
        select: { id: true, remark: true, port: true, sni: true }
      });
    } catch {
      return; // DB not ready yet, skip silently
    }

    if (inbounds.length === 0) return;

    const results = await Promise.allSettled(
      inbounds.map(async ib => {
        const sni = ib.sni || 'ebanking.banksepah.ir';
        // 1. First test if Xray process is actually listening on the local port
        const isPortListening = await testLocalInboundPort(ib.port, 1200);
        
        let result: { healthy: boolean; latencyMs: number; error?: string };
        if (!isPortListening) {
          result = { healthy: false, latencyMs: 9999, error: 'Xray Inbound Port Not Listening' };
        } else {
          result = await testInboundTls(sni, 3000);
        }

        const prev = this.healthMap.get(ib.id);
        const checksTotal = (prev?.checksTotal ?? 0) + 1;
        const checksHealthy = (prev?.checksHealthy ?? 0) + (result.healthy ? 1 : 0);
        const cf = result.healthy ? 0 : (prev?.consecutiveFailures ?? 0) + 1;
        const cs = result.healthy ? (prev?.consecutiveSuccesses ?? 0) + 1 : 0;
        const uptime = Math.round((checksHealthy / checksTotal) * 100);
        const score = calcInboundScore(result.healthy, result.latencyMs, cf, uptime);

        const health: InboundHealth = {
          id: ib.id,
          remark: ib.remark,
          port: ib.port,
          sni,
          latencyMs: result.latencyMs,
          healthy: result.healthy,
          score,
          lastChecked: new Date(),
          consecutiveFailures: cf,
          consecutiveSuccesses: cs,
          uptime,
          checksTotal,
          checksHealthy
        };

        this.healthMap.set(ib.id, health);
        return health;
      })
    );

    const healthy = results.filter(r => r.status === 'fulfilled' && (r.value as InboundHealth).healthy).length;
    console.log(`[Load Balancer] ⚖️ Health check done: ${healthy}/${inbounds.length} inbounds healthy`);
  }

  /**
   * Sort an array of inbound-like objects by their health score (best first).
   * Objects without a health entry get a neutral score of 50 (not penalised).
   * Generic so it works with any Prisma result type.
   */
  sortInbounds<T extends { id: string }>(inbounds: T[]): T[] {
    return [...inbounds].sort((a, b) => {
      const sa = this.healthMap.get(a.id)?.score ?? 50;
      const sb = this.healthMap.get(b.id)?.score ?? 50;
      return sb - sa;
    });
  }

  /** Ordered list of inbound IDs, best health first */
  getSortedIds(): string[] {
    return Array.from(this.healthMap.values())
      .sort((a, b) => b.score - a.score)
      .map(h => h.id);
  }

  /** All inbound health data sorted by score */
  getAllHealth(): InboundHealth[] {
    return Array.from(this.healthMap.values()).sort((a, b) => b.score - a.score);
  }

  getHealth(id: string): InboundHealth | undefined {
    return this.healthMap.get(id);
  }

  startMonitoring(prisma: PrismaClient, intervalMs = 30000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Load Balancer] ⚖️ Smart load balancer started — inbound health refresh every 30s');
    // Delay first check so DB is fully ready
    setTimeout(() => this.refreshHealth(prisma).catch(() => {}), 8000);
    this.intervalTimer = setInterval(() => this.refreshHealth(prisma).catch(() => {}), intervalMs);
  }

  stopMonitoring() {
    if (this.intervalTimer) { clearInterval(this.intervalTimer); this.intervalTimer = null; }
    this.isRunning = false;
  }
}

export const loadBalancer = new LoadBalancerService();
