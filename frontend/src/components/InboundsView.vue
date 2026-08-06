<template>
  <div class="space-y-6">
    <!-- Header Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-cyberYellow glow-yellow">ساخت و مدیریت اینباندها و کانفیگ‌ها</h2>
        <p class="text-sm text-gray-400">تعریف ساختار VPN، محدودیت حجم، انقضا، تست زنده SNI و مدیریت کانفیگ‌ها</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyberYellow via-red-600 to-cyberRed text-black font-extrabold text-sm shadow-lg shadow-cyberYellow/20 hover:opacity-90 transition-all border border-cyberYellow/40"
      >
        <Plus class="w-4 h-4 text-black font-bold" />
        ساخت اینباند / کانفیگ جدید
      </button>
    </div>

    <!-- Live SNI Connection Tester Panel -->
    <div class="glass-panel rounded-3xl p-6 border border-cyberYellow/30 space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <Activity class="w-5 h-5 text-cyberYellow" />
            <span>سامانه پایش و تست زنده دامنه‌های SNI (ارزیابی گذر از اینترنت ملی)</span>
          </h3>
          <p class="text-xs text-gray-400 mt-1">
            عملکرد هر SNI متغیر است و ممکن است روی همراه اول، ایرانسل یا در شرایط قطعی نت متفاوت باشد. پیش از ساخت کانفیگ، وضعیت اتصال دامنه را تست کنید.
          </p>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex flex-wrap items-center gap-2">
        <button 
          v-for="cat in sniCategories" 
          :key="cat.id" 
          @click="activeSniCat = cat.id"
          :class="['px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', activeSniCat === cat.id ? 'bg-cyberYellow text-black font-bold shadow-md shadow-cyberYellow/20' : 'bg-white/5 text-gray-300 hover:bg-white/10']"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- SNI Presets Grid & Custom Test -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="md:col-span-2 flex flex-wrap gap-2 p-3 bg-black/40 rounded-2xl border border-white/5 max-h-40 overflow-y-auto">
          <button 
            v-for="domain in filteredSniList" 
            :key="domain"
            @click="testDomainInput = domain; runSniTest(domain)"
            :class="['px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border', testDomainInput === domain ? 'bg-cyberYellow/20 text-cyberYellow border-cyberYellow' : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30']"
          >
            <span>{{ domain }}</span>
            <Play class="w-3 h-3 opacity-60" />
          </button>
        </div>

        <!-- Custom Domain Test Box -->
        <div class="p-3 bg-black/60 rounded-2xl border border-white/10 flex flex-col justify-between space-y-2">
          <label class="text-xs text-gray-400">تست دامنه دلخواه (Custom SNI):</label>
          <div class="flex items-center gap-2">
            <input 
              v-model="testDomainInput"
              type="text" 
              placeholder="ebanking.banksepah.ir"
              dir="ltr"
              class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left outline-none focus:border-cyberYellow"
            />
            <button 
              @click="runSniTest(testDomainInput)"
              :disabled="testingSni"
              class="px-3 py-1.5 rounded-xl bg-cyberYellow text-black font-bold text-xs hover:opacity-90 transition-all shrink-0 flex items-center gap-1"
            >
              <RefreshCw v-if="testingSni" class="w-3.5 h-3.5 animate-spin" />
              <span>تست</span>
            </button>
          </div>

          <!-- Test Result Box -->
          <div v-if="sniTestResult" :class="['p-2.5 rounded-xl border text-xs font-mono space-y-1', sniTestResult.success ? 'bg-cyberGreen/10 border-cyberGreen/30 text-cyberGreen' : 'bg-cyberRed/10 border-cyberRed/30 text-cyberRed']">
            <div class="flex items-center justify-between font-bold">
              <span>{{ sniTestResult.domain }}</span>
              <span>{{ sniTestResult.latencyMs }} ms</span>
            </div>
            <p class="text-[11px] opacity-90">{{ sniTestResult.message }}</p>
          </div>
        </div>
      </div>

      <!-- Technical Warnings & Engineering Best Practices for SNI -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
        <div class="p-3 rounded-2xl bg-cyberYellow/10 border border-cyberYellow/30 space-y-1">
          <div class="flex items-center gap-1.5 text-cyberYellow font-bold">
            <AlertTriangle class="w-4 h-4 shrink-0" />
            <span>⚠️ هشدار ۱: تفاوت رفتار اپراتورها (MCI / Irancell / ADSL)</span>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            دامنه‌ای که روی همراه اول پاسخ می‌دهد ممکن است روی ایرانسل یا شاتل مسدود باشد. قبل از ارائه عمومی کانفیگ، حتماً پایش زنده اتصال را انجام دهید.
          </p>
        </div>

        <div class="p-3 rounded-2xl bg-cyberRed/10 border border-cyberRed/30 space-y-1">
          <div class="flex items-center gap-1.5 text-cyberRed font-bold">
            <ShieldAlert class="w-4 h-4 shrink-0" />
            <span>⚠️ هشدار ۲: تغییر رفتار فیلترینگ در قطعی نت ملی</span>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            در زمان قطعی کامل اینترنت بین‌الملل، سیستم لیست سفید (Whitelist) فعال می‌شود. در این شرایط دامنه‌های شاپرک (درگاه‌های بانکی) و ابر آروان بالاترین پایداری را دارند.
          </p>
        </div>

        <div class="p-3 rounded-2xl bg-cyberGreen/10 border border-cyberGreen/30 space-y-1">
          <div class="flex items-center gap-1.5 text-cyberGreen font-bold">
            <Zap class="w-4 h-4 shrink-0" />
            <span>⚡ نکته فنی ۳: الزام ترکیب SNI با تکنولوژی Packet Fragment</span>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            استفاده از SNI بدون فعال بودن تکنولوژی Fragment ممکن است توسط سیستم‌های DPI زیرساخت شناسایی شود. حتماً چک‌باکس Fragment را روی اینباند فعال نگه دارید.
          </p>
        </div>

        <div class="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1">
          <div class="flex items-center gap-1.5 text-blue-400 font-bold">
            <Info class="w-4 h-4 shrink-0" />
            <span>💡 نکته فنی ۴: پشتیبانی از گواهی TLS 1.3 در پروتکل REALITY</span>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            در پروتکل VLESS-REALITY حتماً دامنه‌هایی را انتخاب کنید که از TLS 1.3 و Cipherهای مدرن پشتیبانی می‌کنند تا دست‌تکانی SSL بدون اختلال برقرار گردد.
          </p>
        </div>
      </div>
    </div>

    <!-- Inbound Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div 
        v-for="inbound in inbounds" 
        :key="inbound.id"
        class="glass-panel rounded-3xl p-5 border border-white/10 hover:border-cyberYellow/40 transition-all flex flex-col justify-between space-y-4"
      >
        <!-- Card Top Section -->
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-cyberYellow/10 border border-cyberYellow/30 text-cyberYellow flex items-center justify-center font-bold">
                <Network class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-extrabold text-white text-base">{{ inbound.remark }}</h3>
                <span class="text-xs font-mono text-cyberYellow" dir="ltr">Port: {{ inbound.port }} | {{ inbound.protocol.toUpperCase() }}-{{ inbound.security.toUpperCase() }}</span>
              </div>
            </div>

            <!-- Active / Inactive Switch -->
            <button 
              @click="toggleInbound(inbound)"
              :class="['px-3 py-1 rounded-full text-xs font-bold transition-all', inbound.enabled ? 'bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30']"
            >
              {{ inbound.enabled ? '🟢 فعال' : '🔴 غیرفعال' }}
            </button>
          </div>

          <!-- Technical Specs Badges -->
          <div class="flex flex-wrap gap-2 text-[11px] font-mono">
            <span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-300">SNI: {{ inbound.sni || 'yahoo.com' }}</span>
            <span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-300">Network: {{ inbound.network.toUpperCase() }}</span>
            <span v-if="inbound.enableFragment" class="px-2.5 py-1 rounded-xl bg-cyberYellow/10 border border-cyberYellow/30 text-cyberYellow font-semibold">⚡ Packet Fragment</span>
            <span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-300">{{ inbound.maxDevices || 2 }} کاربر همزمان</span>
          </div>

          <!-- Volume & Expiration Usage Progress -->
          <div class="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 text-xs">
            <div class="flex items-center justify-between text-gray-300 font-mono">
              <span>مصرف حجم:</span>
              <span class="text-cyberYellow font-bold" dir="ltr">
                {{ (Number(inbound.usedDataBytes || 0) / (1024*1024*1024)).toFixed(2) }} GB / {{ inbound.dataLimitGb > 0 ? inbound.dataLimitGb + ' GB' : 'نامحدود' }}
              </span>
            </div>
            <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                class="bg-gradient-to-r from-cyberYellow to-cyberRed h-full transition-all"
                :style="{ width: inbound.dataLimitGb > 0 ? Math.min(100, ((Number(inbound.usedDataBytes || 0)/(1024*1024*1024)) / inbound.dataLimitGb)*100) + '%' : '15%' }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-400">
              <span>تاریخ انقضا:</span>
              <span>{{ inbound.expireDate ? new Date(inbound.expireDate).toLocaleDateString('fa-IR') : 'بدون انقضا' }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <button @click="openConfigModal(inbound)" class="flex-1 py-2 px-3 rounded-xl bg-cyberYellow/20 border border-cyberYellow/40 text-cyberYellow hover:bg-cyberYellow/30 text-xs font-extrabold flex items-center justify-center gap-1 transition-all">
            <Download class="w-3.5 h-3.5" />
            دریافت لینک کانفیگ
          </button>
          <button @click="copyInboundInfoPage(inbound)" class="py-2 px-3 rounded-xl bg-cyberGreen/20 border border-cyberGreen/40 text-cyberGreen hover:bg-cyberGreen/30 text-xs font-extrabold flex items-center justify-center gap-1 transition-all" title="لینک صفحه وب اختصاصی کانفیگ جهت مشاهده میزان مصرف و بارکد">
            <ExternalLink class="w-3.5 h-3.5" />
            صفحه وب
          </button>
          <button @click="openEditModal(inbound)" class="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white transition-all" title="ویرایش اینباند">
            <Edit3 class="w-4 h-4" />
          </button>
          <button @click="deleteInbound(inbound.id)" class="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="حذف اینباند">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="inbounds.length === 0" class="col-span-full glass-panel rounded-3xl p-12 text-center text-gray-400">
        هیچ اینباندی هنوز تعریف نشده است. با زدن دکمه «ساخت اینباند / کانفیگ جدید» اولین اینباند را ایجاد کنید.
      </div>
    </div>

    <!-- Create Inbound Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-lg w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
          <Plus class="w-5 h-5 text-cyberYellow" />
          <span>افزودن اینباند / کانفیگ جدید</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-gray-400 mb-1">عنوان یا نام اینباند</label>
            <input v-model="form.remark" type="text" placeholder="مثال: VLESS-Reality-443" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberYellow outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">پروتکل ارتباطی</label>
              <select v-model="form.protocol" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="vless">VLESS (پیش‌نهادی)</option>
                <option value="vmess">VMess</option>
                <option value="trojan">Trojan</option>
                <option value="hysteria2">Hysteria 2</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-400 mb-1">پورت اینباند</label>
              <input v-model.number="form.port" type="number" placeholder="443" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">نوع شبکه (Transport)</label>
              <select v-model="form.network" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="tcp">TCP (پیش‌فرض)</option>
                <option value="grpc">gRPC</option>
                <option value="ws">WebSocket (WS)</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-400 mb-1">نوع رمزنگاری (Security)</label>
              <select v-model="form.security" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
                <option value="reality">REALITY (بالاترین امنیت ضد فیلترینگ)</option>
                <option value="tls">TLS</option>
                <option value="none">None (بدون رمزنگاری)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">سقف حجم (گیگابایت)</label>
              <input v-model.number="form.dataLimitGb" type="number" placeholder="0 برای نامحدود" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
            <div>
              <label class="block text-gray-400 mb-1">مدت اعتبار (روز)</label>
              <input v-model.number="form.expireDays" type="number" placeholder="30" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">تعداد دستگاه/کاربر همزمان (IP Limit)</label>
            <select v-model="form.maxDevices" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option :value="1">۱ کاربره</option>
              <option :value="2">۲ کاربره (پیش‌فرض)</option>
              <option :value="3">۳ کاربره</option>
              <option :value="5">۵ کاربره</option>
              <option :value="10">۱۰ کاربره</option>
            </select>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">انتخاب دامنه وانمودی (SNI)</label>
            <select v-model="selectedSniPreset" @change="handleSniPresetChange" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none mb-2">
              <optgroup label="☁️ ابر و CDNهای داخلی (احتمال دسترسی بالا در قطعی نت)">
                <option value="arvancloud.ir">arvancloud.ir — ابر آروان</option>
                <option value="n2a.arvancloud.ir">n2a.arvancloud.ir — شبکه توزیع آروان</option>
                <option value="iran.liara.run">iran.liara.run — پلتفرم ابری لیارا</option>
                <option value="derak.cloud">derak.cloud — ابر دراک</option>
                <option value="asiatech.ir">asiatech.ir — آسیا تک CDN</option>
              </optgroup>

              <optgroup label="💳 شبکه پرداخت و شاپرک (درگاه‌های بانکی همیشه فعال)">
                <option value="shaparak.ir">shaparak.ir — شبکه مرکزی شاپرک</option>
                <option value="pep.shaparak.ir">pep.shaparak.ir — درگاه بانک پاسارگاد</option>
                <option value="bpm.shaparak.ir">bpm.shaparak.ir — درگاه به پرداخت ملت</option>
                <option value="sadad.shaparak.ir">sadad.shaparak.ir — درگاه سداد بانک ملی</option>
                <option value="zarinpal.com">zarinpal.com — درگاه پرداخت زرین‌پال</option>
                <option value="ebanking.banksepah.ir">ebanking.banksepah.ir — بانک سپه</option>
                <option value="bmi.ir">bmi.ir — بانک ملی ایران</option>
              </optgroup>

              <optgroup label="🚗 سوپر اپ‌ها و خدمات ضروری کشور">
                <option value="snapp.ir">snapp.ir — اسنپ</option>
                <option value="tapsi.ir">tapsi.ir — تپسی</option>
                <option value="digikala.com">digikala.com — دیجی‌کالا</option>
                <option value="torob.com">torob.com — موتور جستجوی ترب</option>
                <option value="divar.ir">divar.ir — دیوار</option>
              </optgroup>

              <optgroup label="🏛️ پنجره ملی خدمات دولت و احراز هویت">
                <option value="my.gov.ir">my.gov.ir — پنجره ملی خدمات دولت</option>
                <option value="eservices.gov.ir">eservices.gov.ir — درگاه خدمات الکترونیک</option>
                <option value="tamin.ir">tamin.ir — سازمان تأمین اجتماعی</option>
              </optgroup>

              <optgroup label="🌐 دامنه‌های بین‌المللی عمومی باثبات">
                <option value="yahoo.com">yahoo.com — یاهو</option>
                <option value="www.google.com">www.google.com — گوگل</option>
                <option value="dl.google.com">dl.google.com — دانلود گوگل</option>
                <option value="www.microsoft.com">www.microsoft.com — مایکروسافت</option>
                <option value="speed.cloudflare.com">speed.cloudflare.com — کلادفلر</option>
                <option value="www.amazon.com">www.amazon.com — آمازون</option>
                <option value="www.apple.com">www.apple.com — اپل</option>
              </optgroup>

              <optgroup label="📦 مخازن نرم‌افزاری و OS (احتمال ۹۰٪ استثنا در نت ملی)">
                <option value="archive.ubuntu.com">archive.ubuntu.com — مخازن اوبونتو</option>
                <option value="pypi.org">pypi.org — مخازن پایتون</option>
                <option value="registry.npmjs.org">registry.npmjs.org — مخازن نودJS</option>
              </optgroup>

              <optgroup label="🔒 مراجع صدور گواهی SSL (ضروری برای کل اینترنت)">
                <option value="acme-v02.api.letsencrypt.org">acme-v02.api.letsencrypt.org — Let's Encrypt</option>
                <option value="ocsp.digicert.com">ocsp.digicert.com — DigiCert</option>
              </optgroup>

              <option value="custom">✏️ وارد کردن دامنه دلخواه (Custom SNI)</option>
            </select>

            <input 
              v-if="selectedSniPreset === 'custom'"
              v-model="form.sni"
              type="text"
              placeholder="مثال: mydomain.com"
              dir="ltr"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none"
            />
          </div>

          <div class="p-3 bg-cyberYellow/10 border border-cyberYellow/30 rounded-2xl flex items-center justify-between">
            <div>
              <span class="font-bold text-white block">تکنولوژی Packet Fragment</span>
              <span class="text-[10px] text-gray-300">تکه‌تکه‌سازی پکت‌های اولیه جهت عبور از DPI زیرساخت</span>
            </div>
            <input type="checkbox" v-model="form.enableFragment" class="w-5 h-5 accent-cyberYellow" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showCreateModal = false" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">انصراف</button>
          <button @click="createInbound" class="px-5 py-2 rounded-xl bg-cyberYellow text-black text-xs font-bold shadow-lg shadow-cyberYellow/30 hover:opacity-90">
            ذخیره و ایجاد اینباند
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Inbound Modal -->
    <div v-if="editingInbound" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-md w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4">
        <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
          <Edit3 class="w-5 h-5 text-cyberYellow" />
          <span>ویرایش اینباند: {{ editingInbound.remark }}</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-gray-400 mb-1">عنوان اینباند</label>
            <input v-model="editForm.remark" type="text" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyberYellow outline-none" />
          </div>

          <div>
            <label class="block text-gray-400 mb-1">دامنه وانمودی (SNI)</label>
            <input v-model="editForm.sni" type="text" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 mb-1">سقف حجم (گیگابایت)</label>
              <input v-model.number="editForm.dataLimitGb" type="number" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
            <div>
              <label class="block text-gray-400 mb-1">تمدید اعتبار (روز)</label>
              <input v-model.number="editForm.expireDays" type="number" placeholder="روزهای جدید" dir="ltr" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:border-cyberYellow outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-gray-400 mb-1">تعداد کاربر/دستگاه همزمان</label>
            <select v-model="editForm.maxDevices" class="w-full bg-[#06070a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
              <option :value="1">۱ کاربره</option>
              <option :value="2">۲ کاربره</option>
              <option :value="3">۳ کاربره</option>
              <option :value="5">۵ کاربره</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="editingInbound = null" class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">انصراف</button>
          <button @click="saveInboundEdit" class="px-5 py-2 rounded-xl bg-cyberYellow text-black text-xs font-bold shadow-lg shadow-cyberYellow/30 hover:opacity-90">
            ذخیره تغییرات
          </button>
        </div>
      </div>
    </div>

    <!-- Config & Links Modal -->
    <div v-if="selectedInboundForConfig" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-panel max-w-2xl w-full rounded-3xl p-6 border border-cyberYellow/40 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>🔑 کانفیگ‌های خروجی: {{ selectedInboundForConfig.remark }}</span>
          </h3>
          <button @click="selectedInboundForConfig = null" class="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div v-if="configLoading" class="flex items-center justify-center py-8">
          <div class="w-6 h-6 border-2 border-cyberYellow border-t-transparent rounded-full animate-spin"></div>
          <span class="mr-3 text-gray-400 text-sm">در حال تولید لینک‌ها...</span>
        </div>

        <div v-if="inboundConfigs && !configLoading" class="space-y-4">
          <!-- Direct VLESS Link -->
          <div class="bg-black/50 rounded-2xl p-3.5 border border-cyberYellow/20 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-cyberYellow font-extrabold">لینک مستقیم VLESS REALITY</span>
              <button @click="copy(inboundConfigs.vlessLink)" class="px-3 py-1 rounded-lg bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30 text-xs font-bold">کپی VLESS</button>
            </div>
            <pre dir="ltr" class="text-[11px] font-mono text-gray-200 break-all whitespace-pre-wrap text-left p-3 bg-black/70 rounded-xl border border-white/10 leading-relaxed">{{ inboundConfigs.vlessLink }}</pre>
          </div>

          <!-- Base64 Subscription -->
          <div class="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-cyberGreen font-extrabold">لینک سابسکریپشن مستقیم (Base64)</span>
              <button @click="copy(inboundConfigs.base64Sub)" class="px-3 py-1 rounded-lg bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30 text-xs font-bold">کپی سابسکریپشن</button>
            </div>
            <input readonly :value="inboundConfigs.subUrl" dir="ltr" class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left text-cyberYellow outline-none" />
          </div>

          <!-- Dedicated Web Info Page Link -->
          <div class="p-3.5 bg-cyberYellow/10 rounded-2xl border border-cyberYellow/30 flex items-center justify-between gap-3 text-xs">
            <span class="text-gray-200">صفحه وب اختصاصی مشاهده مشخصات و حجم:</span>
            <button @click="copy(inboundConfigs.userInfoUrl)" class="px-3 py-1 rounded-xl bg-cyberYellow text-black font-bold">کپی لینک صفحه وب</button>
          </div>

          <!-- QR Code -->
          <div class="flex flex-col items-center gap-2 pt-2">
            <p class="text-xs text-gray-300 font-bold">اسکن بارکد QR</p>
            <div class="bg-white p-4 rounded-2xl shadow-2xl">
              <QrcodeVue :value="inboundConfigs.vlessLink" :size="180" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Plus, Trash2, Download, Network, Edit3, ExternalLink, Activity, Play, RefreshCw, AlertTriangle, ShieldAlert, Zap, Info } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';

const inbounds = ref<any[]>([]);
const showCreateModal = ref(false);
const editingInbound = ref<any>(null);
const selectedInboundForConfig = ref<any>(null);
const inboundConfigs = ref<any>(null);
const configLoading = ref(false);
const selectedSniPreset = ref('yahoo.com');

// Live SNI Tester State
const activeSniCat = ref('CLOUD');
const testDomainInput = ref('arvancloud.ir');
const testingSni = ref(false);
const sniTestResult = ref<any>(null);

const sniCategories = [
  { id: 'CLOUD', label: '☁️ ابر و CDN داخلی' },
  { id: 'SHAPARAK', label: '💳 درگاه بانکی/شاپرک' },
  { id: 'APPS', label: '🚗 سوپر اپ‌ها' },
  { id: 'GOV', label: '🏛️ خدمات دولتی' },
  { id: 'REPOS', label: '📦 مخازن نرم‌افزار' },
  { id: 'SSL', label: '🔒 مراجع SSL' },
  { id: 'GENERAL', label: '🌐 بین‌المللی باثبات' },
];

const sniLists: Record<string, string[]> = {
  CLOUD: ['arvancloud.ir', 'n2a.arvancloud.ir', 'iran.liara.run', 'storage.iran.liara.ir', 'derak.cloud', 'asiatech.ir', 'hostiran.net'],
  SHAPARAK: ['shaparak.ir', 'pep.shaparak.ir', 'bpm.shaparak.ir', 'sadad.shaparak.ir', 'zarinpal.com', 'ebanking.banksepah.ir', 'bmi.ir', 'bank-maskan.ir', 'tejarat24.ir'],
  APPS: ['snapp.ir', 'tapsi.ir', 'digikala.com', 'torob.com', 'divar.ir', 'sheypoor.com', 'bale.ai', 'eitaa.com', 'rubika.ir'],
  GOV: ['my.gov.ir', 'eservices.gov.ir', 'ncr.ir', 'tamin.ir', 'tax.gov.ir'],
  REPOS: ['archive.ubuntu.com', 'security.ubuntu.com', 'pypi.org', 'registry.npmjs.org', 'registry-1.docker.io'],
  SSL: ['acme-v02.api.letsencrypt.org', 'ocsp.digicert.com', 'ocsp.sectigo.com', 'ocsp2.globalsign.com'],
  GENERAL: ['yahoo.com', 'www.google.com', 'dl.google.com', 'www.microsoft.com', 'speed.cloudflare.com', 'www.amazon.com', 'www.apple.com']
};

const filteredSniList = computed(() => sniLists[activeSniCat.value] || sniLists.BANK);

async function runSniTest(domain: string) {
  if (!domain) return;
  testingSni.value = true;
  sniTestResult.value = null;
  try {
    const res = await axios.get(`/api/sni/test?domain=${encodeURIComponent(domain)}`);
    sniTestResult.value = res.data;
  } catch (err: any) {
    sniTestResult.value = {
      domain,
      success: false,
      latencyMs: 4000,
      message: 'خطا در ارتباط شبکه (احتمال مسدودی)'
    };
  } finally {
    testingSni.value = false;
  }
}

const props = defineProps<{ toast?: (msg: string, type?: 'success' | 'error' | 'info') => void }>();

const form = ref({
  remark: '',
  port: 443,
  protocol: 'vless',
  network: 'tcp',
  security: 'reality',
  sni: 'yahoo.com',
  enableFragment: true,
  dataLimitGb: 0,
  expireDays: 30,
  maxDevices: 2
});

const editForm = ref({
  remark: '',
  sni: 'yahoo.com',
  dataLimitGb: 0,
  expireDays: 0,
  maxDevices: 2
});

function handleSniPresetChange() {
  if (selectedSniPreset.value !== 'custom') {
    form.value.sni = selectedSniPreset.value;
  }
}

async function fetchInbounds() {
  try {
    const res = await axios.get('/api/inbounds');
    inbounds.value = res.data;
  } catch (err) {
    console.error('Failed to fetch inbounds:', err);
  }
}

async function createInbound() {
  try {
    const res = await axios.post('/api/inbounds', form.value);
    showCreateModal.value = false;
    const created = res.data;
    props.toast?.('اینباند / کانفیگ جدید با موفقیت ساخته شد', 'success');
    fetchInbounds();
    if (created) openConfigModal(created);
  } catch (err: any) {
    props.toast?.(err?.response?.data?.error || 'خطا در ساخت اینباند', 'error');
  }
}

function openEditModal(inbound: any) {
  editingInbound.value = inbound;
  editForm.value = {
    remark: inbound.remark,
    sni: inbound.sni || 'yahoo.com',
    dataLimitGb: inbound.dataLimitGb || 0,
    expireDays: 0,
    maxDevices: inbound.maxDevices || 2
  };
}

async function saveInboundEdit() {
  if (!editingInbound.value) return;
  try {
    await axios.patch(`/api/inbounds/${editingInbound.value.id}`, editForm.value);
    props.toast?.('مشخصات اینباند با موفقیت به روز شد', 'success');
    editingInbound.value = null;
    fetchInbounds();
  } catch (err) {
    props.toast?.('خطا در بروزرسانی اینباند', 'error');
  }
}

async function toggleInbound(inbound: any) {
  try {
    await axios.patch(`/api/inbounds/${inbound.id}`, { enabled: !inbound.enabled });
    fetchInbounds();
  } catch (err) {
    props.toast?.('خطا در تغییر وضعیت اینباند', 'error');
  }
}

async function deleteInbound(id: string) {
  if (!confirm('آیا از حذف این اینباند اطمینان دارید؟')) return;
  try {
    await axios.delete(`/api/inbounds/${id}`);
    props.toast?.('اینباند حذف شد', 'success');
    fetchInbounds();
  } catch (err) {
    props.toast?.('خطا در حذف اینباند', 'error');
  }
}

async function openConfigModal(inbound: any) {
  selectedInboundForConfig.value = inbound;
  configLoading.value = true;
  inboundConfigs.value = null;
  try {
    const res = await axios.get(`/api/inbounds/${inbound.id}/configs`);
    inboundConfigs.value = res.data;
  } catch (err) {
    console.error('Failed to load configs:', err);
  } finally {
    configLoading.value = false;
  }
}

function copyInboundInfoPage(inbound: any) {
  const host = window.location.host;
  const link = `http://${host}/subinfo/${inbound.uuid || inbound.id}`;
  navigator.clipboard.writeText(link);
  props.toast?.('لینک صفحه وب کانفیگ کپی شد.', 'success');
}

function copy(text: string) {
  navigator.clipboard.writeText(text);
  props.toast?.('محتوا کپی شد.', 'success');
}

onMounted(fetchInbounds);
</script>