<template>
  <div class="space-y-6">
    <!-- Header Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">مدیریت کاربران و اشتراک‌ها</h2>
        <p class="text-sm text-gray-400">تعریف کاربران جدید، مدیریت حجم مصرفی و دریافت لینک‌های اختصاصی</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyberViolet to-cyberPink text-white font-semibold text-sm shadow-lg shadow-cyberViolet/30 hover:opacity-90 transition-all"
      >
        <UserPlus class="w-4 h-4" />
        ساخت کاربر جدید
      </button>
    </div>

    <!-- User List Table / Cards -->
    <div class="glass-panel rounded-3xl overflow-hidden border border-white/10">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px] text-right border-collapse">
          <thead>
            <tr class="bg-white/5 border-b border-white/10 text-xs text-gray-400 font-semibold">
              <th class="p-4">نام کاربر</th>
              <th class="p-4">شناسه اختصاصی (UUID)</th>
              <th class="p-4">مصرف / سقف حجم</th>
              <th class="p-4">تاریخ پایان اعتبار</th>
              <th class="p-4">وضعیت</th>
              <th class="p-4 text-center">دریافت کانفیگ و اشتراک</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-sm">
            <tr v-for="user in users" :key="user.id" class="hover:bg-white/5 transition-colors">
              <td class="p-4 font-semibold text-white flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-cyberViolet/20 text-cyberViolet flex items-center justify-center font-bold text-xs font-mono">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                {{ user.username }}
              </td>
              <td class="p-4 font-mono text-xs text-gray-400" dir="ltr">{{ user.uuid }}</td>
              <td class="p-4">
                <span class="text-white font-mono" dir="ltr">{{ (Number(user.usedDataBytes) / (1024*1024*1024)).toFixed(2) }} GB</span>
                <span class="text-gray-500 text-xs mr-1">/ {{ user.dataLimitGb > 0 ? user.dataLimitGb + ' GB' : 'نامحدود' }}</span>
              </td>
              <td class="p-4 text-xs text-gray-300">
                {{ user.expireDate ? new Date(user.expireDate).toLocaleDateString('fa-IR') : 'بدون انقضا' }}
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
                <button @click="openConfigModal(user)" class="px-3 py-1.5 rounded-xl bg-cyberViolet/20 text-cyberViolet hover:bg-cyberViolet/30 text-xs font-semibold flex items-center gap-1 transition-all">
                  <Download class="w-3.5 h-3.5" />
                  دریافت کانفیگ
                </button>
                <button @click="openSubModal(user)" class="px-3 py-1.5 rounded-xl bg-cyberCyan/20 text-cyberCyan hover:bg-cyberCyan/30 text-xs font-semibold flex items-center gap-1 transition-all">
                  <QrCode class="w-3.5 h-3.5" />
                  لینک ساب
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
                هیچ کاربری ثبت نشده است. با زدن دکمه «ساخت کاربر جدید» اولین کاربر را تعریف کنید.
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
              dir="ltr"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberViolet outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-400 mb-1">سقف حجم (گیگابایت)</label>
              <input 
                v-model="newUser.dataLimitGb"
                type="number" 
                placeholder="0 برای نامحدود"
                dir="ltr"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberViolet outline-none"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">مدت اعتبار (روز)</label>
              <input 
                v-model="newUser.expireDays"
                type="number" 
                placeholder="30"
                dir="ltr"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberViolet outline-none"
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
            ذخیره و ساخت اتصال
          </button>
        </div>
      </div>
    </div>

    <!-- VPN Config Modal -->
    <div v-if="selectedUserForConfig" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-2xl w-full rounded-3xl p-6 border border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white">🔑 کانفیگ‌های خروجی: {{ selectedUserForConfig.username }}</h3>
          <button @click="selectedUserForConfig = null" class="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <!-- ISP Selector -->
        <div class="flex flex-wrap items-center gap-2 p-3 bg-white/5 rounded-2xl">
          <span class="text-xs text-gray-400">تنظیم هوشمند برای اپراتور:</span>
          <button v-for="isp in ispOptions" :key="isp.id" @click="selectedConfigIsp = isp.id; loadConfigs()" :class="['px-3 py-1.5 rounded-xl text-xs font-medium transition-all', selectedConfigIsp === isp.id ? isp.activeClass : 'bg-white/5 text-gray-400 hover:text-white']">
            {{ isp.label }}
          </button>
        </div>

        <div v-if="configLoading" class="flex items-center justify-center py-8">
          <div class="w-6 h-6 border-2 border-cyberViolet border-t-transparent rounded-full animate-spin"></div>
          <span class="mr-3 text-gray-400 text-sm">در حال تولید فرمت‌های مختلف کانفیگ…</span>
        </div>

        <div v-if="userConfigs && !configLoading" class="space-y-4">
          <!-- Tab switcher -->
          <div class="flex items-center gap-1 bg-white/5 p-1 rounded-2xl">
            <button v-for="tab in configTabs" :key="tab.id" @click="activeConfigTab = tab.id" :class="['flex-1 py-1.5 rounded-xl text-xs font-medium transition-all', activeConfigTab === tab.id ? 'bg-cyberViolet text-white shadow-lg' : 'text-gray-400 hover:text-white']">
              {{ tab.label }}
            </button>
          </div>

          <!-- VLESS Links (LTR Fixed) -->
          <div v-if="activeConfigTab === 'vless'" class="space-y-3">
            <div v-for="(link, i) in userConfigs.vlessLinks" :key="i" class="bg-black/40 rounded-2xl p-3 border border-white/5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-cyberCyan font-semibold">لینک مستقیم VLESS (اینباند {{ i + 1 }})</span>
                <button @click="copy(link)" class="px-3 py-1 rounded-lg bg-cyberViolet/30 text-cyberViolet hover:bg-cyberViolet/50 text-xs transition-all">کپی لینک</button>
              </div>
              <pre dir="ltr" class="text-[11px] font-mono text-gray-200 break-all whitespace-pre-wrap text-left p-2.5 bg-black/60 rounded-xl border border-white/5 leading-relaxed">{{ link }}</pre>
            </div>
            <div class="p-3 bg-white/5 rounded-2xl space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-cyberGreen font-semibold">لینک سابسکریپشن کدگذاری شده (Base64)</span>
                <button @click="copy(userConfigs.base64Sub)" class="px-3 py-1 rounded-lg bg-cyberGreen/20 text-cyberGreen hover:bg-cyberGreen/30 text-xs transition-all">کپی سابسکریپشن</button>
              </div>
              <input readonly :value="userConfigs.subUrl" dir="ltr" class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left text-cyberCyan outline-none" />
            </div>
          </div>

          <!-- Clash YAML (LTR Fixed) -->
          <div v-if="activeConfigTab === 'clash'" class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">فایل تنظیمات کامل آماده برای Clash Meta / Stash / Mihomo</p>
              <button @click="copy(userConfigs.clashYaml)" class="px-3 py-1 rounded-xl bg-cyberCyan/20 text-cyberCyan text-xs font-semibold">کپی کامل فایل YAML</button>
            </div>
            <pre dir="ltr" class="bg-black/60 p-4 rounded-2xl text-[11px] font-mono text-cyberGreen text-left overflow-x-auto border border-white/5 max-h-72 leading-relaxed">{{ userConfigs.clashYaml }}</pre>
          </div>

          <!-- Sing-Box JSON (LTR Fixed) -->
          <div v-if="activeConfigTab === 'singbox'" class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">فایل تنظیمات JSON کامل برای نرم‌افزارهای Sing-Box / NekoBox / Hiddify</p>
              <button @click="copy(JSON.stringify(userConfigs.singboxJson, null, 2))" class="px-3 py-1 rounded-xl bg-cyberViolet/20 text-cyberViolet text-xs font-semibold">کپی کامل JSON</button>
            </div>
            <pre dir="ltr" class="bg-black/60 p-4 rounded-2xl text-[11px] font-mono text-cyberCyan text-left overflow-x-auto border border-white/5 max-h-72 leading-relaxed">{{ JSON.stringify(userConfigs.singboxJson, null, 2) }}</pre>
          </div>

          <!-- QR Code -->
          <div v-if="activeConfigTab === 'qr'" class="flex flex-col items-center gap-4 py-2">
            <div v-for="(link, i) in userConfigs.vlessLinks" :key="i" class="flex flex-col items-center gap-2">
              <p class="text-xs text-gray-300">اسکن بارکد لینک {{ i + 1 }}</p>
              <div class="bg-white p-3.5 rounded-2xl shadow-xl">
                <QrcodeVue :value="link" :size="160" />
              </div>
            </div>
          </div>
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
          <label class="block text-xs text-gray-400">انتخاب اپراتور (جهت تنظیم خودکار ترفند Fragment):</label>
          <div class="flex flex-wrap items-center gap-2">
            <button 
              @click="selectedIsp = 'MCI'"
              :class="['px-3 py-1.5 rounded-xl text-xs font-medium transition-all', selectedIsp === 'MCI' ? 'bg-cyberPink text-white' : 'bg-white/5 text-gray-400']"
            >
              همراه اول
            </button>
            <button 
              @click="selectedIsp = 'IRANCELL'"
              :class="['px-3 py-1.5 rounded-xl text-xs font-medium transition-all', selectedIsp === 'IRANCELL' ? 'bg-cyberCyan text-white' : 'bg-white/5 text-gray-400']"
            >
              ایرانسل
            </button>
            <button 
              @click="selectedIsp = 'WHITE_SNI'"
              :class="['px-3 py-1.5 rounded-xl text-xs font-medium transition-all', selectedIsp === 'WHITE_SNI' ? 'bg-cyberGreen text-black font-bold' : 'bg-white/5 text-gray-400']"
            >
              ⚡ SNI سفید (زمان قطعی نت)
            </button>
            <button 
              @click="selectedIsp = 'DEFAULT'"
              :class="['px-3 py-1.5 rounded-xl text-xs font-medium transition-all', selectedIsp === 'DEFAULT' ? 'bg-cyberViolet text-white' : 'bg-white/5 text-gray-400']"
            >
              عمومی
            </button>
          </div>

          <div class="pt-2">
            <label class="block text-xs text-gray-400 mb-1">لینک مستقیم اشتراک:</label>
            <div class="flex items-center gap-2">
              <input 
                readonly
                :value="getSubUrl(selectedUserForSub.uuid, selectedIsp)"
                dir="ltr"
                class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left text-cyberCyan outline-none"
              />
              <button 
                @click="copyToClipboard(getSubUrl(selectedUserForSub.uuid, selectedIsp))"
                class="px-3.5 py-2 rounded-xl bg-cyberViolet text-white text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Copy class="w-3.5 h-3.5" />
                کپی
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl">
          <QrcodeVue :value="getSubUrl(selectedUserForSub.uuid, selectedIsp)" :size="180" />
          <p class="text-xs text-gray-800 font-semibold mt-2">اسکن هوشمند توسط Sing-Box, V2rayN یا Shadowrocket</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { UserPlus, Trash2, QrCode, Copy, Download } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';

const users = ref<any[]>([]);
const showCreateModal = ref(false);
const selectedUserForSub = ref<any>(null);
const selectedIsp = ref('MCI');

// VPN Config Modal state
const selectedUserForConfig = ref<any>(null);
const userConfigs = ref<any>(null);
const configLoading = ref(false);
const selectedConfigIsp = ref('DEFAULT');
const activeConfigTab = ref('vless');

const configTabs = [
  { id: 'vless', label: '🔗 لینک مستقیم VLESS' },
  { id: 'clash', label: '⚡ Clash Meta' },
  { id: 'singbox', label: '📦 Sing-Box' },
  { id: 'qr', label: '📱 بارکد QR' },
];

const ispOptions = [
  { id: 'DEFAULT', label: '🌐 عمومی', activeClass: 'bg-cyberViolet text-white' },
  { id: 'MCI', label: '📱 همراه اول', activeClass: 'bg-cyberPink text-white' },
  { id: 'IRANCELL', label: '📡 ایرانسل', activeClass: 'bg-cyberCyan text-black' },
  { id: 'WHITE_SNI', label: '⚡ SNI سفید (زمان قطعی نت)', activeClass: 'bg-cyberGreen text-black font-bold' },
];

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();
const newUser = ref({ username: '', dataLimitGb: 0, expireDays: 30 });

async function fetchUsers() {
  try { const res = await axios.get('/api/users'); users.value = res.data; }
  catch (err) { console.error('Failed to fetch users:', err); }
}

async function createUser() {
  if (!newUser.value.username) return;
  try {
    await axios.post('/api/users', newUser.value);
    showCreateModal.value = false;
    newUser.value = { username: '', dataLimitGb: 0, expireDays: 30 };
    props.toast?.('کاربر جدید با موفقیت ساخته شد', 'success');
    fetchUsers();
  } catch (err: any) { props.toast?.(err?.response?.data?.error || 'خطا در ساخت کاربر جدید', 'error'); }
}

async function deleteUser(id: string) {
  if (!confirm('آیا از حذف این کاربر اطمینان دارید؟')) return;
  try {
    await axios.delete(`/api/users/${id}`);
    props.toast?.('کاربر با موفقیت حذف شد', 'success');
    fetchUsers();
  }
  catch (err) { props.toast?.('خطا در حذف کاربر', 'error'); }
}

async function openConfigModal(user: any) {
  selectedUserForConfig.value = user;
  selectedConfigIsp.value = 'DEFAULT';
  activeConfigTab.value = 'vless';
  await loadConfigs();
}

async function loadConfigs() {
  if (!selectedUserForConfig.value) return;
  configLoading.value = true;
  userConfigs.value = null;
  try {
    const res = await axios.get(`/api/users/${selectedUserForConfig.value.id}/configs?isp=${selectedConfigIsp.value}`);
    userConfigs.value = res.data;
  } catch (err) { console.error('Failed to load configs:', err); }
  finally { configLoading.value = false; }
}

function copy(text: string) {
  navigator.clipboard.writeText(text);
  props.toast?.('محتوا در حافظه کپی شد.', 'success');
}

function openSubModal(user: any) { selectedUserForSub.value = user; }

function getSubUrl(uuid: string, isp: string) {
  const host = window.location.host;
  return `http://${host}/api/sub/${uuid}?isp=${isp}`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  props.toast?.('لینک سابسکریپشن کپی شد.', 'success');
}

onMounted(fetchUsers);
</script>