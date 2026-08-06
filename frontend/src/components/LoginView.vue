<template>
  <div class="min-h-screen flex items-center justify-center bg-darkBg text-gray-100 px-4">
    <div class="glass-panel max-w-md w-full p-8 rounded-3xl border border-cyberViolet/30 space-y-6 shadow-2xl relative overflow-hidden">
      <!-- Ambient Glow -->
      <div class="absolute -top-20 -right-20 w-40 h-40 bg-cyberViolet/20 blur-3xl rounded-full"></div>
      <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-cyberCyan/20 blur-3xl rounded-full"></div>

      <div class="text-center space-y-2 relative z-10">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyberViolet to-cyberCyan flex items-center justify-center shadow-lg shadow-cyberViolet/40">
          <Shield class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-cyberCyan">
          ورود به Nyx Panel
        </h2>
        <p class="text-xs text-gray-400">سامانه مدیریت ضد فیلترینگ و قطعی شبکه ملی</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4 relative z-10">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-300">نام کاربری ادمین</label>
          <div class="relative">
            <User class="w-4 h-4 absolute right-3.5 top-3 text-gray-400" />
            <input 
              v-model="username" 
              type="text" 
              placeholder="admin" 
              required
              class="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyberCyan outline-none"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-300">کلمه عبور</label>
          <div class="relative">
            <Lock class="w-4 h-4 absolute right-3.5 top-3 text-gray-400" />
            <input 
              v-model="password" 
              type="password" 
              placeholder="••••••••" 
              required
              class="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyberCyan outline-none"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3 rounded-xl bg-gradient-to-r from-cyberViolet to-cyberCyan text-white font-bold text-xs shadow-lg shadow-cyberViolet/30 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw v-if="loading" class="w-4 h-4 animate-spin" />
          <span>{{ loading ? 'در حال بررسی…' : 'ورود به داشبورد' }}</span>
        </button>
      </form>

      <div class="text-center space-y-2 border-t border-white/5 pt-4 text-xs text-gray-400">
        <p>توسعه‌داده‌شده توسط <strong class="text-cyberCyan font-bold">تیم امنیتی ساینت (Cynet)</strong></p>
        <div class="flex items-center justify-center gap-3 text-[11px]">
          <a href="https://t.me/cynetx" target="_blank" class="hover:text-cyberCyan transition-colors">📢 تلگرام</a>
          <span>•</span>
          <a href="https://www.youtube.com/@cynetxir" target="_blank" class="hover:text-cyberPink transition-colors">🎥 یوتیوب</a>
          <span>•</span>
          <a href="https://cynetx.ir" target="_blank" class="hover:text-cyberGreen transition-colors font-mono">🌐 cynetx.ir</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { Shield, User, Lock, RefreshCw } from 'lucide-vue-next';

const emit = defineEmits(['loggedIn']);

const username = ref('admin');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

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
    errorMsg.value = err?.response?.data?.error || 'خطا در ارتباط با سرور.';
  } finally {
    loading.value = false;
  }
}
</script>
