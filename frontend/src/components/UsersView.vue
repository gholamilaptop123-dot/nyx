<template>
  <div class="space-y-6">
    <!-- Header Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">مدیریت کاربران</h2>
        <p class="text-sm text-gray-400">افزودن کاربر جدید، تنظیم حجم و دریافت لینک سابسکریپشن هوشمند</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyberViolet to-cyberPink text-white font-semibold text-sm shadow-lg shadow-cyberViolet/30 hover:opacity-90 transition-all"
      >
        <UserPlus class="w-4 h-4" />
        افزودن کاربر جدید
      </button>
    </div>

    <!-- User List Table / Cards -->
    <div class="glass-panel rounded-3xl overflow-hidden border border-white/10">
      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-white/5 border-b border-white/10 text-xs text-gray-400 font-semibold">
              <th class="p-4">نام کاربر</th>
              <th class="p-4">شناسه UUID</th>
              <th class="p-4">حجم مصرفی</th>
              <th class="p-4">تاریخ انقضا</th>
              <th class="p-4">وضعیت</th>
              <th class="p-4 text-center">عملیات & لینک ساب</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-sm">
            <tr v-for="user in users" :key="user.id" class="hover:bg-white/5 transition-colors">
              <td class="p-4 font-semibold text-white flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-cyberViolet/20 text-cyberViolet flex items-center justify-center font-bold text-xs">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                {{ user.username }}
              </td>
              <td class="p-4 font-mono text-xs text-gray-400">{{ user.uuid }}</td>
              <td class="p-4">
                <span class="text-white font-mono">{{ (Number(user.usedDataBytes) / (1024*1024*1024)).toFixed(2) }} GB</span>
                <span class="text-gray-500 text-xs mr-1">/ {{ user.dataLimitGb > 0 ? user.dataLimitGb + ' GB' : 'نامحدود' }}</span>
              </td>
              <td class="p-4 text-xs text-gray-300">
                {{ user.expireDate ? new Date(user.expireDate).toLocaleDateString('fa-IR') : 'نامحدود' }}
              </td>
              <td class="p-4">
                <span :class="[
                  'px-3 py-1 text-xs rounded-full font-medium inline-block',
                  user.status === 'ACTIVE' ? 'bg-cyberGreen/20 text-cyberGreen' : 'bg-red-500/20 text-red-400'
                ]">
                  {{ user.status === 'ACTIVE' ? 'فعال' : 'غیرفعال' }}
                </span>
              </td>
              <td class="p-4 flex items-center justify-center gap-2">
                <button 
                  @click="openSubModal(user)"
                  class="px-3 py-1.5 rounded-xl bg-cyberCyan/20 text-cyberCyan hover:bg-cyberCyan/30 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <QrCode class="w-3.5 h-3.5" />
                  لینک ساب & QR
                </button>
                <button 
                  @click="deleteUser(user.id)"
                  class="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-all"
                  title="حذف کاربر"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>

            <tr v-if="users.length === 0">
              <td colspan="6" class="p-8 text-center text-gray-400 text-sm">
                هیچ کاربری ثبت نشده است. با زدن دکمه «افزودن کاربر جدید» اولین کاربر را بسازید.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-md w-full rounded-3xl p-6 border border-white/10 space-y-4">
        <h3 class="text-lg font-bold text-white">افزودن کاربر جدید</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs text-gray-400 mb-1">نام کاربر (انگلیسی)</label>
            <input 
              v-model="newUser.username"
              type="text" 
              placeholder="مثال: ali_user"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-400 mb-1">سقف حجم (گیگابایت)</label>
              <input 
                v-model="newUser.dataLimitGb"
                type="number" 
                placeholder="0 برای نامحدود"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">مدت اعتبار (روز)</label>
              <input 
                v-model="newUser.expireDays"
                type="number" 
                placeholder="30"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberViolet outline-none"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button 
            @click="showCreateModal = false"
            class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
          >
            انصراف
          </button>
          <button 
            @click="createUser"
            class="px-5 py-2 rounded-xl bg-cyberViolet text-white text-xs font-semibold shadow-lg shadow-cyberViolet/40 hover:opacity-90"
          >
            ذخیره و ساخت کانفیگ
          </button>
        </div>
      </div>
    </div>

    <!-- Subscription & QR Modal -->
    <div v-if="selectedUserForSub" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-lg w-full rounded-3xl p-6 border border-white/10 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white">لینک سابسکریپشن: {{ selectedUserForSub.username }}</h3>
          <button @click="selectedUserForSub = null" class="text-gray-400 hover:text-white">✕</button>
        </div>

        <div class="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
          <label class="block text-xs text-gray-400">انتخاب اپراتور (برای تنظیم هوشمند Fragment):</label>
          <div class="flex items-center gap-2">
            <button 
              @click="selectedIsp = 'MCI'"
              :class="['px-3 py-1.5 rounded-xl text-xs font-medium', selectedIsp === 'MCI' ? 'bg-cyberPink text-white' : 'bg-white/5 text-gray-400']"
            >
              همراه اول
            </button>
            <button 
              @click="selectedIsp = 'IRANCELL'"
              :class="['px-3 py-1.5 rounded-xl text-xs font-medium', selectedIsp === 'IRANCELL' ? 'bg-cyberCyan text-white' : 'bg-white/5 text-gray-400']"
            >
              ایرانسل
            </button>
            <button 
              @click="selectedIsp = 'WHITE_SNI'"
              :class="['px-3 py-1.5 rounded-xl text-xs font-medium', selectedIsp === 'WHITE_SNI' ? 'bg-cyberGreen text-white font-bold animate-pulse' : 'bg-white/5 text-gray-400']"
            >
              ⚡ SNI سفید (زمان قطعی نت)
            </button>
            <button 
              @click="selectedIsp = 'DEFAULT'"
              :class="['px-3 py-1.5 rounded-xl text-xs font-medium', selectedIsp === 'DEFAULT' ? 'bg-cyberViolet text-white' : 'bg-white/5 text-gray-400']"
            >
              عمومی
            </button>
          </div>

          <div class="pt-2">
            <label class="block text-xs text-gray-400 mb-1">لینک سابسکریپشن کامل:</label>
            <div class="flex items-center gap-2">
              <input 
                readonly
                :value="getSubUrl(selectedUserForSub.uuid, selectedIsp)"
                class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyberCyan outline-none"
              />
              <button 
                @click="copyToClipboard(getSubUrl(selectedUserForSub.uuid, selectedIsp))"
                class="px-3 py-2 rounded-xl bg-cyberViolet text-white text-xs font-semibold flex items-center gap-1"
              >
                <Copy class="w-3.5 h-3.5" />
                کپی
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl">
          <QrcodeVue :value="getSubUrl(selectedUserForSub.uuid, selectedIsp)" :size="180" />
          <p class="text-xs text-gray-800 font-semibold mt-2">اسکن در نرم‌افزار Sing-Box, V2rayN یا Shadowrocket</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { UserPlus, Trash2, QrCode, Copy } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';

const users = ref<any[]>([]);
const showCreateModal = ref(false);
const selectedUserForSub = ref<any>(null);
const selectedIsp = ref('MCI');

const newUser = ref({
  username: '',
  dataLimitGb: 0,
  expireDays: 30
});

async function fetchUsers() {
  try {
    const res = await axios.get('/api/users');
    users.value = res.data;
  } catch (err) {
    console.error('Failed to fetch users:', err);
  }
}

async function createUser() {
  if (!newUser.value.username) return;
  try {
    await axios.post('/api/users', newUser.value);
    showCreateModal.value = false;
    newUser.value = { username: '', dataLimitGb: 0, expireDays: 30 };
    fetchUsers();
  } catch (err) {
    alert('خطا در ساخت کاربر');
  }
}

async function deleteUser(id: string) {
  if (!confirm('آیا از حذف این کاربر اطمینان دارید؟')) return;
  try {
    await axios.delete(`/api/users/${id}`);
    fetchUsers();
  } catch (err) {
    alert('خطا در حذف کاربر');
  }
}

function openSubModal(user: any) {
  selectedUserForSub.value = user;
}

function getSubUrl(uuid: string, isp: string) {
  const host = window.location.host;
  return `http://${host}/api/sub/${uuid}?isp=${isp}`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  alert('لینک سابسکریپشن با موفقیت کپی شد!');
}

onMounted(() => {
  fetchUsers();
});
</script>
