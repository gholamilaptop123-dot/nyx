<template>
  <div class="min-h-screen bg-darkBg text-gray-100 font-sans p-4 md:p-8 flex flex-col items-center justify-center relative">
    <ToastNotification ref="toastRef" />

    <!-- Language Switcher -->
    <div class="absolute top-4 right-4 z-20">
      <button 
        @click="toggleLanguage" 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold border border-white/15 text-amber-300 transition-all"
      >
        <Globe class="w-4 h-4 text-amber-300" />
        <span>{{ currentLang === 'en' ? '🇮🇷 فارسی' : '🇺🇸 English' }}</span>
      </button>
    </div>

    <div v-if="loading" class="flex flex-col items-center gap-3 py-12">
      <div class="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs text-gray-400">{{ t('loading') }}</p>
    </div>

    <div v-else-if="error" class="glass-panel max-w-md w-full p-8 rounded-3xl text-center space-y-4 border border-red-500/30">
      <div class="w-12 h-12 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
        <AlertTriangle class="w-6 h-6" />
      </div>
      <h2 class="text-lg font-bold text-white">Error Loading Subscription</h2>
      <p class="text-xs text-gray-400 leading-relaxed">{{ error }}</p>
    </div>

    <div v-else-if="userData" class="max-w-2xl w-full space-y-5">
      <!-- Header Info Banner with Custom Brand Title & Logo -->
      <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3 md:gap-4">
          <img 
            :src="brandSettings.logoUrl || '/logo_trans.png'" 
            :alt="brandSettings.brandName || 'Logo'" 
            class="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-[0_0_16px_rgba(245,158,11,0.35)] shrink-0 hover:scale-105 transition-all rounded-2xl bg-white/5 p-1" 
          />
          <div>
            <h1 class="text-lg sm:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400">
              {{ brandSettings.brandName || t('userSubTitle') }}: {{ userData.username }}
            </h1>
            <p class="text-xs text-gray-400 font-mono" dir="ltr">UUID: {{ userData.uuid }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0"
          :class="userData.status === 'ACTIVE' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/25 text-rose-300'"
        >
          <span class="w-2 h-2 rounded-full" :class="userData.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'"></span>
          {{ userData.status === 'ACTIVE' ? t('activeStatus') : t('expiredStatus') }}
        </div>
      </div>

      <!-- Customer Announcement Notice Banner -->
      <div v-if="brandSettings.announcement" class="glass-panel p-4 sm:p-5 rounded-3xl border border-amber-400/30 bg-gradient-to-r from-amber-950/30 via-black/60 to-amber-950/30 space-y-2">
        <div class="flex items-center gap-2 text-amber-300 font-bold text-xs">
          <Info class="w-4 h-4 text-amber-400 shrink-0" />
          <span>{{ t('announcementLabel') }}</span>
        </div>
        <p class="text-xs text-gray-200 leading-relaxed whitespace-pre-line">{{ brandSettings.announcement }}</p>
      </div>

      <!-- Support & Channel Contact Buttons -->
      <div v-if="brandSettings.supportLink || brandSettings.channelLink" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <a 
          v-if="brandSettings.supportLink" 
          :href="cleanTelegramLink(brandSettings.supportLink)" 
          target="_blank" 
          class="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all text-center"
        >
          <MessageSquare class="w-4 h-4 shrink-0" />
          <span>{{ t('contactSupportBtn') }}</span>
        </a>
        <a 
          v-if="brandSettings.channelLink" 
          :href="cleanTelegramLink(brandSettings.channelLink)" 
          target="_blank" 
          class="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all text-center"
        >
          <Send class="w-4 h-4 shrink-0" />
          <span>{{ t('joinChannelBtn') }}</span>
        </a>
      </div>

      <!-- Data Usage & Expiration Meter -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Usage Card -->
        <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-400">{{ t('trafficHeader') }}</span>
            <span class="text-amber-300 font-bold font-mono">{{ usedGb }} GB / {{ limitGbText }}</span>
          </div>
          <div class="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
            <div 
              class="h-full rounded-full transition-all duration-500"
              :class="usagePercent > 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'"
              :style="{ width: `${Math.min(100, usagePercent)}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-[11px] text-gray-400">
            <span>Usage: {{ usagePercent.toFixed(1) }}%</span>
            <span>Remaining: {{ remainGbText }}</span>
          </div>
        </div>

        <!-- Expiration Card -->
        <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-3 flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-400">{{ t('expiryHeader') }}</span>
            <span class="text-rose-300 font-bold">{{ expireText }}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-300">
            <Clock class="w-4 h-4 text-rose-400" />
            <span>{{ daysLeftText }}</span>
          </div>
        </div>
      </div>

      <!-- Metadata Row (Creation Date & Max Devices / IP Limit) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Calendar class="w-5 h-5" />
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">Creation Date</span>
            <span class="text-white font-bold text-xs">{{ createdAtText }}</span>
          </div>
        </div>

        <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-400/10 border border-indigo-400/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">{{ t('maxDevices') }} (IP Limit)</span>
            <span class="text-indigo-300 font-bold text-xs">{{ maxDevicesText }}</span>
          </div>
        </div>
      </div>

      <!-- ISP Selector Bar -->
      <div class="glass-panel p-4 rounded-3xl border border-white/[0.08] space-y-3">
        <label class="block text-xs font-semibold text-gray-300">Auto-configure bypass preset for your ISP:</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="isp in ispOptions" :key="isp.id" @click="selectedIsp = isp.id; loadConfigs()"
            :class="['px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all', selectedIsp === isp.id ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-bold shadow-sm' : 'bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] border border-white/[0.05]']"
          >
            {{ isp.label }}
          </button>
        </div>
      </div>

      <!-- Config Formats & QR Code Tabs -->
      <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] space-y-4">
        <!-- Tabs -->
        <div class="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-2xl border border-white/[0.05]">
          <button v-for="tab in configTabs" :key="tab.id" @click="activeTab = tab.id"
            :class="['flex-1 py-2 rounded-xl text-xs font-bold transition-all', activeTab === tab.id ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 shadow-md shadow-amber-500/20' : 'text-gray-400 hover:text-white']"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Sub URL & Base64 -->
        <div v-if="activeTab === 'sub'" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs text-gray-400">Universal Subscription URL:</label>
            <div class="flex items-center gap-2">
              <input readonly :value="subUrl" dir="ltr" class="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs font-mono text-left text-amber-300 outline-none" />
              <button @click="copy(subUrl, 'Subscription link copied')" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 text-xs font-bold shrink-0 hover:opacity-95 flex items-center gap-1">
                <Copy class="w-3.5 h-3.5 text-gray-950 font-bold" /> {{ t('copy') }}
              </button>
            </div>
          </div>
          <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl">
            <QrcodeVue :value="subUrl" :size="190" />
            <p class="text-xs text-gray-800 font-bold mt-2">Scan Direct Subscription QR</p>
          </div>
        </div>

        <!-- VLESS Links -->
        <div v-if="activeTab === 'vless'" class="space-y-3">
          <div v-for="(link, i) in vlessLinks" :key="i" class="bg-black/30 rounded-2xl p-3.5 border border-white/[0.06] space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-amber-300 font-bold">VLESS Link Gateway {{ i + 1 }}</span>
              <button @click="copy(link, 'VLESS link copied')" class="px-3 py-1 rounded-xl bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/20 text-xs font-bold">{{ t('copy') }} Link</button>
            </div>
            <pre dir="ltr" class="text-[11px] font-mono text-gray-200 break-all whitespace-pre-wrap text-left p-2.5 bg-black/50 rounded-xl border border-white/[0.04] leading-relaxed">{{ link }}</pre>
          </div>
        </div>

        <!-- Clash Meta YAML -->
        <div v-if="activeTab === 'clash'" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">Full YAML config for Clash / Stash</span>
            <button @click="copy(clashYaml, 'Clash file copied')" class="px-3 py-1 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-bold">{{ t('copy') }} YAML</button>
          </div>
          <pre dir="ltr" class="bg-black/50 p-4 rounded-2xl text-[11px] font-mono text-emerald-400 text-left overflow-x-auto border border-white/[0.04] max-h-72 leading-relaxed">{{ clashYaml }}</pre>
        </div>

        <!-- Sing-Box JSON -->
        <div v-if="activeTab === 'singbox'" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">Full JSON config for Sing-Box / NekoBox</span>
            <button @click="copy(JSON.stringify(singboxJson, null, 2), 'Sing-Box file copied')" class="px-3 py-1 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-bold">{{ t('copy') }} JSON</button>
          </div>
          <pre dir="ltr" class="bg-black/50 p-4 rounded-2xl text-[11px] font-mono text-indigo-300 text-left overflow-x-auto border border-white/[0.04] max-h-72 leading-relaxed">{{ JSON.stringify(singboxJson, null, 2) }}</pre>
        </div>
      </div>

      <!-- Recommended Client Applications Download Section -->
      <div v-if="brandSettings.showApps" class="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] space-y-4">
        <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Download class="w-4 h-4 text-amber-400" />
          <span>{{ t('clientAppsHeading') }}</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <!-- Android -->
          <div class="p-3.5 bg-black/40 rounded-2xl border border-white/[0.06] space-y-2 flex flex-col justify-between">
            <div>
              <span class="font-bold text-emerald-400 block">🤖 Android</span>
              <p class="text-[11px] text-gray-400 mt-1">v2rayNG / NekoBox</p>
            </div>
            <a href="https://github.com/2dust/v2rayNG/releases" target="_blank" class="py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold text-center hover:bg-emerald-500/20 transition-all">
              Download APK
            </a>
          </div>

          <!-- iOS -->
          <div class="p-3.5 bg-black/40 rounded-2xl border border-white/[0.06] space-y-2 flex flex-col justify-between">
            <div>
              <span class="font-bold text-cyan-400 block">🍏 iOS (iPhone / iPad)</span>
              <p class="text-[11px] text-gray-400 mt-1">Streisand / Sing-box / V2Box</p>
            </div>
            <a href="https://apps.apple.com/us/app/streisand/id6450534064" target="_blank" class="py-2 px-3 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold text-center hover:bg-cyan-500/20 transition-all">
              App Store
            </a>
          </div>

          <!-- Windows -->
          <div class="p-3.5 bg-black/40 rounded-2xl border border-white/[0.06] space-y-2 flex flex-col justify-between">
            <div>
              <span class="font-bold text-indigo-400 block">💻 Windows</span>
              <p class="text-[11px] text-gray-400 mt-1">v2rayN / NekoRay</p>
            </div>
            <a href="https://github.com/2dust/v2rayN/releases" target="_blank" class="py-2 px-3 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold text-center hover:bg-indigo-500/20 transition-all">
              Download ZIP
            </a>
          </div>
        </div>
      </div>

      <!-- Footer Branding -->
      <footer class="text-center space-y-2 pt-4 text-xs text-gray-400 border-t border-white/10">
        <p>{{ brandSettings.brandName || t('byCynet') }}</p>
        <div class="flex items-center justify-center gap-4 text-xs">
          <a href="https://t.me/cynetx" target="_blank" class="hover:text-amber-400 transition-colors">📢 Telegram</a>
          <span>•</span>
          <a href="https://cynetx.ir" target="_blank" class="hover:text-amber-400 transition-colors font-mono">🌐 Website</a>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Shield, Clock, AlertTriangle, Copy, Calendar, Users, Globe, Info, MessageSquare, Send, Download } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import ToastNotification from './ToastNotification.vue';
import { copyToClipboard } from '../utils/clipboard';
import { currentLang, setLanguage, t } from '../i18n';

const props = defineProps<{ uuid?: string }>();

const loading = ref(true);
const error = ref('');
const userData = ref<any>(null);
const selectedIsp = ref('MCI');
const activeTab = ref('sub');
const toastRef = ref<any>(null);

const brandSettings = ref<any>({
  brandName: 'Nyx Panel',
  logoUrl: '/logo_trans.png',
  supportLink: '',
  channelLink: '',
  announcement: '',
  themeColor: 'amber',
  showApps: true
});

function toggleLanguage() {
  const nextLang = currentLang.value === 'en' ? 'fa' : 'en';
  setLanguage(nextLang);
}

function cleanTelegramLink(link: string): string {
  if (!link) return '#';
  const clean = link.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (clean.startsWith('@')) return `https://t.me/${clean.substring(1)}`;
  return `https://t.me/${clean}`;
}

const vlessLinks = ref<string[]>([]);
const clashYaml = ref('');
const singboxJson = ref<any>(null);
const subUrl = ref('');

const configTabs = computed(() => [
  { id: 'sub', label: currentLang.value === 'fa' ? 'سابسکریپشن & QR' : 'Subscription & QR' },
  { id: 'vless', label: currentLang.value === 'fa' ? 'لینک‌های VLESS' : 'VLESS Links' },
  { id: 'clash', label: 'Clash Meta' },
  { id: 'singbox', label: 'Sing-Box' },
]);

const ispOptions = computed(() => [
  { id: 'DEFAULT', label: currentLang.value === 'fa' ? 'عمومی' : 'General', activeClass: 'bg-amber-400 text-gray-950' },
  { id: 'MCI', label: t('operatorMci'), activeClass: 'bg-amber-400 text-gray-950' },
  { id: 'IRANCELL', label: t('operatorIrancell'), activeClass: 'bg-amber-400 text-gray-950' },
  { id: 'WHITE_SNI', label: t('operatorWhite'), activeClass: 'bg-emerald-400 text-gray-950' },
]);

const usedGb = computed(() => {
  if (!userData.value) return '0.00';
  return (Number(userData.value.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(2);
});

const limitGbText = computed(() => {
  if (!userData.value || !userData.value.dataLimitGb) return t('unlimited');
  return `${userData.value.dataLimitGb} GB`;
});

const remainGbText = computed(() => {
  if (!userData.value || !userData.value.dataLimitGb) return t('unlimited');
  const rem = Math.max(0, userData.value.dataLimitGb - Number(usedGb.value));
  return `${rem.toFixed(2)} GB`;
});

const usagePercent = computed(() => {
  if (!userData.value || !userData.value.dataLimitGb) return 10;
  const used = Number(userData.value.usedDataBytes) / (1024 * 1024 * 1024);
  return (used / userData.value.dataLimitGb) * 100;
});

const expireText = computed(() => {
  if (!userData.value || !userData.value.expireDate) return t('unlimited');
  return new Date(userData.value.expireDate).toLocaleDateString();
});

const daysLeftText = computed(() => {
  if (!userData.value || !userData.value.expireDate) return t('unlimited');
  const diff = new Date(userData.value.expireDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return currentLang.value === 'fa' ? 'منقضی شده' : 'Expired';
  return currentLang.value === 'fa' ? `${days} روز باقی‌مانده` : `${days} days left`;
});

const createdAtText = computed(() => {
  if (!userData.value || !userData.value.createdAt) return 'N/A';
  return new Date(userData.value.createdAt).toLocaleDateString();
});

const maxDevicesText = computed(() => {
  if (!userData.value || !userData.value.maxDevices) return currentLang.value === 'fa' ? '۲ کاربره همزمان (پیش‌فرض)' : '2 Devices (Default)';
  return currentLang.value === 'fa'
    ? `${userData.value.maxDevices} دستگاه همزمان (محدودیت IP)`
    : `${userData.value.maxDevices} Devices (IP Limit)`;
});

async function loadUserData() {
  loading.value = true;
  error.value = '';

  const targetUuid = props.uuid || window.location.pathname.split('/subinfo/')[1];
  if (!targetUuid) {
    error.value = 'User UUID not specified.';
    loading.value = false;
    return;
  }

  try {
    const res = await axios.get(`/api/subinfo/${targetUuid}`);
    userData.value = res.data.user;
    brandSettings.value = res.data.brandSettings || brandSettings.value;
    vlessLinks.value = res.data.vlessLinks;
    clashYaml.value = res.data.clashYaml;
    singboxJson.value = res.data.singboxJson;
    subUrl.value = res.data.subUrl;
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'User account not found or disabled.';
  } finally {
    loading.value = false;
  }
}

async function loadConfigs() {
  if (!userData.value) return;
  try {
    const res = await axios.get(`/api/subinfo/${userData.value.uuid}?isp=${selectedIsp.value}`);
    vlessLinks.value = res.data.vlessLinks;
    clashYaml.value = res.data.clashYaml;
    singboxJson.value = res.data.singboxJson;
    subUrl.value = res.data.subUrl;
  } catch (err) {}
}

function copy(text: string, msg: string) {
  copyToClipboard(text);
  if (toastRef.value) {
    toastRef.value.addToast(msg, 'success');
  }
}

onMounted(loadUserData);
</script>
