<template>
  <div class="space-y-6">
    <div class="glass-panel p-6 rounded-3xl border border-cyberYellow/40 relative overflow-hidden">
      <div class="flex items-center gap-3 mb-2">
        <Zap class="w-6 h-6 text-cyberYellow" />
        <h2 class="text-xl font-extrabold text-cyberYellow glow-yellow">{{ t('tunnelsTitle') }}</h2>
      </div>
      <p class="text-xs text-gray-300 leading-relaxed">
        {{ t('tunnelsSub') }}
      </p>
    </div>

    <!-- Generator Input Form -->
    <div class="glass-panel p-6 rounded-3xl border border-cyberYellow/30 space-y-4">
      <h3 class="text-base font-bold text-white">{{ t('tunnelsTitle') }}</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">{{ t('tunnelType') }}</label>
          <select 
            v-model="params.tunnelType"
            class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberYellow outline-none"
          >
            <option value="GOST">Gost v3 (Encrypted MWS Tunnel - Recommended)</option>
            <option value="ICMP_TUNNEL">ICMP Ping Tunnel (Bypasses TCP/UDP Blackouts)</option>
            <option value="WHITE_DNS_TUNNEL">White DNS Tunnel (Port 53 Whitelisted DNS)</option>
            <option value="RATHOLE">Rathole (High-speed Intranet Tunnel)</option>
            <option value="IPV6_RELAY">IPv6 / IP Forwarding (Direct NAT Relay)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1">{{ t('kharejIp') }}</label>
          <input 
            v-model="params.kharejIp"
            type="text" 
            placeholder="185.x.x.x"
            dir="ltr"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1">پورت ارتباطی تونل</label>
          <input 
            v-model="params.tunnelPort"
            type="number" 
            placeholder="8443"
            dir="ltr"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1">پورت اینباند Xray روی خارج</label>
          <input 
            v-model="params.targetInboundPort"
            type="number" 
            placeholder="443"
            dir="ltr"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
          />
        </div>
      </div>

      <!-- Options for DNS Tunnel -->
      <div v-if="params.tunnelType === 'WHITE_DNS_TUNNEL'" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
        <div>
          <label class="block text-xs text-gray-400 mb-1">آدرس IP دی‌ان‌اس سفید</label>
          <input 
            v-model="params.whiteDnsServer"
            type="text" 
            placeholder="178.22.122.100"
            dir="ltr"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">زیردامنه اختصاصی دی‌ان‌اس</label>
          <input 
            v-model="params.whiteDomain"
            type="text" 
            placeholder="tunnel.nyx.ir"
            dir="ltr"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
          />
        </div>
      </div>

      <div class="flex items-center justify-end">
        <button 
          @click="generateScripts"
          class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyberYellow via-red-600 to-cyberRed text-black font-extrabold text-xs shadow-lg shadow-cyberYellow/20 hover:opacity-90 transition-all flex items-center gap-2 border border-cyberYellow/40"
        >
          <Code class="w-4 h-4 text-black font-bold" />
          تولید راهنما و اسکریپت‌های نصب
        </button>
      </div>
    </div>

    <!-- Step by Step Guide (Fixed LTR for Commands) -->
    <div v-if="generated && stepGuide && stepGuide.steps" class="space-y-4">
      <div class="glass-panel p-5 rounded-3xl border border-cyberYellow/30">
        <h3 class="text-base font-extrabold text-cyberYellow glow-yellow flex items-center gap-2 mb-4">
          <BookOpen class="w-5 h-5 text-cyberYellow" />
          راهنمای گام‌به‌گام راه‌اندازی (ترتیب اجرای دستورات)
        </h3>
        <div class="space-y-4">
          <div v-for="(step, i) in stepGuide.steps" :key="i" class="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
            <div class="bg-white/5 px-4 py-2.5 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-cyberYellow flex items-center justify-center text-xs font-extrabold text-black">{{ i + 1 }}</span>
              <h4 class="text-sm font-bold text-white">{{ step.title }}</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/5">
              <div class="p-4 space-y-2">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-cyberViolet flex items-center gap-1">🇮🇷 سرور ایران</span>
                  <span class="text-[11px] font-mono text-gray-400" dir="ltr">{{ stepGuide.iranIp }}</span>
                </div>
                <pre dir="ltr" class="text-xs font-mono text-gray-200 bg-black/60 p-3 rounded-xl whitespace-pre-wrap break-all border border-white/5 text-left leading-relaxed selection:bg-cyberViolet selection:text-white">{{ step.iranStep }}</pre>
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-cyberGreen flex items-center gap-1">🇪🇺 سرور خارج</span>
                  <span class="text-[11px] font-mono text-gray-400" dir="ltr">{{ stepGuide.kharejIp }}</span>
                </div>
                <pre dir="ltr" class="text-xs font-mono text-gray-200 bg-black/60 p-3 rounded-xl whitespace-pre-wrap break-all border border-white/5 text-left leading-relaxed selection:bg-cyberGreen selection:text-white">{{ step.kharejStep }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Output Generated Bash Scripts (LTR Fixed) -->
    <div v-if="generated" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Iran Server Script -->
      <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <span>🇮🇷</span> اسکریپت کامل اجرا روی سرور ایران
          </h4>
          <button 
            @click="copyText(iranScript)"
            class="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-cyberCyan transition-all"
          >
            کپی اسکریپت
          </button>
        </div>
        <pre dir="ltr" class="bg-black/60 p-4 rounded-2xl text-xs font-mono text-cyberGreen overflow-x-auto border border-white/5 max-h-96 text-left leading-relaxed">{{ iranScript }}</pre>
      </div>

      <!-- Kharej Server Script -->
      <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <span>🇪🇺</span> اسکریپت کامل اجرا روی سرور خارج
          </h4>
          <button 
            @click="copyText(kharejScript)"
            class="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-cyberCyan transition-all"
          >
            کپی اسکریپت
          </button>
        </div>
        <pre dir="ltr" class="bg-black/60 p-4 rounded-2xl text-xs font-mono text-cyberCyan overflow-x-auto border border-white/5 max-h-96 text-left leading-relaxed">{{ kharejScript }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { Zap, Copy, Check, Terminal, FileText, ArrowLeftRight, Code, BookOpen } from 'lucide-vue-next';
import { copyToClipboard } from '../utils/clipboard';
import { t } from '../i18n';

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const params = ref({
  iranIp: '',
  kharejIp: '185.100.100.1',
  tunnelPort: 8443,
  targetInboundPort: 443,
  secret: 'NyxSecretKey123',
  tunnelType: 'GOST',
  whiteDnsServer: '178.22.122.100',
  whiteDomain: 'tunnel.nyx.ir'
});

const generated = ref(false);
const iranScript = ref('');
const kharejScript = ref('');
const stepGuide = ref<any>(null);

async function generateScripts() {
  try {
    const res = await axios.post('/api/nodes/tunnel-script', params.value);
    iranScript.value = res.data.iranScript;
    kharejScript.value = res.data.kharejScript;
    stepGuide.value = res.data.stepGuide;
    generated.value = true;
    props.toast?.('اسکریپت‌های اتوماتیک تونل با موفقیت تولید شدند', 'success');
  } catch (err) {
    props.toast?.('خطا در دریافت اطلاعات اسکریپت تونل', 'error');
  }
}

function copyText(text: string) {
  copyToClipboard(text);
  props.toast?.('اسکریپت در حافظه کپی شد.', 'success');
}
</script>