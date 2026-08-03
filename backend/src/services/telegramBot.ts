import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function initTelegramBot(token: string, domainOrIp: string) {
  if (!token || token.trim() === '') {
    console.log('[Telegram Bot] No token provided. Skipping Telegram Bot startup.');
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });
  console.log('[Telegram Bot] AegisX Bot successfully started!');

  bot.onText(/\/start|\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `🛡️ *به ربات مدیریت کانفیگ AegisX خوش آمدید!*

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
      bot.sendMessage(chatId, '❌ نام کاربری تلگرام شما ثبت نشده است.');
      return;
    }

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      bot.sendMessage(chatId, `❌ کاربری با آیدی @${username} در سیستم پیدا نشد.`);
      return;
    }

    const usedGb = (Number(user.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(2);
    const limitGb = user.dataLimitGb > 0 ? `${user.dataLimitGb} GB` : 'نامحدود';
    const statusText = user.status === 'ACTIVE' ? '✅ فعال' : '❌ غیرفعال / منقضی';

    const info = `📊 *وضعیت حساب شما (${user.username}):*

🔹 وضعیت: ${statusText}
📉 حجم مصرف‌شده: ${usedGb} گیگابایت
📦 سقف حجم: ${limitGb}
📅 تاریخ انقضا: ${user.expireDate ? user.expireDate.toLocaleDateString('fa-IR') : 'نامحدود'}`;

    bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/sub/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from?.username;

    if (!username) {
      bot.sendMessage(chatId, '❌ نام کاربری تلگرام شما ثبت نشده است.');
      return;
    }

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      bot.sendMessage(chatId, `❌ کاربری با آیدی @${username} پیدا نشد.`);
      return;
    }

    const subUrl = `http://${domainOrIp}:3000/api/sub/${user.uuid}`;
    bot.sendMessage(chatId, `🔑 *لینک سابسکریپشن اختصاصی شما:*

\`${subUrl}\`

این لینک را در نرم‌افزارهای Sing-Box, V2rayN, Shadowrocket یا MahsaNG وارد کنید.`, { parse_mode: 'Markdown' });
  });

  return bot;
}
