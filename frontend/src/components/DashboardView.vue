<template>
  <div class="space-y-6">
    <!-- Top Banner & Server Health Overview -->
    <div class="glass-panel rounded-3xl p-6 relative overflow-hidden border border-cyberYellow/40">
      <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-cyberYellow/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h2 class="text-2xl font-extrabold text-cyberYellow glow-yellow mb-1 flex items-center gap-2">
            <span>{{ t('dashboardTitle') }}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/40 animate-pulse font-normal">Live</span>
          </h2>
          <p class="text-sm text-gray-300">{{ t('dashboardSub') }}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyberYellow/30 text-xs flex items-center gap-2">
            <span class="text-gray-400">{{ t('serverIp') }}:</span>
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
            {{ t('cpuLoad') }}
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
            {{ t('ramUsage') }}
          </span>
          <span class="text-xs font-mono font-bold text-white">{{ stats.systemHealth.ramPercent }}%</span>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs font-mono text-gray-300" dir="ltr">{{ stats.systemHealth.ramUsageGb }}</span>
          <span class="text-[10px] text-cyberGreen font-bold">{{ t('stable') }}</span>
        </div>
      </div>

      <!-- Live Ping & Latency -->
      <div class="glass-card p-5 rounded-2xl border border-cyberYellow/30">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Activity class="w-4 h-4 text-cyberGreen" />
            {{ t('networkPing') }}
          </span>
          <span class="text-xs font-mono font-extrabold text-cyberGreen" dir="ltr">{{ stats.systemHealth.pingMs }} ms</span>
        </div>
        <div class="flex items-center justify-between mt-2 text-xs">
          <span class="text-gray-400">{{ t('instantSpeed') }}:</span>
          <span class="font-mono text-cyberYellow font-bold" dir="ltr">{{ stats.systemHealth.networkSpeedMb }} MB/s</span>
        </div>
      </div>

      <!-- Server Uptime -->
      <div class="glass-card p-5 rounded-2xl border border-cyberYellow/30">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Clock class="w-4 h-4 text-cyberYellow" />
            {{ t('serverUptime') }}
          </span>
          <span class="text-xs font-bold text-cyberYellow">{{ stats.systemHealth.uptimeText }}</span>
        </div>
        <div class="flex items-center justify-between mt-2 text-xs">
          <span class="text-gray-400">{{ t('networkStability') }}:</span>
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
          <p class="text-xs text-gray-400 font-medium">{{ t('totalUsers') }}</p>
          <h3 class="text-2xl font-extrabold text-white mt-1">{{ stats.totalUsers }}</h3>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl flex items-center gap-4 border border-cyberYellow/30">
        <div class="w-12 h-12 rounded-xl bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 flex items-center justify-center">
          <CheckCircle class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">{{ t('activeUsers') }}</p>
          <h3 class="text-2xl font-extrabold text-white mt-1">{{ stats.activeUsers }}</h3>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl flex items-center gap-4 border border-cyberRed/30">
        <div class="w-12 h-12 rounded-xl bg-cyberRed/20 text-cyberRed border border-cyberRed/30 flex items-center justify-center">
          <Activity class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">{{ t('totalTraffic') }}</p>
          <h3 class="text-2xl font-extrabold text-white mt-1">{{ stats.totalTransferredGb }} GB</h3>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl flex items-center gap-4 border border-cyberYellow/30">
        <div class="w-12 h-12 rounded-xl bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 flex items-center justify-center">
          <Server class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">{{ t('nodesAndServers') }}</p>
          <h3 class="text-2xl font-extrabold text-white mt-1">{{ stats.totalNodes }} {{ t('nodesCount') }}</h3>
        </div>
      </div>
    </div>

    <!-- Detailed Protocols Status Matrix -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="glass-panel p-6 rounded-3xl lg:col-span-2 space-y-4 border border-cyberYellow/30">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 class="text-lg font-extrabold text-cyberYellow glow-yellow flex items-center gap-2">
              <ShieldAlert class="w-5 h-5 text-cyberYellow" />
              {{ t('protoMatrixTitle') }}
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ t('protoMatrixSub') }}</p>
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
                  <span class="text-[10px] bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 px-2 py-0.5 rounded-md">{{ t('mainProtocol') }}</span>
                </h4>
              </div>
              <span class="px-3 py-1 text-xs rounded-full bg-cyberGreen/20 text-cyberGreen font-extrabold border border-cyberGreen/30">
                🟢 {{ t('activeStatus') }}
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-6">
              {{ t('vlessRealityDesc') }}
            </p>
            <div class="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pr-6 pt-1 border-t border-white/5">
              <span>⚡ {{ t('avgLatency') }}: <strong class="text-cyberYellow font-mono" dir="ltr">16 ms</strong></span>
              <span>🔒 {{ t('sslStatus') }}: <strong class="text-cyberGreen">{{ t('domainlessReality') }}</strong></span>
              <span>📱 {{ t('operatorSupport') }}: <strong class="text-white">{{ t('allOperators') }}</strong></span>
            </div>
          </div>

          <!-- Packet Fragment Engine -->
          <div class="p-4 rounded-2xl bg-white/5 border border-cyberYellow/20 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-cyberGreen shadow-sm shadow-cyberGreen"></span>
                <h4 class="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Xray Packet Fragment</span>
                  <span class="text-[10px] bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 px-2 py-0.5 rounded-md">Fragment</span>
                </h4>
              </div>
              <span class="px-3 py-1 text-xs rounded-full bg-cyberGreen/20 text-cyberGreen font-extrabold border border-cyberGreen/30">
                ⚡ Packet Fragment (100-200 Bytes)
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-6">
              {{ t('fragmentDesc') }}
            </p>
            <div class="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pr-6 pt-1 border-t border-white/5">
              <span>🎯 {{ t('packetSize') }}: <strong class="text-cyberYellow font-mono" dir="ltr">100-200 Bytes</strong></span>
              <span>📊 {{ t('deliveryRate') }}: <strong class="text-cyberGreen font-mono">99.9%</strong></span>
              <span>🛡️ {{ t('dpiBypass') }}: <strong class="text-cyberYellow">{{ t('activeStatus') }}</strong></span>
            </div>
          </div>

          <!-- Gost v3 Intranet Tunnel -->
          <div class="p-4 rounded-2xl bg-white/5 border border-cyberYellow/20 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-cyberYellow shadow-sm shadow-cyberYellow"></span>
                <h4 class="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Gost v3 Intranet Tunnel</span>
                  <span class="text-[10px] bg-cyberRed/20 text-cyberRed border border-cyberRed/30 px-2 py-0.5 rounded-md">{{ t('dedicatedTunnel') }}</span>
                </h4>
              </div>
              <span class="px-3 py-1 text-xs rounded-full bg-cyberYellow/20 text-cyberYellow font-extrabold border border-cyberYellow/30">
                🛡️ {{ t('readyBypass') }}
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-6">
              {{ t('gostTunnelDesc') }}
            </p>
            <div class="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pr-6 pt-1 border-t border-white/5">
              <span>🔗 {{ t('tunnelTypeLabel') }}: <strong class="text-cyberYellow font-mono">WebSocket TLS</strong></span>
              <span>📡 {{ t('nodeLinkStatus') }}: <strong class="text-cyberGreen">{{ t('readyEstablished') }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- SMART OPERATOR RECOMMENDATIONS & ISP MATRIX -->
      <div class="space-y-6">
        <div class="glass-panel p-6 rounded-3xl space-y-4 border border-cyberYellow/40">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 class="text-lg font-extrabold text-cyberYellow glow-yellow flex items-center gap-2">
              <Zap class="w-5 h-5 text-cyberYellow" />
              {{ t('ispMatrixTitle') }}
            </h3>
            <span class="text-[11px] text-gray-400 font-mono">ISP Matrix</span>
          </div>

          <div class="space-y-3.5 text-xs">
            <!-- MCI Operator Recommendation Card -->
            <div class="p-4 rounded-2xl bg-white/5 border border-cyberYellow/30 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-cyberYellow flex items-center gap-1.5 text-sm">
                  📱 {{ t('mciNetwork') }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 font-bold">
                  99.5% {{ t('stable') }}
                </span>
              </div>
              <p class="text-gray-300 leading-relaxed">
                {{ t('optimalSetup') }}: <strong class="text-white font-semibold">VLESS-REALITY + Packet Fragment</strong> Port 443.
              </p>
              <div class="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-gray-300 flex items-center justify-between" dir="ltr">
                <span>Fragment: 100-200, length 10-20</span>
                <button @click="copyText('length: 100-200, interval: 10-20', t('copied'))" class="text-cyberYellow hover:underline text-[10px]">{{ t('copy') }}</button>
              </div>
              <p class="text-[11px] text-gray-400">{{ t('suggestedSni') }}: <code class="text-cyberYellow">archive.ubuntu.com</code> / <code class="text-cyberYellow">pypi.org</code></p>
            </div>

            <!-- Irancell Operator Recommendation Card -->
            <div class="p-4 rounded-2xl bg-white/5 border border-cyberRed/30 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-cyberRed flex items-center gap-1.5 text-sm">
                  📡 {{ t('irancellNetwork') }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 font-bold">
                  99.2% {{ t('stable') }}
                </span>
              </div>
              <p class="text-gray-300 leading-relaxed">
                {{ t('optimalSetup') }}: <strong class="text-white font-semibold">REALITY (Chrome Fingerprint)</strong> / gRPC / WS.
              </p>
              <div class="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-gray-300 flex items-center justify-between" dir="ltr">
                <span>Fingerprint: chrome, Port: 2083 / 443</span>
                <button @click="copyText('ebanking.banksepah.ir', t('copied'))" class="text-cyberRed hover:underline text-[10px]">{{ t('copy') }} SNI</button>
              </div>
              <p class="text-[11px] text-gray-400">{{ t('suggestedSni') }}: <code class="text-cyberRed">ebanking.banksepah.ir</code> / <code class="text-cyberRed">download.microsoft.com</code></p>
            </div>

            <!-- Fixed Broadband ADSL / RightTel Card -->
            <div class="p-4 rounded-2xl bg-white/5 border border-cyberYellow/30 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-white flex items-center gap-1.5 text-sm">
                  🌐 {{ t('adslFiberNetwork') }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 font-bold">
                  100% {{ t('statusOnline') }}
                </span>
              </div>
              <p class="text-gray-300 leading-relaxed">
                {{ t('optimalSetup') }}: <strong class="text-white font-semibold">VLESS REALITY TCP / HTTP2</strong> (Port 8080 / 8443).
              </p>
            </div>

            <!-- National Internet Blackout Emergency Card -->
            <div class="p-4 rounded-2xl bg-cyberRed/10 border border-cyberRed/40 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-cyberRed flex items-center gap-1.5 text-sm">
                  🛡️ {{ t('intranetRelayTitle') }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 font-bold">
                  {{ t('relayTunnelBadge') }}
                </span>
              </div>
              <p class="text-gray-200 leading-relaxed">
                <strong class="text-cyberYellow">Gost WebSocket Encrypted Tunnel</strong> Relay Path.
              </p>
            </div>
          </div>
        </div>

        <!-- Live Activity Ticker -->
        <div class="glass-panel p-5 rounded-3xl space-y-3 border border-cyberYellow/30 text-xs">
          <h4 class="font-extrabold text-white flex items-center gap-2">
            <Terminal class="w-4 h-4 text-cyberYellow" />
            {{ t('liveActivityFeed') }}
          </h4>
          <div class="space-y-2 font-mono text-[11px]">
            <div class="flex items-center justify-between text-gray-400 bg-white/5 p-2 rounded-xl">
              <span>{{ t('autoTrafficSync') }}</span>
              <span class="text-cyberGreen font-bold">{{ t('successText') }}</span>
            </div>
            <div class="flex items-center justify-between text-gray-400 bg-white/5 p-2 rounded-xl">
              <span>{{ t('realityKeypair') }}</span>
              <span class="text-cyberYellow font-bold">{{ t('generatedText') }}</span>
            </div>
            <div class="flex items-center justify-between text-gray-400 bg-white/5 p-2 rounded-xl">
              <span>{{ t('botConnectionStatus') }}</span>
              <span class="text-cyberGreen font-bold">{{ t('activeStatus') }}</span>
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
import { copyToClipboard } from '../utils/clipboard';
import { t, currentLang } from '../i18n';

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
    uptimeText: currentLang.value === 'fa' ? 'آنلاین' : 'Online',
    xrayStatus: currentLang.value === 'fa' ? 'فعال و آنلاین (ONLINE 🟢)' : 'Active & Online (ONLINE 🟢)',
    pingMs: 18,
    networkSpeedMb: '5.2',
    bypassEfficiency: currentLang.value === 'fa' ? '۹۹.۸٪ باثبات' : '99.8% Stable'
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

function copyText(text: string, msg: string) {
  copyToClipboard(text);
  alert(msg);
}

onMounted(() => {
  fetchStats();
  timer = setInterval(fetchStats, 5000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
