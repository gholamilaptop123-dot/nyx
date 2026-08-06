import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let currentBotInstance: TelegramBot | null = null;
const adminChatIds = new Set<number>();

// Conversation state machine for interactive admin wizard
const userStates: Record<number, { step: string; data: any }> = {};

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

export function initTelegramBot(token: string, domainOrIp: string, reloadXrayCallback?: () => Promise<void>, configuredAdminChatId?: string) {
  stopTelegramBot();

  if (!token || token.trim() === '') {
    console.log('[Telegram Bot] No token provided. Skipping Telegram Bot startup.');
    return null;
  }

  const PANEL_PORT = process.env.PORT || '3000';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'nyx2026!';
  const bot = new TelegramBot(token, { polling: true });
  currentBotInstance = bot;
  console.log('[Telegram Bot] 🚀 Nyx Interactive Button Bot successfully started!');

  const isAdmin = (chatId: number) => {
    if (configuredAdminChatId && configuredAdminChatId.trim() !== '' && chatId.toString() === configuredAdminChatId.trim()) {
      return true;
    }
    return adminChatIds.has(chatId);
  };

  // --- Main Reply Keyboards ---
  const getUserReplyKeyboard = (chatId: number) => {
    if (isAdmin(chatId)) {
      return {
        keyboard: [
          [{ text: '📊 آمار سرور' }, { text: '👥 مدیریت کاربران' }],
          [{ text: '➕ ساخت کاربر جدید' }, { text: '🌐 اینباندهای Xray' }],
          [{ text: '📊 وضعیت حساب من' }, { text: '🔑 دریافت اشتراک من' }],
          [{ text: '🚪 خروج از پنل ادمین' }]
        ],
        resize_keyboard: true
      };
    }
    return {
      keyboard: [
        [{ text: '📊 وضعیت حساب من' }, { text: '🔑 دریافت اشتراک من' }],
        [{ text: '❓ راهنما و پشتیبانی' }, { text: '🔑 ورود ادمین' }]
      ],
      resize_keyboard: true
    };
  };

  // --- /start Handler ---
  bot.onText(/\/start|\/help/, async (msg) => {
    const chatId = msg.chat.id;
    delete userStates[chatId];

    const welcomeText = `🛡️ *به ربات هوشمند Nyx Panel خوش آمدید!*

برای استفاده از تمام امکانات، از دکمه‌های شیشه‌ای زیر استفاده کنید.`;

    bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: getUserReplyKeyboard(chatId)
    });
  });

  // --- Message Listener (Button Click & Text Wizard Handling) ---
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || '';

    // Skip command strings handled by onText
    if (text.startsWith('/login')) return;

    // Handle persistent reply keyboard buttons
    if (text === '📊 وضعیت حساب من') {
      return handleUserUsage(chatId, msg.from?.username);
    }
    if (text === '🔑 دریافت اشتراک من') {
      return handleUserSub(chatId, msg.from?.username);
    }
    if (text === '❓ راهنما و پشتیبانی') {
      return handleSupport(chatId);
    }
    if (text === '🔑 ورود ادمین') {
      delete userStates[chatId];
      userStates[chatId] = { step: 'WAIT_ADMIN_PASS', data: {} };
      return bot.sendMessage(chatId, '🔒 *لطفاً کلمه عبور ادمین را وارد کنید:*', { parse_mode: 'Markdown' });
    }
    if (text === '🚪 خروج از پنل ادمین') {
      adminChatIds.delete(chatId);
      delete userStates[chatId];
      return bot.sendMessage(chatId, '🚪 شما از پنل ادمین خارج شدید.', {
        reply_markup: getUserReplyKeyboard(chatId)
      });
    }
    if (text === '📊 آمار سرور' && isAdmin(chatId)) {
      return sendAdminStats(chatId);
    }
    if (text === '👥 مدیریت کاربران' && isAdmin(chatId)) {
      return sendAdminUsersList(chatId);
    }
    if (text === '🌐 اینباندهای Xray' && isAdmin(chatId)) {
      return sendAdminInbounds(chatId);
    }
    if (text === '➕ ساخت کاربر جدید' && isAdmin(chatId)) {
      return startCreateUserWizard(chatId);
    }

    // --- State Machine Wizards ---
    const state = userStates[chatId];
    if (state) {
      if (state.step === 'WAIT_ADMIN_PASS') {
        if (text === ADMIN_PASS) {
          adminChatIds.add(chatId);
          delete userStates[chatId];
          return bot.sendMessage(chatId, '✅ *خوش آمدید ادمین گرامی!* \nپنل مدیریتی با دکمه‌های زیر فعال شد:', {
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

      if (state.step === 'CREATE_USER_NAME' && isAdmin(chatId)) {
        const username = text.replace(/[^a-zA-Z0-9_]/g, '');
        if (!username) {
          return bot.sendMessage(chatId, '❌ نام کاربری فقط باید شامل حروف انگلیسی و عدد باشد. دوباره وارد کنید:');
        }

        const existing = await prisma.user.findFirst({ where: { username } });
        if (existing) {
          return bot.sendMessage(chatId, `❌ کاربری با نام *${username}* قبلاً وجود دارد. نام دیگری وارد کنید:`, { parse_mode: 'Markdown' });
        }

        state.data.username = username;
        state.step = 'CREATE_USER_LIMIT';

        const opts = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🌐 نامحدود', callback_data: 'limit_0' },
                { text: '📦 ۱۰ گیگ', callback_data: 'limit_10' },
                { text: '📦 ۲۰ گیگ', callback_data: 'limit_20' }
              ],
              [
                { text: '📦 ۳۰ گیگ', callback_data: 'limit_30' },
                { text: '📦 ۵۰ گیگ', callback_data: 'limit_50' },
                { text: '📦 ۱۰۰ گیگ', callback_data: 'limit_100' }
              ]
            ]
          }
        };

        return bot.sendMessage(chatId, `👤 نام کاربر: *${username}*\n\n👇 سقف حجم مصرفی را انتخاب کنید:`, {
          parse_mode: 'Markdown',
          ...opts
        });
      }
    }
  });

  // --- Inline Keyboard Callbacks ---
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId) return;
    const data = query.data || '';

    bot.answerCallbackQuery(query.id);

    // Limit selection callback in Wizard
    if (data.startsWith('limit_') && isAdmin(chatId)) {
      const limit = parseFloat(data.split('limit_')[1]);
      if (userStates[chatId]) {
        userStates[chatId].data.dataLimitGb = limit;
        userStates[chatId].step = 'CREATE_USER_EXPIRE';

        const opts = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📅 ۱ ماه (۳۰ روز)', callback_data: 'expire_30' },
                { text: '📅 ۲ ماه (۶۰ روز)', callback_data: 'expire_60' }
              ],
              [
                { text: '📅 ۳ ماه (۹۰ روز)', callback_data: 'expire_90' },
                { text: '♾️ بدون انقضا', callback_data: 'expire_0' }
              ]
            ]
          }
        };

        return bot.sendMessage(chatId, `📦 سقف حجم: *${limit > 0 ? limit + ' GB' : 'نامحدود'}*\n\n👇 مدت زمان اعتبار کاربر را انتخاب کنید:`, {
          parse_mode: 'Markdown',
          ...opts
        });
      }
    }

    // Expire selection callback -> Finish Creation
    if (data.startsWith('expire_') && isAdmin(chatId)) {
      const days = parseInt(data.split('expire_')[1]);
      if (userStates[chatId] && userStates[chatId].data.username) {
        const { username, dataLimitGb } = userStates[chatId].data;

        let expireDate: Date | null = null;
        if (days > 0) {
          expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + days);
        }

        try {
          const newUser = await prisma.user.create({
            data: { username, dataLimitGb, expireDate, status: 'ACTIVE' }
          });

          delete userStates[chatId];

          if (reloadXrayCallback) {
            await reloadXrayCallback();
          }

          const subUrl = `http://${domainOrIp}:${PANEL_PORT}/api/sub/${newUser.uuid}`;
          const infoWebUrl = `http://${domainOrIp}:${PANEL_PORT}/subinfo/${newUser.uuid}`;

          const resText = `✅ *کاربر با موفقیت ساخته شد!*

👤 نام کاربر: *${newUser.username}*
📦 سقف حجم: *${dataLimitGb > 0 ? dataLimitGb + ' GB' : 'نامحدود'}*
📅 مدت اعتبار: *${days > 0 ? days + ' روز' : 'نامحدود'}*

🔗 *لینک مستقیم سابسکریپشن:*
\`${subUrl}\`

🌐 *صفحه اختصاصی وب مشاهده مشخصات و QR Code:*
${infoWebUrl}`;

          return bot.sendMessage(chatId, resText, { parse_mode: 'Markdown' });
        } catch (err: any) {
          delete userStates[chatId];
          return bot.sendMessage(chatId, `❌ خطا در ساخت کاربر: ${err.message}`);
        }
      }
    }

    // Admin Users Actions (Delete/Sub)
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

  // --- Wizard Trigger ---
  function startCreateUserWizard(chatId: number) {
    userStates[chatId] = { step: 'CREATE_USER_NAME', data: {} };
    bot.sendMessage(chatId, '➕ *ساخت کاربر جدید*\n\nلطفاً نام کاربری (انگلیسی) را تایپ کنید:', { parse_mode: 'Markdown' });
  }

  // --- Functions ---
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

    const statsText = `📊 *آمار جامع Nyx Panel:*

👥 کل کاربران: *${totalUsers}*
✅ کاربران فعال: *${activeUsers}*
❌ کاربران منقضی/مسدود: *${expiredUsers}*
🌐 تعداد اینباندها: *${inbounds.length}*
📉 مجموع مصرف ترافیک: *${(Number(totalBytes) / (1024 * 1024 * 1024)).toFixed(2)} GB*`;

    bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
  }

  async function sendAdminUsersList(chatId: number) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (users.length === 0) {
      return bot.sendMessage(chatId, '👥 هیچ کاربری یافت نشد.');
    }

    for (const u of users) {
      const usedGb = (Number(u.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(1);
      const limitGb = u.dataLimitGb > 0 ? `${u.dataLimitGb}GB` : 'نامحدود';
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

  async function sendAdminInbounds(chatId: number) {
    const inbounds = await prisma.inbound.findMany();
    if (inbounds.length === 0) {
      return bot.sendMessage(chatId, '🌐 هیچ اینباندی ثبت نشده است.');
    }

    let text = `🌐 *لیست اینباندهای فعال Xray:* \n\n`;
    inbounds.forEach((i) => {
      const statusIcon = i.enabled ? '🟢' : '🔴';
      text += `${statusIcon} *${i.remark}*\n▫️ پورت: \`${i.port}\` | پروتکل: \`${i.protocol.toUpperCase()}\` | SNI: \`${i.sni}\`\n\n`;
    });

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  return bot;
}
