import { PrismaClient } from '@prisma/client';
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);
const prisma = new PrismaClient();

export class XrayStatsService {
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Starts the automatic traffic synchronization loop
   */
  static startTrafficSyncLoop(xrayBinaryPath: string, intervalMs: number = 20000) {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log('[Nyx Traffic Sync] 🔄 Starting automatic traffic synchronization loop (every 20s)...');
    
    // Initial immediate check
    this.syncTraffic(xrayBinaryPath);

    this.timer = setInterval(() => {
      this.syncTraffic(xrayBinaryPath);
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
  static async syncTraffic(xrayBinaryPath: string) {
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

      // Update database records
      for (const [username, bytesDelta] of Object.entries(userTrafficMap)) {
        if (bytesDelta > BigInt(0)) {
          const user = await prisma.user.findFirst({ where: { username } });
          if (user) {
            const newTotal = user.usedDataBytes + bytesDelta;
            let status = user.status;

            // Auto expire user if data limit reached
            if (user.dataLimitGb > 0) {
              const limitBytes = BigInt(Math.floor(user.dataLimitGb * 1024 * 1024 * 1024));
              if (newTotal >= limitBytes) {
                status = 'EXPIRED';
                console.log(`[Nyx Traffic Sync] ⚠️ User ${username} reached data limit! Status set to EXPIRED.`);
              }
            }

            await prisma.user.update({
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
      const expiredUsers = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          expireDate: { lt: now }
        }
      });

      for (const expUser of expiredUsers) {
        await prisma.user.update({
          where: { id: expUser.id },
          data: { status: 'EXPIRED' }
        });
        console.log(`[Nyx Traffic Sync] ⏰ User ${expUser.username} date expired! Status set to EXPIRED.`);
      }

    } catch (err: any) {
      // Xray might be starting up or no traffic recorded yet, ignore normal timeouts
      if (!err.message?.includes('connection refused') && !err.message?.includes('Command failed')) {
        console.warn('[Nyx Traffic Sync] Warning querying stats:', err.message);
      }
    }
  }
}
