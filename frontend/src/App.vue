<template>
  <div v-if="isSubInfoPage">
    <SubUserView />
  </div>

  <div v-else-if="authenticated" class="min-h-screen flex flex-col bg-darkBg text-gray-100 font-sans relative selection:bg-amber-400/30 selection:text-amber-200">
    <!-- Ambient Background Light Drops -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-32 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-20 right-0 w-96 h-96 bg-rose-500/4 rounded-full blur-3xl"></div>
    </div>

    <!-- Toast Notification Overlay -->
    <ToastNotification ref="toastRef" />

    <!-- Header Navbar -->
    <header class="glass-panel sticky top-0 z-50 border-b border-white/[0.06] px-4 sm:px-6 py-3.5 flex items-center justify-between backdrop-blur-xl">
      <div class="flex items-center gap-3 sm:gap-3.5">
        <img src="/logo_trans.png" alt="Nyx Panel Logo" class="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-[0_0_14px_rgba(245,158,11,0.35)] hover:scale-105 transition-all shrink-0" />
        <div>
          <h1 class="text-lg sm:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 tracking-wide flex items-center gap-2">
            <span>Nyx Panel</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-mono font-medium hidden sm:inline-block">v2.4.4</span>
          </h1>
          <p class="text-[11px] text-gray-400 font-mono">{{ t('panelSub') }}</p>
        </div>
      </div>

      <!-- Navigation Tabs (Desktop / Tablet) -->
      <nav class="hidden md:flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-2xl border border-white/[0.06]">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200',
            activeTab === tab.id 
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 shadow-md shadow-amber-500/20 font-extrabold' 
              : 'text-gray-400 hover:text-amber-300 hover:bg-white/[0.04]'
          ]"
        >
          <component :is="tab.icon" class="w-3.5 h-3.5" />
          {{ tab.name }}
        </button>
      </nav>

      <!-- Status Indicator, Language & Logout -->
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {{ t('readyBypass') }}
        </div>
        <button 
          @click="toggleLanguage" 
          title="Switch Language"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold border border-white/[0.08] text-amber-300 transition-all hover:border-amber-400/30"
        >
          <Globe class="w-3.5 h-3.5 text-amber-400" />
          <span class="text-[11px]">{{ currentLang === 'en' ? '🇮🇷 فارسی' : '🇺🇸 EN' }}</span>
        </button>
        <button 
          @click="handleLogout" 
          :title="t('logout')"
          class="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-gray-400 hover:text-rose-400 border border-white/[0.08] hover:border-rose-500/30 transition-all"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Mobile Subnav (Scrollable & Touch-Friendly) -->
    <nav class="md:hidden flex items-center gap-1.5 bg-darkBg/95 backdrop-blur-md border-b border-white/[0.06] px-3 py-2 overflow-x-auto no-scrollbar scroll-smooth sticky top-[69px] z-40">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 transition-all',
          activeTab === tab.id ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 shadow-md shadow-amber-500/25' : 'text-gray-400 bg-white/[0.03] border border-white/[0.05]'
        ]"
      >
        <component :is="tab.icon" class="w-3.5 h-3.5" />
        <span>{{ tab.name }}</span>
      </button>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto relative z-10">
      <DashboardView v-if="activeTab === 'dashboard'" :toast="showToast" />
      <UsersView v-if="activeTab === 'users'" :toast="showToast" />
      <InboundsView v-if="activeTab === 'inbounds'" :toast="showToast" />
      <NodesView v-if="activeTab === 'nodes'" :toast="showToast" />
      <TunnelsView v-if="activeTab === 'tunnels'" :toast="showToast" />
      <SettingsView v-if="activeTab === 'settings'" :toast="showToast" />
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/[0.06] py-4 px-6 text-center text-xs text-gray-400 flex flex-col md:flex-row justify-between items-center gap-3 bg-black/30 backdrop-blur-md relative z-10">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-300">Nyx Panel v2.4.2</span>
        <span class="text-gray-600">|</span>
        <span class="text-gray-400">{{ t('byCynet') }}</span>
      </div>

      <div class="flex items-center gap-4 text-xs">
        <a href="https://t.me/cynetx" target="_blank" class="text-gray-400 hover:text-amber-300 transition-all flex items-center gap-1">
          📢 Telegram (cynetx)
        </a>
        <span class="text-gray-700">•</span>
        <a href="https://www.youtube.com/@cynetxir" target="_blank" class="text-gray-400 hover:text-rose-400 transition-all flex items-center gap-1">
          🎥 YouTube (@cynetxir)
        </a>
        <span class="text-gray-700">•</span>
        <a href="https://cynetx.ir" target="_blank" class="text-gray-400 hover:text-emerald-400 transition-all flex items-center gap-1 font-mono">
          🌐 cynetx.ir
        </a>
      </div>
    </footer>
  </div>

  <LoginView v-else @loggedIn="checkAuth" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Shield, LayoutDashboard, Users, Server, Zap, Network, Settings, LogOut, Globe } from 'lucide-vue-next';
import DashboardView from './components/DashboardView.vue';
import UsersView from './components/UsersView.vue';
import InboundsView from './components/InboundsView.vue';
import NodesView from './components/NodesView.vue';
import TunnelsView from './components/TunnelsView.vue';
import SettingsView from './components/SettingsView.vue';
import SubUserView from './components/SubUserView.vue';
import LoginView from './components/LoginView.vue';
import ToastNotification from './components/ToastNotification.vue';
import { currentLang, setLanguage, t } from './i18n';

const authenticated = ref(false);
const activeTab = ref('dashboard');
const toastRef = ref<any>(null);

function toggleLanguage() {
  const nextLang = currentLang.value === 'en' ? 'fa' : 'en';
  setLanguage(nextLang);
}

const isSubInfoPage = computed(() => {
  const p = window.location.pathname;
  return p.startsWith('/subinfo/') || p.startsWith('/sub/info/');
});

const tabs = computed(() => [
  { id: 'dashboard', name: t('tabDashboard'), icon: LayoutDashboard },
  { id: 'users', name: t('tabUsers'), icon: Users },
  { id: 'inbounds', name: t('tabInbounds'), icon: Network },
  { id: 'nodes', name: t('tabNodes'), icon: Server },
  { id: 'tunnels', name: t('tabTunnels'), icon: Zap },
  { id: 'settings', name: t('tabSettings'), icon: Settings },
]);

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (toastRef.value) {
    toastRef.value.addToast(message, type);
  }
}

async function checkAuth() {
  if (isSubInfoPage.value) return;

  const token = localStorage.getItem('nyx_token');
  if (!token) {
    authenticated.value = false;
    return;
  }

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.get('/api/auth/me');
    authenticated.value = res.data.authenticated;
  } catch (err) {
    authenticated.value = false;
    localStorage.removeItem('nyx_token');
  }
}

function handleLogout() {
  axios.post('/api/auth/logout').catch(() => {});
  localStorage.removeItem('nyx_token');
  authenticated.value = false;
}

onMounted(() => {
  checkAuth();
});
</script>
