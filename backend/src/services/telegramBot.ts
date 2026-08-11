import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import tls from 'tls';
import crypto from 'crypto';
import { generateX25519Keypair } from '../xray/configGenerator';
import { SubscriptionService } from './subscriptionService';
import { TunnelManager } from './tunnelManager';
import { autoFailoverService } from './autoFailoverService';
import { WarpService } from './warpService';
import { BackupService } from './backupService';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
let currentBotInstance: TelegramBot | null = null;
const adminChatIds = new Set<number>();

// Conversation state machine for interactive admin wizards
const userStates: Record<number, { step: string; data: any }> = {};

export function sendAdminNotification(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!currentBotInstance) return resolve(false);
    const dbAdminChatId = process.env.ADMIN_CHAT_ID;
    if (dbAdminChatId) {
      currentBotInstance.sendMessage(dbAdminChatId, message, { parse_mode: 'HTML' })
        .then(() => resolve(true))
        .catch(() => resolve(false));
    } else {
      resolve(false);
    }
  });
}

export function sendAdminDocument(filePath: string, filename: string, caption?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!currentBotInstance) return resolve(false);
    const dbAdminChatId = process.env.ADMIN_CHAT_ID;
    if (dbAdminChatId) {
      currentBotInstance.sendDocument(dbAdminChatId, filePath, { caption, parse_mode: 'HTML' }, { filename })
        .then(() => resolve(true))
        .catch((err) => {
          console.error('[Telegram Bot] Error sending document:', err);
          resolve(false);
        });
    } else {
      resolve(false);
    }
  });
}

export function stopTelegramBot() {
  if (currentBotInstance) {
    try {
      console.log('[Telegram Bot] Stopping previous Telegram bot polling instance...');
      currentBotInstance.stopPolling();
    } catch (e) {
      console.warn('[Telegram Bot] Warning stopping polling:', e);
    }
    currentBotInstance = null;
  }
}

export function initTelegramBot(
  token: string,
  domainOrIp: string,
  reloadXrayCallback?: () => Promise<void>,
  configuredAdminChatId?: string
) {
  stopTelegramBot();

  if (!token || token.trim() === '') {
    console.log('[Telegram Bot] No token provided. Skipping Telegram Bot startup.');
    return null;
  }

  const PANEL_PORT = process.env.PORT || '3080';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'nyx2026!';
  const bot = new TelegramBot(token, { polling: true });
  currentBotInstance = bot;
  console.log('[Telegram Bot] 🚀 Nyx Complete Interactive Telegram Bot started successfully!');

  const isAdmin = (chatId: number) => {
    if (configuredAdminChatId && configuredAdminChatId.trim() !== '' && chatId.toString() === configuredAdminChatId.trim()) {
      return true;
    }
    return adminChatIds.has(chatId);
  };

  // --- Main Reply Keyboards ---
  const getAdminReplyKeyboard = () => {
    return {
      keyboard: [
        [{ text: '📊 Server Stats' }, { text: '🌐 Inbounds & Configs' }],
        [{ text: '➕ Create Config / Inbound' }, { text: '⚡ Live SNI Tester' }],
        [{ text: '🛡️ Auto-Failover SNI' }, { text: '🌐 Cloudflare WARP' }],
        [{ text: '📦 Backup DB Now' }, { text: '🚀 Tunnel Scripts' }],
        [{ text: '🖥️ Servers & Nodes' }, { text: '👥 Users List' }],
        [{ text: '🚪 Admin Logout' }]
      ],
      resize_keyboard: true
    };
  };

  const getUserReplyKeyboard = (chatId: number) => {
    if (isAdmin(chatId)) {
      return getAdminReplyKeyboard();
    }
    return {
      keyboard: [
        [{ text: '📊 My Account Usage' }, { text: '🔑 Get My Subscription' }],
        [{ text: '❓ Help & Support' }, { text: '🔑 Admin Login' }]
      ],
      resize_keyboard: true
    };
  };

  // --- /start Handler ---
  bot.onText(/\/start|\/help/, async (msg) => {
    const chatId = msg.chat.id;
    delete userStates[chatId];

    const welcomeText = `🛡️ *Welcome to Nyx Panel Management Bot!*

All web panel features (config creation, traffic monitoring, live SNI testing, backup/restore, tunnel scripts, and statistics) are accessible via the buttons below.`;

    bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: getUserReplyKeyboard(chatId)
    });
  });

  // --- 1-Click Restore File Upload Listener ---
  bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) return;

    const doc = msg.document;
    if (!doc || !doc.file_name) return;

    if (doc.file_name.endsWith('.db') || doc.file_name.endsWith('.nyx') || doc.file_name.includes('backup')) {
      bot.sendMessage(chatId, '⏳ *در حال دانلود و بازگردانی (Restore) دیتابیس...*\nلطفاً چند ثانیه شکیبا باشید...', { parse_mode: 'Markdown' });
      try {
        const fileStream = bot.getFileStream(doc.file_id);
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const tempPath = path.join(backupDir, `uploaded-${doc.file_name}`);
        const writeStream = fs.createWriteStream(tempPath);
        fileStream.pipe(writeStream);

        writeStream.on('finish', async () => {
          try {
            const res = await BackupService.restoreBackup(prisma, tempPath, reloadXrayCallback || (async () => {}));
            const msgText = `✅ *بازگردانی دیتابیس با موفقیت انجام شد! (Restore Complete)*\n\n` +
              `👥 *کاربران بازگردانی‌شده:* ${res.userCount}\n` +
              `🌐 *اینباندهای بازگردانی‌شده:* ${res.inboundCount}\n` +
              `🚀 هسته Xray مجدداً ریلود و تمام اتصالات زنده شدند.`;
            bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
          } catch (err: any) {
            bot.sendMessage(chatId, `❌ *خطا در بازگردانی دیتابیس:* ${err.message}`, { parse_mode: 'Markdown' });
          }
        });
      } catch (err: any) {
        bot.sendMessage(chatId, `❌ خطا در دریافت فایل از تلگرام: ${err.message}`);
      }
    }
  });

  // --- Main Message Listener ---
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || '';

    if (text.startsWith('/login') || text.startsWith('/start')) return;

    // Public Commands
    if (text === '📊 My Account Usage' || text === '📊 وضعیت حساب من') {
      return handleUserUsage(chatId, msg.from?.username);
    }
    if (text === '🔑 Get My Subscription' || text === '🔑 دریافت اشتراک من') {
      return handleUserSub(chatId, msg.from?.username);
    }
    if (text === '❓ Help & Support' || text === '❓ راهنما و پشتیبانی') {
      return handleSupport(chatId);
    }
    if (text === '🔑 Admin Login' || text === '🔑 ورود ادمین') {
      delete userStates[chatId];
      userStates[chatId] = { step: 'WAIT_ADMIN_PASS', data: {} };
      return bot.sendMessage(chatId, '🔒 *Please enter the Admin Panel Password:*', { parse_mode: 'Markdown' });
    }

    // Admin Logout
    if (text === '🚪 Admin Logout' || text === '🚪 خروج ادمین') {
      adminChatIds.delete(chatId);
      delete userStates[chatId];
      return bot.sendMessage(chatId, '🚪 You have logged out of Admin mode.', {
        reply_markup: getUserReplyKeyboard(chatId)
      });
    }

    // Admin Commands
    if (isAdmin(chatId)) {
      if (text === '📊 Server Stats' || text === '📊 آمار سرور') return sendAdminStats(chatId);
      if (text === '🌐 Inbounds & Configs' || text === '🌐 اینباندها و کانفیگ‌ها') return sendAdminInboundsList(chatId);
      if (text === '➕ Create Config / Inbound' || text === '➕ ساخت کانفیگ / اینباند') return startCreateInboundWizard(chatId);
      if (text === '⚡ Live SNI Tester' || text === '⚡ تست SNI آنلاین') return sendSniTesterMenu(chatId);
      if (text === '🛡️ Auto-Failover SNI' || text === '🛡️ سوئیچ اتوماتیک SNI') return handleAutoFailoverTrigger(chatId);
      if (text === '🌐 Cloudflare WARP' || text === '🌐 کلودفلر WARP') return handleWarpControl(chatId);
      if (text === '📦 Backup DB Now' || text === '📦 بکاپ‌گیری دیتابیس') return handleBackupNow(chatId);
      if (text === '🚀 Tunnel Scripts' || text === '🚀 اسکریپت تونل‌زنی') return startTunnelWizard(chatId);
      if (text === '🖥️ Servers & Nodes' || text === '🖥️ سرورها و نودها') return sendAdminNodesList(chatId);
      if (text === '👥 Users List' || text === '👥 لیست کاربران') return sendAdminUsersList(chatId);
    }

    // --- State Machine Wizards ---
    const state = userStates[chatId];
    if (state) {
      // 1. Admin Pass Login State
      if (state.step === 'WAIT_ADMIN_PASS') {
        if (text === ADMIN_PASS) {
          adminChatIds.add(chatId);
          delete userStates[chatId];
          return bot.sendMessage(chatId, '✅ *Welcome Admin!*\nAdmin Panel keyboard layout activated:', {
            parse_mode: 'Markdown',
            reply_markup: getUserReplyKeyboard(chatId)
          });
        } else {
          delete userStates[chatId];
          return bot.sendMessage(chatId, '❌ کلمه عبور اشتباه است.', {
            reply_markup: getUserReplyKeyboard(chatId)
          });
        }
      }

      // 2. Inbound Wizard: Remark Input
      if (state.step === 'WAIT_INBOUND_REMARK' && isAdmin(chatId)) {
        const remark = text.trim();
        if (!remark) return bot.sendMessage(chatId, '❌ نام کانفیگ معتبر نیست. دوباره تایپ کنید:');

        state.data.remark = remark;
        state.step = 'WAIT_INBOUND_PORT';

        const opts = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔒 پورت 443 (پیش‌فرض)', callback_data: 'inb_port_443' },
                { text: '⚡ پورت 1010', callback_data: 'inb_port_1010' }
              ],
              [
                { text: '🌐 پورت 8443', callback_data: 'inb_port_8443' },
                { text: '🌐 پورت 2083', callback_data: 'inb_port_2083' }
              ],
              [
                { text: '🌐 پورت 8080 (HTTP)', callback_data: 'inb_port_8080' }
              ]
            ]
          }
        };

        return bot.sendMessage(chatId, `📝 نام کانفیگ: *${remark}*\n\n👇 پورت ورود اینباند را انتخاب یا تایپ کنید:`, {
          parse_mode: 'Markdown',
          ...opts
        });
      }

      // Inbound Wizard: Custom Port Typed
      if (state.step === 'WAIT_INBOUND_PORT' && isAdmin(chatId)) {
        const port = parseInt(text, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          return bot.sendMessage(chatId, '❌ پورت باید عددی بین ۱ تا ۶۵۵۳۵ باشد. دوباره تایپ یا از دکمه‌های بالا استفاده کنید:');
        }
        state.data.port = port;
        return proceedToSecurityStep(chatId);
      }

      // Inbound Wizard: Custom SNI Typed
      if (state.step === 'WAIT_INBOUND_SNI_CUSTOM' && isAdmin(chatId)) {
        const sni = text.trim().toLowerCase();
        state.data.sni = sni;
        return proceedToLimitStep(chatId);
      }

      // Tunnel Wizard: Custom Iran IP Typed
      if (state.step === 'WAIT_TUNNEL_IRAN_IP' && isAdmin(chatId)) {
        state.data.iranIp = text.trim();
        state.step = 'WAIT_TUNNEL_KHAREJ_IP';
        return bot.sendMessage(chatId, `🌐 آیپی سرور ایران: *${state.data.iranIp}*\n\n👇 آیپی سرور خارج را وارد کنید (پیش‌فرض: \`${domainOrIp}\`):`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `پیش‌فرض (${domainOrIp})`, callback_data: `tunnel_kharej_${domainOrIp}` }]
            ]
          }
        });
      }

      // Tunnel Wizard: Custom Kharej IP Typed
      if (state.step === 'WAIT_TUNNEL_KHAREJ_IP' && isAdmin(chatId)) {
        state.data.kharejIp = text.trim();
        return generateAndSendTunnelScripts(chatId, state.data);
      }
    }
  });

  // --- Inline Keyboard Callback Queries ---
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId) return;
    const data = query.data || '';

    bot.answerCallbackQuery(query.id);

    // --- Cloudflare WARP Callbacks ---
    if (data.startsWith('toggle_warp:') && isAdmin(chatId)) {
      const targetState = data.split('toggle_warp:')[1] === 'true';
      await WarpService.updateWarpStatus(prisma, targetState, 'ALL');
      if (reloadXrayCallback) await reloadXrayCallback();
      bot.sendMessage(chatId, `✅ وضعیت Cloudflare WARP به *${targetState ? 'فعال (ترافیک کلی)' : 'غیرفعال'}* تغییر یافت و هسته Xray ریلود شد.`, { parse_mode: 'Markdown' });
      return handleWarpControl(chatId);
    }

    if (data === 'register_warp' && isAdmin(chatId)) {
      bot.sendMessage(chatId, '⏳ در حال دریافت و ثبت کلید جدید از کلودفلر WARP...');
      await WarpService.registerWarpAccount(prisma);
      if (reloadXrayCallback) await reloadXrayCallback();
      bot.sendMessage(chatId, '✅ ثبت‌نام مجدد اکانت Cloudflare WARP با موفقیت انجام شد!');
      return handleWarpControl(chatId);
    }

    // --- Inbound Creation Wizard Callbacks ---
    if (data.startsWith('inb_port_') && isAdmin(chatId)) {
      const port = parseInt(data.split('inb_port_')[1], 10);
      if (userStates[chatId]) {
        userStates[chatId].data.port = port;
        return proceedToSecurityStep(chatId);
      }
    }

    if (data.startsWith('inb_sec_') && isAdmin(chatId)) {
      const sec = data.split('inb_sec_')[1];
      if (userStates[chatId]) {
        userStates[chatId].data.security = sec;
        return proceedToSniStep(chatId);
      }
    }

    if (data.startsWith('inb_sni_') && isAdmin(chatId)) {
      const sniVal = data.split('inb_sni_')[1];
      if (sniVal === 'CUSTOM') {
        if (userStates[chatId]) {
          userStates[chatId].step = 'WAIT_INBOUND_SNI_CUSTOM';
          return bot.sendMessage(chatId, '✏️ لطفاً دامنه‌ی SNI اختصاصی مورد نظر خود را تایپ کنید (مثلاً `yahoo.com`):', { parse_mode: 'Markdown' });
        }
      } else {
        if (userStates[chatId]) {
          userStates[chatId].data.sni = sniVal;
          return proceedToLimitStep(chatId);
        }
      }
    }

    if (data.startsWith('inb_limit_') && isAdmin(chatId)) {
      const limit = parseFloat(data.split('inb_limit_')[1]);
      if (userStates[chatId]) {
        userStates[chatId].data.dataLimitGb = limit;
        return proceedToExpireStep(chatId);
      }
    }

    if (data.startsWith('inb_expire_') && isAdmin(chatId)) {
      const days = parseInt(data.split('inb_expire_')[1], 10);
      if (userStates[chatId]) {
        userStates[chatId].data.expireDays = days;
        return proceedToDevicesStep(chatId);
      }
    }

    if (data.startsWith('inb_dev_') && isAdmin(chatId)) {
      const devices = parseInt(data.split('inb_dev_')[1], 10);
      if (userStates[chatId]) {
        userStates[chatId].data.maxDevices = devices;
        return finishInboundCreation(chatId);
      }
    }

    // --- Inbound List Action Callbacks ---
    if (data.startsWith('inbound_vless_') && isAdmin(chatId)) {
      const id = data.split('inbound_vless_')[1];
      const inbound = await prisma.inbound.findUnique({ where: { id } });
      if (inbound) {
        const vlessLink = SubscriptionService.generateVlessLink(inbound as any, domainOrIp);
        bot.sendMessage(chatId, `🔑 *لینک VLESS اینباند ${inbound.remark}:*\n\n\`${vlessLink}\``, { parse_mode: 'Markdown' });
      }
    }

    if (data.startsWith('inbound_sub_') && isAdmin(chatId)) {
      const id = data.split('inbound_sub_')[1];
      const inbound = await prisma.inbound.findUnique({ where: { id } });
      if (inbound) {
        const vlessLink = SubscriptionService.generateVlessLink(inbound as any, domainOrIp);
        const base64Sub = Buffer.from(vlessLink).toString('base64');
        const subUrl = `http://${domainOrIp}:${PANEL_PORT}/api/sub/${inbound.uuid || inbound.id}`;
        bot.sendMessage(chatId, `📋 *لینک سابسکریپشن Base64 اینباند ${inbound.remark}:*\n\n\`${subUrl}\`\n\n🔹 *کد Base64:*\n\`${base64Sub}\``, { parse_mode: 'Markdown' });
      }
    }

    if (data.startsWith('inbound_web_') && isAdmin(chatId)) {
      const id = data.split('inbound_web_')[1];
      const inbound = await prisma.inbound.findUnique({ where: { id } });
      if (inbound) {
        const webUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${inbound.uuid || inbound.id}`;
        bot.sendMessage(chatId, `🌐 *صفحه اختصاصی مشاهده بارکد و حجم اینباند ${inbound.remark}:*\n${webUrl}`, { parse_mode: 'Markdown' });
      }
    }

    if (data.startsWith('inbound_toggle_') && isAdmin(chatId)) {
      const id = data.split('inbound_toggle_')[1];
      const inbound = await prisma.inbound.findUnique({ where: { id } });
      if (inbound) {
        const newStatus = !inbound.enabled;
        await prisma.inbound.update({ where: { id }, data: { enabled: newStatus } });
        if (reloadXrayCallback) await reloadXrayCallback();
        bot.sendMessage(chatId, `🔄 وضعیت اینباند *${inbound.remark}* به *${newStatus ? '🟢 فعال' : '🔴 غیرفعال'}* تغییر یافت.`, { parse_mode: 'Markdown' });
      }
    }

    if (data.startsWith('inbound_del_') && isAdmin(chatId)) {
      const id = data.split('inbound_del_')[1];
      try {
        const deleted = await prisma.inbound.delete({ where: { id } });
        if (reloadXrayCallback) await reloadXrayCallback();
        bot.sendMessage(chatId, `🗑 اینباند *${deleted.remark}* با موفقیت حذف گردید.`, { parse_mode: 'Markdown' });
      } catch (err) {
        bot.sendMessage(chatId, '❌ خطا در حذف اینباند');
      }
    }

    // --- SNI Connection Tester Callbacks ---
    if (data.startsWith('snitest_') && isAdmin(chatId)) {
      const sniDomain = data.split('snitest_')[1];
      return executeSniTest(chatId, sniDomain);
    }

    // --- Tunnel Generator Callbacks ---
    if (data.startsWith('tunnel_kharej_') && isAdmin(chatId)) {
      const kharejIp = data.split('tunnel_kharej_')[1];
      if (userStates[chatId]) {
        userStates[chatId].data.kharejIp = kharejIp;
        return generateAndSendTunnelScripts(chatId, userStates[chatId].data);
      }
    }

    // --- Users List Callbacks ---
    if (data.startsWith('deluser_') && isAdmin(chatId)) {
      const username = data.split('deluser_')[1];
      try {
        await prisma.user.delete({ where: { username } });
        if (reloadXrayCallback) await reloadXrayCallback();
        bot.sendMessage(chatId, `✅ کاربر *${username}* با موفقیت حذف گردید.`, { parse_mode: 'Markdown' });
      } catch (err) {
        bot.sendMessage(chatId, `❌ خطا در حذف کاربر`);
      }
    }

    if (data.startsWith('getsub_') && isAdmin(chatId)) {
      const username = data.split('getsub_')[1];
      const u = await prisma.user.findFirst({ where: { username } });
      if (u) {
        const subUrl = `http://${domainOrIp}:${PANEL_PORT}/api/sub/${u.uuid}`;
        const infoWebUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${u.uuid}`;
        bot.sendMessage(chatId, `🔑 *لینک سابسکریپشن کاربر ${u.username}:*\n\`${subUrl}\`\n\n🌐 *وب‌صفحه:* ${infoWebUrl}`, { parse_mode: 'Markdown' });
      }
    }
  });

  // --- Inbound Creation Helper Steps ---
  function startCreateInboundWizard(chatId: number) {
    userStates[chatId] = {
      step: 'WAIT_INBOUND_REMARK',
      data: {
        protocol: 'vless',
        network: 'tcp',
        security: 'reality',
        sni: 'yahoo.com',
        dataLimitGb: 0,
        expireDays: 30,
        maxDevices: 2,
        enableFragment: true
      }
    };
    bot.sendMessage(chatId, '➕ *ساخت اینباند / کانفیگ جدید*\n\nلطفاً نام اختصاصی کانفیگ (مثلاً `cynet-vip`) را وارد کنید:', { parse_mode: 'Markdown' });
  }

  function proceedToSecurityStep(chatId: number) {
    userStates[chatId].step = 'WAIT_INBOUND_SECURITY';
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛡️ REALITY (ضد فیلترینگ)', callback_data: 'inb_sec_reality' },
            { text: '🔐 TLS Standard', callback_data: 'inb_sec_tls' }
          ],
          [
            { text: '🌐 None (بدون رمزنگاری)', callback_data: 'inb_sec_none' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, '🔒 نوع رمزنگاری امنیتی (Security) را انتخاب کنید:', { parse_mode: 'Markdown', ...opts });
  }

  function proceedToSniStep(chatId: number) {
    userStates[chatId].step = 'WAIT_INBOUND_SNI';
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '☁️ yahoo.com (بین‌المللی)', callback_data: 'inb_sni_yahoo.com' },
            { text: '💳 ebanking.banksepah.ir (بانکی)', callback_data: 'inb_sni_ebanking.banksepah.ir' }
          ],
          [
            { text: '🚗 arvancloud.ir (ابر داخلی)', callback_data: 'inb_sni_arvancloud.ir' },
            { text: '🛍️ digikala.com (ملی)', callback_data: 'inb_sni_digikala.com' }
          ],
          [
            { text: '✏️ تایپ SNI دلخواه', callback_data: 'inb_sni_CUSTOM' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, '🌐 دامنه SNI جهت دور زدن قطعی اینترنت را انتخاب کنید:', { parse_mode: 'Markdown', ...opts });
  }

  function proceedToLimitStep(chatId: number) {
    userStates[chatId].step = 'WAIT_INBOUND_LIMIT';
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '♾️ نامحدود', callback_data: 'inb_limit_0' },
            { text: '📦 ۱۰ گیگ', callback_data: 'inb_limit_10' }
          ],
          [
            { text: '📦 ۳۰ گیگ', callback_data: 'inb_limit_30' },
            { text: '📦 ۵۰ گیگ', callback_data: 'inb_limit_50' }
          ],
          [
            { text: '📦 ۱۰۰ گیگ', callback_data: 'inb_limit_100' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, '📦 سقف حجم ترافیک مصرفی کانفیگ را انتخاب کنید:', { parse_mode: 'Markdown', ...opts });
  }

  function proceedToExpireStep(chatId: number) {
    userStates[chatId].step = 'WAIT_INBOUND_EXPIRE';
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📅 ۱ ماه (۳۰ روز)', callback_data: 'inb_expire_30' },
            { text: '📅 ۲ ماه (۶۰ روز)', callback_data: 'inb_expire_60' }
          ],
          [
            { text: '📅 ۳ ماه (۹۰ روز)', callback_data: 'inb_expire_90' },
            { text: '♾️ بدون انقضا', callback_data: 'inb_expire_0' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, '📅 مدت زمان اعتبار کانفیگ را انتخاب کنید:', { parse_mode: 'Markdown', ...opts });
  }

  function proceedToDevicesStep(chatId: number) {
    userStates[chatId].step = 'WAIT_INBOUND_DEVICES';
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 ۱ کاربره', callback_data: 'inb_dev_1' },
            { text: '👥 ۲ کاربره (پیش‌فرض)', callback_data: 'inb_dev_2' }
          ],
          [
            { text: '👨‍👩‍👧 ۳ کاربره', callback_data: 'inb_dev_3' },
            { text: '🏢 ۵ کاربره', callback_data: 'inb_dev_5' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, '👨‍💻 محدودیت تعداد اتصالات همزمان (IP Limit) را انتخاب کنید:', { parse_mode: 'Markdown', ...opts });
  }

  async function finishInboundCreation(chatId: number) {
    const data = userStates[chatId]?.data;
    if (!data) return;

    try {
      const keys = generateX25519Keypair();
      let expireDate: Date | null = null;
      if (data.expireDays && data.expireDays > 0) {
        expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + data.expireDays);
      }

      const newInbound = await prisma.inbound.create({
        data: {
          remark: data.remark,
          protocol: data.protocol || 'vless',
          port: data.port || 443,
          network: data.network || 'tcp',
          security: data.security || 'reality',
          sni: data.sni || 'yahoo.com',
          privateKey: keys.privateKey,
          publicKey: keys.publicKey,
          shortId: '6ba7b810',
          enableFragment: true,
          dataLimitGb: data.dataLimitGb || 0,
          expireDate,
          maxDevices: data.maxDevices || 2
        }
      });

      delete userStates[chatId];

      if (reloadXrayCallback) {
        await reloadXrayCallback();
      }

      const vlessLink = SubscriptionService.generateVlessLink(newInbound as any, domainOrIp);
      const subUrl = `http://${domainOrIp}:${PANEL_PORT}/api/sub/${newInbound.uuid || newInbound.id}`;
      const webUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${newInbound.uuid || newInbound.id}`;

      const text = `✅ *اینباند / کانفیگ جدید با موفقیت ساخته شد!*

📝 نام کانفیگ: *${newInbound.remark}*
🔌 پورت: \`${newInbound.port}\` | پروتکل: \`${newInbound.protocol.toUpperCase()}\`
🛡️ رمزشود: \`${newInbound.security.toUpperCase()}\` | SNI: \`${newInbound.sni}\`
📦 سقف حجم: *${data.dataLimitGb > 0 ? data.dataLimitGb + ' GB' : 'نامحدود'}*
📅 مدت زمان: *${data.expireDays > 0 ? data.expireDays + ' روز' : 'نامحدود'}*
👥 سقف دستگاه: *${newInbound.maxDevices} کاربره*

🔑 *لینک مستقیم VLESS:*
\`${vlessLink}\`

📋 *لینک سابسکریپشن هوشمند:*
\`${subUrl}\`

🌐 *صفحه اختصاصی وب مشاهده مشخصات و بارکد:*
${webUrl}`;

      bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (err: any) {
      delete userStates[chatId];
      bot.sendMessage(chatId, `❌ خطا در ایجاد اینباند: ${err.message}`);
    }
  }

  // --- SNI Tester Menu & Execution ---
  function sendSniTesterMenu(chatId: number) {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '☁️ ArvanCloud CDN', callback_data: 'snitest_arvancloud.ir' },
            { text: '💳 بانک سپه (شاپرک)', callback_data: 'snitest_ebanking.banksepah.ir' }
          ],
          [
            { text: '🚗 اسنپ (SuperApp)', callback_data: 'snitest_snapp.ir' },
            { text: '🛍️ دیجی‌کالا (ملی)', callback_data: 'snitest_digikala.com' }
          ],
          [
            { text: '🌐 Yahoo.com', callback_data: 'snitest_yahoo.com' },
            { text: '🌐 Microsoft.com', callback_data: 'snitest_microsoft.com' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, '⚡ *تست آنلاین اتصال TLS و سلامت دامنه‌های SNI:*\n\nیک دامنه را انتخاب کنید تا زنده پینگ و اتصال TLS آن سنجیده شود:', { parse_mode: 'Markdown', ...opts });
  }

  function executeSniTest(chatId: number, domain: string) {
    const startTime = Date.now();
    bot.sendMessage(chatId, `⏳ در حال تست اتصال TLS به دامنه \`${domain}\`...`, { parse_mode: 'Markdown' });

    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: 4000,
      rejectUnauthorized: false
    }, () => {
      const latency = Date.now() - startTime;
      const cert = socket.getPeerCertificate();
      socket.destroy();
      const issuer = cert.issuer?.O || cert.issuer?.CN || 'معتبر';

      const res = `✅ *تست اتصال موفقیت‌آمیز بود!*

🌐 دامنه SNI: \`${domain}\`
⚡ تاخیر برقراری اتصال TLS: *${latency} ms*
📜 صادرکننده گواهی: *${issuer}*
🟢 وضعیت: *آماده عبور از قطعی اینترنت*`;

      bot.sendMessage(chatId, res, { parse_mode: 'Markdown' });
    });

    socket.on('error', (err) => {
      socket.destroy();
      bot.sendMessage(chatId, `🔴 *تست اتصال با خطا مواجه شد!*\n\n🌐 دامنه: \`${domain}\`\n❌ خطا: \`${err.message}\`\n⚠️ احتمال مسدودی پکت TLS یا اختلال شدید روی اپراتور.`, { parse_mode: 'Markdown' });
    });

    socket.on('timeout', () => {
      socket.destroy();
      bot.sendMessage(chatId, `⏱ *پاسخ‌دهی به پایان رسید (Timeout)*\n\n🌐 دامنه: \`${domain}\`\n⚠️ اتصال TLS در مهلت ۴ ثانیه‌ای پاسخ دریافت نکرد (احتمال اختلال شبکه).`, { parse_mode: 'Markdown' });
    });
  }

  // --- Tunnel Script Wizard ---
  function startTunnelWizard(chatId: number) {
    userStates[chatId] = {
      step: 'WAIT_TUNNEL_IRAN_IP',
      data: { tunnelPort: 8443, targetInboundPort: 443, secret: 'NyxSecret123' }
    };

    bot.sendMessage(chatId, '🚀 *مولد اتوماتیک اسکریپت تونل‌زنی (ایران <-> خارج)*\n\nلطفاً آیپی سرور ایران خود را وارد کنید:', { parse_mode: 'Markdown' });
  }

  function generateAndSendTunnelScripts(chatId: number, data: any) {
    try {
      const params = {
        iranIp: data.iranIp || 'IRAN_SERVER_IP',
        kharejIp: data.kharejIp || domainOrIp,
        tunnelPort: 8443,
        targetInboundPort: 443,
        secret: 'NyxSecret123',
        tunnelType: 'GOST'
      };

      const iranScript = TunnelManager.generateIranScript(params as any);
      const kharejScript = TunnelManager.generateKharejScript(params as any);

      delete userStates[chatId];

      bot.sendMessage(chatId, `🇮🇷 *اسکریپت نصب سرور ایران (کپی و اجرا در ترمینال ایران):*\n\n\`\`\`bash\n${iranScript}\n\`\`\``, { parse_mode: 'Markdown' });
      bot.sendMessage(chatId, `🇩🇪 *اسکریپت نصب سرور خارج (کپی و اجرا در ترمینال خارج):*\n\n\`\`\`bash\n${kharejScript}\n\`\`\``, { parse_mode: 'Markdown' });
    } catch (err: any) {
      delete userStates[chatId];
      bot.sendMessage(chatId, `❌ خطا در ساخت اسکریپت تونل: ${err.message}`);
    }
  }

  // --- Inbounds Management List ---
  async function sendAdminInboundsList(chatId: number) {
    const inbounds = await prisma.inbound.findMany({ orderBy: { createdAt: 'desc' } });
    if (inbounds.length === 0) {
      return bot.sendMessage(chatId, '🌐 هیچ اینباندی ثبت نشده است.');
    }

    bot.sendMessage(chatId, `🌐 *لیست اینباندها و کانفیگ‌های Xray (${inbounds.length} مورد):*`, { parse_mode: 'Markdown' });

    for (const i of inbounds) {
      const statusIcon = i.enabled ? '🟢' : '🔴';
      const limitText = i.dataLimitGb > 0 ? `${i.dataLimitGb} GB` : 'نامحدود';
      const usedGb = (Number(i.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(1);

      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔑 VLESS', callback_data: `inbound_vless_${i.id}` },
              { text: '📋 Sub Base64', callback_data: `inbound_sub_${i.id}` },
              { text: '🌐 صفحه وب', callback_data: `inbound_web_${i.id}` }
            ],
            [
              { text: i.enabled ? '🔴 خاموش کردن' : '🟢 روشن کردن', callback_data: `inbound_toggle_${i.id}` },
              { text: '🗑 حذف کانفیگ', callback_data: `inbound_del_${i.id}` }
            ]
          ]
        }
      };

      const msgText = `${statusIcon} *کانفیگ: ${i.remark}*
🔌 پورت: \`${i.port}\` | پروتکل: \`${i.protocol.toUpperCase()}\` | رمزشود: \`${i.security.toUpperCase()}\`
🌐 SNI: \`${i.sni}\` | مصرف: \`${usedGb} / ${limitText}\` | سقف دستگاه: *${i.maxDevices} کاربره*`;

      await bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown', ...opts });
    }
  }

  // --- Nodes List ---
  async function sendAdminNodesList(chatId: number) {
    const nodes = await prisma.node.findMany();
    let text = `🖥️ *لیست سرورها و نودهای شبکه Nyx:* \n\n`;
    text += `🟢 *سرور اصلی (Master Node):*\n▫️ آیپی: \`${domainOrIp}\` | وضعیت: *فعال*\n\n`;

    if (nodes.length > 0) {
      nodes.forEach((n) => {
        text += `🔹 *نود فرعی (${n.name}):*\n▫️ نوع: \`${n.type}\` | آیپی: \`${n.ip}\` | پورت: \`${n.apiPort}\`\n\n`;
      });
    } else {
      text += `💡 *نکته:* تمام کانفیگ‌ها در حال حاضر روی سرور اصلی (\`${domainOrIp}\`) پردازش و تونل می‌شوند.`;
    }

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  // --- Users List ---
  async function sendAdminUsersList(chatId: number) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (users.length === 0) {
      return bot.sendMessage(chatId, '👥 هیچ کاربری در جدول کاربران ثبت نشده است.');
    }

    for (const u of users) {
      const usedGb = (Number(u.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(1);
      const limitGb = u.dataLimitGb > 0 ? `${u.dataLimitGb} GB` : 'نامحدود';
      const statusIcon = u.status === 'ACTIVE' ? '✅' : '❌';

      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔑 لینک ساب', callback_data: `getsub_${u.username}` },
              { text: '🗑 حذف کاربر', callback_data: `deluser_${u.username}` }
            ]
          ]
        }
      };

      await bot.sendMessage(chatId, `${statusIcon} *کاربر: ${u.username}*\n▫️ مصرف: \`${usedGb} / ${limitGb}\` | وضعیت: *${u.status}*`, {
        parse_mode: 'Markdown',
        ...opts
      });
    }
  }

  // --- User Public Handlers ---
  async function handleUserUsage(chatId: number, username?: string) {
    if (!username) {
      return bot.sendMessage(chatId, '❌ نام کاربری تلگرام شما تنظیم نشده است.');
    }
    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      return bot.sendMessage(chatId, `❌ کاربری با شناسه @${username} یافت نشد.`);
    }

    const usedGb = (Number(user.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(2);
    const limitGb = user.dataLimitGb > 0 ? `${user.dataLimitGb} GB` : 'نامحدود';
    const remainGb = user.dataLimitGb > 0
      ? Math.max(0, user.dataLimitGb - Number(usedGb)).toFixed(2) + ' GB'
      : 'نامحدود';
    const statusText = user.status === 'ACTIVE' ? '✅ فعال' : '❌ غیرفعال / منقضی';
    const expireText = user.expireDate ? new Date(user.expireDate).toLocaleDateString('fa-IR') : 'بدون محدودیت زمانی';
    const infoWebUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${user.uuid}`;

    const info = `📊 *وضعیت حساب: ${user.username}*

🔹 وضعیت: ${statusText}
📉 حجم مصرف‌شده: ${usedGb} گیگابایت
📦 سقف حجم: ${limitGb}
✅ حجم باقی‌مانده: ${remainGb}
📅 تاریخ انقضا: ${expireText}

🌐 [مشاهده مشخصات کامل و بارکدها](${infoWebUrl})`;

    bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
  }

  async function handleUserSub(chatId: number, username?: string) {
    if (!username) {
      return bot.sendMessage(chatId, '❌ نام کاربری تلگرام شما تنظیم نشده است.');
    }
    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      return bot.sendMessage(chatId, `❌ کاربری با شناسه @${username} یافت نشد.`);
    }
    if (user.status !== 'ACTIVE') {
      return bot.sendMessage(chatId, '⛔ اشتراک شما منقضی یا غیرفعال شده است.');
    }

    const subUrl = `http://${domainOrIp}:${PANEL_PORT}/api/sub/${user.uuid}`;
    const infoWebUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${user.uuid}`;

    bot.sendMessage(chatId, `🔑 *لینک سابسکریپشن اختصاصی شما:*

\`${subUrl}\`

🌐 *صفحه اختصاصی مشاهده بارکدها و اطلاعات:*
${infoWebUrl}`, { parse_mode: 'Markdown' });
  }

  function handleSupport(chatId: number) {
    bot.sendMessage(chatId, `❓ *راهنمای استفاده از ربات:*

۱. آیدی تلگرام شما باید با نام کاربری ثبت‌شده در پنل یکسان باشد.
۲. با کلیک بر روی دکمه «📊 وضعیت حساب من» ترافیک مصرفی را ببینید.
۳. با کلیک بر روی «🔑 دریافت اشتراک من» لینک اتصال را دریافت کنید.`, { parse_mode: 'Markdown' });
  }

  async function sendAdminStats(chatId: number) {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const expiredUsers = await prisma.user.count({ where: { status: 'EXPIRED' } });
    const users = await prisma.user.findMany();
    const inbounds = await prisma.inbound.findMany();

    let totalBytes = BigInt(0);
    users.forEach(u => { totalBytes += u.usedDataBytes; });
    inbounds.forEach(i => { totalBytes += i.usedDataBytes; });

    const statsText = `📊 *آمار جامع Nyx Panel:*

👥 کل کاربران: *${totalUsers}*
✅ کاربران فعال: *${activeUsers}*
❌ کاربران منقضی/مسدود: *${expiredUsers}*
🌐 کل اینباندها و کانفیگ‌ها: *${inbounds.length}*
📉 مجموع مصرف ترافیک: *${(Number(totalBytes) / (1024 * 1024 * 1024)).toFixed(2)} GB*`;

    bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
  }

  async function handleAutoFailoverTrigger(chatId: number) {
    bot.sendMessage(chatId, '⏳ *در حال پایش و تست برقراری اتصال TLS دامنه‌ها...*\nلطفاً چند ثانیه شکیبا باشید...', { parse_mode: 'Markdown' });
    try {
      const result = await autoFailoverService.checkAndFailoverInbounds(prisma, reloadXrayCallback || (async () => {}));
      let msg = `✅ *گزارش سوئیچ هوشمند و پایش SNI (Auto-Failover):*\n\n` +
        `🔹 *اینباندهای بررسی‌شده:* ${result.checkedCount}\n` +
        `⚡ *سوئیچ‌های انجام‌شده:* ${result.switchedCount}\n\n`;

      if (result.switchedCount === 0) {
        msg += `🟢 تمام دامنه‌های SNI اینباندها فعال، باثبات و سالم هستند! نیازی به سوئیچ نبود.`;
      } else {
        msg += `⚠️ *جزئیات سوئیچ هوشمند اینباندها:*\n`;
        for (const ev of result.events) {
          msg += `• *${ev.remark}:* ${ev.oldSni} ➡️ *${ev.newSni}* (${ev.latencyMs}ms)\n`;
        }
      }
      bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      bot.sendMessage(chatId, '❌ خطا در اجرای سوئیچ هوشمند SNI.', { parse_mode: 'Markdown' });
    }
  }

  async function handleWarpControl(chatId: number) {
    try {
      const warpConfig = await WarpService.getWarpConfig(prisma);
      const isEnabled = warpConfig?.enabled || false;
      const mode = warpConfig?.mode || 'ALL';
      const statusEmoji = isEnabled ? '🟢 فعال' : '⚪ غیرفعال';
      const modeText = mode === 'ALL' ? '۱۰۰٪ کل ترافیک (All Traffic)' : 'فقط سایت‌های تحریمی (ChatGPT, Netflix, Spotify)';

      const text = `🌐 *مدیریت خروجی Cloudflare WARP (سرویس ضد تحریم و مخفی‌سازی IP)*

🔹 *وضعیت اتصال:* ${statusEmoji}
⚡ *حالت روتینگ:* ${modeText}
📡 *IP اختصاصی کلودفلر (v4):* \`${warpConfig?.ipv4 || 'ثبت‌نشده'}\`
📜 *IP اختصاصی کلودفلر (v6):* \`${warpConfig?.ipv6 || 'ثبت‌نشده'}\`

_با فعال‌سازی این سرویس، ترافیک سرور شما از شبکه WireGuard کلودفلر عبور کرده، IP اصلی سرور مخفی شده و تمام سایت‌های تحریمی باز می‌شوند._`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: isEnabled ? '🛑 غیرفعال‌سازی WARP' : '🚀 فعال‌سازی ۱-کلیکه WARP', callback_data: `toggle_warp:${!isEnabled}` }
          ],
          [
            { text: '🔄 ثبت‌نام مجدد اکانت WARP', callback_data: 'register_warp' }
          ]
        ]
      };

      bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (err) {
      bot.sendMessage(chatId, '❌ خطا در دریافت وضعیت Cloudflare WARP.');
    }
  }

  async function handleBackupNow(chatId: number) {
    bot.sendMessage(chatId, '⏳ *در حال ساخت فایل بکاپ دیتابیس...*\nلطفاً چند ثانیه شکیبا باشید...', { parse_mode: 'Markdown' });
    try {
      const backup = await BackupService.sendBackupToTelegram(prisma);
      bot.sendMessage(chatId, `✅ *بکاپ‌گیری دیتابیس با موفقیت انجام شد!*\nفایل \`${backup.fileName}\` در پیوی ارسال گردید.\n\n💡 *نکته:* جهت ریستور (Restore) در سرور جدید، کافیست همین فایل دیتابیس را برای ربات بفرستید!`, { parse_mode: 'Markdown' });
    } catch (err: any) {
      bot.sendMessage(chatId, `❌ *خطا در ساخت فایل بکاپ:* ${err.message}`, { parse_mode: 'Markdown' });
    }
  }

  return bot;
}
