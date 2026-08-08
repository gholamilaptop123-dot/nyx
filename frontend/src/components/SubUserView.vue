<template>
  <div class="min-h-screen bg-darkBg text-gray-100 font-sans p-4 md:p-8 flex flex-col items-center justify-center">
    <ToastNotification ref="toastRef" />

    <div v-if="loading" class="flex flex-col items-center gap-3 py-12">
      <div class="w-10 h-10 border-4 border-cyberViolet border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs text-gray-400">در حال دریافت اطلاعات اشتراک کاربر…</p>
    </div>

    <div v-else-if="error" class="glass-panel max-w-md w-full p-8 rounded-3xl text-center space-y-4 border border-red-500/30">
      <div class="w-12 h-12 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
        <AlertTriangle class="w-6 h-6" />
      </div>
      <h2 class="text-lg font-bold text-white">خطا در دریافت اطلاعات</h2>
      <p class="text-xs text-gray-400 leading-relaxed">{{ error }}</p>
    </div>

    <div v-else-if="userData" class="max-w-2xl w-full space-y-6">
      <!-- Header Info Banner -->
      <div class="glass-panel p-6 rounded-3xl border border-cyberViolet/30 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <img src="/logo_trans.png" alt="Nyx Panel Logo" class="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] shrink-0" />
          <div>
            <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-cyberCyan">
              اشتراک: {{ userData.username }}
            </h1>
            <p class="text-xs text-gray-400 font-mono" dir="ltr">UUID: {{ userData.uuid }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
          :class="userData.status === 'ACTIVE' ? 'bg-cyberGreen/15 border border-cyberGreen/40 text-cyberGreen' : 'bg-red-500/15 border border-red-500/40 text-red-400'"
        >
          <span class="w-2 h-2 rounded-full" :class="userData.status === 'ACTIVE' ? 'bg-cyberGreen animate-ping' : 'bg-red-400'"></span>
          {{ userData.status === 'ACTIVE' ? 'اشتراک فعال' : 'اشتراک منقضی / غیرفعال' }}
        </div>
      </div>

      <!-- Data Usage & Expiration Meter -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Usage Card -->
        <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-400">حجم مصرف‌شده</span>
            <span class="text-cyberCyan font-bold font-mono">{{ usedGb }} GB / {{ limitGbText }}</span>
          </div>
          <div class="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              class="h-full rounded-full transition-all duration-500"
              :class="usagePercent > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-cyberViolet to-cyberCyan'"
              :style="{ width: `${Math.min(100, usagePercent)}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-[11px] text-gray-500">
            <span>درصد مصرف: {{ usagePercent.toFixed(1) }}%</span>
            <span>باقی‌مانده: {{ remainGbText }}</span>
          </div>
        </div>

        <!-- Expiration Card -->
        <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-3 flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-400">تاریخ پایان اعتبار</span>
            <span class="text-cyberPink font-bold">{{ expireText }}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-300">
            <Clock class="w-4 h-4 text-cyberPink" />
            <span>{{ daysLeftText }}</span>
          </div>
        </div>
      </div>

      <!-- Metadata Row (Creation Date & Max Devices / IP Limit) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="glass-panel p-5 rounded-3xl border border-white/10 flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-cyberYellow/10 border border-cyberYellow/30 text-cyberYellow flex items-center justify-center shrink-0">
            <Calendar class="w-5 h-5" />
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">تاریخ ایجاد / خرید اشتراک</span>
            <span class="text-white font-bold text-xs">{{ createdAtText }}</span>
          </div>
        </div>

        <div class="glass-panel p-5 rounded-3xl border border-white/10 flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-cyberCyan/10 border border-cyberCyan/30 text-cyberCyan flex items-center justify-center shrink-0">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">محدودیت دستگاه همزمان (IP Limit)</span>
            <span class="text-cyberCyan font-bold text-xs">{{ maxDevicesText }}</span>
          </div>
        </div>
      </div>

      <!-- ISP Selector Bar -->
      <div class="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
        <label class="block text-xs font-semibold text-gray-300">تنظیم اتوماتیک ترفندها بر اساس اپراتور شبکه شما:</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="isp in ispOptions" :key="isp.id" @click="selectedIsp = isp.id; loadConfigs()"
            :class="['px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all', selectedIsp === isp.id ? isp.activeClass : 'bg-white/5 text-gray-400 hover:text-white']"
          >
            {{ isp.label }}
          </button>
        </div>
      </div>

      <!-- Config Formats & QR Code Tabs -->
      <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <!-- Tabs -->
        <div class="flex items-center gap-1 bg-white/5 p-1 rounded-2xl">
          <button v-for="tab in configTabs" :key="tab.id" @click="activeTab = tab.id"
            :class="['flex-1 py-2 rounded-xl text-xs font-semibold transition-all', activeTab === tab.id ? 'bg-cyberViolet text-white shadow-lg' : 'text-gray-400 hover:text-white']"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Sub URL & Base64 -->
        <div v-if="activeTab === 'sub'" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs text-gray-400">لینک سابسکریپشن هوشمند (ویژه تمام نرم‌افزارها):</label>
            <div class="flex items-center gap-2">
              <input readonly :value="subUrl" dir="ltr" class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-left text-cyberCyan outline-none" />
              <button @click="copy(subUrl, 'لینک سابسکریپشن کپی شد')" class="px-4 py-2.5 rounded-xl bg-cyberViolet text-white text-xs font-bold shrink-0 hover:opacity-90 flex items-center gap-1">
                <Copy class="w-3.5 h-3.5" /> کپی
              </button>
            </div>
          </div>
          <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl">
            <QrcodeVue :value="subUrl" :size="190" />
            <p class="text-xs text-gray-800 font-bold mt-2">اسکن مستقیم سابسکریپشن</p>
          </div>
        </div>

        <!-- VLESS Links -->
        <div v-if="activeTab === 'vless'" class="space-y-3">
          <div v-for="(link, i) in vlessLinks" :key="i" class="bg-black/40 rounded-2xl p-3.5 border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-cyberCyan font-bold">لینک VLESS اینباند {{ i + 1 }}</span>
              <button @click="copy(link, 'لینک VLESS کپی شد')" class="px-3 py-1 rounded-xl bg-cyberViolet/30 text-cyberViolet hover:bg-cyberViolet/50 text-xs font-semibold">کپی لینک</button>
            </div>
            <pre dir="ltr" class="text-[11px] font-mono text-gray-200 break-all whitespace-pre-wrap text-left p-2.5 bg-black/60 rounded-xl border border-white/5 leading-relaxed">{{ link }}</pre>
          </div>
        </div>

        <!-- Clash Meta YAML -->
        <div v-if="activeTab === 'clash'" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">کانفیگ کامل YAML برای Clash / Stash</span>
            <button @click="copy(clashYaml, 'فایل Clash کپی شد')" class="px-3 py-1 rounded-xl bg-cyberCyan/20 text-cyberCyan text-xs font-bold">کپی YAML</button>
          </div>
          <pre dir="ltr" class="bg-black/60 p-4 rounded-2xl text-[11px] font-mono text-cyberGreen text-left overflow-x-auto border border-white/5 max-h-72 leading-relaxed">{{ clashYaml }}</pre>
        </div>

        <!-- Sing-Box JSON -->
        <div v-if="activeTab === 'singbox'" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">کانفیگ کامل JSON برای Sing-Box / NekoBox</span>
            <button @click="copy(JSON.stringify(singboxJson, null, 2), 'فایل Sing-Box کپی شد')" class="px-3 py-1 rounded-xl bg-cyberViolet/20 text-cyberViolet text-xs font-bold">کپی JSON</button>
          </div>
          <pre dir="ltr" class="bg-black/60 p-4 rounded-2xl text-[11px] font-mono text-cyberCyan text-left overflow-x-auto border border-white/5 max-h-72 leading-relaxed">{{ JSON.stringify(singboxJson, null, 2) }}</pre>
        </div>
      </div>

      <!-- Footer Branding -->
      <footer class="text-center space-y-2 pt-4 text-xs text-gray-400 border-t border-white/10">
        <p>توسعه‌داده‌شده توسط <strong class="text-cyberCyan font-bold">تیم امنیتی ساینت (Cynet)</strong></p>
        <div class="flex items-center justify-center gap-4 text-xs">
          <a href="https://t.me/cynetx" target="_blank" class="hover:text-cyberCyan transition-colors">📢 تلگرام (cynetx)</a>
          <span>•</span>
          <a href="https://www.youtube.com/@cynetxir" target="_blank" class="hover:text-cyberPink transition-colors">🎥 یوتیوب (@cynetxir)</a>
          <span>•</span>
          <a href="https://cynetx.ir" target="_blank" class="hover:text-cyberGreen transition-colors font-mono">🌐 cynetx.ir</a>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Shield, Clock, AlertTriangle, Copy, Calendar, Users } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import ToastNotification from './ToastNotification.vue';
import { copyToClipboard } from '../utils/clipboard';

const props = defineProps<{ uuid?: string }>();

const loading = ref(true);
const error = ref('');
const userData = ref<any>(null);
const selectedIsp = ref('MCI');
const activeTab = ref('sub');
const toastRef = ref<any>(null);

const vlessLinks = ref<string[]>([]);
const clashYaml = ref('');
const singboxJson = ref<any>(null);
const subUrl = ref('');

const configTabs = [
  { id: 'sub', label: 'لینک سابسکریپشن & QR' },
  { id: 'vless', label: 'لینک‌های VLESS' },
  { id: 'clash', label: 'Clash Meta' },
  { id: 'singbox', label: 'Sing-Box' },
];

const ispOptions = [
  { id: 'DEFAULT', label: 'عمومی', activeClass: 'bg-cyberViolet text-white' },
  { id: 'MCI', label: 'همراه اول', activeClass: 'bg-cyberPink text-white' },
  { id: 'IRANCELL', label: 'ایرانسل', activeClass: 'bg-cyberCyan text-black font-bold' },
  { id: 'WHITE_SNI', label: 'SNI سفید (زمان اختلال نت)', activeClass: 'bg-cyberGreen text-black font-bold' },
];

const usedGb = computed(() => {
  if (!userData.value) return '0.00';
  return (Number(userData.value.usedDataBytes) / (1024 * 1024 * 1024)).toFixed(2);
});

const limitGbText = computed(() => {
  if (!userData.value || !userData.value.dataLimitGb) return 'نامحدود';
  return `${userData.value.dataLimitGb} GB`;
});

const remainGbText = computed(() => {
  if (!userData.value || !userData.value.dataLimitGb) return 'نامحدود';
  const rem = Math.max(0, userData.value.dataLimitGb - Number(usedGb.value));
  return `${rem.toFixed(2)} GB`;
});

const usagePercent = computed(() => {
  if (!userData.value || !userData.value.dataLimitGb) return 0;
  return Math.min(100, (Number(usedGb.value) / userData.value.dataLimitGb) * 100);
});

const expireText = computed(() => {
  if (!userData.value || !userData.value.expireDate) return 'بدون محدودیت زمانی';
  return new Date(userData.value.expireDate).toLocaleDateString('fa-IR');
});

const daysLeftText = computed(() => {
  if (!userData.value || !userData.value.expireDate) return 'مدت زمان: نامحدود';
  const diff = new Date(userData.value.expireDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days > 0 ? `${days} روز باقی‌مانده` : 'منقضی شده';
});

const createdAtText = computed(() => {
  if (!userData.value || !userData.value.createdAt) return 'ثبت شده در سیستم';
  return new Date(userData.value.createdAt).toLocaleDateString('fa-IR');
});

const maxDevicesText = computed(() => {
  if (!userData.value || !userData.value.maxDevices) return '۲ کاربره همزمان (پیش‌فرض)';
  return `${userData.value.maxDevices} دستگاه همزمان (محدودیت IP)`;
});

async function loadUserData() {
  loading.value = true;
  error.value = '';

  const targetUuid = props.uuid || window.location.pathname.split('/subinfo/')[1];
  if (!targetUuid) {
    error.value = 'شناسه کاربر یافت نشد.';
    loading.value = false;
    return;
  }

  try {
    const res = await axios.get(`/api/subinfo/${targetUuid}`);
    userData.value = res.data.user;
    vlessLinks.value = res.data.vlessLinks;
    clashYaml.value = res.data.clashYaml;
    singboxJson.value = res.data.singboxJson;
    subUrl.value = res.data.subUrl;
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'حساب کاربر یافت نشد یا غیرفعال گردیده است.';
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
