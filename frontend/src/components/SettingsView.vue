<template>
  <div class="space-y-6">
    <div class="glass-panel p-6 rounded-3xl border border-cyberViolet/30 relative overflow-hidden">
      <div class="flex items-center gap-3 mb-2">
        <Bot class="w-6 h-6 text-cyberCyan" />
        <h2 class="text-xl font-bold text-white">تنظیمات ربات تلگرام و مدیریت هوشمند ادمین</h2>
      </div>
      <p class="text-xs text-gray-300 leading-relaxed">
        با پیکربندی ربات تلگرام و تنظیم **چت‌آیدی ادمین**، می‌توانید تمام امور پنل (ساخت کاربر، مشاهده آمار، دریافت لینک‌ها، حذف کاربر و...) را مستقیماً از تلگرام با دکمه‌های شیشه‌ای انجام دهید.
      </p>
    </div>

    <!-- Settings Form -->
    <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-cyberCyan/10 text-cyberCyan flex items-center justify-center font-bold">
            <Send class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">پیکربندی ربات تلگرام (Telegram Bot API)</h3>
            <p class="text-xs text-gray-400">توکن ربات و چت‌آیدی ادمین را وارد کنید</p>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          :class="botEnabled ? 'bg-cyberGreen/10 border border-cyberGreen/30 text-cyberGreen' : 'bg-red-500/10 border border-red-500/30 text-red-400'"
        >
          <span class="w-2 h-2 rounded-full" :class="botEnabled ? 'bg-cyberGreen animate-pulse' : 'bg-red-400'"></span>
          {{ botEnabled ? 'ربات فعال است' : 'ربات غیرفعال' }}
        </div>
      </div>

      <div class="space-y-4">
        <!-- Bot Token Field -->
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">توکن ربات (Bot Token)</label>
          <div class="relative">
            <input 
              v-model="botToken" 
              :type="showToken ? 'text' : 'password'" 
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyZ..."
              dir="ltr"
              class="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-12 py-3 text-xs text-white font-mono text-left focus:border-cyberCyan outline-none"
            />
            <button 
              type="button" 
              @click="showToken = !showToken"
              class="absolute left-3 top-3 text-gray-400 hover:text-white text-xs"
            >
              {{ showToken ? 'مخفی' : 'نمایش' }}
            </button>
          </div>
          <p class="text-[11px] text-gray-500 mt-1.5">
            برای ایجاد توکن به ربات <a href="https://t.me/BotFather" target="_blank" class="text-cyberCyan underline">@BotFather</a> در تلگرام پیام داده و دستور /newbot را اجرا کنید.
          </p>
        </div>

        <!-- Admin Chat ID Field -->
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">چت‌آیدی تلگرام ادمین (Admin Chat ID)</label>
          <input 
            v-model="adminChatId" 
            type="text" 
            placeholder="مثال: 987654321"
            dir="ltr"
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono text-left focus:border-cyberCyan outline-none"
          />
          <p class="text-[11px] text-gray-500 mt-1.5">
            با ثبت چت‌آیدی، ربات شما را به‌صورت خودکار به‌عنوان ادمین تشخیص داده و منوی مدیریت دکمه‌ای را برایتان فعال می‌کند.
            (برای دریافت چت‌آیدی به ربات <a href="https://t.me/userinfobot" target="_blank" class="text-cyberCyan underline">@userinfobot</a> پیام دهید).
          </p>
        </div>

        <!-- Guide Card for Admin & Users -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <!-- Admin Capabilities Guide -->
          <div class="p-4 rounded-2xl bg-cyberViolet/10 border border-cyberViolet/20 space-y-2 text-xs">
            <h4 class="font-bold text-cyberViolet flex items-center gap-2">
              <Shield class="w-4 h-4" />
              امکانات ادمین در ربات تلگرام:
            </h4>
            <ul class="list-disc list-inside space-y-1 text-gray-300 pr-2 leading-relaxed">
              <li>شناسایی خودکار ادمین بر اساس Chat ID.</li>
              <li>منوی تمام دکمه‌ای (Reply Keyboard) جهت مدیریت آسان.</li>
              <li>**ساخت کاربر جدید مرحله‌به‌مرحله:** کلیک روی دکمه «➕ ساخت کاربر جدید» 👈 تایپ نام 👈 انتخاب حجم و زمان با دکمه شیشه‌ای!</li>
              <li>مشاهده آمار کامل سرور (`/stats`) و لیست اینباندها (`/inbounds`).</li>
            </ul>
          </div>

          <!-- Client Users Guide -->
          <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
            <h4 class="font-bold text-cyberCyan flex items-center gap-2">
              <Info class="w-4 h-4" />
              نحوه استفاده کاربران عادی:
            </h4>
            <ul class="list-disc list-inside space-y-1 text-gray-300 pr-2 leading-relaxed">
              <li>نام کاربری ثبت‌شده در پنل باید با **آیدی تلگرام کاربر** (بدون @) یکسان باشد.</li>
              <li>کاربر با زدن دکمه «📊 وضعیت حساب من» حجم باقی‌مانده و انقضا را مشاهده می‌کند.</li>
              <li>با زدن دکمه «🔑 دریافت اشتراک من» لینک ساب و وب‌صفحه QR را دریافت می‌کند.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end pt-4 border-t border-white/10">
        <button 
          @click="saveSettings" 
          :disabled="saving"
          class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyberCyan to-cyberViolet text-white font-bold text-xs shadow-lg shadow-cyberCyan/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ saving ? 'در حال ذخیره…' : 'ذخیره و شروع ربات' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Bot, Send, Info, Shield, Save, RefreshCw } from 'lucide-vue-next';

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const botToken = ref('');
const adminChatId = ref('');
const botEnabled = ref(false);
const showToken = ref(false);
const saving = ref(false);

async function fetchSettings() {
  try {
    const res = await axios.get('/api/settings');
    botToken.value = res.data.botToken || '';
    adminChatId.value = res.data.adminChatId || '';
    botEnabled.value = res.data.botEnabled || false;
  } catch (err) {
    console.error('Failed to fetch settings:', err);
  }
}

async function saveSettings() {
  saving.value = true;
  try {
    const res = await axios.post('/api/settings', {
      botToken: botToken.value,
      adminChatId: adminChatId.value
    });
    botEnabled.value = res.data.botEnabled;
    props.toast?.(res.data.message || 'تنظیمات ذخیره شد', 'success');
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'خطا در ذخیره تنظیمات', 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(fetchSettings);
</script>
