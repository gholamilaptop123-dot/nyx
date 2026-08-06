<template>
  <div class="space-y-6">
    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-cyberYellow glow-yellow">درگاه‌ها و اینباندهای Xray</h2>
        <p class="text-sm text-gray-400">تنظیم پروتکل‌های VLESS، REALITY، gRPC و تکنولوژی Fragment</p>
      </div>
      <button 
        @click="showCreateModal = true" 
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyberYellow via-red-600 to-cyberRed text-black font-extrabold text-sm shadow-lg shadow-cyberYellow/20 hover:opacity-90 transition-all border border-cyberYellow/40"
      >
        <Plus class="w-4 h-4 text-black font-bold" />
        ساخت اینباند جدید
      </button>
    </div>

    <!-- Live SNI Connection Tester Card -->
    <div class="glass-panel p-5 rounded-3xl border border-cyberYellow/40 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Activity class="w-5 h-5 text-cyberYellow" />
          <h3 class="text-sm font-extrabold text-cyberYellow glow-yellow">ابزار تست زنده اتصال TLS (ارزیابی پاسخ‌دهی دامنه SNI)</h3>
        </div>
        <span class="text-[11px] text-gray-400">تست واقعی برقراری ارتباط روی پورت ۴۴۳</span>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3">
        <input 
          v-model="sniTestDomain" 
          type="text" 
          placeholder="مثال: archive.ubuntu.com یا ebanking.banksepah.ir"
          dir="ltr"
          class="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-left text-white focus:border-cyberYellow outline-none"
        />
        <button 
          @click="runSniTest" 
          :disabled="testingSni"
          class="w-full sm:w-auto px-5 py-2 rounded-xl bg-cyberYellow/20 border border-cyberYellow/40 text-cyberYellow font-bold text-xs hover:bg-cyberYellow/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span v-if="testingSni" class="w-3.5 h-3.5 border-2 border-cyberYellow border-t-transparent rounded-full animate-spin"></span>
          <span>{{ testingSni ? 'در حال تست...' : 'تست اتصال SNI' }}</span>
        </button>
      </div>

      <!-- SNI Test Result Banner -->
      <div v-if="sniResult" :class="['p-3 rounded-2xl border text-xs flex items-center justify-between', sniResult.success ? 'bg-cyberGreen/10 border-cyberGreen/30 text-cyberGreen' : 'bg-red-500/10 border-red-500/30 text-red-400']">
        <div class="flex items-center gap-2">
          <span class="font-bold">{{ sniResult.success ? '✓ پاسخ مثبت:' : '✗ خطا در اتصال:' }}</span>
          <span dir="ltr" class="font-mono">{{ sniResult.domain }}</span>
        </div>
        <span dir="ltr" class="font-mono font-bold">{{ sniResult.message }}</span>
      </div>
    </div>

    <!-- Inbounds List Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="inbound in inbounds" :key="inbound.id" class="glass-panel p-5 rounded-3xl space-y-4 border border-cyberYellow/30 relative">
        <div class="flex items-center justify-between border-b border-white/5 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :class="inbound.enabled ? 'bg-cyberGreen shadow-sm shadow-cyberGreen' : 'bg-gray-600'"></div>
            <h3 class="font-bold text-white text-base">{{ inbound.remark }}</h3>
          </div>
          <span class="px-2.5 py-1 text-xs rounded-full bg-cyberYellow/10 text-cyberYellow border border-cyberYellow/30 font-mono font-bold">
            پورت {{ inbound.port }}
          </span>
        </div>

        <div class="space-y-2 text-xs p-3.5 rounded-2xl bg-black/30 border border-white/5">
          <div class="flex justify-between text-gray-400"><span>پروتکل:</span><span class="text-cyberYellow font-mono font-bold uppercase">{{ inbound.protocol }}</span></div>
          <div class="flex justify-between text-gray-400"><span>نوع شبکه:</span><span class="text-white font-mono uppercase">{{ inbound.network }}</span></div>
          <div class="flex justify-between text-gray-400"><span>دامنه وانمودی (SNI):</span><span class="text-cyberYellow font-mono" dir="ltr">{{ inbound.sni }}</span></div>
          <div class="flex justify-between text-gray-400"><span>تکنولوژی Fragment:</span><span :class="inbound.enableFragment ? 'text-cyberGreen font-semibold' : 'text-gray-500'">{{ inbound.enableFragment ? '✓ فعال' : '✗ غیرفعال' }}</span></div>
          <div v-if="inbound.publicKey" class="flex justify-between text-gray-400">
            <span>Public Key:</span>
            <span class="text-gray-300 font-mono text-[10px] truncate max-w-[140px]" dir="ltr">{{ inbound.publicKey?.substring(0, 18) }}…</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button 
            @click="showInboundSampleModal(inbound)" 
            class="w-full py-2 rounded-xl bg-cyberYellow/20 border border-cyberYellow/40 text-cyberYellow hover:bg-cyberYellow/30 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
          >
            <QrCode class="w-4 h-4" />
            دریافت لینک کانفیگ و QR کد
          </button>
          <div class="flex items-center gap-2">
            <button @click="toggleInbound(inbound)" class="flex-1 py-2 rounded-xl text-xs font-semibold transition-all" :class="inbound.enabled ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-cyberGreen/10 text-cyberGreen hover:bg-cyberGreen/20'">
              {{ inbound.enabled ? 'غیرفعال‌سازی اینباند' : 'فعال‌سازی اینباند' }}
            </button>
            <button @click="deleteInbound(inbound.id)" class="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="حذف اینباند">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="inbounds.length === 0" class="col-span-full glass-panel p-8 rounded-3xl text-center text-gray-400 text-sm">
        هنوز اینباندی ثبت نشده است. با کلیک روی دکمه «ساخت اینباند جدید» اولین درگاه را پیکربندی کنید.
      </div>
    </div>

    <!-- Create Inbound Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-lg w-full rounded-3xl p-6 border border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white">افزودن اینباند جدید</h3>
          <button @click="showCreateModal = false" class="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">نام یا عنوان اینباند</label>
            <input v-model="form.remark" type="text" placeholder="مثال: VLESS-Reality-443" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberYellow outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">پروتکل ارتباطی</label>
            <select v-model="form.protocol" class="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="vless">VLESS (پیشنهادی)</option>
              <option value="vmess">VMess</option>
              <option value="trojan">Trojan</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">پورت اینباند</label>
            <input v-model="form.port" type="number" placeholder="443" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono text-left text-white focus:border-cyberYellow outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">نوع شبکه (Transport)</label>
            <select v-model="form.network" class="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="tcp">TCP (پیش‌فرض)</option>
              <option value="grpc">gRPC</option>
              <option value="ws">WebSocket</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">نوع رمزنگاری (Security)</label>
            <select v-model="form.security" class="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option value="reality">REALITY (بالاترین امنیت ضد فیلتر)</option>
              <option value="tls">TLS معمولی</option>
              <option value="none">بدون رمزنگاری</option>
            </select>
          </div>

          <!-- Categorized SNI Select -->
          <div class="col-span-2 space-y-1">
            <label class="block text-xs text-gray-400 mb-1">انتخاب دامنه وانمودی (SNI)</label>
            <select v-model="form.sni" class="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <optgroup label="--- حالت معمولی شبکه (اپراتورهای عادی) ---">
                <option value="yahoo.com">yahoo.com — دامنه عمومی بسیار باثبات</option>
                <option value="www.microsoft.com">www.microsoft.com — مایکروسافت</option>
                <option value="dl.google.com">dl.google.com — گوگل دانلود</option>
                <option value="speed.cloudflare.com">speed.cloudflare.com — کلودفلر</option>
                <option value="www.apple.com">www.apple.com — اپل</option>
                <option value="github.com">github.com — گیت‌هاب</option>
              </optgroup>
              <optgroup label="--- مخازن توسعه و نرم‌افزار (پایدار در شبکه ایران) ---">
                <option value="pypi.org">pypi.org — مخزن رسمی پایتون</option>
                <option value="archive.ubuntu.com">archive.ubuntu.com — مخزن بروزرسانی اوبونتو</option>
                <option value="security.ubuntu.com">security.ubuntu.com — امنیتی اوبونتو</option>
                <option value="registry.npmjs.org">registry.npmjs.org — مخزن رسمی npm</option>
                <option value="files.pythonhosted.org">files.pythonhosted.org</option>
                <option value="deb.debian.org">deb.debian.org — مخزن دبیان</option>
                <option value="download.docker.com">download.docker.com — داکر</option>
              </optgroup>
              <optgroup label="--- مراجع صدور گواهی SSL ---">
                <option value="acme-v02.api.letsencrypt.org">acme-v02.api.letsencrypt.org — Let's Encrypt API</option>
                <option value="r3.o.lencr.org">r3.o.lencr.org — OCSP Let's Encrypt</option>
                <option value="ocsp.digicert.com">ocsp.digicert.com — DigiCert</option>
                <option value="ocsp.sectigo.com">ocsp.sectigo.com — Sectigo</option>
              </optgroup>
              <optgroup label="--- بروزرسانی سیستم‌عامل‌ها ---">
                <option value="download.microsoft.com">download.microsoft.com — آپدیت ویندوز</option>
                <option value="windowsupdate.microsoft.com">windowsupdate.microsoft.com — آپدیت ویندوز</option>
                <option value="mesu.apple.com">mesu.apple.com — آپدیت آیفون/مک</option>
                <option value="downloads.kaspersky.com">downloads.kaspersky.com — آپدیت آنتی‌ویروس</option>
              </optgroup>
              <optgroup label="--- دامنه‌های سفید داخلی ---">
                <option value="ebanking.banksepah.ir">ebanking.banksepah.ir — همراه بانک سپه</option>
                <option value="bmi.ir">bmi.ir — بانک ملی</option>
                <option value="custom">دستی (وارد کردن دامنه دلخواه)...</option>
              </optgroup>
            </select>
          </div>

          <div v-if="form.sni === 'custom'" class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">دامنه SNI دلخواه</label>
            <input v-model="form.customSni" type="text" placeholder="مثال: mydomain.com" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono text-left text-white focus:border-cyberYellow outline-none" />
          </div>

          <div class="col-span-2 flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <span class="block text-xs font-bold text-white">تکنولوژی Packet Fragment</span>
              <span class="text-[11px] text-gray-400">تکه‌تکه‌سازی پکت‌های اولیه جهت عبور از DPI زیرساخت</span>
            </div>
            <input v-model="form.enableFragment" type="checkbox" class="w-4 h-4 accent-cyberYellow cursor-pointer" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateModal = false" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">انصراف</button>
          <button @click="createInbound" :disabled="creating" class="px-5 py-2 rounded-xl bg-cyberYellow text-black text-xs font-bold shadow-lg shadow-cyberYellow/30 hover:opacity-90 flex items-center gap-2">
            <span v-if="creating" class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            <span>ذخیره و ساخت اینباند</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Sample Config & QR Code Modal for Inbounds -->
    <div v-if="selectedInboundForSample" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-xl w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <QrCode class="w-5 h-5 text-cyberYellow" />
            <span>لینک کانفیگ نمونه و بارکد QR: {{ selectedInboundForSample.remark }}</span>
          </h3>
          <button @click="selectedInboundForSample = null" class="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div class="space-y-3">
          <div class="p-3 bg-black/50 rounded-2xl border border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-cyberYellow font-bold">لینک VLESS اینباند (با کلید و SNI):</span>
              <button @click="copyText(sampleVlessUrl)" class="px-3 py-1 rounded-xl bg-cyberYellow text-black font-bold text-xs hover:opacity-90 transition-all">
                کپی لینک
              </button>
            </div>
            <pre dir="ltr" class="text-[11px] font-mono text-gray-200 break-all whitespace-pre-wrap text-left p-3 bg-black/70 rounded-xl border border-white/10 leading-relaxed">{{ sampleVlessUrl }}</pre>
          </div>

          <!-- QR Code Display -->
          <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-2xl">
            <QrcodeVue :value="sampleVlessUrl" :size="190" />
            <p class="text-xs text-gray-800 font-bold mt-2">اسکن فوری توسط Sing-Box / V2rayN / Shadowrocket</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Plus, Trash2, Activity, QrCode, Copy } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const inbounds = ref<any[]>([]);
const showCreateModal = ref(false);
const creating = ref(false);
const testingSni = ref(false);
const sniTestDomain = ref('archive.ubuntu.com');
const sniResult = ref<any>(null);

const selectedInboundForSample = ref<any>(null);

const form = ref({
  remark: '',
  protocol: 'vless',
  port: 443,
  network: 'tcp',
  security: 'reality',
  sni: 'yahoo.com',
  customSni: '',
  privateKey: '',
  publicKey: '',
  shortId: '6ba7b810',
  enableFragment: true
});

const sampleVlessUrl = computed(() => {
  if (!selectedInboundForSample.value) return '';
  const inb = selectedInboundForSample.value;
  const host = window.location.hostname || '127.0.0.1';
  const sampleUuid = '11111111-2222-3333-4444-555555555555';
  const pbk = inb.publicKey || '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';
  const sid = inb.shortId || '6ba7b810';
  return `vless://${sampleUuid}@${host}:${inb.port}?type=${inb.network}&security=${inb.security}&pbk=${pbk}&fp=chrome&sni=${inb.sni}&sid=${sid}#${encodeURIComponent(inb.remark)}`;
});

function showInboundSampleModal(inbound: any) {
  selectedInboundForSample.value = inbound;
}

async function fetchInbounds() {
  try {
    const res = await axios.get('/api/inbounds');
    inbounds.value = res.data;
  } catch (err) {
    console.error('Failed to fetch inbounds:', err);
  }
}

async function runSniTest() {
  if (!sniTestDomain.value.trim()) return;
  testingSni.value = true;
  sniResult.value = null;
  try {
    const res = await axios.get(`/api/inbounds/test-sni?domain=${encodeURIComponent(sniTestDomain.value.trim())}`);
    sniResult.value = res.data;
  } catch (err: any) {
    sniResult.value = { success: false, domain: sniTestDomain.value, message: 'ارتباط برقرار نشد یا تایم‌آوت داد.' };
  } finally {
    testingSni.value = false;
  }
}

async function createInbound() {
  if (!form.value.port) return;
  creating.value = true;
  try {
    const sni = form.value.sni === 'custom' ? form.value.customSni : form.value.sni;
    const res = await axios.post('/api/inbounds', { ...form.value, sni });
    showCreateModal.value = false;
    const createdInbound = res.data;
    form.value = { remark: '', protocol: 'vless', port: 443, network: 'tcp', security: 'reality', sni: 'yahoo.com', customSni: '', privateKey: '', publicKey: '', shortId: '6ba7b810', enableFragment: true };
    props.toast?.('اینباند جدید با موفقیت ایجاد گردید', 'success');
    await fetchInbounds();
    // Auto-open sample config & QR Code modal
    if (createdInbound) {
      showInboundSampleModal(createdInbound);
    }
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'خطا در ثبت اینباند', 'error');
  } finally { creating.value = false; }
}

async function toggleInbound(inbound: any) {
  try {
    await axios.patch(`/api/inbounds/${inbound.id}`, { enabled: !inbound.enabled });
    props.toast?.(`وضعیت اینباند ${inbound.remark} به‌روزرسانی شد`, 'info');
    fetchInbounds();
  } catch (err: any) {
    props.toast?.('خطا در تغییر وضعیت اینباند', 'error');
  }
}

async function deleteInbound(id: string) {
  if (!confirm('آیا از حذف این اینباند اطمینان دارید؟')) return;
  try {
    await axios.delete(`/api/inbounds/${id}`);
    props.toast?.('اینباند با موفقیت حذف شد', 'success');
    fetchInbounds();
  } catch (err) {
    props.toast?.('خطا در حذف اینباند', 'error');
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  props.toast?.('لینک کانفیگ در حافظه کپی شد.', 'success');
}

onMounted(fetchInbounds);
</script>