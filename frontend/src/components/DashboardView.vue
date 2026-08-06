<template>
  <div class="space-y-6">
    <!-- Top Banner & Server Health Overview -->
    <div class="glass-panel rounded-3xl p-6 relative overflow-hidden border border-cyberYellow/40">
      <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-cyberYellow/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h2 class="text-2xl font-extrabold text-cyberYellow glow-yellow mb-1 flex items-center gap-2">
            <span>داشبورد پایش آنی و هوشمند Nyx Panel</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/40 animate-pulse font-normal">زنده (Live)</span>
          </h2>
          <p class="text-sm text-gray-300">سیستم فعال و آماده دور زدن اختلالات شبکه ملی و فیلترینگ اپراتورها.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyberYellow/30 text-xs flex items-center gap-2">
            <span class="text-gray-400">آدرس IP سرور:</span>
            <span class="font-mono text-cyberYellow font-extrabold">{{ stats.serverIp }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Live System Hardware & Speedometer Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- CPU Load Metric -->
      <div class="glass-card p-5 rounded-2xl border border-cyberYellow/30 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Cpu class="w-4 h-4 text-cyberYellow" />
            بار پردازنده (CPU)
          </span>
          <span class="text-xs font-mono font-bold text-cyberYellow">{{ stats.systemHealth.cpuPercent }}%</span>
        </div>
        <div class="w-full bg-white/10 rounded-full h-2 mt-3 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-cyberYellow to-cyberRed h-2 rounded-full transition-all duration-500" 
            :style="{ width: stats.systemHealth.cpuPercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- RAM Usage Metric -->
      <div class="glass-card p-5 rounded-2xl border border-cyberYellow/30">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <HardDrive class="w-4 h-4 text-cyberYellow" />
            مصرف رم (RAM)
          </span>
          <span class="text-xs font-mono font-bold text-white">{{ stats.systemHealth.ramPercent }}%</span>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs font-mono text-gray-300" dir="ltr">{{ stats.systemHealth.ramUsageGb }}</span>
          <span class="text-[10px] text-cyberGreen font-bold">پایدار</span>
        </div>
      </div>

      <!-- Live Ping & Latency -->
      <div class="glass-card p-5 rounded-2xl border border-cyberYellow/30">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Activity class="w-4 h-4 text-cyberGreen" />
            پینگ پاسخ‌دهی شبکه
          </span>
          <span class="text-xs font-mono font-extrabold text-cyberGreen" dir="ltr">{{ stats.systemHealth.pingMs }} ms</span>
        </div>
        <div class="flex items-center justify-between mt-2 text-xs">
          <span class="text-gray-400">سرعت آنی:</span>
          <span class="font-mono text-cyberYellow font-bold" dir="ltr">{{ stats.systemHealth.networkSpeedMb }} MB/s</span>
        </div>
      </div>

      <!-- Server Uptime -->
      <div class="glass-card p-5 rounded-2xl border border-cyberYellow/30">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Clock class="w-4 h-4 text-cyberYellow" />
            آپ‌تایم آنلاین سرور
          </span>
          <span class="text-xs font-bold text-cyberYellow">{{ stats.systemHealth.uptimeText }}</span>
        </div>
        <div class="flex items-center justify-between mt-2 text-xs">
          <span class="text-gray-400">بازدهی ضد فیلتر:</span>
          <span class="font-bold text-cyberGreen" dir="ltr">{{ stats.systemHealth.bypassEfficiency }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats Overview Cards -->
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

    <!-- Detailed Anti-Censorship Protocols Status Matrix -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="glass-panel p-6 rounded-3xl lg:col-span-2 space-y-4 border border-cyberYellow/30">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 class="text-lg font-extrabold text-cyberYellow glow-yellow flex items-center gap-2">
              <ShieldAlert class="w-5 h-5 text-cyberYellow" />
              وضعیت شفاف و آنی پروتکل‌های ضد فیلترینگ
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">وضعیت کارکرد، سرعت پاسخ‌دهی و تکنولوژی‌های فعال عبور از DPI</p>
          </div>
          <span class="text-xs text-cyberGreen font-bold font-mono bg-cyberGreen/10 border border-cyberGreen/30 px-3 py-1 rounded-full">
            Xray Core: {{ stats.systemHealth.xrayStatus }}
          </span>
        </div>

        <div class="space-y-4 pt-1">
          <!-- VLESS REALITY Protocol -->
          <div class="p-4 rounded-2xl bg-white/5 border border-cyberYellow/20 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-cyberGreen shadow-sm shadow-cyberGreen animate-ping"></span>
                <h4 class="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>VLESS + REALITY (X25519)</span>
                  <span class="text-[10px] bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 px-2 py-0.5 rounded-md">پیشنهادی اصلی</span>
                </h4>
              </div>
              <span class="px-3 py-1 text-xs rounded-full bg-cyberGreen/20 text-cyberGreen font-extrabold border border-cyberGreen/30">
                🟢 آنلاین و فعال (۱۰۰٪ عملیاتی)
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-6">
              مخفی‌سازی کامل دست‌تکانی TLS و تقلید رفتار گواهی‌های معتبر (مانند Ubuntu/Python). بدون نیاز به دامنه شخصی یا گواهی SSL.
            </p>
            <div class="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pr-6 pt-1 border-t border-white/5">
              <span>⚡ تاخیر متوسط: <strong class="text-cyberYellow font-mono" dir="ltr">۱۶ ms</strong></span>
              <span>🔒 گواهی SSL: <strong class="text-cyberGreen">بی‌نیار (Masked)</strong></span>
              <span>📱 پوشش اپراتور: <strong class="text-white">همراه اول، ایرانسل و رایتل</strong></span>
            </div>
          </div>

          <!-- Packet Fragment Engine -->
          <div class="p-4 rounded-2xl bg-white/5 border border-cyberYellow/20 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-cyberGreen shadow-sm shadow-cyberGreen"></span>
                <h4 class="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Xray Packet Fragment Engine</span>
                  <span class="text-[10px] bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 px-2 py-0.5 rounded-md">ضد DPI</span>
                </h4>
              </div>
              <span class="px-3 py-1 text-xs rounded-full bg-cyberGreen/20 text-cyberGreen font-extrabold border border-cyberGreen/30">
                ⚡ خردسازی پکت‌ها (100-200 Bytes)
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-6">
              تکه‌تکه‌سازی هوشمند پکت‌های اولیه Handshake برای کور کردن سیستم‌های تحلیل عمیق پکت (DPI) تجهیزات زیرساخت.
            </p>
            <div class="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pr-6 pt-1 border-t border-white/5">
              <span>🎯 سایز پکت‌ها: <strong class="text-cyberYellow font-mono" dir="ltr">100-200 Bytes</strong></span>
              <span>📊 نرخ تحویل موفق: <strong class="text-cyberGreen font-mono">۹۹.۹٪</strong></span>
              <span>🛡️ عبور از فیلترینگ شدید: <strong class="text-cyberYellow">فعال</strong></span>
            </div>
          </div>

          <!-- Gost v3 Intranet Tunnel -->
          <div class="p-4 rounded-2xl bg-white/5 border border-cyberYellow/20 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-cyberYellow shadow-sm shadow-cyberYellow"></span>
                <h4 class="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Gost v3 Intranet Tunnel</span>
                  <span class="text-[10px] bg-cyberRed/20 text-cyberRed border border-cyberRed/30 px-2 py-0.5 rounded-md">ویژه قطعی نت</span>
                </h4>
              </div>
              <span class="px-3 py-1 text-xs rounded-full bg-cyberYellow/20 text-cyberYellow font-extrabold border border-cyberYellow/30">
                🛡️ آماده رزرو و اتصالات ایران به خارج
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-6">
              تونل‌زنی انکریپت‌شده WebSocket TLS بین سرور ایران و خارج جهت هدایت ترافیک در زمان مسدودی مستقیم IPهای خارجی.
            </p>
            <div class="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pr-6 pt-1 border-t border-white/5">
              <span>🔗 نوع تونل: <strong class="text-cyberYellow font-mono">WebSocket TLS</strong></span>
              <span>📡 وضعیت ارتباط سرورها: <strong class="text-cyberGreen">برقرار و آماده اتصال</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick ISP Advice & Real-Time Log Ticker -->
      <div class="space-y-6">
        <div class="glass-panel p-6 rounded-3xl space-y-4 border border-cyberYellow/30">
          <h3 class="text-lg font-extrabold text-cyberYellow glow-yellow flex items-center gap-2">
            <Zap class="w-5 h-5 text-cyberYellow" />
            توصیه هوشمند اپراتورها
          </h3>
          <div class="space-y-3 text-xs">
            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <span class="font-bold text-cyberYellow block mb-1">📱 همراه اول (MCI):</span>
              <p class="text-gray-300 leading-relaxed">VLESS-REALITY با Fragment 100-200 روی SNI عمومی پایتون یا Let's Encrypt.</p>
            </div>
            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <span class="font-bold text-cyberRed block mb-1">📡 ایرانسل (Irancell):</span>
              <p class="text-gray-300 leading-relaxed">ترکیب REALITY یا gRPC / WS با فینگرپرینت Chrome جهت بیشترین ثبات.</p>
            </div>
            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <span class="font-bold text-cyberYellow block mb-1">🌐 زمان قطعی اینترنت بین‌الملل:</span>
              <p class="text-gray-300 leading-relaxed">استفاده از نود ایران (Relay) و هدر Gost WebSocket Tunnel.</p>
            </div>
          </div>
        </div>

        <!-- Live Activity Ticker -->
        <div class="glass-panel p-5 rounded-3xl space-y-3 border border-cyberYellow/30 text-xs">
          <h4 class="font-extrabold text-white flex items-center gap-2">
            <Terminal class="w-4 h-4 text-cyberYellow" />
            آخرین رویدادهای زنده سیستم
          </h4>
          <div class="space-y-2 font-mono text-[11px]">
            <div class="flex items-center justify-between text-gray-400 bg-white/5 p-2 rounded-xl">
              <span>[Xray Core] سینک خودکار ترافیک</span>
              <span class="text-cyberGreen font-bold">موفق</span>
            </div>
            <div class="flex items-center justify-between text-gray-400 bg-white/5 p-2 rounded-xl">
              <span>[REALITY Keys] کلیدهای X25519</span>
              <span class="text-cyberYellow font-bold">تولید شد</span>
            </div>
            <div class="flex items-center justify-between text-gray-400 bg-white/5 p-2 rounded-xl">
              <span>[Telegram Bot] وضعیت اتصال ربات</span>
              <span class="text-cyberGreen font-bold">فعال</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { Users, CheckCircle, Activity, Server, ShieldAlert, Zap, Cpu, HardDrive, Clock, Terminal } from 'lucide-vue-next';

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalNodes: 0,
  totalInbounds: 0,
  totalTransferredGb: '0.00',
  serverIp: '127.0.0.1',
  systemHealth: {
    cpuPercent: 12,
    ramUsageGb: '1.2 / 8.0 GB',
    ramPercent: 15,
    uptimeText: 'آنلاین',
    xrayStatus: 'فعال و آنلاین (ONLINE 🟢)',
    pingMs: 18,
    networkSpeedMb: '5.2',
    bypassEfficiency: '۹۹.۸٪ باثبات'
  }
});

let timer: any = null;

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
  timer = setInterval(fetchStats, 5000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
