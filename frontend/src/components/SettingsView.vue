<template>
  <div class="space-y-6">
    <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] relative overflow-hidden">
      <div class="flex items-center gap-3 mb-2">
        <Bot class="w-6 h-6 text-amber-400" />
        <h2 class="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-400">{{ t('settingsTitle') }}</h2>
      </div>
      <p class="text-xs sm:text-sm text-gray-400 leading-relaxed">
        {{ t('settingsSub') }}
      </p>
    </div>

    <!-- Settings Form -->
    <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center font-bold shrink-0">
            <Send class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-white">Telegram Bot API Configuration</h3>
            <p class="text-xs text-gray-400">Enter your bot token and admin chat ID</p>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold w-fit"
          :class="botEnabled ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'"
        >
          <span class="w-2 h-2 rounded-full" :class="botEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'"></span>
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
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-10 pr-12 py-3 text-xs text-white font-mono text-left focus:border-amber-400/50 outline-none"
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
            class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white font-mono text-left focus:border-amber-400/50 outline-none"
          />
        </div>
      </div>

      <div class="flex items-center justify-end pt-4 border-t border-white/[0.06]">
        <button 
          @click="saveSettings" 
          :disabled="saving"
          class="px-5 sm:px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw v-if="saving" class="w-4 h-4 animate-spin text-gray-950" />
          <Save v-else class="w-4 h-4 text-gray-950" />
          <span>{{ saving ? t('loading') : t('saveSettingsBtn') }}</span>
        </button>
      </div>
    </div>

    <!-- Custom Server Domain / Cloudflare CDN Domain Card -->
    <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-black/80 via-amber-950/15 to-black/80 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center font-bold shrink-0">
            <Globe class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{{ t('customDomainCardTitle') }}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono" :class="customDomain ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-gray-400 border border-white/10'">
                {{ customDomain ? 'ACTIVE 🌐' : 'DEFAULT IP' }}
              </span>
            </h3>
            <p class="text-xs text-gray-300 mt-0.5 leading-relaxed">
              {{ t('customDomainCardSub') }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">{{ t('customDomainCardTitle') }}</label>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input 
              v-model="customDomain" 
              type="text" 
              :placeholder="t('customDomainPlaceholder')"
              dir="ltr"
              class="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white font-mono text-left focus:border-amber-400/50 outline-none"
            />
            <button 
              @click="saveCustomDomain" 
              :disabled="savingDomain"
              class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              <RefreshCw v-if="savingDomain" class="w-4 h-4 animate-spin text-gray-950" />
              <Save v-else class="w-4 h-4 text-gray-950" />
              <span>{{ t('saveDomainBtn') }}</span>
            </button>
          </div>
        </div>

        <div v-if="customDomain" class="p-3 rounded-2xl bg-black/40 border border-amber-400/20 flex items-center justify-between text-xs font-mono">
          <div class="flex items-center gap-2 text-amber-300">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Target Host: {{ customDomain }}</span>
          </div>
          <button @click="customDomain = ''; saveCustomDomain()" class="text-gray-400 hover:text-rose-400 text-xs">
            Reset to Default IP
          </button>
        </div>
      </div>
    </div>

    <!-- Subscription Portal Branding & Customization Card -->
    <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-black/80 via-indigo-950/15 to-black/80 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-400/10 text-indigo-400 border border-indigo-400/20 flex items-center justify-center font-bold shrink-0">
            <Palette class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{{ t('subPortalCustomTitle') }}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {{ subBrandName || 'Customized' }}
              </span>
            </h3>
            <p class="text-xs text-gray-300 mt-0.5 leading-relaxed">
              {{ t('subPortalCustomSub') }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Brand Name / Portal Title -->
          <div>
            <label class="block font-semibold text-gray-300 mb-1.5">{{ t('brandNameLabel') }}</label>
            <input 
              v-model="subBrandName" 
              type="text" 
              placeholder="e.g. MyVPN Pro"
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white focus:border-indigo-400/50 outline-none"
            />
          </div>

          <!-- Logo URL -->
          <div>
            <label class="block font-semibold text-gray-300 mb-1.5">{{ t('brandLogoUrlLabel') }}</label>
            <input 
              v-model="subLogoUrl" 
              type="text" 
              placeholder="e.g. https://site.com/logo.png or /logo_trans.png"
              dir="ltr"
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white font-mono text-left focus:border-indigo-400/50 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Telegram Support Link -->
          <div>
            <label class="block font-semibold text-gray-300 mb-1.5">{{ t('supportLinkLabel') }}</label>
            <input 
              v-model="subSupportLink" 
              type="text" 
              placeholder="e.g. https://t.me/MySupport or @MySupportBot"
              dir="ltr"
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white font-mono text-left focus:border-indigo-400/50 outline-none"
            />
          </div>

          <!-- Telegram Channel Link -->
          <div>
            <label class="block font-semibold text-gray-300 mb-1.5">{{ t('channelLinkLabel') }}</label>
            <input 
              v-model="subChannelLink" 
              type="text" 
              placeholder="e.g. https://t.me/MyChannel"
              dir="ltr"
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white font-mono text-left focus:border-indigo-400/50 outline-none"
            />
          </div>
        </div>

        <!-- Announcement Notice Box -->
        <div>
          <label class="block font-semibold text-gray-300 mb-1.5">{{ t('announcementLabel') }}</label>
          <textarea 
            v-model="subAnnouncement" 
            rows="3" 
            :placeholder="t('announcementPlaceholder')"
            class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 text-xs text-white leading-relaxed focus:border-indigo-400/50 outline-none resize-none"
          ></textarea>
        </div>

        <!-- Display Client Apps Toggle -->
        <div class="p-3.5 bg-black/40 border border-white/[0.06] rounded-2xl flex items-center justify-between">
          <div>
            <span class="font-bold text-white block">{{ t('showAppsLabel') }}</span>
            <span class="text-[10px] text-gray-400">Shows download buttons for v2rayNG, Streisand, and Sing-box</span>
          </div>
          <input type="checkbox" v-model="subShowApps" class="w-5 h-5 accent-indigo-400" />
        </div>

        <div class="flex items-center justify-end pt-2">
          <button 
            @click="saveSubBranding" 
            :disabled="savingBranding"
            class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw v-if="savingBranding" class="w-4 h-4 animate-spin text-white" />
            <Save v-else class="w-4 h-4 text-white" />
            <span>{{ t('saveSubBrandingBtn') }}</span>
          </button>
        </div>
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

    <!-- System Service Control & Maintenance Card -->
    <div class="glass-panel p-6 rounded-3xl border border-red-500/30 bg-gradient-to-r from-black/80 via-red-950/20 to-black/80 space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
            <Power class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>{{ t('systemControlTitle') }}</span>
            </h3>
            <p class="text-xs text-gray-300 max-w-2xl leading-relaxed mt-0.5">
              {{ t('systemControlSub') }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button 
          @click="reloadXrayCore" 
          :disabled="reloadingXray"
          class="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-cyan-300 text-xs border border-cyan-500/30 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw class="w-4 h-4 text-cyan-400" :class="{ 'animate-spin': reloadingXray }" />
          <span>{{ t('reloadXrayCoreBtn') }}</span>
        </button>

        <button 
          @click="restartSystem" 
          :disabled="restartingSystem"
          class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-red-600/20 hover:opacity-90 transition-all flex items-center gap-2 border border-red-400/40 disabled:opacity-50"
        >
          <Power class="w-4 h-4 text-white" :class="{ 'animate-spin': restartingSystem }" />
          <span>{{ t('restartSystemBtn') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Bot, Send, Info, Shield, Save, RefreshCw, Globe, Zap, Database, Download, Power, Palette } from 'lucide-vue-next';
import { t, currentLang } from '../i18n';

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const botToken = ref('');
const adminChatId = ref('');
const botEnabled = ref(false);
const customDomain = ref('');
const savingDomain = ref(false);
const showToken = ref(false);
const saving = ref(false);

// Sub Portal Customization State
const subBrandName = ref('Nyx Panel');
const subLogoUrl = ref('/logo_trans.png');
const subSupportLink = ref('');
const subChannelLink = ref('');
const subAnnouncement = ref('');
const subShowApps = ref(true);
const savingBranding = ref(false);

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
    customDomain.value = res.data.customDomain || '';

    subBrandName.value = res.data.subBrandName || 'Nyx Panel';
    subLogoUrl.value = res.data.subLogoUrl || '/logo_trans.png';
    subSupportLink.value = res.data.subSupportLink || '';
    subChannelLink.value = res.data.subChannelLink || '';
    subAnnouncement.value = res.data.subAnnouncement || '';
    subShowApps.value = res.data.subShowApps !== undefined ? res.data.subShowApps : true;

    const warpRes = await axios.get('/api/warp/status');
    warpConfig.value = warpRes.data;
    warpEnabled.value = warpRes.data?.enabled || false;
    warpMode.value = warpRes.data?.mode || 'ALL';
  } catch (err) {
    console.error('Failed to fetch settings:', err);
  }
}

async function saveSubBranding() {
  savingBranding.value = true;
  try {
    const res = await axios.post('/api/settings', {
      subBrandName: subBrandName.value,
      subLogoUrl: subLogoUrl.value,
      subSupportLink: subSupportLink.value,
      subChannelLink: subChannelLink.value,
      subAnnouncement: subAnnouncement.value,
      subShowApps: subShowApps.value
    });
    props.toast?.(currentLang.value === 'fa' ? 'شخصی‌سازی صفحه ساب مشتری با موفقیت ذخیره شد.' : 'Subscription portal branding saved successfully.', 'success');
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'Failed to save sub branding', 'error');
  } finally {
    savingBranding.value = false;
  }
}

async function saveCustomDomain() {
  savingDomain.value = true;
  try {
    const res = await axios.post('/api/settings', {
      customDomain: customDomain.value
    });
    customDomain.value = res.data.customDomain || '';
    props.toast?.(currentLang.value === 'fa' ? 'دامنه اختصاصی با موفقیت ذخیره و اعمال شد.' : 'Custom domain saved and applied.', 'success');
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'Failed to save custom domain', 'error');
  } finally {
    savingDomain.value = false;
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
    const errMsg = err?.response?.data?.error;
    if (errMsg === 'BOT_NOT_CONFIGURED') {
      props.toast?.(
        currentLang.value === 'fa' 
          ? 'ربات تلگرام یا Admin Chat ID تنظیم نشده است. لطفاً ابتدا توکن ربات و Chat ID را وارد کنید.' 
          : 'Telegram Bot or Admin Chat ID is not configured. Please enter Bot Token and Chat ID first.', 
        'error'
      );
    } else {
      props.toast?.(errMsg || (currentLang.value === 'fa' ? 'خطا در ارسال بکاپ به تلگرام' : 'Failed to send backup to Telegram'), 'error');
    }
  } finally {
    telegramBackupSending.value = false;
  }
}

// System Maintenance State
const restartingSystem = ref(false);
const reloadingXray = ref(false);

async function reloadXrayCore() {
  reloadingXray.value = true;
  try {
    await axios.post('/api/system/reload-xray');
    props.toast?.(currentLang.value === 'fa' ? 'هسته Xray با موفقیت ریلود شد.' : 'Xray core reloaded successfully.', 'success');
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'Failed to reload Xray core', 'error');
  } finally {
    reloadingXray.value = false;
  }
}

async function restartSystem() {
  if (!confirm(t('confirmRestartPrompt'))) return;

  restartingSystem.value = true;
  try {
    await axios.post('/api/system/restart');
    props.toast?.(currentLang.value === 'fa' ? 'سرویس پنل در حال راه‌اندازی مجدد است... ۵ ثانیه شکیبا باشید.' : 'Panel service is restarting... Please wait 5 seconds.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  } catch (err: any) {
    props.toast?.('Failed to send restart signal', 'error');
    restartingSystem.value = false;
  }
}

onMounted(fetchSettings);
</script>
