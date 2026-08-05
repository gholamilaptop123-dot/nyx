<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">????????? ? ?????????</h2>
        <p class="text-sm text-gray-400">?????? ????????? ????? ????????? ? ??????? REALITY</p>
      </div>
      <button @click="openCreateModal" class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyberCyan to-cyberViolet text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all">
        <Plus class="w-4 h-4" /> ?????? ??????? ????
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="inbound in inbounds" :key="inbound.id" class="glass-card p-5 rounded-3xl space-y-4 border border-white/10 hover:border-cyberCyan/30 transition-all">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-cyberCyan/15 text-cyberCyan flex items-center justify-center font-bold text-sm">{{ inbound.port }}</div>
            <div>
              <h3 class="font-bold text-white text-sm">{{ inbound.remark }}</h3>
              <p class="text-xs text-gray-400 uppercase">{{ inbound.protocol }} · {{ inbound.security }}</p>
            </div>
          </div>
          <span :class="['px-2 py-0.5 text-xs rounded-full font-semibold', inbound.enabled ? 'bg-cyberGreen/20 text-cyberGreen' : 'bg-red-500/20 text-red-400']">{{ inbound.enabled ? '????' : '???????' }}</span>
        </div>
        <div class="space-y-1.5 text-xs p-3 rounded-2xl bg-white/5">
          <div class="flex justify-between text-gray-400"><span>????:</span><span class="text-white font-mono uppercase">{{ inbound.network }}</span></div>
          <div class="flex justify-between text-gray-400"><span>SNI:</span><span class="text-cyberCyan font-mono">{{ inbound.sni }}</span></div>
          <div class="flex justify-between text-gray-400"><span>Fragment:</span><span :class="inbound.enableFragment ? 'text-cyberGreen' : 'text-gray-500'">{{ inbound.enableFragment ? '? ????' : '? ???????' }}</span></div>
          <div v-if="inbound.publicKey" class="flex justify-between text-gray-400"><span>Public Key:</span><span class="text-gray-300 font-mono text-[10px] truncate max-w-[140px]">{{ inbound.publicKey?.substring(0, 18) }}…</span></div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="toggleInbound(inbound)" class="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all" :class="inbound.enabled ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-cyberGreen/10 text-cyberGreen hover:bg-cyberGreen/20'">{{ inbound.enabled ? '????????????' : '?????????' }}</button>
          <button @click="deleteInbound(inbound.id)" class="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"><Trash2 class="w-4 h-4" /></button>
        </div>
      </div>
      <div v-if="inbounds.length === 0" class="col-span-full glass-panel p-8 rounded-3xl text-center text-gray-400 text-sm">??? ???????? ???? ???.</div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-lg w-full rounded-3xl p-6 border border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white">?????? ??????? ????</h3>
          <button @click="showCreateModal = false" class="text-gray-400 hover:text-white text-xl">?</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">??? / ????? (Remark)</label>
            <input v-model="form.remark" type="text" placeholder="VLESS-Reality-443" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberCyan outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">??????</label>
            <select v-model="form.protocol" class="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="vless">VLESS</option>
              <option value="vmess">VMess</option>
              <option value="trojan">Trojan</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">????</label>
            <input v-model="form.port" type="number" placeholder="443" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberCyan outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">??? ????</label>
            <select v-model="form.network" class="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="tcp">TCP</option>
              <option value="grpc">gRPC</option>
              <option value="ws">WebSocket</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">??? ?????</label>
            <select v-model="form.security" class="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="reality">REALITY (??????)</option>
              <option value="tls">TLS</option>
              <option value="none">???? ????????</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">SNI (???? ???????)</label>
            <select v-model="form.sni" class="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="yahoo.com">yahoo.com (????????)</option>
              <option value="www.google.com">www.google.com</option>
              <option value="dl.google.com">dl.google.com</option>
              <option value="speed.cloudflare.com">speed.cloudflare.com</option>
              <option value="microsoft.com">microsoft.com</option>
              <option value="custom">???? ???? ????…</option>
            </select>
            <input v-if="form.sni === 'custom'" v-model="form.customSni" type="text" placeholder="yourdomain.com" class="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberCyan outline-none" />
          </div>
          <div v-if="form.security === 'reality'" class="col-span-2 space-y-3 p-3 rounded-2xl bg-cyberViolet/10 border border-cyberViolet/20">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-cyberViolet">?? ??????? REALITY (X25519)</p>
              <button @click="generateKeys" :disabled="keygenLoading" class="px-3 py-1 rounded-xl bg-cyberViolet/30 text-cyberViolet text-xs font-bold hover:bg-cyberViolet/50 transition-all disabled:opacity-50">{{ keygenLoading ? '?? ??? ?????…' : '? ????? ??????' }}</button>
            </div>
            <div><label class="block text-xs text-gray-400 mb-1">Private Key</label><input v-model="form.privateKey" type="text" class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-cyberGreen outline-none" /></div>
            <div><label class="block text-xs text-gray-400 mb-1">Public Key</label><input v-model="form.publicKey" type="text" class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-cyberCyan outline-none" /></div>
            <div><label class="block text-xs text-gray-400 mb-1">Short ID</label><input v-model="form.shortId" type="text" placeholder="6ba7b810" class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white outline-none" /></div>
          </div>
          <div class="col-span-2 flex items-center gap-3 p-3 rounded-2xl bg-white/5">
            <input type="checkbox" v-model="form.enableFragment" id="frag" class="w-4 h-4 accent-cyberViolet" />
            <label for="frag" class="text-sm text-gray-300 cursor-pointer">????????? <span class="text-cyberViolet font-semibold">Packet Fragment</span> — ??? ??? DPI ?????????? ?????</label>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateModal = false" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">??????</button>
          <button @click="createInbound" :disabled="creating" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyberCyan to-cyberViolet text-white text-xs font-bold shadow-lg hover:opacity-90 disabled:opacity-50">{{ creating ? '?? ??? ?????…' : '????? ???????' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-vue-next';

const inbounds = ref<any[]>([]);
const showCreateModal = ref(false);
const creating = ref(false);
const keygenLoading = ref(false);
const form = ref({ remark: '', protocol: 'vless', port: 443, network: 'tcp', security: 'reality', sni: 'yahoo.com', customSni: '', privateKey: '', publicKey: '', shortId: '6ba7b810', enableFragment: true });

async function fetchInbounds() {
  try { const res = await axios.get('/api/inbounds'); inbounds.value = res.data; } catch (err) { console.error(err); }
}

async function openCreateModal() { showCreateModal.value = true; await generateKeys(); }

async function generateKeys() {
  keygenLoading.value = true;
  try { const res = await axios.get('/api/inbounds/keygen'); form.value.privateKey = res.data.privateKey; form.value.publicKey = res.data.publicKey; form.value.shortId = res.data.shortId; }
  catch (err) { console.error(err); } finally { keygenLoading.value = false; }
}

async function createInbound() {
  if (!form.value.port) return;
  creating.value = true;
  try {
    const sni = form.value.sni === 'custom' ? form.value.customSni : form.value.sni;
    await axios.post('/api/inbounds', { ...form.value, sni });
    showCreateModal.value = false;
    form.value = { remark: '', protocol: 'vless', port: 443, network: 'tcp', security: 'reality', sni: 'yahoo.com', customSni: '', privateKey: '', publicKey: '', shortId: '6ba7b810', enableFragment: true };
    fetchInbounds();
  } catch (err: any) { alert(err?.response?.data?.error || '??? ?? ???? ???????'); } finally { creating.value = false; }
}

async function toggleInbound(inbound: any) {
  try { await axios.patch(`/api/inbounds/${inbound.id}`, { enabled: !inbound.enabled }); fetchInbounds(); } catch (err) { alert('???'); }
}

async function deleteInbound(id: string) {
  if (!confirm('??? ?? ??? ??? ??????? ??????? ??????')) return;
  try { await axios.delete(`/api/inbounds/${id}`); fetchInbounds(); } catch (err) { alert('??? ?? ???'); }
}

onMounted(fetchInbounds);
</script>
