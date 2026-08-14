<template>
  <div class="space-y-6">
    <!-- Top Header Banner -->
    <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] relative overflow-hidden space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Zap class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-400">{{ t('tunnelsTitle') }}</h2>
            <p class="text-xs sm:text-sm text-gray-400 mt-0.5">{{ t('tunnelsSub') }}</p>
          </div>
        </div>
      </div>

      <!-- Tunnel Flow Architecture Diagram -->
      <div class="p-3.5 rounded-2xl bg-black/40 border border-white/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-gray-300 font-medium">{{ t('tunnelExplainTitle') }}</span>
        </div>
        <div class="flex items-center gap-2 text-[11px] font-mono text-gray-300 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.05]" dir="ltr">
          <span class="text-amber-300 font-bold">📱 Client</span>
          <span class="text-gray-500">➜</span>
          <span class="text-indigo-400 font-bold">🇮🇷 Iran Relay IP</span>
          <span class="text-gray-500">═══[ 🔒 Encrypted Tunnel ]═══></span>
          <span class="text-emerald-400 font-bold">🇪🇺 Kharej Master IP</span>
          <span class="text-gray-500">➜</span>
          <span class="text-cyan-400 font-bold">🌐 Free Web</span>
        </div>
      </div>
    </div>

    <!-- Generator Input Form -->
    <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] space-y-6">
      <div class="border-b border-white/[0.06] pb-3 flex items-center justify-between">
        <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Server class="w-5 h-5 text-amber-400" />
          <span>پیکربندی مشخصات سرور ایران و خارج (Server IP Setup)</span>
        </h3>
        <button 
          @click="generateRandomSecret" 
          type="button"
          class="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20"
        >
          <span>🎲 ساخت کلید تصادفی</span>
        </button>
      </div>

      <!-- IP & Ports Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Iran Relay Server IP -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-gray-300">
            <span class="text-amber-300">🇮🇷</span> {{ t('iranIpLabel') }}
          </label>
          <div class="relative">
            <input 
              v-model="params.iranIp"
              type="text" 
              :placeholder="t('iranIpPlaceholder')"
              dir="ltr"
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono text-left focus:border-amber-400/50 outline-none placeholder:text-gray-600"
            />
          </div>
          <span class="text-[10px] text-gray-500 block">آدرس IP سرور مجازی لینوکس داخل ایران</span>
        </div>

        <!-- 2. Kharej Master Server IP -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-gray-300">
            <span class="text-emerald-300">🇪🇺</span> {{ t('kharejIpLabel') }}
          </label>
          <div class="relative">
            <input 
              v-model="params.kharejIp"
              type="text" 
              :placeholder="t('kharejIpPlaceholder')"
              dir="ltr"
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono text-left focus:border-amber-400/50 outline-none placeholder:text-gray-600"
            />
          </div>
          <span class="text-[10px] text-gray-500 block">آدرس IP سرور خارج (که پنل روش نصبه)</span>
        </div>

        <!-- 3. Tunnel Communication Port -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-gray-300">
            🔌 {{ t('tunnelPortLabel') }}
          </label>
          <input 
            v-model="params.tunnelPort"
            type="number" 
            placeholder="8443"
            dir="ltr"
            class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono text-left focus:border-amber-400/50 outline-none"
          />
          <span class="text-[10px] text-gray-500 block">پورت اتصال اختصاصی بین دو سرور</span>
        </div>

        <!-- 4. Target Inbound Port -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-gray-300">
            🎯 {{ t('kharejInboundPortLabel') }}
          </label>
          <input 
            v-model="params.targetInboundPort"
            type="number" 
            placeholder="443"
            dir="ltr"
            class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono text-left focus:border-amber-400/50 outline-none"
          />
          <span class="text-[10px] text-gray-500 block">پورت اینباند Xray (مثلاً ۴۴۳ یا ۸۴۴۳)</span>
        </div>
      </div>

      <!-- Tunnel Secret Key Field -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-gray-300">
          🔑 {{ t('tunnelSecretLabel') }}
        </label>
        <div class="flex items-center gap-2">
          <input 
            v-model="params.secret"
            type="text" 
            placeholder="NyxSecretKey_2026"
            dir="ltr"
            class="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono text-left focus:border-amber-400/50 outline-none"
          />
          <button 
            type="button" 
            @click="generateRandomSecret" 
            class="px-3 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs border border-white/[0.06] shrink-0 transition-all"
          >
            🎲 ایجاد کلید امن
          </button>
        </div>
      </div>

      <!-- Protocol Selection Section -->
      <div class="space-y-2.5">
        <label class="block text-xs font-semibold text-gray-300">
          🛡️ {{ t('tunnelTypeLabel') }}:
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <!-- Gost v3 -->
          <div 
            @click="params.tunnelType = 'GOST'"
            :class="[
              'p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1',
              params.tunnelType === 'GOST' 
                ? 'bg-amber-400/10 border-amber-400/30 text-white shadow-sm' 
                : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
            ]"
          >
            <div class="flex items-center justify-between font-bold text-xs">
              <span class="text-amber-300">🚀 Gost v3 (MWS - پیشنهادی)</span>
              <span v-if="params.tunnelType === 'GOST'" class="text-[10px] bg-amber-400 text-gray-950 px-2 py-0.5 rounded-full font-bold">انتخاب‌شده</span>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              تونل وب‌سوکت مالتی‌پلکس رمزشده با بیشترین پهنای باند و کمترین تاخیر؛ بالاترین پایداری در شبکه ایران.
            </p>
          </div>

          <!-- Rathole -->
          <div 
            @click="params.tunnelType = 'RATHOLE'"
            :class="[
              'p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1',
              params.tunnelType === 'RATHOLE' 
                ? 'bg-indigo-400/10 border-indigo-400/30 text-white shadow-sm' 
                : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
            ]"
          >
            <div class="flex items-center justify-between font-bold text-xs">
              <span class="text-indigo-300">⚡ Rathole (سبک - زبان Rust)</span>
              <span v-if="params.tunnelType === 'RATHOLE'" class="text-[10px] bg-indigo-400 text-gray-950 px-2 py-0.5 rounded-full font-bold">انتخاب‌شده</span>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              نوشته شده با زبان راست، مصرف رم زیر ۱۰ مگابایت؛ فوق‌العاده سبک و بهینه برای سرورهای ضعیف ایران.
            </p>
          </div>

          <!-- ICMP Ping Tunnel -->
          <div 
            @click="params.tunnelType = 'ICMP_TUNNEL'"
            :class="[
              'p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1',
              params.tunnelType === 'ICMP_TUNNEL' 
                ? 'bg-rose-400/10 border-rose-400/30 text-white shadow-sm' 
                : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
            ]"
          >
            <div class="flex items-center justify-between font-bold text-xs">
              <span class="text-rose-300">🚨 ICMP Ping Tunnel (ضد قطعی پورت)</span>
              <span v-if="params.tunnelType === 'ICMP_TUNNEL'" class="text-[10px] bg-rose-400 text-gray-950 px-2 py-0.5 rounded-full font-bold">انتخاب‌شده</span>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              عبور پکت‌ها از بستر پینگ ICMP (لایه ۳)؛ زمانی که تمام پورت‌های TCP و UDP مسدود شده‌اند کار می‌کند.
            </p>
          </div>

          <!-- White DNS Tunnel -->
          <div 
            @click="params.tunnelType = 'WHITE_DNS_TUNNEL'"
            :class="[
              'p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1',
              params.tunnelType === 'WHITE_DNS_TUNNEL' 
                ? 'bg-cyan-400/10 border-cyan-400/30 text-white shadow-sm' 
                : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
            ]"
          >
            <div class="flex items-center justify-between font-bold text-xs">
              <span class="text-cyan-300">🌐 White DNS Tunnel (پورت ۵۳)</span>
              <span v-if="params.tunnelType === 'WHITE_DNS_TUNNEL'" class="text-[10px] bg-cyan-400 text-gray-950 px-2 py-0.5 rounded-full font-bold">انتخاب‌شده</span>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              ارسال پکت‌ها در قالب کوئری‌های DNS از روی پورت ۵۳ دامنه‌های لیست سفید و سرورهای داخلی.
            </p>
          </div>

          <!-- Native IP Forwarding -->
          <div 
            @click="params.tunnelType = 'IPV6_RELAY'"
            :class="[
              'p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 sm:col-span-2 lg:col-span-2',
              params.tunnelType === 'IPV6_RELAY' 
                ? 'bg-emerald-400/10 border-emerald-400/30 text-white shadow-sm' 
                : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
            ]"
          >
            <div class="flex items-center justify-between font-bold text-xs">
              <span class="text-emerald-300">🔀 رله مستقیم IPTables / NAT Forwarding</span>
              <span v-if="params.tunnelType === 'IPV6_RELAY'" class="text-[10px] bg-emerald-400 text-gray-950 px-2 py-0.5 rounded-full font-bold">انتخاب‌شده</span>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              بدون نیاز به نرم‌افزار اضافی؛ مستقیماً از قابلیت Kernel NAT Forwarding لینوکس برای رله ترافیک استفاده می‌کند.
            </p>
          </div>
        </div>
      </div>

      <!-- Additional DNS Tunnel Fields -->
      <div v-if="params.tunnelType === 'WHITE_DNS_TUNNEL'" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20">
        <div>
          <label class="block text-xs text-gray-300 mb-1 font-semibold">{{ t('whiteDnsIpLabel') }}</label>
          <input 
            v-model="params.whiteDnsServer"
            type="text" 
            placeholder="178.22.122.100"
            dir="ltr"
            class="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-mono text-left outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-300 mb-1 font-semibold">{{ t('whiteSubdomainLabel') }}</label>
          <input 
            v-model="params.whiteDomain"
            type="text" 
            placeholder="tunnel.nyx.ir"
            dir="ltr"
            class="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-mono text-left outline-none"
          />
        </div>
      </div>

      <!-- Action Button -->
      <div class="flex items-center justify-end pt-2 border-t border-white/[0.06]">
        <button 
          @click="generateScripts"
          :disabled="generating"
          class="px-5 sm:px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="generating" class="w-4 h-4 animate-spin text-gray-950" />
          <Code v-else class="w-4 h-4 text-gray-950 font-bold" />
          {{ t('generateScriptsBtnLabel') }}
        </button>
      </div>
    </div>

    <!-- Client Application Setup Notice Banner -->
    <div v-if="generated" class="glass-panel p-4 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-black/60 via-emerald-950/20 to-black/60 space-y-1.5">
      <div class="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
        <CheckCircle2 class="w-5 h-5 text-emerald-400" />
        <span>{{ t('tunnelClientUsageNotice') }}</span>
      </div>
      <div class="text-[11px] text-gray-300 leading-relaxed font-mono" dir="ltr">
        Address: <span class="text-amber-300 font-bold">{{ params.iranIp || 'IRAN_SERVER_IP' }}</span> | Port: <span class="text-amber-300 font-bold">{{ params.targetInboundPort }}</span>
      </div>
    </div>

    <!-- Step by Step Visual Guide -->
    <div v-if="generated && stepGuide && stepGuide.steps" class="space-y-4">
      <div class="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] space-y-4 shadow-xl">
        <h3 class="text-base font-extrabold text-white flex items-center gap-2">
          <BookOpen class="w-5 h-5 text-amber-400" />
          <span>{{ t('stepGuideTitle') }}</span>
        </h3>

        <div class="space-y-4">
          <div v-for="(step, i) in stepGuide.steps" :key="i" class="border border-white/[0.06] rounded-2xl overflow-hidden bg-black/30">
            <div class="bg-white/[0.03] px-4 py-2.5 flex items-center gap-2.5 border-b border-white/[0.06]">
              <span class="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-xs font-bold text-gray-950 shrink-0">{{ i + 1 }}</span>
              <h4 class="text-xs sm:text-sm font-bold text-white">{{ step.title }}</h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/[0.06]">
              <!-- Iran Server Step -->
              <div class="p-4 space-y-2">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-indigo-300 flex items-center gap-1">{{ t('iranServerBadge') }}</span>
                  <span class="text-[11px] font-mono text-gray-400" dir="ltr">{{ params.iranIp || 'IRAN_IP' }}</span>
                </div>
                <pre dir="ltr" class="text-xs font-mono text-gray-200 bg-black/50 p-3 rounded-xl whitespace-pre-wrap break-all border border-white/[0.04] text-left leading-relaxed">{{ step.iranStep }}</pre>
              </div>

              <!-- Kharej Server Step -->
              <div class="p-4 space-y-2">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-emerald-300 flex items-center gap-1">{{ t('kharejServerBadge') }}</span>
                  <span class="text-[11px] font-mono text-gray-400" dir="ltr">{{ params.kharejIp || 'KHAREJ_IP' }}</span>
                </div>
                <pre dir="ltr" class="text-xs font-mono text-gray-200 bg-black/50 p-3 rounded-xl whitespace-pre-wrap break-all border border-white/[0.04] text-left leading-relaxed">{{ step.kharejStep }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Output Generated Bash Scripts (1-Click Copy) -->
    <div v-if="generated" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Iran Server Script -->
      <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-3 shadow-xl">
        <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <h4 class="text-xs sm:text-sm font-bold text-indigo-300 flex items-center gap-2">
            <span>{{ t('iranScriptBoxTitle') }}</span>
          </h4>
          <button 
            @click="copyText(iranScript)"
            class="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-bold text-indigo-300 border border-indigo-500/20 transition-all flex items-center gap-1"
          >
            <Copy class="w-3.5 h-3.5" />
            {{ t('copyScriptBtn') }}
          </button>
        </div>
        <pre dir="ltr" class="bg-black/50 p-4 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto border border-white/[0.04] max-h-96 text-left leading-relaxed">{{ iranScript }}</pre>
      </div>

      <!-- Kharej Server Script -->
      <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-3 shadow-xl">
        <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <h4 class="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-2">
            <span>{{ t('kharejScriptBoxTitle') }}</span>
          </h4>
          <button 
            @click="copyText(kharejScript)"
            class="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-300 border border-emerald-500/20 transition-all flex items-center gap-1"
          >
            <Copy class="w-3.5 h-3.5" />
            {{ t('copyScriptBtn') }}
          </button>
        </div>
        <pre dir="ltr" class="bg-black/50 p-4 rounded-2xl text-xs font-mono text-amber-300 overflow-x-auto border border-white/[0.04] max-h-96 text-left leading-relaxed">{{ kharejScript }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Zap, Copy, Server, Code, BookOpen, CheckCircle2, RefreshCw } from 'lucide-vue-next';
import { copyToClipboard } from '../utils/clipboard';
import { t, currentLang } from '../i18n';

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const params = ref({
  iranIp: '',
  kharejIp: '',
  tunnelPort: 8443,
  targetInboundPort: 443,
  secret: 'NyxSecretKey_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  tunnelType: 'GOST' as 'GOST' | 'RATHOLE' | 'ICMP_TUNNEL' | 'WHITE_DNS_TUNNEL' | 'IPV6_RELAY',
  whiteDnsServer: '178.22.122.100',
  whiteDomain: 'tunnel.nyx.ir'
});

const generated = ref(false);
const generating = ref(false);
const iranScript = ref('');
const kharejScript = ref('');
const stepGuide = ref<any>(null);

onMounted(() => {
  // Auto-detect current Kharej server IP from browser URL
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    params.value.kharejIp = window.location.hostname;
  }
});

function generateRandomSecret() {
  params.value.secret = 'NyxSec_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Math.floor(1000 + Math.random() * 9000);
}

async function generateScripts() {
  generating.value = true;
  try {
    const payload = { 
      ...params.value, 
      kharejIp: params.value.kharejIp || (typeof window !== 'undefined' ? window.location.hostname : '185.100.100.1'),
      lang: currentLang.value 
    };
    const res = await axios.post('/api/nodes/tunnel-script', payload);
    iranScript.value = res.data.iranScript;
    kharejScript.value = res.data.kharejScript;
    stepGuide.value = res.data.stepGuide;
    generated.value = true;
    props.toast?.(t('tunnelScriptsSuccess'), 'success');
  } catch (err) {
    props.toast?.(t('tunnelScriptError'), 'error');
  } finally {
    generating.value = false;
  }
}

function copyText(text: string) {
  copyToClipboard(text);
  props.toast?.(t('scriptCopiedToast'), 'success');
}
</script>