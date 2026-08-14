<template>
  <div class="space-y-6">
    <!-- Top Banner & Server Health Overview -->
    <div class="glass-panel rounded-3xl p-5 sm:p-6 relative overflow-hidden border border-white/[0.08] bg-gradient-to-r from-amber-500/[0.03] via-white/[0.02] to-indigo-500/[0.03]">
      <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-400 mb-1 flex items-center gap-2">
            <span>{{ t('dashboardTitle') }}</span>
            <span class="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">Live</span>
          </h2>
          <p class="text-xs sm:text-sm text-gray-400 leading-relaxed">{{ t('dashboardSub') }}</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/[0.08] text-xs flex items-center gap-2">
            <span class="text-gray-400">{{ t('serverIp') }}:</span>
            <span class="font-mono text-amber-300 font-bold">{{ stats.serverIp }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Live System Hardware & Speedometer Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      <!-- CPU Load Metric -->
      <div class="glass-card p-4 sm:p-5 rounded-2xl border border-white/[0.06] relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Cpu class="w-4 h-4 text-amber-400" />
            {{ t('cpuLoad') }}
          </span>
          <span class="text-xs font-mono font-bold text-amber-300">{{ stats.systemHealth.cpuPercent }}%</span>
        </div>
        <div class="w-full bg-white/[0.06] rounded-full h-1.5 mt-3 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full transition-all duration-500" 
            :style="{ width: stats.systemHealth.cpuPercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- RAM Usage Metric -->
      <div class="glass-card p-4 sm:p-5 rounded-2xl border border-white/[0.06]">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <HardDrive class="w-4 h-4 text-amber-400" />
            {{ t('ramUsage') }}
          </span>
          <span class="text-xs font-mono font-bold text-gray-200">{{ stats.systemHealth.ramPercent }}%</span>
        </div>
        <div class="flex items-center justify-between mt-2.5">
          <span class="text-xs font-mono text-gray-400" dir="ltr">{{ stats.systemHealth.ramUsageGb }}</span>
          <span class="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{{ t('stable') }}</span>
        </div>
      </div>

      <!-- Live Ping & Latency -->
      <div class="glass-card p-4 sm:p-5 rounded-2xl border border-white/[0.06]">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Activity class="w-4 h-4 text-emerald-400" />
            {{ t('networkPing') }}
          </span>
          <span class="text-xs font-mono font-extrabold text-emerald-400" dir="ltr">{{ stats.systemHealth.pingMs }} ms</span>
        </div>
        <div class="flex items-center justify-between mt-2.5 text-xs">
          <span class="text-gray-400">{{ t('instantSpeed') }}:</span>
          <span class="font-mono text-amber-300 font-bold" dir="ltr">{{ stats.systemHealth.networkSpeedMb }} MB/s</span>
        </div>
      </div>

      <!-- Server Uptime -->
      <div class="glass-card p-4 sm:p-5 rounded-2xl border border-white/[0.06]">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Clock class="w-4 h-4 text-amber-400" />
            {{ t('serverUptime') }}
          </span>
          <span class="text-xs font-bold text-amber-300">{{ stats.systemHealth.uptimeText }}</span>
        </div>
        <div class="flex items-center justify-between mt-2.5 text-xs">
          <span class="text-gray-400">{{ t('networkStability') }}:</span>
          <span class="font-bold text-emerald-400" dir="ltr">{{ stats.systemHealth.bypassEfficiency }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats Overview Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      <div class="glass-card p-4 sm:p-5 rounded-2xl flex items-center gap-4 border border-white/[0.06]">
        <div class="w-11 h-11 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">{{ t('totalUsers') }}</p>
          <h3 class="text-xl sm:text-2xl font-extrabold text-white mt-0.5">{{ stats.totalUsers }}</h3>
        </div>
      </div>

      <div class="glass-card p-4 sm:p-5 rounded-2xl flex items-center gap-4 border border-white/[0.06]">
        <div class="w-11 h-11 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 flex items-center justify-center shrink-0">
          <CheckCircle class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">{{ t('activeUsers') }}</p>
          <h3 class="text-xl sm:text-2xl font-extrabold text-white mt-0.5">{{ stats.activeUsers }}</h3>
        </div>
      </div>

      <div class="glass-card p-4 sm:p-5 rounded-2xl flex items-center gap-4 border border-white/[0.06]">
        <div class="w-11 h-11 rounded-xl bg-rose-400/10 text-rose-400 border border-rose-400/20 flex items-center justify-center shrink-0">
          <Activity class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">{{ t('totalTraffic') }}</p>
          <h3 class="text-xl sm:text-2xl font-extrabold text-white mt-0.5">{{ stats.totalTransferredGb }} GB</h3>
        </div>
      </div>

      <div class="glass-card p-4 sm:p-5 rounded-2xl flex items-center gap-4 border border-white/[0.06]">
        <div class="w-11 h-11 rounded-xl bg-indigo-400/10 text-indigo-400 border border-indigo-400/20 flex items-center justify-center shrink-0">
          <Server class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">{{ t('nodesAndServers') }}</p>
          <h3 class="text-xl sm:text-2xl font-extrabold text-white mt-0.5">{{ stats.totalNodes }} {{ t('nodesCount') }}</h3>
        </div>
      </div>
    </div>

    <!-- Detailed Protocols Status Matrix -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
      <div class="glass-panel p-5 sm:p-6 rounded-3xl lg:col-span-2 space-y-4 border border-white/[0.08]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3.5">
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <ShieldAlert class="w-5 h-5 text-amber-400" />
              <span>{{ t('protoMatrixTitle') }}</span>
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ t('protoMatrixSub') }}</p>
          </div>
          <span class="text-xs text-emerald-300 font-bold font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shrink-0">
            Xray Core: {{ stats.systemHealth.xrayStatus }}
          </span>
        </div>

        <div class="space-y-3.5 pt-1">
          <!-- VLESS REALITY Protocol -->
          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-400/25 transition-all space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h4 class="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
                  <span>VLESS + REALITY (X25519)</span>
                  <span class="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-md">{{ t('mainProtocol') }}</span>
                </h4>
              </div>
              <span class="px-2.5 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                {{ t('activeStatus') }}
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-5">
              {{ t('vlessRealityDesc') }}
            </p>
            <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-gray-400 pr-5 pt-1.5 border-t border-white/[0.04]">
              <span>⚡ {{ t('avgLatency') }}: <strong class="text-amber-300 font-mono" dir="ltr">16 ms</strong></span>
              <span>🔒 {{ t('sslStatus') }}: <strong class="text-emerald-400">{{ t('domainlessReality') }}</strong></span>
              <span>📱 {{ t('operatorSupport') }}: <strong class="text-gray-200">{{ t('allOperators') }}</strong></span>
            </div>
          </div>

          <!-- Packet Fragment Engine -->
          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-400/25 transition-all space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h4 class="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
                  <span>Xray Packet Fragment</span>
                  <span class="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/25 px-2 py-0.5 rounded-md">Fragment</span>
                </h4>
              </div>
              <span class="px-2.5 py-0.5 text-xs rounded-full bg-amber-400/10 text-amber-300 font-bold border border-amber-400/20">
                100-200 Bytes
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-5">
              {{ t('fragmentDesc') }}
            </p>
            <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-gray-400 pr-5 pt-1.5 border-t border-white/[0.04]">
              <span>🎯 {{ t('packetSize') }}: <strong class="text-amber-300 font-mono" dir="ltr">100-200 Bytes</strong></span>
              <span>📊 {{ t('deliveryRate') }}: <strong class="text-emerald-400 font-mono">99.9%</strong></span>
              <span>🛡️ {{ t('dpiBypass') }}: <strong class="text-amber-300">{{ t('activeStatus') }}</strong></span>
            </div>
          </div>

          <!-- Gost v3 Intranet Tunnel -->
          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-400/25 transition-all space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                <h4 class="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
                  <span>Gost v3 Intranet Tunnel</span>
                  <span class="text-[10px] bg-indigo-400/15 text-indigo-300 border border-indigo-400/25 px-2 py-0.5 rounded-md">{{ t('dedicatedTunnel') }}</span>
                </h4>
              </div>
              <span class="px-2.5 py-0.5 text-xs rounded-full bg-indigo-400/10 text-indigo-300 font-bold border border-indigo-400/20">
                {{ t('readyBypass') }}
              </span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed pr-5">
              {{ t('gostTunnelDesc') }}
            </p>
            <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-gray-400 pr-5 pt-1.5 border-t border-white/[0.04]">
              <span>🔗 {{ t('tunnelTypeLabel') }}: <strong class="text-indigo-300 font-mono">WebSocket TLS</strong></span>
              <span>📡 {{ t('nodeLinkStatus') }}: <strong class="text-emerald-400">{{ t('readyEstablished') }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- SMART OPERATOR RECOMMENDATIONS & ISP MATRIX -->
      <div class="space-y-5 sm:space-y-6">
        <div class="glass-panel p-5 sm:p-6 rounded-3xl space-y-4 border border-white/[0.08]">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 class="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Zap class="w-5 h-5 text-amber-400" />
              <span>{{ t('ispMatrixTitle') }}</span>
            </h3>
            <span class="text-[11px] text-gray-400 font-mono">ISP Matrix</span>
          </div>

          <div class="space-y-3 text-xs">
            <!-- MCI Operator Recommendation Card -->
            <div class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
                  📱 {{ t('mciNetwork') }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  99.5% {{ t('stable') }}
                </span>
              </div>
              <p class="text-gray-300 leading-relaxed text-xs">
                {{ t('optimalSetup') }}: <strong class="text-white font-medium">VLESS-REALITY + Fragment</strong> Port 443.
              </p>
              <div class="p-2 rounded-xl bg-black/30 border border-white/[0.06] font-mono text-[11px] text-gray-300 flex items-center justify-between" dir="ltr">
                <span>Fragment: 100-200, interval: 10-20</span>
                <button @click="copyText('length: 100-200, interval: 10-20', t('copied'))" class="text-amber-400 hover:underline text-[10px]">{{ t('copy') }}</button>
              </div>
              <p class="text-[11px] text-gray-400">{{ t('suggestedSni') }}: <code class="text-amber-300">archive.ubuntu.com</code> / <code class="text-amber-300">pypi.org</code></p>
            </div>

            <!-- Irancell Operator Recommendation Card -->
            <div class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-rose-300 flex items-center gap-1.5 text-xs sm:text-sm">
                  📡 {{ t('irancellNetwork') }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  99.2% {{ t('stable') }}
                </span>
              </div>
              <p class="text-gray-300 leading-relaxed text-xs">
                {{ t('optimalSetup') }}: <strong class="text-white font-medium">REALITY (Chrome Fingerprint)</strong> / gRPC.
              </p>
              <div class="p-2 rounded-xl bg-black/30 border border-white/[0.06] font-mono text-[11px] text-gray-300 flex items-center justify-between" dir="ltr">
                <span>Fingerprint: chrome, Port: 443</span>
                <button @click="copyText('ebanking.banksepah.ir', t('copied'))" class="text-rose-400 hover:underline text-[10px]">{{ t('copy') }} SNI</button>
              </div>
              <p class="text-[11px] text-gray-400">{{ t('suggestedSni') }}: <code class="text-rose-300">ebanking.banksepah.ir</code> / <code class="text-rose-300">bmi.ir</code></p>
            </div>

            <!-- Fixed Broadband ADSL / RightTel Card -->
            <div class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-gray-200 flex items-center gap-1.5 text-xs sm:text-sm">
                  🌐 {{ t('adslFiberNetwork') }}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  {{ t('statusOnline') }}
                </span>
              </div>
              <p class="text-gray-300 leading-relaxed text-xs">
                {{ t('optimalSetup') }}: <strong class="text-white font-medium">VLESS REALITY TCP</strong> (Port 8443 / 443).
              </p>
            </div>
          </div>
        </div>

        <!-- Live Activity Ticker -->
        <div class="glass-panel p-4 sm:p-5 rounded-3xl space-y-3 border border-white/[0.08] text-xs">
          <h4 class="font-bold text-white flex items-center gap-2">
            <Terminal class="w-4 h-4 text-amber-400" />
            {{ t('liveActivityFeed') }}
          </h4>
          <div class="space-y-2 font-mono text-[11px]">
            <div class="flex items-center justify-between text-gray-400 bg-white/[0.03] p-2 rounded-xl border border-white/[0.04]">
              <span>{{ t('autoTrafficSync') }}</span>
              <span class="text-emerald-400 font-bold">{{ t('successText') }}</span>
            </div>
            <div class="flex items-center justify-between text-gray-400 bg-white/[0.03] p-2 rounded-xl border border-white/[0.04]">
              <span>{{ t('realityKeypair') }}</span>
              <span class="text-amber-300 font-bold">{{ t('generatedText') }}</span>
            </div>
            <div class="flex items-center justify-between text-gray-400 bg-white/[0.03] p-2 rounded-xl border border-white/[0.04]">
              <span>{{ t('botConnectionStatus') }}</span>
              <span class="text-emerald-400 font-bold">{{ t('activeStatus') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ⚛️ Quantum MultiPath Engine — Full Real-Time Network Health Dashboard -->
    <div class="glass-panel rounded-3xl p-4 sm:p-6 border border-white/[0.08] relative overflow-hidden bg-gradient-to-br from-amber-500/[0.02] via-transparent to-indigo-500/[0.02]">
      <!-- Animated background glow -->
      <div class="absolute inset-0 pointer-events-none">
        <div :class="[
          'absolute -top-12 -right-12 w-56 h-56 rounded-full blur-3xl transition-all duration-1000',
          networkHealth.panicMode ? 'bg-cyberRed/30' :
          networkHealth.overallHealth === 'CRITICAL' ? 'bg-orange-500/20' :
          networkHealth.overallHealth === 'EXCELLENT' ? 'bg-cyberGreen/20' : 'bg-cyberYellow/15'
        ]"></div>
      </div>

      <div class="relative z-10">
        <!-- Header Row -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-white flex flex-wrap items-center gap-2">
              <span class="text-xl sm:text-2xl">⚛️</span>
              <span>{{ t('multiPathTitle') }}</span>
              <span
                :class="[
                  'text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border font-bold transition-all duration-500',
                  networkHealth.overallHealth === 'EXCELLENT' ? 'bg-cyberGreen/20 text-cyberGreen border-cyberGreen/50 animate-pulse' :
                  networkHealth.overallHealth === 'GOOD' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                  networkHealth.overallHealth === 'DEGRADED' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                  networkHealth.overallHealth === 'CRITICAL' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 animate-pulse' :
                  'bg-cyberRed/20 text-cyberRed border-cyberRed/50 animate-pulse'
                ]">
                {{ networkHealth.overallHealth === 'EXCELLENT' ? t('healthExcellent') :
                   networkHealth.overallHealth === 'GOOD' ? t('healthGood') :
                   networkHealth.overallHealth === 'DEGRADED' ? t('healthDegraded') :
                   networkHealth.overallHealth === 'CRITICAL' ? t('healthCritical') : t('healthPanic') }}
              </span>
            </h3>
            <p class="text-xs text-gray-400 mt-1">{{ t('multiPathSub') }}</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span class="text-[10px] text-gray-500 font-mono" dir="ltr">
              #{{ networkHealth.checkCount }} {{ t('multiPathChecks') }}
            </span>
            <button
              @click="forceMultiPathCheck"
              :disabled="isCheckingPaths"
              class="text-xs px-3 py-1.5 bg-cyberYellow/10 hover:bg-cyberYellow/20 border border-cyberYellow/30 rounded-xl text-cyberYellow font-bold transition-all disabled:opacity-50"
            >
              {{ isCheckingPaths ? '...' : t('multiPathRefresh') }}
            </button>
          </div>
        </div>

        <!-- 4 Path Health Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div
            v-for="(path, key) in networkHealth.paths"
            :key="key"
            :class="[
              'p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden',
              path.healthy
                ? 'bg-white/[0.03] border-white/[0.06] hover:border-emerald-400/30 hover:bg-white/[0.05]'
                : 'bg-black/40 border-rose-500/20 hover:border-rose-500/40'
            ]"
          >
            <!-- Subtle glow on healthy paths -->
            <div v-if="path.healthy" class="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>

            <div class="relative z-10">
              <div class="flex items-center justify-between mb-2">
                <span class="text-base sm:text-lg">{{ path.emoji }}</span>
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'w-2 h-2 rounded-full',
                      path.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    ]"
                  ></span>
                  <span
                    :class="[
                      'text-xs font-mono font-extrabold',
                      path.latencyMs < 200 ? 'text-emerald-400' :
                      path.latencyMs < 600 ? 'text-amber-300' : 'text-rose-400'
                    ]"
                    dir="ltr"
                  >
                    {{ path.healthy ? path.latencyMs + 'ms' : '—' }}
                  </span>
                </div>
              </div>

              <!-- Score bar -->
              <div class="w-full bg-white/[0.06] rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  :class="[
                    'h-1.5 rounded-full transition-all duration-500',
                    path.score >= 80 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                    path.score >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    path.score >= 20 ? 'bg-gradient-to-r from-orange-400 to-rose-400' : 'bg-rose-500'
                  ]"
                  :style="{ width: path.score + '%' }"
                ></div>
              </div>

              <p class="text-[11px] text-gray-300 leading-snug">{{ path.label_fa }}</p>
              <p v-if="!path.healthy && path.error" class="text-[9px] text-rose-400/80 mt-0.5 truncate">{{ path.error }}</p>

              <!-- Best path crown -->
              <div v-if="networkHealth.bestPath === key" class="mt-2">
                <span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25 font-bold">★ BEST</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendation Banner -->
        <div :class="[
          'rounded-2xl px-4 py-3 text-xs leading-relaxed border transition-all duration-300',
          networkHealth.panicMode
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : networkHealth.overallHealth === 'CRITICAL'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-white/[0.03] border-white/[0.06] text-gray-300'
        ]">
          <span class="font-bold text-amber-300">{{ t('multiPathRecommendation') }}:</span>
          {{ currentLang === 'fa' ? networkHealth.recommendation_fa : networkHealth.recommendation }}
        </div>

        <!-- Panic Mode Alert -->
        <div v-if="networkHealth.panicMode" class="mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 animate-pulse">
          <span class="text-lg">🚨</span>
          <span class="text-xs font-bold">{{ t('panicModeActive') }}</span>
        </div>
        <div v-else class="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 w-fit">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-medium">{{ t('panicModeInactive') }}</span>
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

// ── Dashboard Stats ────────────────────────────────────────────────────

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

// ── Quantum MultiPath Engine State ─────────────────────────────────────

const networkHealth = ref<{
  overallHealth: string;
  paths: Record<string, { path: string; label: string; label_fa: string; emoji: string; healthy: boolean; latencyMs: number; error?: string; consecutiveFailures: number; score: number }>;
  bestPath: string | null;
  panicMode: boolean;
  recommendation: string;
  recommendation_fa: string;
  lastUpdate: string;
  checkCount: number;
}>({
  overallHealth: 'DEGRADED',
  paths: {},
  bestPath: null,
  panicMode: false,
  recommendation: 'Loading...',
  recommendation_fa: 'در حال دریافت...',
  lastUpdate: new Date().toISOString(),
  checkCount: 0
});

const isCheckingPaths = ref(false);

async function fetchNetworkHealth() {
  try {
    const res = await axios.get('/api/multipath/status');
    networkHealth.value = res.data;
  } catch {
    // Silent — don't break dashboard if engine is initializing
  }
}

async function forceMultiPathCheck() {
  if (isCheckingPaths.value) return;
  isCheckingPaths.value = true;
  try {
    const res = await axios.post('/api/multipath/check');
    networkHealth.value = res.data;
  } catch { /* noop */ }
  finally { isCheckingPaths.value = false; }
}

let timer: any = null;
let multiPathTimer: any = null;

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
  fetchNetworkHealth();
  timer = setInterval(fetchStats, 5000);
  multiPathTimer = setInterval(fetchNetworkHealth, 15000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (multiPathTimer) clearInterval(multiPathTimer);
});
</script>
