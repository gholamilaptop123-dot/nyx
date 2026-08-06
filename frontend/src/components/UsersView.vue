<template>
  <div class="space-y-6">
    <!-- Header Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-cyberYellow glow-yellow">مدیریت کاربران و اشتراک‌ها</h2>
        <p class="text-sm text-gray-400">تعریف کاربر، محدودیت حجم، انقضا، تعداد دستگاه‌های همزمان و لینک اختصاصی اکانت</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyberYellow via-red-600 to-cyberRed text-black font-extrabold text-sm shadow-lg shadow-cyberYellow/20 hover:opacity-90 transition-all border border-cyberYellow/40"
      >
        <UserPlus class="w-4 h-4 text-black font-bold" />
        ساخت کاربر جدید
      </button>
    </div>

    <!-- User List Table / Cards -->
    <div class="glass-panel rounded-3xl overflow-hidden border border-cyberYellow/30">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[750px] text-right border-collapse">
          <thead>
            <tr class="bg-white/5 border-b border-cyberYellow/20 text-xs text-cyberYellow font-bold">
              <th class="p-4">نام کاربر</th>
              <th class="p-4">مصرف / سقف حجم</th>
              <th class="p-4">تاریخ انقضا</th>
              <th class="p-4">حد دستگاه همزمان</th>
              <th class="p-4">وضعیت</th>
              <th class="p-4 text-center">عملیات و دریافت اشتراک</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-sm">
            <tr v-for="user in users" :key="user.id" class="hover:bg-white/5 transition-colors">
              <td class="p-4 font-semibold text-white">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-2xl bg-cyberYellow/20 border border-cyberYellow/40 text-cyberYellow flex items-center justify-center font-bold text-xs font-mono">
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="block font-bold text-white">{{ user.username }}</span>
                    <span class="text-[10px] font-mono text-gray-400" dir="ltr">{{ user.uuid.substring(0, 18) }}…</span>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <span class="text-cyberYellow font-mono font-bold" dir="ltr">{{ (Number(user.usedDataBytes) / (1024*1024*1024)).toFixed(2) }} GB</span>
                <span class="text-gray-400 text-xs mr-1">/ {{ user.dataLimitGb > 0 ? user.dataLimitGb + ' GB' : 'نامحدود' }}</span>
              </td>
              <td class="p-4 text-xs text-gray-300">
                {{ user.expireDate ? new Date(user.expireDate).toLocaleDateString('fa-IR') : 'بدون انقضا' }}
              </td>
              <td class="p-4 text-xs font-mono text-white">
                {{ user.maxDevices || 2 }} کاربره
              </td>
              <td class="p-4">
                <span :class="[
                  'px-3 py-1 text-xs rounded-full font-bold inline-block',
                  user.status === 'ACTIVE' ? 'bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30' : 'bg-cyberRed/20 text-cyberRed border border-cyberRed/30'
                ]">
                  {{ user.status === 'ACTIVE' ? '🟢 فعال' : '🔴 غیرفعال' }}
                </span>
              </td>
              <td class="p-4 flex items-center justify-center gap-2">
                <button @click="openConfigModal(user)" class="px-3 py-1.5 rounded-xl bg-cyberYellow/20 border border-cyberYellow/40 text-cyberYellow hover:bg-cyberYellow/30 text-xs font-extrabold flex items-center gap-1 transition-all">
                  <Download class="w-3.5 h-3.5" />
                  کانفیگ‌ها
                </button>
                <button @click="openSubModal(user)" class="px-3 py-1.5 rounded-xl bg-cyberRed/20 border border-cyberRed/40 text-cyberRed hover:bg-cyberRed/30 text-xs font-extrabold flex items-center gap-1 transition-all">
                  <QrCode class="w-3.5 h-3.5" />
                  لینک ساب
                </button>
                <button @click="copyUserInfoLink(user)" class="px-3 py-1.5 rounded-xl bg-cyberGreen/20 border border-cyberGreen/40 text-cyberGreen hover:bg-cyberGreen/30 text-xs font-extrabold flex items-center gap-1 transition-all" title="لینک صفحه وب اختصاصی کاربر جهت مشاهده حجم و مشخصات اکانت">
                  <ExternalLink class="w-3.5 h-3.5" />
                  صفحه اکانت
                </button>
                <button @click="openEditModal(user)" class="p-1.5 rounded-xl bg-white/10 text-gray-300 hover:text-white text-xs transition-all" title="ویرایش کاربر">
                  <Edit3 class="w-4 h-4" />
                </button>
                <button @click="deleteUser(user.id)" class="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-all" title="حذف کاربر">
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
      <div class="glass-panel max-w-md w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4">
        <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
          <UserPlus class="w-5 h-5 text-cyberYellow" />
          <span>افزودن کاربر جدید</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-gray-400 mb-1">نام کاربر (انگلیسی)</label>
            <input 
              v-model="newUser.username"
              type="text" 
              placeholder="مثال: ali_user"
              dir="ltr"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">سقف حجم (گیگابایت)</label>
              <input 
                v-model="newUser.dataLimitGb"
                type="number" 
                placeholder="0 برای نامحدود"
                dir="ltr"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
              />
            </div>
            <div>
              <label class="block text-gray-400 mb-1">مدت اعتبار (روز)</label>
              <input 
                v-model="newUser.expireDays"
                type="number" 
                placeholder="30"
                dir="ltr"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">تعداد کاربر / دستگاه همزمان (IP Limit)</label>
            <select v-model="newUser.maxDevices" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option :value="1">۱ کاربره (تک کاربره)</option>
              <option :value="2">۲ کاربره (پیش‌فرض)</option>
              <option :value="3">۳ کاربره</option>
              <option :value="5">۵ کاربره</option>
              <option :value="10">۱۰ کاربره (گروهی)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateModal = false" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">انصراف</button>
          <button @click="createUser" class="px-5 py-2 rounded-xl bg-cyberYellow text-black text-xs font-bold shadow-lg shadow-cyberYellow/30 hover:opacity-90">
            ذخیره و ساخت اتصال
          </button>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="editingUser" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-md w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4">
        <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
          <Edit3 class="w-5 h-5 text-cyberYellow" />
          <span>ویرایش مشخصات کاربر: {{ editingUser.username }}</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">سقف حجم (گیگابایت)</label>
              <input v-model="editForm.dataLimitGb" type="number" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
            <div>
              <label class="block text-gray-400 mb-1">تمدید اعتبار (روز)</label>
              <input v-model="editForm.expireDays" type="number" placeholder="روزهای تمدید" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">تعداد کاربر / دستگاه همزمان</label>
            <select v-model="editForm.maxDevices" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option :value="1">۱ کاربره</option>
              <option :value="2">۲ کاربره</option>
              <option :value="3">۳ کاربره</option>
              <option :value="5">۵ کاربره</option>
              <option :value="10">۱۰ کاربره</option>
            </select>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">وضعیت اکانت</label>
            <select v-model="editForm.status" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="ACTIVE">🟢 فعال (ACTIVE)</option>
              <option value="DISABLED">🔴 غیرفعال (DISABLED)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="editingUser = null" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">انصراف</button>
          <button @click="saveUserEdit" class="px-5 py-2 rounded-xl bg-cyberYellow text-black text-xs font-bold shadow-lg shadow-cyberYellow/30 hover:opacity-90">
            ذخیره تغییرات
          </button>
        </div>
      </div>
    </div>

    <!-- VPN Config Modal -->
    <div v-if="selectedUserForConfig" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-2xl w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>🔑 دریافت کامل کانفیگ‌ها: {{ selectedUserForConfig.username }}</span>
          </h3>
          <button @click="selectedUserForConfig = null" class="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <!-- User Info Page Link Banner -->
        <div class="p-3.5 rounded-2xl bg-cyberGreen/10 border border-cyberGreen/30 flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2">
            <ExternalLink class="w-4 h-4 text-cyberGreen shrink-0" />
            <span class="text-gray-200">صفحه وب اختصاصی مشاهده حجم و انقضای کاربر:</span>
          </div>
          <button @click="copyUserInfoLink(selectedUserForConfig)" class="px-3 py-1 rounded-xl bg-cyberGreen text-black font-bold hover:opacity-90 transition-all shrink-0">
            کپی لینک صفحه کاربر
          </button>
        </div>

        <!-- ISP Selector -->
        <div class="flex flex-wrap items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
          <span class="text-xs text-gray-400">تنظیم خودکار برای اپراتور:</span>
          <button v-for="isp in ispOptions" :key="isp.id" @click="selectedConfigIsp = isp.id; loadConfigs()" :class="['px-3 py-1.5 rounded-xl text-xs font-medium transition-all', selectedConfigIsp === isp.id ? isp.activeClass : 'bg-white/5 text-gray-400 hover:text-white']">
            {{ isp.label }}
          </button>
        </div>

        <div v-if="configLoading" class="flex items-center justify-center py-8">
          <div class="w-6 h-6 border-2 border-cyberYellow border-t-transparent rounded-full animate-spin"></div>
          <span class="mr-3 text-gray-400 text-sm">در حال ساخت لینک‌های خروجی VLESS…</span>
        </div>

        <div v-if="userConfigs && !configLoading" class="space-y-4">
          <!-- Tab switcher -->
          <div class="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
            <button v-for="tab in configTabs" :key="tab.id" @click="activeConfigTab = tab.id" :class="['flex-1 py-2 rounded-xl text-xs font-bold transition-all', activeConfigTab === tab.id ? 'bg-cyberYellow text-black shadow-lg shadow-cyberYellow/20' : 'text-gray-400 hover:text-white']">
              {{ tab.label }}
            </button>
          </div>

          <!-- VLESS Links -->
          <div v-if="activeConfigTab === 'vless'" class="space-y-3">
            <div v-for="(link, i) in userConfigs.vlessLinks" :key="i" class="bg-black/50 rounded-2xl p-3.5 border border-cyberYellow/20">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-cyberYellow font-extrabold">لینک مستقیم VLESS (درگاه {{ i + 1 }})</span>
                <button @click="copy(link)" class="px-3 py-1 rounded-lg bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 hover:bg-cyberYellow/30 text-xs font-bold transition-all">کپی لینک VLESS</button>
              </div>
              <pre dir="ltr" class="text-[11px] font-mono text-gray-200 break-all whitespace-pre-wrap text-left p-3 bg-black/70 rounded-xl border border-white/10 leading-relaxed">{{ link }}</pre>
            </div>
            <div class="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-cyberGreen font-extrabold">لینک سابسکریپشن کدگذاری شده (Base64)</span>
                <button @click="copy(userConfigs.base64Sub)" class="px-3 py-1 rounded-lg bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 hover:bg-cyberGreen/30 text-xs font-bold transition-all">کپی سابسکریپشن</button>
              </div>
              <input readonly :value="userConfigs.subUrl" dir="ltr" class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left text-cyberYellow outline-none" />
            </div>
          </div>

          <!-- Clash YAML -->
          <div v-if="activeConfigTab === 'clash'" class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">فایل تنظیمات کامل آماده برای Clash Meta / Stash / Mihomo</p>
              <button @click="copy(userConfigs.clashYaml)" class="px-3 py-1 rounded-xl bg-cyberYellow text-black text-xs font-bold">کپی کامل فایل YAML</button>
            </div>
            <pre dir="ltr" class="bg-black/70 p-4 rounded-2xl text-[11px] font-mono text-cyberGreen text-left overflow-x-auto border border-white/10 max-h-72 leading-relaxed">{{ userConfigs.clashYaml }}</pre>
          </div>

          <!-- Sing-Box JSON -->
          <div v-if="activeConfigTab === 'singbox'" class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">فایل تنظیمات JSON کامل برای Sing-Box / NekoBox / Hiddify</p>
              <button @click="copy(JSON.stringify(userConfigs.singboxJson, null, 2))" class="px-3 py-1 rounded-xl bg-cyberYellow text-black text-xs font-bold">کپی کامل JSON</button>
            </div>
            <pre dir="ltr" class="bg-black/70 p-4 rounded-2xl text-[11px] font-mono text-cyberYellow text-left overflow-x-auto border border-white/10 max-h-72 leading-relaxed">{{ JSON.stringify(userConfigs.singboxJson, null, 2) }}</pre>
          </div>

          <!-- QR Code -->
          <div v-if="activeConfigTab === 'qr'" class="flex flex-col items-center gap-4 py-2">
            <div v-for="(link, i) in userConfigs.vlessLinks" :key="i" class="flex flex-col items-center gap-2">
              <p class="text-xs text-gray-300 font-bold">اسکن بارکد لینک VLESS درگاه {{ i + 1 }}</p>
              <div class="bg-white p-4 rounded-2xl shadow-2xl">
                <QrcodeVue :value="link" :size="180" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscription & QR Modal -->
    <div v-if="selectedUserForSub" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-lg w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white">لینک سابسکریپشن: {{ selectedUserForSub.username }}</h3>
          <button @click="selectedUserForSub = null" class="text-gray-400 hover:text-white">✕</button>
        </div>

        <div class="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 text-xs">
          <label class="block text-gray-400">انتخاب اپراتور (جهت تنظیم خودکار ترفند Fragment):</label>
          <div class="flex flex-wrap items-center gap-2">
            <button @click="selectedIsp = 'MCI'" :class="['px-3 py-1.5 rounded-xl font-medium transition-all', selectedIsp === 'MCI' ? 'bg-cyberYellow text-black font-bold' : 'bg-white/5 text-gray-400']">همراه اول</button>
            <button @click="selectedIsp = 'IRANCELL'" :class="['px-3 py-1.5 rounded-xl font-medium transition-all', selectedIsp === 'IRANCELL' ? 'bg-cyberRed text-white font-bold' : 'bg-white/5 text-gray-400']">ایرانسل</button>
            <button @click="selectedIsp = 'WHITE_SNI'" :class="['px-3 py-1.5 rounded-xl font-medium transition-all', selectedIsp === 'WHITE_SNI' ? 'bg-cyberGreen text-black font-bold' : 'bg-white/5 text-gray-400']">⚡ SNI سفید</button>
          </div>

          <div class="space-y-2 pt-2">
            <label class="block text-gray-400">لینک سابسکریپشن مستقیم:</label>
            <div class="flex items-center gap-2">
              <input readonly :value="getSubUrl(selectedUserForSub.uuid, selectedIsp)" dir="ltr" class="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left text-cyberYellow outline-none" />
              <button @click="copyToClipboard(getSubUrl(selectedUserForSub.uuid, selectedIsp))" class="px-4 py-2 rounded-xl bg-cyberYellow text-black font-bold text-xs flex items-center gap-1">
                <Copy class="w-3.5 h-3.5" />
                کپی
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-2xl">
          <QrcodeVue :value="getSubUrl(selectedUserForSub.uuid, selectedIsp)" :size="180" />
          <p class="text-xs text-gray-800 font-bold mt-2">اسکن هوشمند توسط Sing-Box, V2rayN یا Shadowrocket</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { UserPlus, Trash2, QrCode, Copy, Download, Edit3, ExternalLink } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';

const users = ref<any[]>([]);
const showCreateModal = ref(false);
const selectedUserForSub = ref<any>(null);
const selectedIsp = ref('MCI');

const editingUser = ref<any>(null);
const editForm = ref({ dataLimitGb: 0, expireDays: 0, maxDevices: 2, status: 'ACTIVE' });

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
  { id: 'DEFAULT', label: '🌐 عمومی', activeClass: 'bg-cyberYellow text-black font-bold' },
  { id: 'MCI', label: '📱 همراه اول', activeClass: 'bg-cyberYellow text-black font-bold' },
  { id: 'IRANCELL', label: '📡 ایرانسل', activeClass: 'bg-cyberRed text-white font-bold' },
  { id: 'WHITE_SNI', label: '⚡ SNI سفید (زمان قطعی نت)', activeClass: 'bg-cyberGreen text-black font-bold' },
];

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();
const newUser = ref({ username: '', dataLimitGb: 0, expireDays: 30, maxDevices: 2 });

async function fetchUsers() {
  try { const res = await axios.get('/api/users'); users.value = res.data; }
  catch (err) { console.error('Failed to fetch users:', err); }
}

async function createUser() {
  if (!newUser.value.username) return;
  try {
    const res = await axios.post('/api/users', newUser.value);
    showCreateModal.value = false;
    const createdUser = res.data;
    newUser.value = { username: '', dataLimitGb: 0, expireDays: 30, maxDevices: 2 };
    props.toast?.('کاربر جدید با موفقیت ساخته شد', 'success');
    await fetchUsers();
    if (createdUser) {
      openConfigModal(createdUser);
    }
  } catch (err: any) { props.toast?.(err?.response?.data?.error || 'خطا در ساخت کاربر جدید', 'error'); }
}

function openEditModal(user: any) {
  editingUser.value = user;
  editForm.value = {
    dataLimitGb: user.dataLimitGb || 0,
    expireDays: 0,
    maxDevices: user.maxDevices || 2,
    status: user.status || 'ACTIVE'
  };
}

async function saveUserEdit() {
  if (!editingUser.value) return;
  try {
    await axios.patch(`/api/users/${editingUser.value.id}`, editForm.value);
    props.toast?.('مشخصات کاربر با موفقیت به‌روزرسانی گردید', 'success');
    editingUser.value = null;
    fetchUsers();
  } catch (err: any) {
    props.toast?.('خطا در بروزرسانی کاربر', 'error');
  }
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

function copyUserInfoLink(user: any) {
  const host = window.location.host;
  const link = `http://${host}/subinfo/${user.uuid}`;
  navigator.clipboard.writeText(link);
  props.toast?.('لینک صفحه وب اختصاصی کاربر کپی شد.', 'success');
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  props.toast?.('لینک سابسکریپشن کپی شد.', 'success');
}

onMounted(fetchUsers);
</script>