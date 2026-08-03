<template>
  <div class="space-y-6">
    <div class="glass-panel p-6 rounded-3xl border border-cyberViolet/30 relative overflow-hidden">
      <div class="flex items-center gap-3 mb-2">
        <Zap class="w-6 h-6 text-cyberViolet" />
        <h2 class="text-xl font-bold text-white">ژنراتور تونل‌های پیشرفته ضد قطعی اینترنت بین‌الملل</h2>
      </div>
      <p class="text-xs text-gray-300">
        در زمان قطعی کامل اینترنت بین‌الملل و فعال‌شدن شبکه ملی اطلاعات، از متدهای انکریپت‌شده Gost، Rathole، **ICMP Ping Tunnel** یا **White DNS Tunnel** برای اتصال سرور ایران به خارج استفاده کنید.
      </p>
    </div>

    <!-- Generator Input Form -->
    <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
      <h3 class="text-base font-bold text-white">پیکربندی متد تونل‌زنی</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">انتخاب متد تونل‌زنی</label>
          <select 
            v-model="params.tunnelType"
            class="w-full bg-darkBg border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
          >
            <option value="GOST">🔒 Gost v3 (Encrypted WebSocket Tunnel)</option>
            <option value="ICMP_TUNNEL">⚡ ICMP Ping Tunnel (عبور از قطع پورت‌های TCP/UDP)</option>
            <option value="WHITE_DNS_TUNNEL">📡 White DNS Tunnel (عبور از طریق دی‌ان‌اس‌های سفید)</option>
            <option value="RATHOLE">🐀 Rathole (سبک و با پایداری بالا)</option>
            <option value="IPV6_RELAY">🌐 IPv6 Intranet Relay (مستقیم)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1">آدرس IP سرور خارج (Kharej IP)</label>
          <input 
            v-model="params.kharejIp"
            type="text" 
            placeholder="185.x.x.x"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1">پورت تونل (Tunnel Listener Port)</label>
          <input 
            v-model="params.tunnelPort"
            type="number" 
            placeholder="8443"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1">پورت هدف Xray (Target Inbound Port)</label>
          <input 
            v-model="params.targetInboundPort"
            type="number" 
            placeholder="443"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
          />
        </div>
      </div>

      <!-- Additional Options for DNS Tunnel -->
      <div v-if="params.tunnelType === 'WHITE_DNS_TUNNEL'" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
        <div>
          <label class="block text-xs text-gray-400 mb-1">آدرس DNS سفید (White Resolver IP)</label>
          <input 
            v-model="params.whiteDnsServer"
            type="text" 
            placeholder="178.22.122.100"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">دامنه اختصاصی دی‌ان‌اس (Domain Subdomain)</label>
          <input 
            v-model="params.whiteDomain"
            type="text" 
            placeholder="tunnel.nyx.ir"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
          />
        </div>
      </div>

      <div class="flex items-center justify-end">
        <button 
          @click="generateScripts"
          class="px-6 py-2.5 rounded-2xl bg-cyberViolet text-white font-semibold text-xs shadow-lg shadow-cyberViolet/30 hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Code class="w-4 h-4" />
          تولید اسکریپت اتوماتیک متد انتخابی
        </button>
      </div>
    </div>

    <!-- Output Generated Bash Scripts -->
    <div v-if="generated" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Iran Server Script -->
      <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <span>🇮🇷</span> دستور اجرا روی سرور ایران (Iran Relay)
          </h4>
          <button 
            @click="copyText(iranScript)"
            class="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-cyberCyan"
          >
            کپی اسکریپت
          </button>
        </div>
        <pre class="bg-black/50 p-4 rounded-2xl text-xs font-mono text-cyberGreen overflow-x-auto border border-white/5 max-h-96">{{ iranScript }}</pre>
      </div>

      <!-- Kharej Server Script -->
      <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <span>🇪🇺</span> دستور اجرا روی سرور خارج (Kharej Node)
          </h4>
          <button 
            @click="copyText(kharejScript)"
            class="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-cyberCyan"
          >
            کپی اسکریپت
          </button>
        </div>
        <pre class="bg-black/50 p-4 rounded-2xl text-xs font-mono text-cyberCyan overflow-x-auto border border-white/5 max-h-96">{{ kharejScript }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { Zap, Code } from 'lucide-vue-next';

const params = ref({
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

async function generateScripts() {
  try {
    const res = await axios.post('/api/nodes/tunnel-script', params.value);
    iranScript.value = res.data.iranScript;
    kharejScript.value = res.data.kharejScript;
    generated.value = true;
  } catch (err) {
    alert('خطا در تولید اسکریپت تونل');
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  alert('اسکریپت با موفقیت کپی شد!');
}
</script>
