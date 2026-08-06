import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from './subscriptionService';

const prisma = new PrismaClient();
let currentBotInstance: TelegramBot | null = null;
const adminChatIds = new Set<number>();

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

export function initTelegramBot(token: string, domainOrIp: string, reloadXrayCallback?: () => Promise<void>) {
  stopTelegramBot();

  if (!token || token.trim() === '') {
    console.log('[Telegram Bot] No token provided. Skipping Telegram Bot startup.');
    return null;
  }

  const PANEL_PORT = process.env.PORT || '3000';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'nyx2026!';
  const bot = new TelegramBot(token, { polling: true });
  currentBotInstance = bot;
  console.log('[Telegram Bot] 🚀 Nyx Admin Bot successfully started!');

  // Helper to check if chat is authenticated as Admin
  const isAdmin = (chatId: number) => adminChatIds.has(chatId);

  // --- /start & Help ---
  bot.onText(/\/start|\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const adminStatus = isAdmin(chatId) ? '🟢 ادمین احراز هویت شده' : '⚪ کاربر عادی';

    const text = `🛡️ *به ربات مدیریت Nyx Panel خوش آمدید!*
وضعیت شما: ${adminStatus}

📌 *دستورات کاربران عادی:*
📊 /usage - استعلام حجم و اعتبار باقی‌مانده
🔑 /sub - دریافت لینک سابسکریپشن و کانفیگ‌ها
❓ /support - راهنمایی و پشتیبانی

⚙️ *ورود ادمین:*
🔑 \`/login <رمز_عبور>\` - ورود به حالت مدیریت پنل`;

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  });

  // --- Admin Login ---
  bot.onText(/\/login (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const passInput = match ? match[1].trim() : '';

    if (passInput === ADMIN_PASS) {
      adminChatIds.add(chatId);
      bot.sendMessage(chatId, `✅ *احراز هویت ادمین با موفقیت انجام شد!*

اکنون به تمامی دسترسی‌های مدیریتی دسترسی دارید:
📊 /stats - آمار جامع سرور و ترافیک
👥 /users - مشاهده لیست تمام کاربران
➕ \`/createuser <نام_کاربری> <حجم_گیگ> <روز>\` - ساخت کاربر جدید
❌ \`/deleteuser <نام_کاربری>\` - حذف کاربر
🌐 /inbounds - مشاهده پورت‌ها و اینباندها
⚡ /menu - منوی دکمه‌ای ادمین`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '❌ رمز عبور ادمین نادرست است.');
    }
  });

  // --- Admin Menu ---
  bot.onText(/\/admin|\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) {
      return bot.sendMessage(chatId, '❌ دسترسی غیرمجاز. ابتدا با `/login <رمز>` وارد شوید.', { parse_mode: 'Markdown' });
    }

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 آمار کامل سرور', callback_data: 'admin_stats' },
            { text: '👥 لیست کاربران', callback_data: 'admin_users' }
          ],
          [
            { text: '🌐 لیست اینباندها', callback_data: 'admin_inbounds' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, '⚙️ *منوی مدیریت Nyx Panel:*', { parse_mode: 'Markdown', ...opts });
  });

  // --- Inline Keyboard Callbacks ---
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId || !isAdmin(chatId)) return;

    if (query.data === 'admin_stats') {
      sendAdminStats(chatId);
    } else if (query.data === 'admin_users') {
      sendAdminUsersList(chatId);
    } else if (query.data === 'admin_inbounds') {
      sendAdminInbounds(chatId);
    }
  });

  // Helper: Send Admin Stats
  async function sendAdminStats(chatId: number) {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const expiredUsers = await prisma.user.count({ where: { status: 'EXPIRED' } });
    const users = await prisma.user.findMany();
    const inbounds = await prisma.inbound.findMany();

    let totalBytes = BigInt(0);
    users.forEach(u => { totalBytes += u.usedDataBytes; });

    const statsText = `📊 *آمار جامع Nyx Panel:*

👥 کل کاربران: *${totalUsers}*
✅ کاربران فعال: *${activeUsers}*
❌ کاربران منقضی/مسدود: *${expiredUsers}*
🌐 تعداد اینباندها: *${inbounds.length}*
📉 مجموع مصرف ترافیک: *${(Number(totalBytes) / (1024 * 1024 * 1024)).toFixed(2)} GB*`;

    bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
  }

  // Helper: Send Users List
  async function sendAdminUsersList(chatId: number) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15
    });

    if (users.length === 0) {
      return bot.sendMessage(chatId, '👥 هیچ کاربری یافت نشد.');
    }

    let text = `👥 *لیست ۱۵ کاربر اخیر:* \n\n`;
    users.forEach((u, i) => {
      const usedGb = (Number(u.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(1);
      const limitGb = u.dataLimitGb > 0 ? `${u.dataLimitGb}GB` : 'نامحدود';
      const statusIcon = u.status === 'ACTIVE' ? '✅' : '❌';
      text += `${i + 1}. ${statusIcon} *${u.username}* | مصرف: \`${usedGb}/${limitGb}\`\n`;
    });

    text += `\n➕ برای ساخت کاربر جدید: \`/createuser <username> <limit_gb> <days>\``;
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  // Helper: Send Inbounds List
  async function sendAdminInbounds(chatId: number) {
    const inbounds = await prisma.inbound.findMany();
    if (inbounds.length === 0) {
      return bot.sendMessage(chatId, '🌐 هیچ اینباندی ثبت نشده است.');
    }

    let text = `🌐 *لیست اینباندهای فعال Xray:* \n\n`;
    inbounds.forEach((i) => {
      const statusIcon = i.enabled ? '🟢' : '🔴';
      text += `${statusIcon} *${i.remark}*\n▫️ پورت: \`${i.port}\` | پروتکل: \`${i.protocol.toUpperCase()}\` | امنیت: \`${i.security.toUpperCase()}\` | SNI: \`${i.sni}\` | Fragment: ${i.enableFragment ? '✓' : '✗'}\n\n`;
    });

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  // --- Admin Command: Create User ---
  bot.onText(/\/createuser (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) {
      return bot.sendMessage(chatId, '❌ دسترسی غیرمجاز. ابتدا با `/login <رمز>` وارد شوید.', { parse_mode: 'Markdown' });
    }

    const args = match ? match[1].trim().split(/\s+/) : [];
    const username = args[0];
    const dataLimitGb = parseFloat(args[1] || '0');
    const expireDays = parseInt(args[2] || '30');

    if (!username) {
      return bot.sendMessage(chatId, '❌ نحوه استفاده: \`/createuser <نام_کاربری> [حجم_گیگ] [مدت_روز]\` \nمثال: \`/createuser ali 50 30\`', { parse_mode: 'Markdown' });
    }

    try {
      const existing = await prisma.user.findFirst({ where: { username } });
      if (existing) {
        return bot.sendMessage(chatId, `❌ کاربری با نام *${username}* قبلاً ثبت شده است.`, { parse_mode: 'Markdown' });
      }

      let expireDate: Date | null = null;
      if (expireDays > 0) {
        expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + expireDays);
      }

      const newUser = await prisma.user.create({
        data: {
          username,
          dataLimitGb,
          expireDate,
          status: 'ACTIVE'
        }
      });

      if (reloadXrayCallback) {
        await reloadXrayCallback();
      }

      const subUrl = `http://${domainOrIp}:${PANEL_PORT}/api/sub/${newUser.uuid}`;
      const infoWebUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${newUser.uuid}`;

      const resText = `✅ *کاربر با موفقیت ساخته شد!*

👤 نام کاربر: *${newUser.username}*
📦 سقف حجم: *${dataLimitGb > 0 ? dataLimitGb + ' GB' : 'نامحدود'}*
📅 مدت اعتبار: *${expireDays > 0 ? expireDays + ' روز' : 'نامحدود'}*
🆔 شناسه (UUID): \`${newUser.uuid}\`

🔗 *لینک مستقیم سابسکریپشن:*
\`${subUrl}\`

🌐 *صفحه اختصاصی مشاهده مشخصات کاربر:*
${infoWebUrl}`;

      bot.sendMessage(chatId, resText, { parse_mode: 'Markdown' });
    } catch (err: any) {
      bot.sendMessage(chatId, `❌ خطا در ساخت کاربر: ${err.message}`);
    }
  });

  // --- Admin Command: Delete User ---
  bot.onText(/\/deleteuser (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) {
      return bot.sendMessage(chatId, '❌ دسترسی غیرمجاز. ابتدا با `/login <رمز>` وارد شوید.', { parse_mode: 'Markdown' });
    }

    const username = match ? match[1].trim() : '';
    if (!username) {
      return bot.sendMessage(chatId, '❌ نحوه استفاده: \`/deleteuser <نام_کاربری>\`', { parse_mode: 'Markdown' });
    }

    try {
      const user = await prisma.user.findFirst({ where: { username } });
      if (!user) {
        return bot.sendMessage(chatId, `❌ کاربری با نام *${username}* یافت نشد.`, { parse_mode: 'Markdown' });
      }

      await prisma.user.delete({ where: { id: user.id } });

      if (reloadXrayCallback) {
        await reloadXrayCallback();
      }

      bot.sendMessage(chatId, `✅ کاربر *${username}* با موفقیت حذف گردید.`, { parse_mode: 'Markdown' });
    } catch (err: any) {
      bot.sendMessage(chatId, `❌ خطا در حذف کاربر: ${err.message}`);
    }
  });

  // --- Admin Command: Stats ---
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) {
      return bot.sendMessage(chatId, '❌ دسترسی غیرمجاز. ابتدا با `/login <رمز>` وارد شوید.', { parse_mode: 'Markdown' });
    }
    sendAdminStats(chatId);
  });

  // --- Admin Command: Users ---
  bot.onText(/\/users/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) {
      return bot.sendMessage(chatId, '❌ دسترسی غیرمجاز. ابتدا با `/login <رمز>` وارد شوید.', { parse_mode: 'Markdown' });
    }
    sendAdminUsersList(chatId);
  });

  // --- Admin Command: Inbounds ---
  bot.onText(/\/inbounds/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) {
      return bot.sendMessage(chatId, '❌ دسترسی غیرمجاز. ابتدا با `/login <رمز>` وارد شوید.', { parse_mode: 'Markdown' });
    }
    sendAdminInbounds(chatId);
  });

  // --- User Command: /usage ---
  bot.onText(/\/usage/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from?.username;

    if (!username) {
      bot.sendMessage(chatId, '❌ نام کاربری تلگرام شما تنظیم نشده است. لطفاً در تنظیمات تلگرام یک username بسازید.');
      return;
    }

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      bot.sendMessage(chatId, `❌ کاربری با شناسه @${username} در سیستم پیدا نشد.\n\nاطمینان حاصل کنید که username تلگرام شما با نام کاربری ثبت‌شده در پنل یکسان باشد.`);
      return;
    }

    const usedGb = (Number(user.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(2);
    const limitGb = user.dataLimitGb > 0 ? `${user.dataLimitGb} GB` : 'نامحدود';
    const remainGb = user.dataLimitGb > 0
      ? Math.max(0, user.dataLimitGb - Number(usedGb)).toFixed(2) + ' GB'
      : 'نامحدود';
    const statusText = user.status === 'ACTIVE' ? '✅ فعال' : '❌ غیرفعال / منقضی';
    const expireText = user.expireDate
      ? new Date(user.expireDate).toLocaleDateString('fa-IR')
      : 'بدون محدودیت زمانی';
    const infoWebUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${user.uuid}`;

    const info = `📊 *وضعیت حساب: ${user.username}*

🔹 وضعیت: ${statusText}
📉 حجم مصرف‌شده: ${usedGb} گیگابایت
📦 سقف حجم: ${limitGb}
✅ حجم باقی‌مانده: ${remainGb}
📅 تاریخ انقضا: ${expireText}

🌐 [مشاهده کامل مشخصات و بارکدها](${infoWebUrl})`;

    bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
  });

  // --- User Command: /sub ---
  bot.onText(/\/sub/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from?.username;

    if (!username) {
      bot.sendMessage(chatId, '❌ نام کاربری تلگرام شما تنظیم نشده است.');
      return;
    }

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      bot.sendMessage(chatId, `❌ کاربری با شناسه @${username} پیدا نشد.`);
      return;
    }

    if (user.status !== 'ACTIVE') {
      bot.sendMessage(chatId, '⛔ اشتراک شما منقضی یا غیرفعال شده است. برای تمدید با ادمین تماس بگیرید.');
      return;
    }

    const subUrl = `http://${domainOrIp}:${PANEL_PORT}/api/sub/${user.uuid}`;
    const infoWebUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${user.uuid}`;

    bot.sendMessage(chatId, `🔑 *لینک سابسکریپشن اختصاصی شما:*

\`${subUrl}\`

🌐 *صفحه وب مشاهده اطلاعات و QR Code:*
${infoWebUrl}`, { parse_mode: 'Markdown' });
  });

  // --- User Command: /support ---
  bot.onText(/\/support/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `❓ *راهنمای استفاده:*

۱. نام کاربری تلگرام شما باید با نام کاربری ثبت‌شده در پنل یکسان باشد.
۲. برای دریافت حجم مصرفی: /usage
۳. برای دریافت لینک اتصال: /sub
۴. در صورت نیاز به راهنمایی بیشتر با پشتیبانی تماس بگیرید.`, { parse_mode: 'Markdown' });
  });

  return bot;
}
