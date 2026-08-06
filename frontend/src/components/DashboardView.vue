<template>
  <div class="space-y-6">
    <!-- Top Banner -->
    <div class="glass-panel rounded-3xl p-6 relative overflow-hidden border border-cyberYellow/40">
      <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-cyberYellow/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h2 class="text-2xl font-extrabold text-cyberYellow glow-yellow mb-1">خوش آمدید به Nyx Panel</h2>
          <p class="text-sm text-gray-300">سیستم فعال و آماده مدیریت اتصالات شبکه.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyberYellow/30 text-xs flex items-center gap-2">
            <span class="text-gray-400">IP سرور شما:</span>
            <span class="font-mono text-cyberYellow font-bold">{{ stats.serverIp }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="glass-card p-5 rounded-2xl flex items-center gap-4 border border-cyberYellow/30">
        <div class="w-12 h-12 rounded-xl bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 flex items-center justify-center">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">کل کاربران</p>
          <h3 class="text-2xl font-extrabold text-white mt-1">{{ stats.totalUsers }}</h3>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl flex items-center gap-4 border border-cyberYellow/30">
        <div class="w-12 h-12 rounded-xl bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 flex items-center justify-center">
          <CheckCircle class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">کاربران فعال</p>
          <h3 class="text-2xl font-extrabold text-white mt-1">{{ stats.activeUsers }}</h3>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl flex items-center gap-4 border border-cyberRed/30">
        <div class="w-12 h-12 rounded-xl bg-cyberRed/20 text-cyberRed border border-cyberRed/30 flex items-center justify-center">
          <Activity class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">ترافیک کل تبادل شده</p>
          <h3 class="text-2xl font-extrabold text-white mt-1">{{ stats.totalTransferredGb }} GB</h3>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl flex items-center gap-4 border border-cyberYellow/30">
        <div class="w-12 h-12 rounded-xl bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 flex items-center justify-center">
          <Server class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">نودها و سرورها</p>
          <h3 class="text-2xl font-extrabold text-white mt-1">{{ stats.totalNodes }} نود</h3>
        </div>
      </div>
    </div>

    <!-- Anti-Censorship Health Matrix -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="glass-panel p-6 rounded-3xl lg:col-span-2 space-y-4 border border-white/10">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert class="w-5 h-5 text-cyberCyan" />
          وضعیت پروتکل‌های ضد فیلترینگ Nyx Panel
        </h3>
        <p class="text-xs text-gray-400">تنظیمات فعال برای عبور از DPI و فیلترینگ شدید اپراتورهای ایران</p>

        <div class="space-y-3 pt-2">
          <div class="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-cyberGreen"></div>
              <div>
                <h4 class="text-sm font-semibold text-white">VLESS + REALITY</h4>
                <p class="text-xs text-gray-400">مخفی‌سازی Handshake و بدون نیاز به گواهی SSL</p>
              </div>
            </div>
            <span class="px-3 py-1 text-xs rounded-full bg-cyberGreen/20 text-cyberGreen font-medium">فعال و عملیاتی</span>
          </div>

          <div class="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-cyberGreen"></div>
              <div>
                <h4 class="text-sm font-semibold text-white">Xray Packet Fragment</h4>
                <p class="text-xs text-gray-400">تکه‌تکه‌سازی پکت‌ها برای دور زدن سیستم تحلیل DPI همراه اول و ایرانسل</p>
              </div>
            </div>
            <span class="px-3 py-1 text-xs rounded-full bg-cyberGreen/20 text-cyberGreen font-medium">پیکربندی شده</span>
          </div>

          <div class="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-cyberViolet"></div>
              <div>
                <h4 class="text-sm font-semibold text-white">Gost v3 Intranet Tunnel</h4>
                <p class="text-xs text-gray-400">تونل‌زنی اختصاصی ایران به خارج برای شرایط قطعی اینترنت بین‌الملل</p>
              </div>
            </div>
            <span class="px-3 py-1 text-xs rounded-full bg-cyberViolet/20 text-cyberViolet font-medium">آماده اتصال</span>
          </div>
        </div>
      </div>

      <!-- Quick ISP Advice -->
      <div class="glass-panel p-6 rounded-3xl space-y-4 border border-white/10">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <Zap class="w-5 h-5 text-cyberViolet" />
          توصیه هوشمند اپراتورها
        </h3>
        <div class="space-y-3 text-xs">
          <div class="p-3 rounded-xl bg-white/5 border border-white/5">
            <span class="font-bold text-cyberPink">همراه اول (MCI):</span>
            <p class="text-gray-300 mt-1">استفاده از VLESS-REALITY + Fragment 100-200 با SNI عمومی.</p>
          </div>
          <div class="p-3 rounded-xl bg-white/5 border border-white/5">
            <span class="font-bold text-cyberCyan">ایرانسل (Irancell):</span>
            <p class="text-gray-300 mt-1">ترکیب VLESS + gRPC / WS یا REALITY با فینگرپرینت Chrome.</p>
          </div>
          <div class="p-3 rounded-xl bg-white/5 border border-white/5">
            <span class="font-bold text-cyberGreen">زمان قطعی اینترنت بین‌الملل:</span>
            <p class="text-gray-300 mt-1">استفاده از نود ایران (Relay) و فیلد Gost Tunnel.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Users, CheckCircle, Activity, Server, ShieldAlert, Zap } from 'lucide-vue-next';

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalNodes: 0,
  totalInbounds: 0,
  totalTransferredGb: '0.00',
  serverIp: '127.0.0.1'
});

async function fetchStats() {
  try {
    const res = await axios.get('/api/stats/dashboard');
    stats.value = res.data;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

onMounted(() => {
  fetchStats();
});
</script>
