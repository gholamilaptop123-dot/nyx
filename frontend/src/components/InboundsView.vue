<template>
  <div class="space-y-6">
    <!-- Header Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-400">{{ t('inboundsTitle') }}</h2>
        <p class="text-xs sm:text-sm text-gray-400 mt-0.5">{{ t('inboundsSub') }}</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:opacity-95 transition-all"
      >
        <Plus class="w-4 h-4 text-gray-950 font-bold" />
        {{ t('createInboundBtn') }}
      </button>
    </div>

    <!-- Smart Auto-Failover Banner Card -->
    <div class="glass-panel rounded-3xl p-4 sm:p-5 border border-emerald-500/20 bg-gradient-to-r from-black/60 via-emerald-950/20 to-black/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h3 class="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
          <ShieldAlert class="w-5 h-5 text-emerald-400 animate-pulse" />
          <span>{{ t('autoFailoverTitle') }}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">{{ t('autoFailoverStatusActive') }}</span>
        </h3>
        <p class="text-xs text-gray-300 max-w-3xl leading-relaxed">
          {{ t('autoFailoverSub') }}
        </p>
      </div>
      <button 
        @click="triggerAutoFailover" 
        :disabled="failoverTriggering"
        class="px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
      >
        <Zap class="w-4 h-4 text-gray-950 font-bold" :class="{ 'animate-spin': failoverTriggering }" />
        <span>{{ t('triggerFailoverBtn') }}</span>
      </button>
    </div>

    <!-- Live SNI Connection Tester Panel -->
    <div class="glass-panel rounded-3xl p-4 sm:p-6 border border-white/[0.08] space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Activity class="w-5 h-5 text-amber-400" />
            <span>{{ t('sniTesterHeading') }}</span>
          </h3>
          <p class="text-xs text-gray-400 mt-1">
            {{ t('sniTesterHeadingSub') }}
          </p>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button 
          v-for="cat in sniCategories" 
          :key="cat.id" 
          @click="activeSniCat = cat.id"
          :class="['px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', activeSniCat === cat.id ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-bold shadow-sm' : 'bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] border border-white/[0.05]']"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- SNI Presets Grid & Custom Test -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="md:col-span-2 flex flex-wrap gap-2 p-3 bg-black/30 rounded-2xl border border-white/[0.05] max-h-40 overflow-y-auto">
          <button 
            v-for="domain in filteredSniList" 
            :key="domain"
            @click="testDomainInput = domain; runSniTest(domain)"
            :class="['px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border', testDomainInput === domain ? 'bg-amber-400/15 text-amber-300 border-amber-400/30 font-bold' : 'bg-white/[0.03] text-gray-300 border-white/[0.06] hover:border-white/[0.15]']"
          >
            <span>{{ domain }}</span>
            <Play class="w-3 h-3 opacity-60" />
          </button>
        </div>

        <!-- Custom Domain Test Box -->
        <div class="p-3 bg-black/40 rounded-2xl border border-white/[0.06] flex flex-col justify-between space-y-2">
          <label class="text-xs text-gray-400">{{ t('customSniTestLabel') }}</label>
          <div class="flex items-center gap-2">
            <input 
              v-model="testDomainInput"
              type="text" 
              placeholder="ebanking.banksepah.ir"
              dir="ltr"
              class="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left outline-none focus:border-amber-400/50"
            />
            <button 
              @click="runSniTest(testDomainInput)"
              :disabled="testingSni"
              class="px-3 py-1.5 rounded-xl bg-amber-400 text-gray-950 font-bold text-xs hover:opacity-90 transition-all shrink-0 flex items-center gap-1"
            >
              <RefreshCw v-if="testingSni" class="w-3.5 h-3.5 animate-spin text-gray-950" />
              <span>{{ t('testBtn') }}</span>
            </button>
          </div>
          <!-- Test Result Box -->
          <div v-if="sniTestResult" :class="['p-2 rounded-xl border text-xs font-mono space-y-1 mt-2', sniTestResult.success ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-rose-500/10 border-rose-500/25 text-rose-300']">
            <div class="flex items-center justify-between font-bold">
              <span>{{ sniTestResult.domain }}</span>
              <span>{{ sniTestResult.latencyMs }} ms</span>
            </div>
            <p class="text-[11px] opacity-90">{{ sniTestResult.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-2.5">
      <Search class="w-4 h-4 text-gray-400 shrink-0" />
      <input 
        v-model="inboundSearch" 
        type="text" 
        :placeholder="t('searchInboundsPlaceholder')" 
        class="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none" 
      />
      <span v-if="inboundSearch" @click="inboundSearch = ''" class="cursor-pointer text-gray-400 hover:text-white text-xs">✕</span>
    </div>

    <!-- Inbound Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      <div 
        v-for="inbound in filteredInbounds" 
        :key="inbound.id"
        class="glass-panel rounded-3xl p-5 border border-white/[0.08] hover:border-amber-400/30 transition-all flex flex-col justify-between space-y-4"
      >
        <!-- Card Top Section -->
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Network class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-extrabold text-white text-base truncate max-w-[180px]">{{ inbound.remark }}</h3>
                <span class="text-xs font-mono text-amber-300" dir="ltr">
                  Port: {{ inbound.port }} | {{ (inbound.protocol || 'vless').toUpperCase() }}-{{ (inbound.network || 'tcp').toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Active / Inactive Switch -->
            <button 
              @click="toggleInbound(inbound)"
              :class="['px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0', inbound.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30']"
            >
              {{ inbound.enabled ? t('activeStatus') : t('disabledStatus') }}
            </button>
          </div>

          <!-- Technical Specs Badges -->
          <div class="flex flex-wrap gap-1.5 text-[11px] font-mono">
            <span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-300">
              SNI: {{ inbound.sni || 'yahoo.com' }}
            </span>
            <span class="px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-semibold">
              {{ (inbound.network || 'tcp').toUpperCase() }}
            </span>
            <span v-if="inbound.customDomain" class="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
              🌐 {{ inbound.customDomain }}
            </span>
            <span v-if="inbound.enableFragment" class="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
              ⚡ Frag: {{ inbound.fragmentLength || '100-200' }}
            </span>
            <span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-300">
              {{ inbound.maxDevices || 2 }} Devices
            </span>
          </div>

          <!-- Volume & Expiration Usage Progress -->
          <div class="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 text-xs">
            <div class="flex items-center justify-between text-gray-300 font-mono">
              <span>{{ t('trafficHeader') }}:</span>
              <span class="text-amber-300 font-bold" dir="ltr">
                {{ (Number(inbound.usedDataBytes || 0) / (1024*1024*1024)).toFixed(2) }} GB / {{ inbound.dataLimitGb > 0 ? inbound.dataLimitGb + ' GB' : t('unlimited') }}
              </span>
            </div>
            <div class="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
              <div 
                class="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-500" 
                :style="{ width: inbound.dataLimitGb > 0 ? Math.min(100, ((Number(inbound.usedDataBytes || 0)/(1024*1024*1024)) / inbound.dataLimitGb)*100) + '%' : '15%' }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-400">
              <span>{{ t('expiryHeader') }}:</span>
              <span>{{ inbound.expireDate ? new Date(inbound.expireDate).toLocaleDateString() : t('unlimited') }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button @click="openConfigModal(inbound)" class="flex-1 py-2 px-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 hover:bg-amber-400/20 text-xs font-bold flex items-center justify-center gap-1 transition-all">
            <Download class="w-3.5 h-3.5" />
            Get Config
          </button>
          <button @click="copyInboundInfoPage(inbound)" class="py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1 transition-all" title="User Info Web Page">
            <ExternalLink class="w-3.5 h-3.5" />
            Web Portal
          </button>
          <button @click="openEditModal(inbound)" class="p-2 rounded-xl bg-white/[0.04] text-gray-300 hover:text-white border border-white/[0.06] transition-all" title="Edit Inbound">
            <Edit3 class="w-4 h-4" />
          </button>
          <button @click="deleteInbound(inbound.id)" class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all" title="Delete Inbound">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="filteredInbounds.length === 0" class="col-span-full glass-panel rounded-3xl p-12 text-center text-gray-400">
        {{ inboundSearch ? 'No inbounds matching your search.' : 'No inbounds created yet. Click "Create Inbound / Config" to create the first inbound.' }}
      </div>
    </div>

    <!-- Create Inbound Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-lg w-full rounded-3xl p-5 sm:p-6 border border-white/[0.08] space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 class="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
          <Plus class="w-5 h-5 text-amber-400" />
          <span>{{ t('createInboundBtn') }}</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-gray-400 mb-1">Inbound Title / Remark</label>
            <input v-model="form.remark" type="text" placeholder="e.g. VLESS-Reality-443" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-400 outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">{{ t('protocolType') }}</label>
              <select v-model="form.protocol" @change="onProtocolChange" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="vless">VLESS (Recommended)</option>
                <option value="vmess">VMess</option>
                <option value="trojan">Trojan</option>
                <option value="shadowsocks">Shadowsocks (SS)</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-400 mb-1">Inbound Port</label>
              <input v-model.number="form.port" type="number" placeholder="443" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none" />
            </div>
          </div>

          <!-- Shadowsocks Credentials (Visible only when protocol is Shadowsocks) -->
          <div v-if="form.protocol === 'shadowsocks'" class="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl space-y-2">
            <span class="font-bold text-amber-300 block text-xs">🔑 Shadowsocks Credentials</span>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-gray-400">Cipher / الگوریتم رمزنگاری</label>
                <select v-model="form.ssCipher" class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none">
                  <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
                  <option value="aes-128-gcm">aes-128-gcm</option>
                  <option value="aes-256-gcm">aes-256-gcm</option>
                  <option value="2022-blake3-aes-128-gcm">2022-blake3-aes-128-gcm</option>
                  <option value="2022-blake3-aes-256-gcm">2022-blake3-aes-256-gcm</option>
                  <option value="2022-blake3-chacha20-poly1305">2022-blake3-chacha20-poly1305</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] text-gray-400">Password / رمز عبور</label>
                <input v-model="form.ssPassword" type="text" placeholder="Auto-generated if empty" dir="ltr" class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left focus:border-amber-400 outline-none" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3" v-if="form.protocol !== 'shadowsocks'">
            <div>
              <label class="block text-gray-400 mb-1">{{ t('transportType') }}</label>
              <select v-model="form.network" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="tcp">TCP (Reality Default)</option>
                <option value="xhttp">XHTTP (SplitHTTP - Next-Gen)</option>
                <option value="ws">WebSocket (WS / CDN)</option>
                <option value="grpc">gRPC (Multiplex)</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-400 mb-1">Security Encryption</label>
              <select v-model="form.security" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="reality">REALITY (Anti-Censorship)</option>
                <option value="tls">TLS</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">{{ t('inboundCustomDomainLabel') }}</label>
            <input 
              v-model="form.customDomain" 
              type="text" 
              :placeholder="t('inboundCustomDomainPlaceholder')"
              dir="ltr"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none"
            />
          </div>

          <div>
            <label class="block text-gray-400 mb-1">SNI Camouflage Domain</label>
            <select v-model="selectedSniPreset" @change="handleSniPresetChange" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none mb-2">
              <optgroup label="☁️ Cloud & CDNs">
                <option value="arvancloud.ir">arvancloud.ir</option>
                <option value="n2a.arvancloud.ir">n2a.arvancloud.ir</option>
                <option value="iran.liara.run">iran.liara.run</option>
                <option value="derak.cloud">derak.cloud</option>
              </optgroup>

              <optgroup label="💳 Financial & Gateways">
                <option value="shaparak.ir">shaparak.ir</option>
                <option value="pep.shaparak.ir">pep.shaparak.ir</option>
                <option value="ebanking.banksepah.ir">ebanking.banksepah.ir</option>
                <option value="bmi.ir">bmi.ir</option>
              </optgroup>

              <optgroup label="🚗 Essential Services">
                <option value="snapp.ir">snapp.ir</option>
                <option value="tapsi.ir">tapsi.ir</option>
                <option value="digikala.com">digikala.com</option>
                <option value="divar.ir">divar.ir</option>
              </optgroup>

              <optgroup label="🌐 Global Domains">
                <option value="yahoo.com">yahoo.com</option>
                <option value="www.google.com">www.google.com</option>
                <option value="dl.google.com">dl.google.com</option>
                <option value="speed.cloudflare.com">speed.cloudflare.com</option>
              </optgroup>

              <option value="custom">✏️ Custom SNI</option>
            </select>

            <input 
              v-if="selectedSniPreset === 'custom'"
              v-model="form.sni"
              type="text"
              placeholder="e.g. mydomain.com"
              dir="ltr"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none"
            />
          </div>

          <!-- Advanced Packet Fragment Customization -->
          <div class="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-bold text-white block">{{ t('fragmentSettings') }}</span>
                <span class="text-[10px] text-gray-300">Bypass DPI inspection via packet fragmentation</span>
              </div>
              <input type="checkbox" v-model="form.enableFragment" class="w-5 h-5 accent-amber-400" />
            </div>

            <div v-if="form.enableFragment" class="space-y-2 pt-2 border-t border-white/10">
              <label class="block text-[11px] text-gray-300">Preset Template / پریست سریع:</label>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  @click="applyFragmentPreset('100-200', '10-20')" 
                  class="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/40 text-[11px] text-left text-gray-300"
                >
                  {{ t('fragmentPresetMci') }}
                </button>
                <button 
                  type="button" 
                  @click="applyFragmentPreset('50-150', '5-15')" 
                  class="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/40 text-[11px] text-left text-gray-300"
                >
                  {{ t('fragmentPresetIrancell') }}
                </button>
                <button 
                  type="button" 
                  @click="applyFragmentPreset('10-60', '2-10')" 
                  class="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/40 text-[11px] text-left text-gray-300"
                >
                  {{ t('fragmentPresetIntranet') }}
                </button>
                <button 
                  type="button" 
                  @click="applyFragmentPreset('100-200', '10-20')" 
                  class="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/40 text-[11px] text-left text-gray-300"
                >
                  {{ t('fragmentPresetCustom') }}
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label class="block text-[10px] text-gray-400">{{ t('fragmentLengthLabel') }}</label>
                  <input v-model="form.fragmentLength" type="text" placeholder="100-200" dir="ltr" class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left focus:border-amber-400 outline-none" />
                </div>
                <div>
                  <label class="block text-[10px] text-gray-400">{{ t('fragmentIntervalLabel') }}</label>
                  <input v-model="form.fragmentInterval" type="text" placeholder="10-20" dir="ltr" class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left focus:border-amber-400 outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">{{ t('selectTraffic') }} (GB)</label>
              <input v-model.number="form.dataLimitGb" type="number" placeholder="0 for unlimited" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none" />
            </div>
            <div>
              <label class="block text-gray-400 mb-1">{{ t('selectExpiry') }} ({{ t('daysCount') }})</label>
              <input v-model.number="form.expireDays" type="number" placeholder="30" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none" />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateModal = false" :disabled="isSubmitting" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-50">{{ t('cancel') }}</button>
          <button @click="createInbound" :disabled="isSubmitting" class="px-5 py-2 rounded-xl bg-amber-400 text-gray-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
            <svg v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            {{ isSubmitting ? (currentLang === 'fa' ? 'در حال ساخت...' : 'Creating...') : t('save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Inbound Modal -->
    <div v-if="editingInbound" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-md w-full rounded-3xl p-6 border border-amber-400/40 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
          <Edit3 class="w-5 h-5 text-amber-400" />
          <span>{{ t('edit') }}: {{ editingInbound.remark }}</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-gray-400 mb-1">Inbound Title</label>
            <input v-model="editForm.remark" type="text" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-400 outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">{{ t('protocolType') }}</label>
              <select v-model="editForm.protocol" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="vless">VLESS</option>
                <option value="vmess">VMess</option>
                <option value="trojan">Trojan</option>
                <option value="shadowsocks">Shadowsocks (SS)</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-400 mb-1">{{ t('transportType') }}</label>
              <select v-model="editForm.network" :disabled="editForm.protocol === 'shadowsocks'" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none disabled:opacity-40">
                <option value="tcp">TCP</option>
                <option value="xhttp">XHTTP (SplitHTTP)</option>
                <option value="ws">WebSocket (WS)</option>
                <option value="grpc">gRPC</option>
              </select>
            </div>
          </div>

          <!-- Shadowsocks Credentials in Edit Modal -->
          <div v-if="editForm.protocol === 'shadowsocks'" class="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl space-y-2">
            <span class="font-bold text-amber-300 block text-xs">🔑 Shadowsocks Credentials</span>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-gray-400">Cipher / الگوریتم رمزنگاری</label>
                <select v-model="editForm.ssCipher" class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none">
                  <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
                  <option value="aes-128-gcm">aes-128-gcm</option>
                  <option value="aes-256-gcm">aes-256-gcm</option>
                  <option value="2022-blake3-aes-128-gcm">2022-blake3-aes-128-gcm</option>
                  <option value="2022-blake3-aes-256-gcm">2022-blake3-aes-256-gcm</option>
                  <option value="2022-blake3-chacha20-poly1305">2022-blake3-chacha20-poly1305</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] text-gray-400">Password / رمز عبور</label>
                <input v-model="editForm.ssPassword" type="text" placeholder="Inbound password" dir="ltr" class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left focus:border-amber-400 outline-none" />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">{{ t('inboundCustomDomainLabel') }}</label>
            <input v-model="editForm.customDomain" type="text" :placeholder="t('inboundCustomDomainPlaceholder')" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none" />
          </div>

          <div>
            <label class="block text-gray-400 mb-1">SNI Domain</label>
            <input v-model="editForm.sni" type="text" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none" />
          </div>

          <!-- Fragment Settings Edit -->
          <div class="p-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white text-xs">{{ t('fragmentSettings') }}</span>
              <input type="checkbox" v-model="editForm.enableFragment" class="w-4 h-4 accent-amber-400" />
            </div>
            <div v-if="editForm.enableFragment" class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-gray-400">{{ t('fragmentLengthLabel') }}</label>
                <input v-model="editForm.fragmentLength" type="text" dir="ltr" class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label class="block text-[10px] text-gray-400">{{ t('fragmentIntervalLabel') }}</label>
                <input v-model="editForm.fragmentInterval" type="text" dir="ltr" class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left focus:border-amber-400 outline-none" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">{{ t('selectTraffic') }} (GB)</label>
              <input v-model.number="editForm.dataLimitGb" type="number" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none" />
            </div>
            <div>
              <label class="block text-gray-400 mb-1">Renew Expiry (Days)</label>
              <input v-model.number="editForm.expireDays" type="number" placeholder="Days to extend" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-amber-400 outline-none" />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="editingInbound = null" :disabled="isSavingEdit" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-50">{{ t('cancel') }}</button>
          <button @click="saveInboundEdit" :disabled="isSavingEdit" class="px-5 py-2 rounded-xl bg-amber-400 text-gray-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
            <svg v-if="isSavingEdit" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            {{ isSavingEdit ? (currentLang === 'fa' ? 'در حال ذخیره...' : 'Saving...') : t('save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Config & Links Modal -->
    <div v-if="selectedInboundForConfig" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-2xl w-full rounded-3xl p-6 border border-amber-400/40 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>🔑 Output Configs: {{ selectedInboundForConfig.remark }}</span>
          </h3>
          <button @click="selectedInboundForConfig = null" class="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div v-if="configLoading" class="flex items-center justify-center py-8">
          <div class="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <span class="mr-3 text-gray-400 text-sm">Generating config links…</span>
        </div>

        <div v-if="inboundConfigs && !configLoading" class="space-y-4">
          <!-- Direct Config Link -->
          <div class="bg-black/50 rounded-2xl p-3.5 border border-amber-400/20 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-amber-300 font-extrabold">Direct Connection Link</span>
              <button @click="copy(inboundConfigs.vlessLink)" class="px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                {{ t('copy') }} Link
              </button>
            </div>
            <pre dir="ltr" class="text-[11px] font-mono text-gray-200 break-all whitespace-pre-wrap text-left p-3 bg-black/70 rounded-xl border border-white/10 leading-relaxed">{{ inboundConfigs.vlessLink }}</pre>
          </div>

          <!-- Base64 Subscription -->
          <div class="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-emerald-300 font-extrabold">Base64 Subscription Link</span>
              <button @click="copy(inboundConfigs.subUrl)" class="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                {{ t('copy') }} Sub
              </button>
            </div>
            <input readonly :value="inboundConfigs.subUrl" dir="ltr" class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left text-amber-300 outline-none" />
          </div>

          <!-- Dedicated Web Info Page Link -->
          <div class="p-3.5 bg-amber-400/10 rounded-2xl border border-amber-400/20 flex items-center justify-between gap-3 text-xs">
            <span class="text-gray-200">Standalone User Info Web Page:</span>
            <button @click="copy(inboundConfigs.userInfoUrl)" class="px-3 py-1 rounded-xl bg-amber-400 text-gray-950 font-bold">
              {{ t('openUserPage') }}
            </button>
          </div>

          <!-- QR Code -->
          <div class="flex flex-col items-center gap-2 pt-2">
            <p class="text-xs text-gray-300 font-bold">Scan QR Code</p>
            <div class="bg-white p-4 rounded-2xl shadow-2xl">
              <QrcodeVue :value="inboundConfigs.vlessLink" :size="180" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Plus, Trash2, Download, Network, Edit3, ExternalLink, Activity, Play, RefreshCw, AlertTriangle, ShieldAlert, Zap, Info, Search } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { copyToClipboard } from '../utils/clipboard';
import { t, currentLang } from '../i18n';

const inbounds = ref<any[]>([]);
const inboundSearch = ref('');
const showCreateModal = ref(false);
const editingInbound = ref<any>(null);
const selectedInboundForConfig = ref<any>(null);
const inboundConfigs = ref<any>(null);
const configLoading = ref(false);
const selectedSniPreset = ref('yahoo.com');
const isSubmitting = ref(false); // Prevents double-click duplicate submissions
const isSavingEdit = ref(false);

// Live SNI Tester & Auto-Failover State
const activeSniCat = ref('CLOUD');
const testDomainInput = ref('arvancloud.ir');
const testingSni = ref(false);
const sniTestResult = ref<any>(null);
const failoverTriggering = ref(false);

const filteredInbounds = computed(() => {
  const q = inboundSearch.value.trim().toLowerCase();
  if (!q) return inbounds.value;
  return inbounds.value.filter(i => 
    (i.remark && i.remark.toLowerCase().includes(q)) ||
    (i.port && String(i.port).includes(q)) ||
    (i.protocol && i.protocol.toLowerCase().includes(q)) ||
    (i.network && i.network.toLowerCase().includes(q)) ||
    (i.sni && i.sni.toLowerCase().includes(q)) ||
    (i.customDomain && i.customDomain.toLowerCase().includes(q))
  );
});

async function triggerAutoFailover() {
  failoverTriggering.value = true;
  try {
    const res = await axios.post('/api/sni/auto-failover/trigger');
    props.toast?.(t('failoverSuccessToast'), 'success');
    await fetchInbounds();
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'Failed to execute auto-failover', 'error');
  } finally {
    failoverTriggering.value = false;
  }
}

const sniCategories = computed(() => [
  { id: 'CLOUD', label: t('sniCatCloud') },
  { id: 'SHAPARAK', label: t('sniCatBanking') },
  { id: 'APPS', label: t('sniCatApps') },
  { id: 'GOV', label: t('sniCatGov') },
  { id: 'REPOS', label: t('sniCatRepos') },
  { id: 'SSL', label: t('sniCatSsl') },
  { id: 'GENERAL', label: t('sniCatGeneral') },
]);

const sniLists: Record<string, string[]> = {
  CLOUD: ['arvancloud.ir', 'n2a.arvancloud.ir', 'iran.liara.run', 'storage.iran.liara.ir', 'derak.cloud', 'asiatech.ir', 'hostiran.net'],
  SHAPARAK: ['shaparak.ir', 'pep.shaparak.ir', 'bpm.shaparak.ir', 'sadad.shaparak.ir', 'zarinpal.com', 'ebanking.banksepah.ir', 'bmi.ir', 'bank-maskan.ir', 'tejarat24.ir'],
  APPS: ['snapp.ir', 'tapsi.ir', 'digikala.com', 'torob.com', 'divar.ir', 'sheypoor.com', 'bale.ai', 'eitaa.com', 'rubika.ir'],
  GOV: ['my.gov.ir', 'eservices.gov.ir', 'ncr.ir', 'tamin.ir', 'tax.gov.ir'],
  REPOS: ['archive.ubuntu.com', 'security.ubuntu.com', 'pypi.org', 'registry.npmjs.org', 'registry-1.docker.io'],
  SSL: ['acme-v02.api.letsencrypt.org', 'ocsp.digicert.com', 'ocsp.sectigo.com', 'ocsp2.globalsign.com'],
  GENERAL: ['yahoo.com', 'www.google.com', 'dl.google.com', 'www.microsoft.com', 'speed.cloudflare.com', 'www.amazon.com', 'www.apple.com']
};

const filteredSniList = computed(() => sniLists[activeSniCat.value] || sniLists.CLOUD);

async function runSniTest(domain: string) {
  if (!domain) return;
  testingSni.value = true;
  sniTestResult.value = null;
  try {
    const res = await axios.get(`/api/sni/test?domain=${encodeURIComponent(domain)}`);
    sniTestResult.value = res.data;
  } catch (err: any) {
    sniTestResult.value = {
      domain,
      success: false,
      latencyMs: 4000,
      message: 'خطا در ارتباط شبکه (احتمال مسدودی)'
    };
  } finally {
    testingSni.value = false;
  }
}

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const form = ref({
  remark: '',
  port: 443,
  protocol: 'vless',
  network: 'tcp',
  security: 'reality',
  sni: 'yahoo.com',
  customDomain: '',
  enableFragment: true,
  fragmentLength: '100-200',
  fragmentInterval: '10-20',
  dataLimitGb: 0,
  expireDays: 30,
  maxDevices: 2,
  ssPassword: '',
  ssCipher: 'chacha20-ietf-poly1305'
});

const editForm = ref({
  remark: '',
  protocol: 'vless',
  network: 'tcp',
  sni: 'yahoo.com',
  customDomain: '',
  enableFragment: true,
  fragmentLength: '100-200',
  fragmentInterval: '10-20',
  dataLimitGb: 0,
  expireDays: 0,
  maxDevices: 2,
  ssPassword: '',
  ssCipher: 'chacha20-ietf-poly1305'
});

function onProtocolChange() {
  if (form.value.protocol === 'shadowsocks') {
    form.value.security = 'none';
  }
}

function handleSniPresetChange() {
  if (selectedSniPreset.value !== 'custom') {
    form.value.sni = selectedSniPreset.value;
  }
}

function applyFragmentPreset(len: string, int: string) {
  form.value.fragmentLength = len;
  form.value.fragmentInterval = int;
}

async function fetchInbounds() {
  try {
    const res = await axios.get('/api/inbounds');
    inbounds.value = res.data;
  } catch (err) {
    console.error('Failed to fetch inbounds:', err);
  }
}

async function createInbound() {
  if (isSubmitting.value) return; // Guard against double-click
  isSubmitting.value = true;
  try {
    const res = await axios.post('/api/inbounds', form.value);
    showCreateModal.value = false;
    const created = res.data;
    props.toast?.(currentLang.value === 'fa' ? 'اینباند / کانفیگ جدید با موفقیت ساخته شد' : 'New inbound config created successfully', 'success');
    fetchInbounds();
    if (created) openConfigModal(created);
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || (currentLang.value === 'fa' ? 'خطا در ساخت اینباند' : 'Failed to create inbound'), 'error');
  } finally {
    isSubmitting.value = false;
  }
}

function openEditModal(inbound: any) {
  editingInbound.value = inbound;
  editForm.value = {
    remark: inbound.remark,
    protocol: inbound.protocol || 'vless',
    network: inbound.network || 'tcp',
    sni: inbound.sni || 'yahoo.com',
    customDomain: inbound.customDomain || '',
    enableFragment: inbound.enableFragment !== undefined ? inbound.enableFragment : true,
    fragmentLength: inbound.fragmentLength || '100-200',
    fragmentInterval: inbound.fragmentInterval || '10-20',
    dataLimitGb: inbound.dataLimitGb || 0,
    expireDays: 0,
    maxDevices: inbound.maxDevices || 2,
    ssPassword: inbound.ssPassword || '',
    ssCipher: inbound.ssCipher || 'chacha20-ietf-poly1305'
  };
}

async function saveInboundEdit() {
  if (!editingInbound.value || isSavingEdit.value) return;
  isSavingEdit.value = true;
  try {
    await axios.patch(`/api/inbounds/${editingInbound.value.id}`, editForm.value);
    props.toast?.(currentLang.value === 'fa' ? 'مشخصات اینباند با موفقیت به روز شد' : 'Inbound updated successfully', 'success');
    editingInbound.value = null;
    fetchInbounds();
  } catch (err) {
    props.toast?.(currentLang.value === 'fa' ? 'خطا در بروزرسانی اینباند' : 'Failed to update inbound', 'error');
  } finally {
    isSavingEdit.value = false;
  }
}

async function toggleInbound(inbound: any) {
  try {
    await axios.patch(`/api/inbounds/${inbound.id}`, { enabled: !inbound.enabled });
    fetchInbounds();
  } catch (err) {
    props.toast?.(currentLang.value === 'fa' ? 'خطا در تغییر وضعیت اینباند' : 'Failed to toggle inbound', 'error');
  }
}

async function deleteInbound(id: string) {
  if (!confirm(currentLang.value === 'fa' ? 'آیا از حذف این اینباند اطمینان دارید؟' : 'Are you sure you want to delete this inbound?')) return;
  try {
    await axios.delete(`/api/inbounds/${id}`);
    props.toast?.(currentLang.value === 'fa' ? 'اینباند حذف شد' : 'Inbound deleted successfully', 'success');
    fetchInbounds();
  } catch (err) {
    props.toast?.(currentLang.value === 'fa' ? 'خطا در حذف اینباند' : 'Failed to delete inbound', 'error');
  }
}

async function openConfigModal(inbound: any) {
  selectedInboundForConfig.value = inbound;
  configLoading.value = true;
  inboundConfigs.value = null;
  try {
    const res = await axios.get(`/api/inbounds/${inbound.id}/configs`);
    inboundConfigs.value = res.data;
  } catch (err) {
    console.error('Failed to load configs:', err);
  } finally {
    configLoading.value = false;
  }
}

function copyInboundInfoPage(inbound: any) {
  const proto = window.location.protocol; // respect http vs https
  const host = window.location.host;
  const link = `${proto}//${host}/subinfo/${inbound.uuid || inbound.id}`;
  copyToClipboard(link);
  window.open(link, '_blank');
  props.toast?.(currentLang.value === 'fa' ? 'صفحه وب کانفیگ در تب جدید باز شد و لینک کپی گردید.' : 'Config web page opened and link copied.', 'success');
}

function copy(text: string) {
  copyToClipboard(text);
  props.toast?.(t('copied'), 'success');
}

onMounted(fetchInbounds);
</script>