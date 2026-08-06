import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function initTelegramBot(token: string, domainOrIp: string) {
  if (!token || token.trim() === '') {
    console.log('[Telegram Bot] No token provided. Skipping Telegram Bot startup.');
    return null;
  }

  const PANEL_PORT = process.env.PORT || '3000';
  const bot = new TelegramBot(token, { polling: true });
  console.log('[Telegram Bot] Nyx Bot successfully started!');

  bot.onText(/\/start|\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `🛡️ *به ربات مدیریت Nyx Panel خوش آمدید!*

برنامه‌ریزی‌شده برای شرایط سخت فیلترینگ و قطعی اینترنت بین‌الملل.

📌 *دستورات:*
📊 /usage - استعلام حجم و اعتبار باقی‌مانده
🔑 /sub - دریافت لینک سابسکریپشن و کانفیگ‌ها
❓ /support - پشتیبانی و راهنما`;

    bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
  });

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

    const info = `📊 *وضعیت حساب: ${user.username}*

🔹 وضعیت: ${statusText}
📉 حجم مصرف‌شده: ${usedGb} گیگابایت
📦 سقف حجم: ${limitGb}
✅ حجم باقی‌مانده: ${remainGb}
📅 تاریخ انقضا: ${expireText}`;

    bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
  });

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
    bot.sendMessage(chatId, `🔑 *لینک سابسکریپشن اختصاصی شما:*

\`${subUrl}\`

این لینک را در نرم‌افزارهای Sing-Box, V2rayN, Shadowrocket یا MahsaNG وارد کنید.`, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/support/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `❓ *راهنمای استفاده:*

۱. نام کاربری تلگرام شما باید با نام کاربری ثبت‌شده در پنل یکسان باشد.
۲. برای دریافت حجم مصرفی: /usage
۳. برای دریافت لینک اتصال: /sub
۴. در صورت مشکل با ادمین تماس بگیرید.`, { parse_mode: 'Markdown' });
  });

  return bot;
}

