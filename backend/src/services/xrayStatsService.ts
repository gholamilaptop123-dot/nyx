import { PrismaClient } from '@prisma/client';
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);
// NOTE: No standalone PrismaClient here — we use the shared instance from index.ts
//       to avoid SQLite BUSY / locking errors from multiple open connections.


export class XrayStatsService {
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Starts the automatic traffic synchronization loop.
   * @param xrayBinaryPath  Path to the Xray binary
   * @param prismaClient    The SHARED PrismaClient from index.ts (avoids SQLite BUSY errors)
   * @param intervalMs      Polling interval in ms (default 20 s)
   * @param onUserExpired   Optional callback triggered when any user expires, so Xray is reloaded immediately
   */
  static startTrafficSyncLoop(
    xrayBinaryPath: string,
    prismaClient: PrismaClient,
    intervalMs: number = 20000,
    onUserExpired?: () => Promise<void>
  ) {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log('[Nyx Traffic Sync] 🔄 Starting automatic traffic synchronization loop (every 20s)...');

    // Initial immediate check
    this.syncTraffic(xrayBinaryPath, prismaClient, onUserExpired);

    this.timer = setInterval(() => {
      this.syncTraffic(xrayBinaryPath, prismaClient, onUserExpired);
    }, intervalMs);
  }

  /**
   * Stop the synchronization loop
   */
  static stopTrafficSyncLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Queries Xray gRPC stats API and updates user data consumption in SQLite
   */
  static async syncTraffic(
    xrayBinaryPath: string,
    prismaClient: PrismaClient,
    onUserExpired?: () => Promise<void>
  ) {
    if (!xrayBinaryPath) return;

    try {
      // Execute xray api statsquery with reset=true to fetch incremental traffic delta
      const { stdout } = await execFileAsync(xrayBinaryPath, [
        'api',
        'statsquery',
        '--server=127.0.0.1:10085',
        '-reset=true'
      ], { timeout: 5000 });

      if (!stdout || stdout.trim() === '') return;

      const data = JSON.parse(stdout);
      const statList = data.stat || [];

      // Map user traffic increments: email in xray config matches username
      const userTrafficMap: Record<string, bigint> = {};

      for (const item of statList) {
        // Pattern: user>>>email>>>traffic>>>downlink or uplink
        if (item.name && item.name.startsWith('user>>>') && item.value) {
          const parts = item.name.split('>>>');
          if (parts.length >= 4) {
            const username = parts[1];
            const bytes = BigInt(item.value || 0);

            if (!userTrafficMap[username]) {
              userTrafficMap[username] = BigInt(0);
            }
            userTrafficMap[username] += bytes;
          }
        }
      }

      let anyExpired = false;

      // Update database records
      for (const [username, bytesDelta] of Object.entries(userTrafficMap)) {
        if (bytesDelta > BigInt(0)) {
          const user = await prismaClient.user.findFirst({ where: { username } });
          if (user) {
            const newTotal = user.usedDataBytes + bytesDelta;
            let status = user.status;

            // Auto expire user if data limit reached
            if (user.dataLimitGb > 0) {
              const limitBytes = BigInt(Math.floor(user.dataLimitGb * 1024 * 1024 * 1024));
              if (newTotal >= limitBytes && status === 'ACTIVE') {
                status = 'EXPIRED';
                anyExpired = true;
                console.log(`[Nyx Traffic Sync] ⚠️ User ${username} reached data limit! Status set to EXPIRED.`);
              }
            }

            await prismaClient.user.update({
              where: { id: user.id },
              data: {
                usedDataBytes: newTotal,
                status
              }
            });
            console.log(`[Nyx Traffic Sync] 📊 Updated ${username}: +${bytesDelta} bytes (Total: ${(Number(newTotal) / (1024 * 1024 * 1024)).toFixed(3)} GB)`);
          }
        }
      }

      // Also check time expirations
      const now = new Date();
      const expiredUsers = await prismaClient.user.findMany({
        where: {
          status: 'ACTIVE',
          expireDate: { lt: now }
        }
      });

      for (const expUser of expiredUsers) {
        await prismaClient.user.update({
          where: { id: expUser.id },
          data: { status: 'EXPIRED' }
        });
        anyExpired = true;
        console.log(`[Nyx Traffic Sync] ⏰ User ${expUser.username} date expired! Status set to EXPIRED.`);
      }

      // Reload Xray config immediately so expired users are evicted from the active client list
      if (anyExpired && onUserExpired) {
        console.log('[Nyx Traffic Sync] 🔄 Reloading Xray config to remove expired users...');
        onUserExpired().catch((err: any) => {
          console.error('[Nyx Traffic Sync] Failed to reload Xray after user expiry:', err?.message);
        });
      }

    } catch (err: any) {
      // Xray might be starting up or no traffic recorded yet, ignore normal timeouts
      if (!err.message?.includes('connection refused') && !err.message?.includes('Command failed')) {
        console.warn('[Nyx Traffic Sync] Warning querying stats:', err.message);
      }
    }
  }
}
