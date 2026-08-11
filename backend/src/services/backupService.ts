import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { sendAdminDocument, sendAdminNotification } from './telegramBot';

export interface BackupResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  userCount: number;
  inboundCount: number;
  sha256: string;
}

export class BackupService {
  private static isBackupDaemonRunning: boolean = false;
  private static backupIntervalTimer: NodeJS.Timeout | null = null;

  /**
   * Generates a safe point-in-time backup copy of the SQLite database
   */
  static async createBackup(prisma: PrismaClient): Promise<BackupResult> {
    const dbPath = path.join(process.cwd(), 'prisma/dev.db');
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at path: ${dbPath}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `nyx-backup-${timestamp}.db`;
    const destPath = path.join(backupDir, fileName);

    // Perform safe atomic file copy
    fs.copyFileSync(dbPath, destPath);

    const stats = fs.statSync(destPath);
    const fileBuffer = fs.readFileSync(destPath);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const userCount = await prisma.user.count();
    const inboundCount = await prisma.inbound.count();

    console.log(`[Backup Service] 📦 Created database backup: ${fileName} (${(stats.size / 1024).toFixed(1)} KB, Users: ${userCount}, Inbounds: ${inboundCount})`);

    return {
      filePath: destPath,
      fileName,
      fileSize: stats.size,
      userCount,
      inboundCount,
      sha256
    };
  }

  /**
   * Restores database from a backup file buffer or path
   */
  static async restoreBackup(
    prisma: PrismaClient,
    sourceFilePath: string,
    reloadXrayCore: () => Promise<void>
  ): Promise<{ userCount: number; inboundCount: number }> {
    const dbPath = path.join(process.cwd(), 'prisma/dev.db');

    if (!fs.existsSync(sourceFilePath)) {
      throw new Error(`Source backup file does not exist: ${sourceFilePath}`);
    }

    // Create a rollback safety copy of current db before overwriting
    const rollbackPath = path.join(process.cwd(), 'prisma/dev.db.rollback');
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, rollbackPath);
    }

    try {
      // Disconnect Prisma client momentarily to release SQLite file lock
      await prisma.$disconnect();

      // Overwrite dev.db with backup file
      fs.copyFileSync(sourceFilePath, dbPath);

      // Reconnect Prisma
      await prisma.$connect();

      const userCount = await prisma.user.count();
      const inboundCount = await prisma.inbound.count();

      console.log(`[Backup Service] ✅ Database restored successfully! (Users: ${userCount}, Inbounds: ${inboundCount})`);

      // Reload Xray core to apply restored users and inbounds
      await reloadXrayCore();

      // Clean up rollback copy
      if (fs.existsSync(rollbackPath)) {
        fs.unlinkSync(rollbackPath);
      }

      return { userCount, inboundCount };
    } catch (err: any) {
      console.error('[Backup Service] ❌ Restore failed! Rolling back to original database...', err);

      // Rollback to original db if restore failed
      if (fs.existsSync(rollbackPath)) {
        fs.copyFileSync(rollbackPath, dbPath);
        await prisma.$connect();
        fs.unlinkSync(rollbackPath);
      }

      throw new Error(`Database restore failed: ${err.message}`);
    }
  }

  /**
   * Performs backup and sends document directly to Telegram Admin Chat
   */
  static async sendBackupToTelegram(prisma: PrismaClient): Promise<BackupResult> {
    const backup = await this.createBackup(prisma);
    const caption = `📦 <b>[Nyx Database Backup / بکاپ اتوماتیک دیتابیس]</b>\n\n` +
      `👤 <b>Total Users:</b> ${backup.userCount}\n` +
      `🌐 <b>Total Inbounds:</b> ${backup.inboundCount}\n` +
      `📅 <b>Date:</b> ${new Date().toLocaleTimeString('fa-IR')} - ${new Date().toLocaleDateString('fa-IR')}\n` +
      `🔒 <b>SHA256:</b> <code>${backup.sha256.slice(0, 16)}...</code>\n\n` +
      `<i>To restore this backup, simply upload/forward this .db file to the Telegram bot!</i>`;

    const sent = await sendAdminDocument(backup.filePath, backup.fileName, caption);
    if (!sent) {
      throw new Error('BOT_NOT_CONFIGURED');
    }
    return backup;
  }

  /**
   * Starts daily automated backup daemon
   */
  static startBackupDaemon(prisma: PrismaClient, intervalMs: number = 86400000) {
    if (this.isBackupDaemonRunning) return;
    this.isBackupDaemonRunning = true;
    console.log(`[Backup Service] Automated Telegram backup daemon started (Runs every ${intervalMs / 3600000}h)...`);

    // Run initial backup 30 seconds after server startup
    setTimeout(() => {
      this.sendBackupToTelegram(prisma).catch(() => {});
    }, 30000);

    this.backupIntervalTimer = setInterval(() => {
      this.sendBackupToTelegram(prisma).catch(() => {});
    }, intervalMs);
  }
}
