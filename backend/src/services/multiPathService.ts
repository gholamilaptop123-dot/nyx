/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║         Nyx Panel — Quantum MultiPath Engine v1.0                   ║
 * ║  Real-time simultaneous health monitoring of 4 connection paths     ║
 * ║  Automatic protocol switching during Iranian internet blackouts     ║
 * ║  Developed by Cynet Security Team (cynetx.ir)                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import tls from 'tls';
import dns from 'dns';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// ─── Types ────────────────────────────────────────────────────────────────────

export type PathType = 'DIRECT_TLS' | 'CDN_ARVAN' | 'DNS_RESOLUTION' | 'ICMP_PING';

export type OverallHealth = 'EXCELLENT' | 'GOOD' | 'DEGRADED' | 'CRITICAL' | 'PANIC';

export interface PathHealthResult {
  path: PathType;
  label: string;
  label_fa: string;
  emoji: string;
  healthy: boolean;
  latencyMs: number;
  error?: string;
  timestamp: Date;
  consecutiveFailures: number;
  score: number; // 0–100: higher = better
}

export interface NetworkSnapshot {
  overallHealth: OverallHealth;
  paths: Record<PathType, PathHealthResult>;
  bestPath: PathType | null;
  panicMode: boolean;
  recommendation: string;
  recommendation_fa: string;
  lastUpdate: Date;
  checkCount: number;
}

// ─── Static Config ────────────────────────────────────────────────────────────

const PATH_META: Record<PathType, { label: string; label_fa: string; emoji: string }> = {
  DIRECT_TLS: {
    label: 'Direct TLS / VLESS Reality',
    label_fa: 'مستقیم TLS / ریلیتی',
    emoji: '🛡️'
  },
  CDN_ARVAN: {
    label: 'CDN Iran Gateway (ArvanCloud)',
    label_fa: 'دروازه CDN ایران (ابر آروان)',
    emoji: '☁️'
  },
  DNS_RESOLUTION: {
    label: 'DNS Tunnel Viability (Port 53)',
    label_fa: 'امکان تونل DNS (پورت ۵۳)',
    emoji: '🌐'
  },
  ICMP_PING: {
    label: 'ICMP Ping Path (L3 Bypass)',
    label_fa: 'مسیر پینگ ICMP (دور زدن لایه ۳)',
    emoji: '📡'
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcScore(healthy: boolean, latencyMs: number, consecutiveFailures: number): number {
  if (!healthy) return 0;
  let score: number;
  if (latencyMs < 80) score = 100;
  else if (latencyMs < 200) score = 90;
  else if (latencyMs < 400) score = 75;
  else if (latencyMs < 800) score = 55;
  else if (latencyMs < 1500) score = 35;
  else score = 15;
  // Stability bonus — reward paths that have never recently failed
  if (consecutiveFailures === 0) score = Math.min(100, score + 5);
  return score;
}

// ─── Individual Path Testers ──────────────────────────────────────────────────

/** Test 1 — Real TLS 1.3 handshake (proves Reality / VLESS connectivity) */
function testDirectTls(
  sniDomain: string,
  timeoutMs = 4500
): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  return new Promise(resolve => {
    const t0 = Date.now();
    const sock = tls.connect(
      { host: sniDomain, port: 443, servername: sniDomain, rejectUnauthorized: false, timeout: timeoutMs },
      () => { const ms = Date.now() - t0; sock.destroy(); resolve({ healthy: true, latencyMs: ms }); }
    );
    sock.on('error', err => { sock.destroy(); resolve({ healthy: false, latencyMs: Date.now() - t0, error: err.message }); });
    sock.on('timeout', () => { sock.destroy(); resolve({ healthy: false, latencyMs: timeoutMs, error: 'TLS Timeout (>4.5s)' }); });
  });
}

/** Test 2 — ArvanCloud CDN has PoP nodes inside Iran: if this works, CDN-based tunneling is viable */
function testCdnArvan(timeoutMs = 4000): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  return new Promise(resolve => {
    const t0 = Date.now();
    const sock = tls.connect(
      { host: 'arvancloud.ir', port: 443, servername: 'arvancloud.ir', rejectUnauthorized: false, timeout: timeoutMs },
      () => { const ms = Date.now() - t0; sock.destroy(); resolve({ healthy: true, latencyMs: ms }); }
    );
    sock.on('error', err => { sock.destroy(); resolve({ healthy: false, latencyMs: Date.now() - t0, error: err.message }); });
    sock.on('timeout', () => { sock.destroy(); resolve({ healthy: false, latencyMs: timeoutMs, error: 'CDN Timeout (>4s)' }); });
  });
}

/** Test 3 — DNS resolution on port 53 (ISPs almost never block port 53 → DNS Tunnel viable) */
function testDnsResolution(timeoutMs = 3000): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  return new Promise(resolve => {
    const t0 = Date.now();
    const resolver = new dns.Resolver();
    resolver.setServers(['8.8.8.8:53', '1.1.1.1:53', '4.2.2.4:53']);
    const timer = setTimeout(() => resolve({ healthy: false, latencyMs: timeoutMs, error: 'DNS Timeout (>3s)' }), timeoutMs);
    resolver.resolve4('google.com', (err, addresses) => {
      clearTimeout(timer);
      const ms = Date.now() - t0;
      if (err || !addresses?.length) {
        resolve({ healthy: false, latencyMs: ms, error: err?.message || 'Empty DNS response' });
      } else {
        resolve({ healthy: true, latencyMs: ms });
      }
    });
  });
}

/** Test 4 — ICMP ping: proves raw L3 packet delivery (ICMP tunnel viable if this works) */
async function testIcmpPing(
  target = '8.8.8.8',
  timeoutMs = 3500
): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    const isWin = process.platform === 'win32';
    const cmd = isWin
      ? `ping -n 1 -w ${timeoutMs} ${target}`
      : `ping -c 1 -W ${Math.ceil(timeoutMs / 1000)} ${target}`;

    const { stdout } = await Promise.race([
      execAsync(cmd, { timeout: timeoutMs + 1000 }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('ICMP race timeout')), timeoutMs + 1200))
    ]);

    const ms = Date.now() - t0;
    // Parse reported RTT from ping output for more accuracy
    const m = stdout.match(/time[=<](\d+\.?\d*)\s*ms/i) || stdout.match(/(\d+\.?\d*)\s*ms/i);
    return { healthy: true, latencyMs: m ? Math.round(parseFloat(m[1])) : ms };
  } catch (err: any) {
    return { healthy: false, latencyMs: Date.now() - t0, error: err.message?.slice(0, 80) || 'ICMP failed' };
  }
}

// ─── Main Engine Class ────────────────────────────────────────────────────────

class MultiPathEngine {
  private snapshot: NetworkSnapshot;
  private intervalTimer: NodeJS.Timeout | null = null;
  private checkCount = 0;
  private isRunning = false;
  private sniDomainGetter: () => string = () => 'ebanking.banksepah.ir';

  constructor() {
    this.snapshot = this.buildInitialSnapshot();
  }

  private buildInitialSnapshot(): NetworkSnapshot {
    const paths = {} as Record<PathType, PathHealthResult>;
    (Object.keys(PATH_META) as PathType[]).forEach(p => {
      paths[p] = {
        path: p,
        ...PATH_META[p],
        healthy: false,
        latencyMs: 9999,
        timestamp: new Date(),
        consecutiveFailures: 0,
        score: 0
      };
    });
    return {
      overallHealth: 'DEGRADED',
      paths,
      bestPath: null,
      panicMode: false,
      recommendation: 'Initializing Quantum MultiPath Engine...',
      recommendation_fa: 'در حال راه‌اندازی موتور مسیریابی چندگانه...',
      lastUpdate: new Date(),
      checkCount: 0
    };
  }

  /** Run all 4 tests concurrently, merge results into snapshot */
  async checkAllPaths(): Promise<NetworkSnapshot> {
    this.checkCount++;
    const sni = this.sniDomainGetter();

    const [r1, r2, r3, r4] = await Promise.allSettled([
      testDirectTls(sni),
      testCdnArvan(),
      testDnsResolution(),
      testIcmpPing()
    ]);

    const raw: Record<PathType, { healthy: boolean; latencyMs: number; error?: string }> = {
      DIRECT_TLS:    r1.status === 'fulfilled' ? r1.value : { healthy: false, latencyMs: 9999, error: 'Promise rejected' },
      CDN_ARVAN:     r2.status === 'fulfilled' ? r2.value : { healthy: false, latencyMs: 9999, error: 'Promise rejected' },
      DNS_RESOLUTION:r3.status === 'fulfilled' ? r3.value : { healthy: false, latencyMs: 9999, error: 'Promise rejected' },
      ICMP_PING:     r4.status === 'fulfilled' ? r4.value : { healthy: false, latencyMs: 9999, error: 'Promise rejected' }
    };

    const paths = {} as Record<PathType, PathHealthResult>;
    (Object.keys(PATH_META) as PathType[]).forEach(p => {
      const prev = this.snapshot.paths[p];
      const res = raw[p];
      const cf = res.healthy ? 0 : (prev.consecutiveFailures + 1);
      paths[p] = {
        path: p,
        ...PATH_META[p],
        healthy: res.healthy,
        latencyMs: res.latencyMs,
        error: res.error,
        timestamp: new Date(),
        consecutiveFailures: cf,
        score: calcScore(res.healthy, res.latencyMs, cf)
      };
    });

    const healthyPaths = Object.values(paths).filter(p => p.healthy);
    const avgScore = Object.values(paths).reduce((s, p) => s + p.score, 0) / 4;
    const panicMode = healthyPaths.length === 0;

    let overallHealth: OverallHealth;
    if (healthyPaths.length === 4 && avgScore >= 80) overallHealth = 'EXCELLENT';
    else if (healthyPaths.length >= 3 && avgScore >= 55) overallHealth = 'GOOD';
    else if (healthyPaths.length === 2) overallHealth = 'DEGRADED';
    else if (healthyPaths.length === 1) overallHealth = 'CRITICAL';
    else overallHealth = 'PANIC';

    const bestPathEntry = healthyPaths.sort((a, b) => b.score - a.score)[0];
    const bestPath = bestPathEntry?.path ?? null;

    const { recommendation, recommendation_fa } = this.buildRecommendation(overallHealth, bestPath, paths);

    this.snapshot = { overallHealth, paths, bestPath, panicMode, recommendation, recommendation_fa, lastUpdate: new Date(), checkCount: this.checkCount };

    if (process.env.NODE_ENV !== 'production' || overallHealth === 'CRITICAL' || overallHealth === 'PANIC') {
      const pathSummary = Object.values(paths).map(p => `${p.emoji}${p.healthy ? `${p.latencyMs}ms` : 'FAIL'}`).join(' | ');
      console.log(`[MultiPath] [${overallHealth}] ${pathSummary} | Best: ${bestPath ?? 'NONE'}`);
    }

    return this.snapshot;
  }

  private buildRecommendation(
    health: OverallHealth,
    bestPath: PathType | null,
    paths: Record<PathType, PathHealthResult>
  ): { recommendation: string; recommendation_fa: string } {
    const latencyStr = bestPath ? `${paths[bestPath].latencyMs}ms` : 'N/A';
    switch (health) {
      case 'EXCELLENT':
        return {
          recommendation: `✅ All 4 paths healthy. Optimal route: ${bestPath?.replace(/_/g, ' ')} (${latencyStr})`,
          recommendation_fa: `✅ هر ۴ مسیر سالم هستند. بهترین مسیر: ${latencyStr} لتنسی`
        };
      case 'GOOD':
        return {
          recommendation: `🟢 Network stable. Minor path degradation. Using optimal route (${latencyStr}).`,
          recommendation_fa: `🟢 شبکه پایدار است. تخریب جزئی مسیرها. مسیر بهینه (${latencyStr}) فعال.`
        };
      case 'DEGRADED':
        return {
          recommendation: `⚠️ DPI/Filtering interference on ${4 - Object.values(paths).filter(p => p.healthy).length} paths. Auto-fallback active.`,
          recommendation_fa: `⚠️ اختلال DPI روی برخی مسیرها. فال‌بک خودکار فعال است.`
        };
      case 'CRITICAL':
        return {
          recommendation: `🚨 Critical: 3 paths blocked! Only ${bestPath?.replace(/_/g, ' ')} (${latencyStr}) reachable. Emergency protocols active.`,
          recommendation_fa: `🚨 بحرانی: ۳ مسیر مسدود! فقط مسیر ${latencyStr}ای پاسخگو است. پروتکل اضطراری فعال.`
        };
      case 'PANIC':
        return {
          recommendation: `🔴 PANIC MODE — Complete international internet blackout detected. All tunnels unavailable. Check your ISP.`,
          recommendation_fa: `🔴 حالت اضطراری — قطعی کامل اینترنت بین‌الملل تشخیص داده شد. تمام تونل‌ها غیرقابل دسترس هستند.`
        };
    }
  }

  getSnapshot(): NetworkSnapshot { return this.snapshot; }

  setSniDomainGetter(getter: () => string) { this.sniDomainGetter = getter; }

  startMonitoring(intervalMs = 15000, sniGetter?: () => string) {
    if (this.isRunning) return;
    this.isRunning = true;
    if (sniGetter) this.sniDomainGetter = sniGetter;
    console.log(`[MultiPath] 🚀 Quantum MultiPath Engine started — 4 parallel paths monitored every ${intervalMs / 1000}s`);
    setTimeout(() => this.checkAllPaths().catch(() => {}), 6000);
    this.intervalTimer = setInterval(() => this.checkAllPaths().catch(() => {}), intervalMs);
  }

  stopMonitoring() {
    if (this.intervalTimer) { clearInterval(this.intervalTimer); this.intervalTimer = null; }
    this.isRunning = false;
  }
}

export const multiPathEngine = new MultiPathEngine();
