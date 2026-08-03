<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">سرورها و نودها (Multi-Node)</h2>
        <p class="text-sm text-gray-400">مدیریت متمرکز سرورهای خارج و نودهای واسط داخل ایران (Relays)</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyberCyan text-black font-bold text-sm shadow-lg shadow-cyberCyan/30 hover:opacity-90 transition-all"
      >
        <Server class="w-4 h-4" />
        افزودن نود جدید
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="node in nodes" :key="node.id" class="glass-card p-5 rounded-3xl space-y-4 border border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="[
              'w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg',
              node.type === 'IRAN_RELAY' ? 'bg-cyberViolet/20 text-cyberViolet' : 'bg-cyberGreen/20 text-cyberGreen'
            ]">
              {{ node.type === 'IRAN_RELAY' ? '🇮🇷' : '🇪🇺' }}
            </div>
            <div>
              <h3 class="font-bold text-white text-base">{{ node.name }}</h3>
              <span class="text-xs text-gray-400 font-mono">{{ node.ip }}</span>
            </div>
          </div>
          <span :class="[
            'px-2.5 py-1 text-xs rounded-full font-semibold',
            node.status === 'ONLINE' ? 'bg-cyberGreen/20 text-cyberGreen' : 'bg-red-500/20 text-red-400'
          ]">
            {{ node.status === 'ONLINE' ? 'آنلاین' : 'آفلاین' }}
          </span>
        </div>

        <div class="p-3 rounded-2xl bg-white/5 space-y-1 text-xs">
          <div class="flex justify-between text-gray-400">
            <span>نوع نود:</span>
            <span class="text-white font-semibold">{{ node.type === 'IRAN_RELAY' ? 'ریلی ایران (Relay)' : 'سرور اصلی خارج (Kharej)' }}</span>
          </div>
          <div class="flex justify-between text-gray-400">
            <span>حالت تونل:</span>
            <span class="text-cyberCyan font-semibold">{{ node.tunnelType || 'مستقیم (None)' }}</span>
          </div>
        </div>
      </div>

      <div v-if="nodes.length === 0" class="col-span-full glass-panel p-8 rounded-3xl text-center text-gray-400 text-sm">
        هنوز هیچ نود اضافی ثبت نشده است. سرور اصلی به‌صورت خودکار در حال فعالیت است.
      </div>
    </div>

    <!-- Create Node Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-md w-full rounded-3xl p-6 border border-white/10 space-y-4">
        <h3 class="text-lg font-bold text-white">افزودن نود جدید</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs text-gray-400 mb-1">نام نود / سرور</label>
            <input 
              v-model="newNode.name"
              type="text" 
              placeholder="مثال: Iran-Asiatech-Relay-1"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberCyan outline-none"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">آدرس IP سرور</label>
            <input 
              v-model="newNode.ip"
              type="text" 
              placeholder="185.x.x.x"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberCyan outline-none"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">نوع سرور</label>
            <select 
              v-model="newNode.type"
              class="w-full bg-darkBg border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberCyan outline-none"
            >
              <option value="IRAN_RELAY">🇮🇷 سرور واسط ایران (Relay)</option>
              <option value="KHAREJ">🇪🇺 سرور خروجی خارج (Kharej Node)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateModal = false" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">انصراف</button>
          <button @click="createNode" class="px-5 py-2 rounded-xl bg-cyberCyan text-black text-xs font-bold shadow-lg shadow-cyberCyan/30">ثبت نود</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Server } from 'lucide-vue-next';

const nodes = ref<any[]>([]);
const showCreateModal = ref(false);
const newNode = ref({
  name: '',
  ip: '',
  type: 'IRAN_RELAY'
});

async function fetchNodes() {
  try {
    const res = await axios.get('/api/nodes');
    nodes.value = res.data;
  } catch (err) {
    console.error('Failed to fetch nodes:', err);
  }
}

async function createNode() {
  if (!newNode.value.name || !newNode.value.ip) return;
  try {
    await axios.post('/api/nodes', newNode.value);
    showCreateModal.value = false;
    newNode.value = { name: '', ip: '', type: 'IRAN_RELAY' };
    fetchNodes();
  } catch (err) {
    alert('خطا در ثبت نود');
  }
}

onMounted(() => {
  fetchNodes();
});
</script>
