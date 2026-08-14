<template>
  <div class="min-h-screen flex items-center justify-center bg-darkBg text-gray-100 px-4 relative overflow-hidden selection:bg-amber-400/30 selection:text-amber-200">
    <!-- Ambient Background Light Drops -->
    <div class="absolute -top-32 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Language Switcher in Login Screen -->
    <div class="absolute top-5 right-5 sm:top-6 sm:right-6 z-20">
      <button 
        @click="toggleLanguage" 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold border border-white/[0.08] text-amber-300 transition-all hover:border-amber-400/30"
      >
        <Globe class="w-3.5 h-3.5 text-amber-400" />
        <span class="text-[11px]">{{ currentLang === 'en' ? '🇮🇷 فارسی' : '🇺🇸 EN' }}</span>
      </button>
    </div>

    <div class="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border border-white/[0.08] space-y-6 shadow-2xl relative z-10">
      <div class="text-center space-y-2.5">
        <img src="/logo_trans.png" alt="Nyx Panel Logo" class="w-24 h-24 sm:w-28 sm:h-28 mx-auto object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 transition-all duration-300" />
        <h2 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 tracking-wide">
          {{ t('loginTitle') }}
        </h2>
        <p class="text-xs text-gray-400 font-mono">{{ t('loginSub') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-300">{{ t('usernameLabel') }}</label>
          <div class="relative">
            <User class="w-4 h-4 absolute ltr:left-3.5 rtl:right-3.5 top-3 text-gray-400" />
            <input 
              v-model="username" 
              type="text" 
              placeholder="admin" 
              required
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-10 py-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-400/60 outline-none"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-300">{{ t('passwordLabel') }}</label>
          <div class="relative">
            <Lock class="w-4 h-4 absolute ltr:left-3.5 rtl:right-3.5 top-3 text-gray-400" />
            <input 
              v-model="password" 
              type="password" 
              placeholder="••••••••" 
              required
              class="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-10 py-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-400/60 outline-none"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/25 hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw v-if="loading" class="w-4 h-4 animate-spin text-gray-950" />
          <span>{{ loading ? t('authenticating') : t('loginButton') }}</span>
        </button>
      </form>

      <div class="text-center space-y-2 border-t border-white/[0.06] pt-4 text-xs text-gray-400">
        <p class="text-gray-400">{{ t('byCynet') }}</p>
        <div class="flex items-center justify-center gap-3 text-[11px]">
          <a href="https://t.me/cynetx" target="_blank" class="hover:text-amber-300 transition-colors">📢 Telegram</a>
          <span class="text-gray-600">•</span>
          <a href="https://www.youtube.com/@cynetxir" target="_blank" class="hover:text-rose-400 transition-colors">🎥 YouTube</a>
          <span class="text-gray-600">•</span>
          <a href="https://cynetx.ir" target="_blank" class="hover:text-emerald-400 transition-colors font-mono">🌐 cynetx.ir</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { User, Lock, RefreshCw, Globe } from 'lucide-vue-next';
import { currentLang, setLanguage, t } from '../i18n';

const emit = defineEmits(['loggedIn']);

const username = ref('admin');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

function toggleLanguage() {
  const nextLang = currentLang.value === 'en' ? 'fa' : 'en';
  setLanguage(nextLang);
}

async function handleLogin() {
  loading.value = true;
  errorMsg.value = '';

  try {
    const res = await axios.post('/api/auth/login', {
      username: username.value,
      password: password.value
    });

    if (res.data.token) {
      localStorage.setItem('nyx_token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      emit('loggedIn');
    }
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.error || t('invalidAuth');
  } finally {
    loading.value = false;
  }
}
</script>
