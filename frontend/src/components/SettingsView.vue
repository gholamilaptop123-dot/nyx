<template>
  <div class="space-y-6">
    <div class="glass-panel p-6 rounded-3xl border border-cyberYellow/40 relative overflow-hidden">
      <div class="flex items-center gap-3 mb-2">
        <Bot class="w-6 h-6 text-cyberYellow" />
        <h2 class="text-xl font-extrabold text-cyberYellow glow-yellow">{{ t('settingsTitle') }}</h2>
      </div>
      <p class="text-xs text-gray-300 leading-relaxed">
        {{ t('settingsSub') }}
      </p>
    </div>

    <!-- Settings Form -->
    <div class="glass-panel p-6 rounded-3xl border border-cyberYellow/30 space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 flex items-center justify-center font-bold">
            <Send class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Telegram Bot API Configuration</h3>
            <p class="text-xs text-gray-400">Enter your bot token and admin chat ID</p>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          :class="botEnabled ? 'bg-cyberGreen/10 border border-cyberGreen/30 text-cyberGreen' : 'bg-cyberRed/10 border border-cyberRed/30 text-cyberRed'"
        >
          <span class="w-2 h-2 rounded-full" :class="botEnabled ? 'bg-cyberGreen animate-pulse' : 'bg-cyberRed'"></span>
          {{ botEnabled ? t('statusOnline') : t('statusOffline') }}
        </div>
      </div>

      <div class="space-y-4">
        <!-- Bot Token Field -->
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">{{ t('botTokenLabel') }}</label>
          <div class="relative">
            <input 
              v-model="botToken" 
              :type="showToken ? 'text' : 'password'" 
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyZ..."
              dir="ltr"
              class="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-12 py-3 text-xs text-white font-mono text-left focus:border-cyberYellow outline-none"
            />
            <button 
              type="button" 
              @click="showToken = !showToken"
              class="absolute left-3 top-3 text-gray-400 hover:text-white text-xs"
            >
              {{ showToken ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <!-- Admin Chat ID Field -->
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">{{ t('adminChatIdLabel') }}</label>
          <input 
            v-model="adminChatId" 
            type="text" 
            placeholder="e.g. 987654321"
            dir="ltr"
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono text-left focus:border-cyberYellow outline-none"
          />
        </div>
      </div>

      <div class="flex items-center justify-end pt-4 border-t border-white/10">
        <button 
          @click="saveSettings" 
          :disabled="saving"
          class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyberYellow via-red-600 to-cyberRed text-black font-extrabold text-xs shadow-lg shadow-cyberYellow/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 border border-cyberYellow/40"
        >
          <RefreshCw v-if="saving" class="w-4 h-4 animate-spin text-black" />
          <Save v-else class="w-4 h-4 text-black" />
          <span>{{ saving ? t('loading') : t('saveSettingsBtn') }}</span>
        </button>
      </div>
    </div>

    <!-- Cloudflare WARP Outbound Management Card -->
    <div class="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-black/80 via-cyan-950/20 to-black/80 space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
            <Globe class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>{{ t('warpTitle') }}</span>
            </h3>
            <p class="text-xs text-gray-300 max-w-2xl leading-relaxed mt-0.5">
              {{ t('warpSub') }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          :class="warpEnabled ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' : 'bg-white/5 border border-white/10 text-gray-400'"
        >
          <span class="w-2 h-2 rounded-full" :class="warpEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-gray-500'"></span>
          {{ warpEnabled ? t('warpEnabledLabel') : t('warpDisabledLabel') }}
        </div>
      </div>

      <div v-if="warpConfig" class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 text-xs text-gray-300">
        <div>
          <span class="text-gray-400 block mb-1">{{ t('warpAssignedIp') }}:</span>
          <span class="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/20">{{ warpConfig.ipv4 || 'N/A' }}</span>
        </div>
        <div>
          <span class="text-gray-400 block mb-1">Assigned Cloudflare IPv6:</span>
          <span class="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/20 truncate block">{{ warpConfig.ipv6 || 'N/A' }}</span>
        </div>
      </div>

      <!-- WARP Mode Options -->
      <div class="space-y-3">
        <label class="block text-xs font-semibold text-gray-300">Routing Mode / حالت روتینگ:</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            type="button" 
            @click="warpMode = 'ALL'"
            :class="['p-3 rounded-2xl border text-xs text-left transition-all', warpMode === 'ALL' ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10']"
          >
            <div class="font-bold text-cyan-300">🌐 {{ t('warpModeAll') }}</div>
            <div class="text-[11px] text-gray-400 mt-1">Routes 100% server outbound traffic through Cloudflare WireGuard mesh.</div>
          </button>
          <button 
            type="button" 
            @click="warpMode = 'SANCTIONED'"
            :class="['p-3 rounded-2xl border text-xs text-left transition-all', warpMode === 'SANCTIONED' ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10']"
          >
            <div class="font-bold text-cyan-300">🤖 {{ t('warpModeSanctioned') }}</div>
            <div class="text-[11px] text-gray-400 mt-1">Routes OpenAI, ChatGPT, Netflix, Spotify & IP check sites through WARP.</div>
          </button>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
        <button 
          @click="registerWarp" 
          :disabled="warpRegistering"
          class="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': warpRegistering }" />
          <span>Re-register WARP Account</span>
        </button>

        <button 
          @click="toggleWarp" 
          :disabled="warpSaving"
          :class="['px-6 py-2.5 rounded-2xl font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 border disabled:opacity-50', warpEnabled ? 'bg-cyberRed text-white border-cyberRed/40 shadow-cyberRed/20' : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-black border-cyan-400 shadow-cyan-500/20']"
        >
          <Zap class="w-4 h-4" :class="{ 'animate-spin': warpSaving }" />
          <span>{{ warpEnabled ? t('disableWarpBtn') : t('enableWarpBtn') }}</span>
        </button>
      </div>
    </div>

    <!-- Database Backup & Restore Card -->
    <div class="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-black/80 via-purple-950/20 to-black/80 space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
            <Database class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>{{ t('backupTitle') }}</span>
            </h3>
            <p class="text-xs text-gray-300 max-w-2xl leading-relaxed mt-0.5">
              {{ t('backupSub') }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button 
          @click="downloadBackup" 
          :disabled="backupDownloading"
          class="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-purple-300 text-xs border border-purple-500/30 flex items-center gap-2 disabled:opacity-50"
        >
          <Download class="w-4 h-4 text-purple-400" />
          <span>{{ t('downloadBackupBtn') }}</span>
        </button>

        <button 
          @click="triggerTelegramBackup" 
          :disabled="telegramBackupSending"
          class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 hover:opacity-90 transition-all flex items-center gap-2 border border-purple-400/40 disabled:opacity-50"
        >
          <Send class="w-4 h-4 text-white" :class="{ 'animate-spin': telegramBackupSending }" />
          <span>{{ t('sendBackupTelegramBtn') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Bot, Send, Info, Shield, Save, RefreshCw, Globe, Zap, Database, Download } from 'lucide-vue-next';
import { t, currentLang } from '../i18n';

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const botToken = ref('');
const adminChatId = ref('');
const botEnabled = ref(false);
const showToken = ref(false);
const saving = ref(false);

// WARP State
const warpConfig = ref<any>(null);
const warpEnabled = ref(false);
const warpMode = ref<'ALL' | 'SANCTIONED'>('ALL');
const warpSaving = ref(false);
const warpRegistering = ref(false);

// Backup State
const backupDownloading = ref(false);
const telegramBackupSending = ref(false);

async function fetchSettings() {
  try {
    const res = await axios.get('/api/settings');
    botToken.value = res.data.botToken || '';
    adminChatId.value = res.data.adminChatId || '';
    botEnabled.value = res.data.botEnabled || false;

    const warpRes = await axios.get('/api/warp/status');
    warpConfig.value = warpRes.data;
    warpEnabled.value = warpRes.data?.enabled || false;
    warpMode.value = warpRes.data?.mode || 'ALL';
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
    props.toast?.(res.data.message || (currentLang.value === 'fa' ? 'تنظیمات ذخیره شد' : 'Settings saved successfully'), 'success');
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || (currentLang.value === 'fa' ? 'خطا در ذخیره تنظیمات' : 'Failed to save settings'), 'error');
  } finally {
    saving.value = false;
  }
}

async function toggleWarp() {
  warpSaving.value = true;
  const targetState = !warpEnabled.value;
  try {
    const res = await axios.post('/api/warp/toggle', {
      enabled: targetState,
      mode: warpMode.value
    });
    warpConfig.value = res.data.config;
    warpEnabled.value = res.data.config.enabled;
    props.toast?.(currentLang.value === 'fa' ? `سرویس Cloudflare WARP ${targetState ? 'فعال' : 'غیرفعال'} شد.` : `Cloudflare WARP ${targetState ? 'enabled' : 'disabled'}.`, 'success');
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'Failed to update WARP state', 'error');
  } finally {
    warpSaving.value = false;
  }
}

async function registerWarp() {
  warpRegistering.value = true;
  try {
    const res = await axios.post('/api/warp/register');
    warpConfig.value = res.data.config;
    warpEnabled.value = res.data.config.enabled;
    props.toast?.(currentLang.value === 'fa' ? 'ثبت‌نام مجدد اکانت WARP با موفقیت انجام شد' : 'WARP account registered successfully', 'success');
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'Failed to register WARP account', 'error');
  } finally {
    warpRegistering.value = false;
  }
}

async function downloadBackup() {
  backupDownloading.value = true;
  try {
    window.location.href = '/api/backup/download';
    props.toast?.(currentLang.value === 'fa' ? 'دانلود فایل بکاپ دیتابیس شروع شد.' : 'Database backup download started.', 'success');
  } catch (err: any) {
    props.toast?.('Failed to download backup', 'error');
  } finally {
    setTimeout(() => { backupDownloading.value = false; }, 1500);
  }
}

async function triggerTelegramBackup() {
  telegramBackupSending.value = true;
  try {
    const res = await axios.post('/api/backup/telegram-now');
    props.toast?.(currentLang.value === 'fa' ? `فایل بکاپ ${res.data.backup.fileName} در پیوی تلگرام ارسال شد.` : `Backup sent to Telegram successfully.`, 'success');
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'Failed to send backup to Telegram', 'error');
  } finally {
    telegramBackupSending.value = false;
  }
}

onMounted(fetchSettings);
</script>
