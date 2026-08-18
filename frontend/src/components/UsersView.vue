<template>
  <div class="space-y-6">
    <!-- Header Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-400">{{ t('usersTitle') }}</h2>
        <p class="text-xs sm:text-sm text-gray-400 mt-0.5">{{ t('usersSub') }}</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:opacity-95 transition-all"
      >
        <UserPlus class="w-4 h-4 text-gray-950 font-bold" />
        {{ t('createUserBtn') }}
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-2.5">
      <Search class="w-4 h-4 text-gray-400 shrink-0" />
      <input 
        v-model="userSearch" 
        type="text" 
        :placeholder="t('searchUsersPlaceholder')" 
        class="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none" 
      />
      <span v-if="userSearch" @click="userSearch = ''" class="cursor-pointer text-gray-400 hover:text-white text-xs">✕</span>
    </div>

    <!-- User List Table / Cards -->
    <div class="glass-panel rounded-3xl overflow-hidden border border-white/[0.08]">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[750px] text-right border-collapse">
          <thead>
            <tr class="bg-white/[0.02] border-b border-white/[0.06] text-xs text-amber-300 font-bold">
              <th class="p-4">{{ t('usernameHeader') }}</th>
              <th class="p-4">{{ t('trafficHeader') }}</th>
              <th class="p-4">{{ t('expiryHeader') }}</th>
              <th class="p-4">{{ t('maxDevices') }}</th>
              <th class="p-4">{{ t('statusHeader') }}</th>
              <th class="p-4 text-center">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.04] text-sm">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-white/[0.02] transition-colors">
              <td class="p-4 font-semibold text-white">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="block font-bold text-white text-xs sm:text-sm">{{ user.username }}</span>
                    <span class="text-[10px] font-mono text-gray-400" dir="ltr">{{ user.uuid.substring(0, 18) }}…</span>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <span class="text-amber-300 font-mono font-bold text-xs" dir="ltr">{{ (Number(user.usedDataBytes) / (1024*1024*1024)).toFixed(2) }} GB</span>
                <span class="text-gray-400 text-xs mr-1">/ {{ user.dataLimitGb > 0 ? user.dataLimitGb + ' GB' : t('unlimited') }}</span>
              </td>
              <td class="p-4 text-xs text-gray-300">
                {{ user.expireDate ? new Date(user.expireDate).toLocaleDateString() : t('unlimited') }}
              </td>
              <td class="p-4 text-xs font-mono text-gray-200">
                {{ user.maxDevices || 2 }} Device
              </td>
              <td class="p-4">
                <span :class="[
                  'px-2.5 py-0.5 text-xs rounded-full font-bold inline-block',
                  user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                ]">
                  {{ user.status === 'ACTIVE' ? t('activeStatus') : t('disabledStatus') }}
                </span>
              </td>
              <td class="p-4 flex items-center justify-center gap-1.5 sm:gap-2">
                <button @click="openConfigModal(user)" class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 hover:bg-amber-400/20 text-xs font-bold flex items-center gap-1 transition-all">
                  <Download class="w-3.5 h-3.5" />
                  Configs
                </button>
                <button @click="openSubModal(user)" class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1 transition-all">
                  <QrCode class="w-3.5 h-3.5" />
                  Sub Link
                </button>
                <button @click="copyUserInfoLink(user)" class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 transition-all" title="User Web Portal">
                  <ExternalLink class="w-3.5 h-3.5" />
                  Web Portal
                </button>
                <button @click="openEditModal(user)" class="p-1.5 rounded-xl bg-white/[0.04] text-gray-300 hover:text-white text-xs border border-white/[0.06] transition-all" title="Edit User">
                  <Edit3 class="w-4 h-4" />
                </button>
                <button @click="deleteUser(user.id)" class="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs border border-rose-500/20 transition-all" title="Delete User">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>

            <tr v-if="users.length === 0">
              <td colspan="6" class="p-8 text-center text-gray-400 text-sm">
                No subscribers created yet. Click "Create User" to define the first user.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-md w-full rounded-3xl p-5 sm:p-6 border border-white/[0.08] space-y-4 shadow-2xl">
        <h3 class="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
          <UserPlus class="w-5 h-5 text-amber-400" />
          <span>{{ t('createUserWizard') }}</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-gray-400 mb-1">{{ t('usernameHeader') }}</label>
            <input 
              v-model="newUser.username"
              type="text" 
              placeholder="e.g. ali_user"
              dir="ltr"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">{{ t('selectTraffic') }} (GB)</label>
              <input 
                v-model="newUser.dataLimitGb"
                type="number" 
                placeholder="0 for unlimited"
                dir="ltr"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
              />
            </div>
            <div>
              <label class="block text-gray-400 mb-1">{{ t('selectExpiry') }} ({{ t('daysCount') }})</label>
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
            <label class="block text-gray-400 mb-1">{{ t('maxDevices') }} (IP Limit)</label>
            <select v-model="newUser.maxDevices" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option :value="1">1 Device (Single)</option>
              <option :value="2">2 Devices (Default)</option>
              <option :value="3">3 Devices</option>
              <option :value="5">5 Devices</option>
              <option :value="10">10 Devices (Group)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateModal = false" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">{{ t('cancel') }}</button>
          <button @click="createUser" class="px-5 py-2 rounded-xl bg-cyberYellow text-black text-xs font-bold shadow-lg shadow-cyberYellow/30 hover:opacity-90">
            {{ t('save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="editingUser" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-md w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4">
        <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
          <Edit3 class="w-5 h-5 text-cyberYellow" />
          <span>{{ t('edit') }}: {{ editingUser.username }}</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">{{ t('selectTraffic') }} (GB)</label>
              <input v-model="editForm.dataLimitGb" type="number" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
            <div>
              <label class="block text-gray-400 mb-1">Renew Expiry (Days)</label>
              <input v-model="editForm.expireDays" type="number" placeholder="Days to extend" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">{{ t('maxDevices') }}</label>
            <select v-model="editForm.maxDevices" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option :value="1">1 Device</option>
              <option :value="2">2 Devices</option>
              <option :value="3">3 Devices</option>
              <option :value="5">5 Devices</option>
              <option :value="10">10 Devices</option>
            </select>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">{{ t('statusHeader') }}</label>
            <select v-model="editForm.status" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="ACTIVE">🟢 {{ t('activeStatus') }} (ACTIVE)</option>
              <option value="DISABLED">🔴 {{ t('disabledStatus') }} (DISABLED)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="editingUser = null" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">{{ t('cancel') }}</button>
          <button @click="saveUserEdit" class="px-5 py-2 rounded-xl bg-cyberYellow text-black text-xs font-bold shadow-lg shadow-cyberYellow/30 hover:opacity-90">
            {{ t('save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- VPN Config Modal -->
    <div v-if="selectedUserForConfig" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-2xl w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>🔑 Get Configs: {{ selectedUserForConfig.username }}</span>
          </h3>
          <button @click="selectedUserForConfig = null" class="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <!-- User Info Page Link Banner -->
        <div class="p-3.5 rounded-2xl bg-cyberGreen/10 border border-cyberGreen/30 flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2">
            <ExternalLink class="w-4 h-4 text-cyberGreen shrink-0" />
            <span class="text-gray-200">Standalone User Info Web Page:</span>
          </div>
          <button @click="copyUserInfoLink(selectedUserForConfig)" class="px-3 py-1 rounded-xl bg-cyberGreen text-black font-bold hover:opacity-90 transition-all shrink-0">
            {{ t('openUserPage') }}
          </button>
        </div>

        <!-- ISP Selector -->
        <div class="flex flex-wrap items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
          <span class="text-xs text-gray-400">Target ISP:</span>
          <button v-for="isp in ispOptions" :key="isp.id" @click="selectedConfigIsp = isp.id; loadConfigs()" :class="['px-3 py-1.5 rounded-xl text-xs font-medium transition-all', selectedConfigIsp === isp.id ? isp.activeClass : 'bg-white/5 text-gray-400 hover:text-white']">
            {{ isp.label }}
          </button>
        </div>

        <div v-if="configLoading" class="flex items-center justify-center py-8">
          <div class="w-6 h-6 border-2 border-cyberYellow border-t-transparent rounded-full animate-spin"></div>
          <span class="mr-3 text-gray-400 text-sm">Generating VLESS links…</span>
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
                <span class="text-xs text-cyberYellow font-extrabold">VLESS REALITY Link (Gateway {{ i + 1 }})</span>
                <button @click="copy(link)" class="px-3 py-1 rounded-lg bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 hover:bg-cyberYellow/30 text-xs font-bold transition-all">{{ t('copy') }} VLESS</button>
              </div>
              <pre dir="ltr" class="text-[11px] font-mono text-gray-200 break-all whitespace-pre-wrap text-left p-3 bg-black/70 rounded-xl border border-white/10 leading-relaxed">{{ link }}</pre>
            </div>
            <div class="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-cyberGreen font-extrabold">Base64 Encoded Subscription</span>
                <button @click="copy(userConfigs.base64Sub)" class="px-3 py-1 rounded-lg bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 hover:bg-cyberGreen/30 text-xs font-bold transition-all">{{ t('copy') }} Sub</button>
              </div>
              <input readonly :value="userConfigs.subUrl" dir="ltr" class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left text-cyberYellow outline-none" />
            </div>
          </div>

          <!-- Clash YAML -->
          <div v-if="activeConfigTab === 'clash'" class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">Full YAML configuration file for Clash Meta / Stash / Mihomo</p>
              <button @click="copy(userConfigs.clashYaml)" class="px-3 py-1 rounded-xl bg-cyberYellow text-black text-xs font-bold">{{ t('copy') }} YAML File</button>
            </div>
            <pre dir="ltr" class="bg-black/70 p-4 rounded-2xl text-[11px] font-mono text-cyberGreen text-left overflow-x-auto border border-white/10 max-h-72 leading-relaxed">{{ userConfigs.clashYaml }}</pre>
          </div>

          <!-- Sing-Box JSON -->
          <div v-if="activeConfigTab === 'singbox'" class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">Full JSON configuration file for Sing-Box / NekoBox / Hiddify</p>
              <button @click="copy(JSON.stringify(userConfigs.singboxJson, null, 2))" class="px-3 py-1 rounded-xl bg-cyberYellow text-black text-xs font-bold">{{ t('copy') }} JSON File</button>
            </div>
            <pre dir="ltr" class="bg-black/70 p-4 rounded-2xl text-[11px] font-mono text-cyberYellow text-left overflow-x-auto border border-white/10 max-h-72 leading-relaxed">{{ JSON.stringify(userConfigs.singboxJson, null, 2) }}</pre>
          </div>

          <!-- QR Code -->
          <div v-if="activeConfigTab === 'qr'" class="flex flex-col items-center gap-4 py-2">
            <div v-for="(link, i) in userConfigs.vlessLinks" :key="i" class="flex flex-col items-center gap-2">
              <p class="text-xs text-gray-300 font-bold">Scan QR Code for VLESS Link Gateway {{ i + 1 }}</p>
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
          <h3 class="text-lg font-bold text-white">{{ t('subLinkHeader') }}: {{ selectedUserForSub.username }}</h3>
          <button @click="selectedUserForSub = null" class="text-gray-400 hover:text-white">✕</button>
        </div>

        <div class="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 text-xs">
          <label class="block text-gray-400">Target Operator Preset:</label>
          <div class="flex flex-wrap items-center gap-2">
            <button @click="selectedIsp = 'MCI'" :class="['px-3 py-1.5 rounded-xl font-medium transition-all', selectedIsp === 'MCI' ? 'bg-cyberYellow text-black font-bold' : 'bg-white/5 text-gray-400']">MCI</button>
            <button @click="selectedIsp = 'IRANCELL'" :class="['px-3 py-1.5 rounded-xl font-medium transition-all', selectedIsp === 'IRANCELL' ? 'bg-cyberRed text-white font-bold' : 'bg-white/5 text-gray-400']">Irancell</button>
            <button @click="selectedIsp = 'WHITE_SNI'" :class="['px-3 py-1.5 rounded-xl font-medium transition-all', selectedIsp === 'WHITE_SNI' ? 'bg-cyberGreen text-black font-bold' : 'bg-white/5 text-gray-400']">⚡ White SNI</button>
          </div>

          <div class="space-y-2 pt-2">
            <label class="block text-gray-400">Direct Subscription URL:</label>
            <div class="flex items-center gap-2">
              <input readonly :value="getSubUrl(selectedUserForSub.uuid, selectedIsp)" dir="ltr" class="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left text-cyberYellow outline-none" />
              <button @click="copyToClipboard(getSubUrl(selectedUserForSub.uuid, selectedIsp))" class="px-4 py-2 rounded-xl bg-cyberYellow text-black font-bold text-xs flex items-center gap-1">
                <Copy class="w-3.5 h-3.5" />
                {{ t('copy') }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-2xl">
          <QrcodeVue :value="getSubUrl(selectedUserForSub.uuid, selectedIsp)" :size="180" />
          <p class="text-xs text-gray-800 font-bold mt-2">Scan via Sing-Box, V2rayN, MahsaNG or Shadowrocket</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { UserPlus, Trash2, QrCode, Copy, Download, Edit3, ExternalLink, Search } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { copyToClipboard } from '../utils/clipboard';
import { t, currentLang } from '../i18n';

const users = ref<any[]>([]);
const userSearch = ref('');
const showCreateModal = ref(false);
const selectedUserForSub = ref<any>(null);
const selectedIsp = ref('MCI');

const editingUser = ref<any>(null);
const editForm = ref({ dataLimitGb: 0, expireDays: 0, maxDevices: 2, status: 'ACTIVE' });

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase();
  if (!q) return users.value;
  return users.value.filter((u: any) => 
    (u.username && u.username.toLowerCase().includes(q)) ||
    (u.uuid && u.uuid.toLowerCase().includes(q)) ||
    (u.status && u.status.toLowerCase().includes(q))
  );
});

// VPN Config Modal state
const selectedUserForConfig = ref<any>(null);
const userConfigs = ref<any>(null);
const configLoading = ref(false);
const selectedConfigIsp = ref('DEFAULT');
const activeConfigTab = ref('vless');

const configTabs = computed(() => [
  { id: 'vless', label: currentLang.value === 'fa' ? '🔗 لینک مستقیم VLESS' : '🔗 Direct VLESS Links' },
  { id: 'clash', label: '⚡ Clash Meta' },
  { id: 'singbox', label: '📦 Sing-Box' },
  { id: 'qr', label: currentLang.value === 'fa' ? '📱 بارکد QR' : '📱 QR Code' },
]);

const ispOptions = computed(() => [
  { id: 'DEFAULT', label: currentLang.value === 'fa' ? '🌐 عمومی' : '🌐 General', activeClass: 'bg-cyberYellow text-black font-bold' },
  { id: 'MCI', label: t('operatorMci'), activeClass: 'bg-cyberYellow text-black font-bold' },
  { id: 'IRANCELL', label: t('operatorIrancell'), activeClass: 'bg-cyberRed text-white font-bold' },
  { id: 'WHITE_SNI', label: t('operatorWhite'), activeClass: 'bg-cyberGreen text-black font-bold' },
]);

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
    props.toast?.(currentLang.value === 'fa' ? 'کاربر جدید با موفقیت ساخته شد' : 'New user created successfully', 'success');
    await fetchUsers();
    if (createdUser) {
      openConfigModal(createdUser);
    }
  } catch (err: any) { props.toast?.(err?.response?.data?.error || (currentLang.value === 'fa' ? 'خطا در ساخت کاربر جدید' : 'Failed to create user'), 'error'); }
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
    props.toast?.(currentLang.value === 'fa' ? 'مشخصات کاربر با موفقیت به‌روزرسانی گردید' : 'User updated successfully', 'success');
    editingUser.value = null;
    fetchUsers();
  } catch (err: any) {
    props.toast?.(currentLang.value === 'fa' ? 'خطا در بروزرسانی کاربر' : 'Failed to update user', 'error');
  }
}

async function deleteUser(id: string) {
  if (!confirm(currentLang.value === 'fa' ? 'آیا از حذف این کاربر اطمینان دارید؟' : 'Are you sure you want to delete this user?')) return;
  try {
    await axios.delete(`/api/users/${id}`);
    props.toast?.(currentLang.value === 'fa' ? 'کاربر با موفقیت حذف شد' : 'User deleted successfully', 'success');
    fetchUsers();
  }
  catch (err) { props.toast?.(currentLang.value === 'fa' ? 'خطا در حذف کاربر' : 'Failed to delete user', 'error'); }
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
  copyToClipboard(text);
  props.toast?.(t('copied'), 'success');
}

function openSubModal(user: any) { selectedUserForSub.value = user; }

function getSubUrl(uuid: string, isp: string) {
  const host = window.location.host;
  return `http://${host}/api/sub/${uuid}?isp=${isp}`;
}

function copyUserInfoLink(user: any) {
  const host = window.location.host;
  const link = `http://${host}/subinfo/${user.uuid}`;
  copyToClipboard(link);
  window.open(link, '_blank');
  props.toast?.(currentLang.value === 'fa' ? 'صفحه وب اختصاصی کاربر باز شد و لینک کپی گردید.' : 'User web portal opened & link copied.', 'success');
}

onMounted(fetchUsers);
</script>