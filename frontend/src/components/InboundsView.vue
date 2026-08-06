<template>
  <div class="space-y-6">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">مدیریت اینباندها و پروتکل‌های ارتباطی</h2>
        <p class="text-sm text-gray-400">تنظیم درگاه‌های ورود، کلیدهای اختصاصی REALITY و پیکربندی دامنه وانمودی (SNI)</p>
      </div>
      <button @click="openCreateModal" class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyberCyan to-cyberViolet text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all">
        <Plus class="w-4 h-4" /> ساخت اینباند جدید
      </button>
    </div>

    <!-- SNI Volatility & Strategy Notice -->
    <div class="glass-panel p-5 rounded-3xl border border-amber-500/20 bg-amber-500/5 space-y-2">
      <div class="flex items-center gap-2 text-amber-400 font-bold text-sm">
        <AlertTriangle class="w-5 h-5" />
        <span>راهنمای حیاتی انتخاب دامنه وانمودی (SNI) در شبکه ایران</span>
      </div>
      <p class="text-xs text-gray-300 leading-relaxed">
        توجه داشته باشید که مسدودی دامنه‌ها (SNIها) در ایران پویاست؛ ممکن است یک دامنه روی همراه اول باز باشد اما روی ایرانسل اختلال داشته باشد، یا در ساعات مختلف شبانه‌روز تغییر کند. 
        <strong class="text-white">پیشنهاد کاربردی:</strong> همیشه چند اینباند با SNIهای متفاوت (مثلاً مخازن نرم‌افزاری اوبونتو/پایتون، مراجع گواهی SSL، و دامنه‌های بانکی) بسازید و قبل از انتخاب، با ابزار تست زیر از پاسخ‌دهی آن مطمئن شوید.
      </p>
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
          class="w-full sm:w-auto px-5 py-2 rounded-xl bg-cyberYellow text-black font-extrabold hover:opacity-90 text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyberYellow/20"
        >
          <RefreshCw v-if="testingSni" class="w-3.5 h-3.5 animate-spin text-black" />
          <span>{{ testingSni ? 'در حال سنجش…' : 'شروع تست ارتباط' }}</span>
        </button>
      </div>

      <!-- Test Result Output -->
      <div v-if="testResult" class="p-4 rounded-2xl border text-xs space-y-2 transition-all" :class="testResult.success ? 'bg-cyberGreen/10 border-cyberGreen/30 text-gray-200' : 'bg-red-500/10 border-red-500/30 text-gray-200'">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm" :class="testResult.success ? 'text-cyberGreen' : 'text-red-400'">
            {{ testResult.success ? '🟢 دامنه در دسترس است' : '🔴 مسدود یا دارای اختلال ارتباطی' }}
          </span>
          <span v-if="testResult.latencyMs" class="font-mono text-xs px-2 py-0.5 rounded-lg bg-black/40" dir="ltr">
            زمان پاسخ: {{ testResult.latencyMs }} ms
          </span>
        </div>
        <p class="text-xs text-gray-300">{{ testResult.message }}</p>
        <div v-if="testResult.issuer" class="text-[11px] text-gray-400 font-mono" dir="ltr">
          صادرکننده گواهی: {{ testResult.issuer }}
        </div>
      </div>

      <!-- Command Line Testing Instructions -->
      <div class="pt-2 border-t border-white/5 space-y-2">
        <p class="text-[11px] text-gray-400">دستورات تست دستی در ترمینال یا سرور شخص شما:</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono" dir="ltr">
          <div class="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">curl -svo /dev/null --connect-timeout 5 https://{{ sniTestDomain || 'yahoo.com' }}</span>
            <button @click="copyText(`curl -svo /dev/null --connect-timeout 5 https://${sniTestDomain || 'yahoo.com'}`)" class="text-cyberCyan hover:underline text-[10px] ml-2 shrink-0">کپی</button>
          </div>
          <div class="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">openssl s_client -connect {{ sniTestDomain || 'yahoo.com' }}:443 -servername {{ sniTestDomain || 'yahoo.com' }}</span>
            <button @click="copyText(`openssl s_client -connect ${sniTestDomain || 'yahoo.com'}:443 -servername ${sniTestDomain || 'yahoo.com'}`)" class="text-cyberCyan hover:underline text-[10px] ml-2 shrink-0">کپی</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Inbounds Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="inbound in inbounds" :key="inbound.id" class="glass-card p-5 rounded-3xl space-y-4 border border-white/10 hover:border-cyberCyan/30 transition-all">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-cyberCyan/15 text-cyberCyan flex items-center justify-center font-bold text-sm font-mono">{{ inbound.port }}</div>
            <div>
              <h3 class="font-bold text-white text-sm">{{ inbound.remark }}</h3>
              <p class="text-xs text-gray-400 uppercase font-mono">{{ inbound.protocol }} · {{ inbound.security }}</p>
            </div>
          </div>
          <span :class="['px-2.5 py-1 text-xs rounded-full font-semibold', inbound.enabled ? 'bg-cyberGreen/20 text-cyberGreen' : 'bg-red-500/20 text-red-400']">
            {{ inbound.enabled ? 'فعال' : 'غیرفعال' }}
          </span>
        </div>
        <div class="space-y-2 text-xs p-3.5 rounded-2xl bg-black/30 border border-white/5">
          <div class="flex justify-between text-gray-400"><span>نوع شبکه:</span><span class="text-white font-mono uppercase">{{ inbound.network }}</span></div>
          <div class="flex justify-between text-gray-400"><span>دامنه وانمودی (SNI):</span><span class="text-cyberCyan font-mono" dir="ltr">{{ inbound.sni }}</span></div>
          <div class="flex justify-between text-gray-400"><span>تکنولوژی Fragment:</span><span :class="inbound.enableFragment ? 'text-cyberGreen font-semibold' : 'text-gray-500'">{{ inbound.enableFragment ? '✓ فعال' : '✗ غیرفعال' }}</span></div>
          <div v-if="inbound.publicKey" class="flex justify-between text-gray-400">
            <span>Public Key:</span>
            <span class="text-gray-300 font-mono text-[10px] truncate max-w-[140px]" dir="ltr">{{ inbound.publicKey?.substring(0, 18) }}…</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="toggleInbound(inbound)" class="flex-1 py-2 rounded-xl text-xs font-semibold transition-all" :class="inbound.enabled ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-cyberGreen/10 text-cyberGreen hover:bg-cyberGreen/20'">
            {{ inbound.enabled ? 'غیرفعال‌سازی اینباند' : 'فعال‌سازی اینباند' }}
          </button>
          <button @click="deleteInbound(inbound.id)" class="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="حذف اینباند">
            <Trash2 class="w-4 h-4" />
          </button>
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
            <input v-model="form.remark" type="text" placeholder="مثال: VLESS-Reality-443" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberCyan outline-none" />
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
            <input v-model="form.port" type="number" placeholder="443" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono text-left text-white focus:border-cyberCyan outline-none" />
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

          <!-- === Categorized SNI Select === -->
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
                <option value="arvancloud.ir">arvancloud.ir — ابر آروان</option>
                <option value="irancell.ir">irancell.ir — ایرانسل</option>
                <option value="mci.ir">mci.ir — همراه اول</option>
                <option value="divar.ir">divar.ir — دیوار</option>
              </optgroup>
              <option value="custom">وارد کردن دستی دامنه دلخواه…</option>
            </select>
            <input v-if="form.sni === 'custom'" v-model="form.customSni" type="text" placeholder="mydomain.com" dir="ltr" class="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono text-left text-white focus:border-cyberCyan outline-none" />
          </div>

          <div v-if="form.security === 'reality'" class="col-span-2 space-y-3 p-3 rounded-2xl bg-cyberViolet/10 border border-cyberViolet/20">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-cyberViolet">کلیدهای اختصاصی REALITY (X25519)</p>
              <button @click="generateKeys" :disabled="keygenLoading" class="px-3 py-1 rounded-xl bg-cyberViolet/30 text-cyberViolet text-xs font-bold hover:bg-cyberViolet/50 transition-all disabled:opacity-50">
                {{ keygenLoading ? 'در حال ساخت کلید…' : 'تولید کلید جدید' }}
              </button>
            </div>
            <div><label class="block text-xs text-gray-400 mb-1">Private Key</label><input v-model="form.privateKey" type="text" dir="ltr" class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-left text-cyberGreen outline-none" /></div>
            <div><label class="block text-xs text-gray-400 mb-1">Public Key</label><input v-model="form.publicKey" type="text" dir="ltr" class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-left text-cyberCyan outline-none" /></div>
            <div><label class="block text-xs text-gray-400 mb-1">Short ID</label><input v-model="form.shortId" type="text" placeholder="6ba7b810" dir="ltr" class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-left text-white outline-none" /></div>
          </div>
          <div class="col-span-2 flex items-center gap-3 p-3 rounded-2xl bg-white/5">
            <input type="checkbox" v-model="form.enableFragment" id="frag" class="w-4 h-4 accent-cyberViolet cursor-pointer" />
            <label for="frag" class="text-xs text-gray-300 cursor-pointer">
              فعال‌سازی تکنولوژی <span class="text-cyberViolet font-semibold">Packet Fragment</span> جهت عبور از بسته‌بندی پکت‌های فیلترینگ
            </label>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateModal = false" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">انصراف</button>
          <button @click="createInbound" :disabled="creating" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyberCyan to-cyberViolet text-white text-xs font-bold shadow-lg hover:opacity-90 disabled:opacity-50">
            {{ creating ? 'در حال ذخیره…' : 'ذخیره اینباند' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Plus, Trash2, AlertTriangle, Activity, RefreshCw } from 'lucide-vue-next';

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const inbounds = ref<any[]>([]);
const showCreateModal = ref(false);
const creating = ref(false);
const keygenLoading = ref(false);

// SNI Tester states
const sniTestDomain = ref('archive.ubuntu.com');
const testingSni = ref(false);
const testResult = ref<any>(null);

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

async function runSniTest() {
  if (!sniTestDomain.value) return;
  testingSni.value = true;
  testResult.value = null;
  try {
    const res = await axios.get(`/api/sni/test?domain=${encodeURIComponent(sniTestDomain.value.trim())}`);
    testResult.value = res.data;
  } catch (err: any) {
    testResult.value = { success: false, message: 'خطا در برقراری ارتباط با سرور جهت تست' };
  } finally {
    testingSni.value = false;
  }
}

async function createInbound() {
  if (!form.value.port) return;
  creating.value = true;
  try {
    const sni = form.value.sni === 'custom' ? form.value.customSni : form.value.sni;
    await axios.post('/api/inbounds', { ...form.value, sni });
    showCreateModal.value = false;
    form.value = { remark: '', protocol: 'vless', port: 443, network: 'tcp', security: 'reality', sni: 'yahoo.com', customSni: '', privateKey: '', publicKey: '', shortId: '6ba7b810', enableFragment: true };
    props.toast?.('اینباند جدید با موفقیت ایجاد گردید', 'success');
    fetchInbounds();
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
  props.toast?.('دستور در حافظه کپی شد.', 'success');
}

onMounted(fetchInbounds);
</script>