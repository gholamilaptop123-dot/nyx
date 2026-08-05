<template>
  <div class="min-h-screen flex flex-col bg-darkBg text-gray-100 font-sans">
    <!-- Header Navbar -->
    <header class="glass-panel sticky top-0 z-50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyberViolet to-cyberCyan flex items-center justify-center shadow-lg shadow-cyberViolet/30">
          <Shield class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-cyberCyan glow-purple">
            AegisX Panel
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

      <!-- Status Indicator -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyberGreen/10 border border-cyberGreen/30 text-cyberGreen text-xs font-semibold">
          <span class="w-2 h-2 rounded-full bg-cyberGreen animate-ping"></span>
          آماده عبور از قطعی نت
        </div>
      </div>
    </header>

    <!-- Mobile Subnav -->
    <nav class="md:hidden flex items-center justify-around bg-darkBg border-b border-white/10 p-2">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex flex-col items-center gap-1 p-2 text-xs font-medium rounded-lg',
          activeTab === tab.id ? 'text-cyberViolet font-bold' : 'text-gray-400'
        ]"
      >
        <component :is="tab.icon" class="w-5 h-5" />
        {{ tab.name }}
      </button>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
      <DashboardView v-if="activeTab === 'dashboard'" />
      <UsersView v-if="activeTab === 'users'" />
      <InboundsView v-if="activeTab === 'inbounds'" />
      <NodesView v-if="activeTab === 'nodes'" />
      <TunnelsView v-if="activeTab === 'tunnels'" />
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/5 py-4 px-6 text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center gap-2">
      <span>AegisX v1.0.0 - طراحی ویژه لینوکس و شرایط سخت فیلترینگ ایران</span>
      <span>مبتنی بر هسته Xray-core & Gost v3</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Shield, LayoutDashboard, Users, Server, Zap, Network } from 'lucide-vue-next';
import DashboardView from './components/DashboardView.vue';
import UsersView from './components/UsersView.vue';
import InboundsView from './components/InboundsView.vue';
import NodesView from './components/NodesView.vue';
import TunnelsView from './components/TunnelsView.vue';

const activeTab = ref('dashboard');

const tabs = [
  { id: 'dashboard', name: 'داشبورد', icon: LayoutDashboard },
  { id: 'users', name: 'کاربران', icon: Users },
  { id: 'inbounds', name: 'اینباندها', icon: Network },
  { id: 'nodes', name: 'سرورها و نودها', icon: Server },
  { id: 'tunnels', name: 'تونل قطعی نت', icon: Zap },
];
</script>
