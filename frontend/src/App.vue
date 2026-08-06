<template>
  <div v-if="isSubInfoPage">
    <SubUserView />
  </div>

  <div v-else-if="authenticated" class="min-h-screen flex flex-col bg-darkBg text-gray-100 font-sans">
    <!-- Toast Notification Overlay -->
    <ToastNotification ref="toastRef" />

    <!-- Header Navbar -->
    <header class="glass-panel sticky top-0 z-50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyberViolet to-cyberCyan flex items-center justify-center shadow-lg shadow-cyberViolet/30">
          <Shield class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-cyberCyan glow-purple">
            Nyx Panel
          </h1>
          <p class="text-xs text-gray-400">سامانه مدیریت ضد فیلترینگ و قطعی شبکه ملی</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="hidden md:flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
            activeTab === tab.id 
              ? 'bg-cyberViolet text-white shadow-lg shadow-cyberViolet/40' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
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
          class="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 transition-all"
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
          activeTab === tab.id ? 'bg-cyberViolet text-white shadow-lg shadow-cyberViolet/40' : 'text-gray-400 bg-white/5'
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
        <span>توسعه‌داده‌شده توسط <strong class="text-cyberCyan font-bold">تیم امنیتی ساینت (Cynet)</strong></span>
      </div>

      <div class="flex items-center gap-4 text-xs">
        <a href="https://t.me/cynetx" target="_blank" class="text-gray-400 hover:text-cyberCyan transition-all flex items-center gap-1">
          📢 کانال تلگرام (cynetx)
        </a>
        <span class="text-gray-700">•</span>
        <a href="https://www.youtube.com/@cynetxir" target="_blank" class="text-gray-400 hover:text-cyberPink transition-all flex items-center gap-1">
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
  return window.location.pathname.startsWith('/subinfo/');
});

const tabs = [
  { id: 'dashboard', name: 'داشبورد', icon: LayoutDashboard },
  { id: 'users', name: 'کاربران', icon: Users },
  { id: 'inbounds', name: 'اینباندها', icon: Network },
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
