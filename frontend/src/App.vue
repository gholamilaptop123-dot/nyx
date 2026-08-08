<template>
  <div v-if="isSubInfoPage">
    <SubUserView />
  </div>

  <div v-else-if="authenticated" class="min-h-screen flex flex-col bg-darkBg text-gray-100 font-sans">
    <!-- Toast Notification Overlay -->
    <ToastNotification ref="toastRef" />

    <!-- Header Navbar -->
    <header class="glass-panel sticky top-0 z-50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3 md:gap-4">
        <img src="/logo_trans.png" alt="Nyx Panel Logo" class="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-[0_0_16px_rgba(234,179,8,0.5)] hover:scale-105 transition-all shrink-0" />
        <div>
          <h1 class="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyberYellow via-red-400 to-cyberRed glow-yellow tracking-wider">
            Nyx Panel
          </h1>
          <p class="text-xs text-gray-400 font-mono">سامانه مدیریت VPN و شبکه اختصاصی</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="hidden md:flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
            activeTab === tab.id 
              ? 'bg-cyberYellow text-black font-extrabold shadow-lg shadow-cyberYellow/40 border border-cyberYellow' 
              : 'text-gray-400 hover:text-cyberYellow hover:bg-white/5'
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.name }}
        </button>
      </nav>

      <!-- Status Indicator & Logout -->
      <div class="flex items-center gap-3">
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyberGreen/10 border border-cyberGreen/30 text-cyberGreen text-xs font-semibold">
          <span class="w-2 h-2 rounded-full bg-cyberGreen animate-ping"></span>
          آماده عبور از قطعی نت
        </div>
        <button 
          @click="handleLogout" 
          title="خروج از سیستم"
          class="p-2 rounded-xl bg-white/5 hover:bg-cyberRed/20 text-gray-400 hover:text-cyberRed border border-white/10 transition-all"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Mobile Subnav (Scrollable & Touch-Friendly) -->
    <nav class="md:hidden flex items-center gap-1 bg-darkBg border-b border-white/10 px-3 py-2 overflow-x-auto no-scrollbar scroll-smooth">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl shrink-0 transition-all',
          activeTab === tab.id ? 'bg-cyberYellow text-black font-extrabold shadow-lg shadow-cyberYellow/40 border border-cyberYellow' : 'text-gray-400 bg-white/5'
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.name }}</span>
      </button>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
      <DashboardView v-if="activeTab === 'dashboard'" :toast="showToast" />
      <UsersView v-if="activeTab === 'users'" :toast="showToast" />
      <InboundsView v-if="activeTab === 'inbounds'" :toast="showToast" />
      <NodesView v-if="activeTab === 'nodes'" :toast="showToast" />
      <TunnelsView v-if="activeTab === 'tunnels'" :toast="showToast" />
      <SettingsView v-if="activeTab === 'settings'" :toast="showToast" />
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/10 py-4 px-6 text-center text-xs text-gray-400 flex flex-col md:flex-row justify-between items-center gap-3 bg-black/20">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-200">Nyx Panel v2.0</span>
        <span class="text-gray-600">|</span>
        <span>توسعه‌داده‌شده توسط <strong class="text-cyberYellow font-bold">تیم امنیتی ساینت (Cynet)</strong></span>
      </div>

      <div class="flex items-center gap-4 text-xs">
        <a href="https://t.me/cynetx" target="_blank" class="text-gray-400 hover:text-cyberYellow transition-all flex items-center gap-1">
          📢 کانال تلگرام (cynetx)
        </a>
        <span class="text-gray-700">•</span>
        <a href="https://www.youtube.com/@cynetxir" target="_blank" class="text-gray-400 hover:text-cyberRed transition-all flex items-center gap-1">
          🎥 یوتیوب (@cynetxir)
        </a>
        <span class="text-gray-700">•</span>
        <a href="https://cynetx.ir" target="_blank" class="text-gray-400 hover:text-cyberGreen transition-all flex items-center gap-1 font-mono">
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
import { Shield, LayoutDashboard, Users, Server, Zap, Network, Settings, LogOut } from 'lucide-vue-next';
import DashboardView from './components/DashboardView.vue';
import UsersView from './components/UsersView.vue';
import InboundsView from './components/InboundsView.vue';
import NodesView from './components/NodesView.vue';
import TunnelsView from './components/TunnelsView.vue';
import SettingsView from './components/SettingsView.vue';
import SubUserView from './components/SubUserView.vue';
import LoginView from './components/LoginView.vue';
import ToastNotification from './components/ToastNotification.vue';

const authenticated = ref(false);
const activeTab = ref('dashboard');
const toastRef = ref<any>(null);

const isSubInfoPage = computed(() => {
  const p = window.location.pathname;
  return p.startsWith('/subinfo/') || p.startsWith('/sub/info/');
});

const tabs = [
  { id: 'dashboard', name: 'داشبورد', icon: LayoutDashboard },
  { id: 'inbounds', name: 'اینباندها و کانفیگ‌ها', icon: Network },
  { id: 'nodes', name: 'سرورها و نودها', icon: Server },
  { id: 'tunnels', name: 'تونل قطعی نت', icon: Zap },
  { id: 'settings', name: 'ربات و تنظیمات', icon: Settings },
];

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
