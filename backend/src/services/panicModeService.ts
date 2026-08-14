/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║         Nyx Panel — Panic Mode Emergency Response System            ║
 * ║  Detects complete internet blackouts and triggers emergency alerts  ║
 * ║  Broadcasts recovery status when connectivity is restored           ║
 * ║  Developed by Cynet Security Team (cynetx.ir)                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { multiPathEngine, OverallHealth } from './multiPathService';
import { sendAdminNotification } from './telegramBot';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PanicEvent {
  id: string;
  triggeredAt: Date;
  resolvedAt: Date | null;
  durationMs: number | null;
  peakHealth: OverallHealth;
  pathsDown: number;
}

export interface PanicStatus {
  isPanicActive: boolean;
  panicStartTime: Date | null;
  activeForSeconds: number;
  consecutiveFailChecks: number;
  panicHistory: PanicEvent[];
  totalPanicEvents: number;
}

// ─── Manager ──────────────────────────────────────────────────────────────────

class PanicModeManager {
  private isPanicActive = false;
  private panicStartTime: Date | null = null;
  private consecutivePanicChecks = 0;
  private consecutiveRecoveryChecks = 0;
  private panicHistory: PanicEvent[] = [];
  private intervalTimer: NodeJS.Timeout | null = null;
  private totalPanicEvents = 0;

  /**
   * Hysteresis logic: need PANIC_THRESHOLD consecutive bad checks to trigger,
   * and RECOVERY_THRESHOLD consecutive good checks to resolve.
   * This prevents flip-flop on flapping connections.
   */
  private readonly PANIC_THRESHOLD = 3;
  private readonly RECOVERY_THRESHOLD = 2;

  async tick(): Promise<void> {
    const snap = multiPathEngine.getSnapshot();

    if (snap.panicMode) {
      // Bad: one more failing check
      this.consecutivePanicChecks++;
      this.consecutiveRecoveryChecks = 0;

      if (!this.isPanicActive && this.consecutivePanicChecks >= this.PANIC_THRESHOLD) {
        await this.activatePanic(snap.overallHealth);
      }
    } else {
      // Good: network partially or fully recovered
      this.consecutiveRecoveryChecks++;
      if (this.consecutiveRecoveryChecks >= 1) {
        this.consecutivePanicChecks = Math.max(0, this.consecutivePanicChecks - 1);
      }

      if (this.isPanicActive && this.consecutiveRecoveryChecks >= this.RECOVERY_THRESHOLD) {
        await this.resolvePanic(snap.overallHealth);
      }
    }

    // Also alert on CRITICAL (not full panic but very bad)
    if (!this.isPanicActive && snap.overallHealth === 'CRITICAL' && this.consecutivePanicChecks === this.PANIC_THRESHOLD - 1) {
      await this.sendCriticalWarning(snap).catch(() => {});
    }
  }

  private async activatePanic(health: OverallHealth): Promise<void> {
    this.isPanicActive = true;
    this.panicStartTime = new Date();
    this.totalPanicEvents++;

    const snap = multiPathEngine.getSnapshot();
    const pathLines = Object.values(snap.paths)
      .map(p => `${p.emoji} <b>${p.label_fa}</b>: ${p.healthy ? `✅ ${p.latencyMs}ms` : `❌ ${p.error?.slice(0, 50) || 'قطع'}` }`)
      .join('\n');

    const msg =
      `🔴 <b>حالت اضطراری Nyx فعال شد!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ زمان: ${new Date().toLocaleTimeString('fa-IR')}\n` +
      `🌐 وضعیت: <b>قطعی کامل اینترنت بین‌الملل</b>\n\n` +
      `📊 <b>وضعیت ۴ مسیر اتصال:</b>\n` +
      `${pathLines}\n\n` +
      `🛡️ <b>اقدامات اتوماتیک فعال:</b>\n` +
      `• تمام سابسکریپشن‌ها به مسیرهای اضطراری هدایت شدند\n` +
      `• مانیتورینگ مداوم فعال است — بازیابی خودکار اعلام می‌شود\n\n` +
      `<i>Nyx Quantum MultiPath Engine — Emergency Protocol Active</i>`;

    console.error(`[Panic Mode] 🔴 ACTIVATED — ${this.consecutivePanicChecks} consecutive failures → full blackout`);

    await sendAdminNotification(msg).catch(() => {});

    // Record event
    const event: PanicEvent = {
      id: `panic-${Date.now()}`,
      triggeredAt: this.panicStartTime,
      resolvedAt: null,
      durationMs: null,
      peakHealth: health,
      pathsDown: 4
    };
    this.panicHistory.unshift(event);
    if (this.panicHistory.length > 10) this.panicHistory.pop();
  }

  private async resolvePanic(health: OverallHealth): Promise<void> {
    if (!this.panicStartTime) return;

    const durationMs = Date.now() - this.panicStartTime.getTime();
    this.isPanicActive = false;
    this.consecutivePanicChecks = 0;
    this.consecutiveRecoveryChecks = 0;

    if (this.panicHistory.length > 0) {
      this.panicHistory[0].resolvedAt = new Date();
      this.panicHistory[0].durationMs = durationMs;
    }

    const snap = multiPathEngine.getSnapshot();
    const mins = Math.floor(durationMs / 60000);
    const secs = Math.floor((durationMs % 60000) / 1000);
    const bestPath = snap.bestPath ? snap.paths[snap.bestPath] : null;

    const msg =
      `✅ <b>اتصال Nyx بازگردانی شد!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⏱️ مدت قطعی: <b>${mins} دقیقه و ${secs} ثانیه</b>\n` +
      `⚡ بهترین مسیر: <b>${bestPath?.label_fa || '—'}</b> (${bestPath?.latencyMs ?? '?'}ms)\n` +
      `🔄 وضعیت شبکه: <b>${health}</b>\n` +
      `⏰ زمان بازیابی: ${new Date().toLocaleTimeString('fa-IR')}\n\n` +
      `<i>سیستم به حالت عادی بازگشت. همه سابسکریپشن‌ها فعال هستند.</i>`;

    console.log(`[Panic Mode] ✅ RESOLVED — Duration: ${mins}m ${secs}s — Best path now: ${snap.bestPath}`);

    await sendAdminNotification(msg).catch(() => {});
    this.panicStartTime = null;
  }

  private async sendCriticalWarning(snap: ReturnType<typeof multiPathEngine.getSnapshot>): Promise<void> {
    const healthyCount = Object.values(snap.paths).filter(p => p.healthy).length;
    const msg =
      `🚨 <b>هشدار بحرانی Nyx</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ فقط <b>${healthyCount} از ۴ مسیر</b> پاسخگوست\n` +
      `📉 وضعیت: <b>CRITICAL</b>\n` +
      `⏰ ${new Date().toLocaleTimeString('fa-IR')}\n\n` +
      `در صورت ادامه، حالت اضطراری کامل فعال خواهد شد.`;
    await sendAdminNotification(msg).catch(() => {});
  }

  startMonitoring(intervalMs = 15000) {
    if (this.intervalTimer) return;
    console.log('[Panic Mode] 🛡️ Emergency response system armed');
    // Offset slightly so it runs after multiPathEngine check
    this.intervalTimer = setInterval(() => this.tick().catch(() => {}), intervalMs);
  }

  stopMonitoring() {
    if (this.intervalTimer) { clearInterval(this.intervalTimer); this.intervalTimer = null; }
  }

  getStatus(): PanicStatus {
    return {
      isPanicActive: this.isPanicActive,
      panicStartTime: this.panicStartTime,
      activeForSeconds: this.isPanicActive && this.panicStartTime
        ? Math.floor((Date.now() - this.panicStartTime.getTime()) / 1000)
        : 0,
      consecutiveFailChecks: this.consecutivePanicChecks,
      panicHistory: this.panicHistory.slice(0, 5),
      totalPanicEvents: this.totalPanicEvents
    };
  }
}

export const panicModeManager = new PanicModeManager();
