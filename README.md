<div align="center">

<p align="center">
  <img src="mainlogo.png" alt="Nyx Panel Main Banner" width="100%" />
</p>

# 🛡️ Nyx Panel (نیکس پنل)
### سامانه پیشرفته مدیریت اتصالات Xray-core متمرکز بر شبکه و فیلترینگ ایران
#### 🔐 توسعه داده‌شده توسط تیم امنیتی ساینت (Cynet Security Team)

[![Version](https://img.shields.io/badge/version-2.4.0-blueviolet?style=for-the-badge&logo=shield)](https://github.com/icynetx/Nyx)
[![Deploy on Railway](https://railway.com/button.svg)](#-3-راه‌اندازی-رایگان-روی-سرورهای-ابری-railway--render--docker)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://github.com/icynetx/Nyx)
[![Telegram](https://img.shields.io/badge/Telegram-cynetx-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/cynetx)
[![YouTube Video](https://img.shields.io/badge/Watch_Video-6Ekgxg--eSx8-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/6Ekgxg-eSx8)
[![Website](https://img.shields.io/badge/Website-cynetx.ir-cyberCyan?style=for-the-badge)](https://cynetx.ir)
[![License](https://img.shields.io/badge/license-MIT-cyberGreen?style=for-the-badge)](https://github.com/icynetx/Nyx/blob/main/LICENSE)

<p align="center">
  <b>Language Options / تغییر زبان:</b>
  <br />
  <b>🇮🇷 Persian (فارسی)</b> • <a href="README_EN.md">🇺🇸 English</a>
</p>

<p align="center" dir="rtl">
  طراحی‌شده برای شرایط اختلالات شبکه، مسدودی SNI و انتقال ترافیک بین سرور داخل و خارج
  <br />
  <code>VLESS + REALITY (X25519)</code> · <code>Packet Fragment</code> · <code>Auto-Failover SNI</code> · <code>Cloudflare WARP</code> · <code>Auto Backup</code>
</p>

<p align="center">
  <a href="https://youtu.be/6Ekgxg-eSx8" target="_blank">
    <img src="https://i.ytimg.com/vi/6Ekgxg-eSx8/hqdefault.jpg" alt="Nyx Panel YouTube Video Demo" width="85%" />
  </a>
  <br />
  <br />
  <a href="https://youtu.be/6Ekgxg-eSx8" target="_blank">
    <img src="https://img.shields.io/badge/YouTube-Watch_Full_Video_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch on YouTube" />
  </a>
  <br />
  <br />
  <a href="https://youtu.be/6Ekgxg-eSx8" target="_blank">
    <span dir="rtl">🔴 <b>جهت تماشای ویدیو معرفی و آموزش کامل در یوتیوب کلیک کنید</b> 🔴</span>
  </a>
</p>

[⚡ راهنمای نصب سریع](#-راهنمای-نصب-سریع-روی-سرور-لینوکس-و-ویندوز) •
[☁️ راه‌اندازی رایگان ابری و داکر](#-3-راه‌اندازی-رایگان-روی-سرورهای-ابری-railway--render--docker) •
[⚛️ موتور Quantum MultiPath](#-موتور-quantum-multipath-engine-v230---تحول-اصلی-این-نسخه) •
[🚀 قابلیت‌های جدید v2.3](#-قابلیت‌های-جدید-در-نسخه-v230) •
[📊 جدول مقایسه فنی](#-جدول-مقایسه-فنی-nyx-panel-با-سایر-پنل‌ها) •
[🧩 توضیحات کامل امکانات](#-توضیحات-تفصیلی-امکانات-پنل) •
[🤖 راهنمای ربات تلگرام](#-راهنمای-کامل-پیکربندی-و-استفاده-از-ربات-تلگرام) •
[📱 اتصال کلاینت‌ها](#-راهنمای-استفاده-در-نرم‌افزارهای-کلاینت) •
[🗑️ راهنمای حذف](#-راهنمای-حذف-کامل-و-پاکسازی-پنل)

</div>

---

<div dir="rtl">

## ⚛️ موتور `Quantum MultiPath Engine v2.3.0` — تحول اصلی این نسخه

> 🔥 **مشکلی که هیچ پنلی حل نکرده بود، امروز حل شد.**

### مشکل واقعی:
در قطعی‌های سنگین اینترنت ایران (مانند ساعات قطعی گسترده اپراتورهای همراه اول و ایرانسل)، حتی با پیشرفته‌ترین پروتکل‌ها مانند `VLESS Reality` و `Packet Fragment`، اتصال کاربر به طور کامل قطع می‌شود و هیچ راه جایگزینی وجود ندارد.

### راه‌حل — سامانه `Nyx Quantum MultiPath Engine`:
**موتور مسیریابی چندگانه کوانتومی** که **۴ مسیر اتصال مستقل را به صورت همزمان** پایش و مدیریت می‌کند:

</div>

<div dir="ltr">

```text
🛡️ Route 1 (Standard):    Direct VLESS + REALITY ──► Free Internet ✅
☁️ Route 2 (DPI Blocked): Domestic Iran CDN (ArvanCloud PoP) ──► Server ──► Internet ✅
🌐 Route 3 (Heavy Cut):   DNS Tunnel via Port 53 ──► Internet ✅  
📡 Route 4 (Emergency):   L3 ICMP Ping Tunnel ──► Internet ✅
```

</div>

<div dir="rtl">

### قابلیت‌های ۴ گانه:

| قابلیت | توضیح |
|---|---|
| **🔄 سوئیچ خودکار (`Auto-Switch`)** | هر ۱۵ ثانیه ۴ مسیر همزمان تست می‌شوند و بهترین مسیر خودکار انتخاب می‌شود. |
| **📊 سابسکریپشن هوشمند (`Smart Subscription`)** | سابسکریپشن کاربر همیشه سالم‌ترین سرور را در ردیف اول قرار می‌دهد (`Load Balancer`). |
| **🚨 وضعیت اضطراری (`Panic Mode`)** | در زمان قطعی ۱۰۰٪، هشدار فوری به تلگرام ادمین ارسال شده و بازیابی خودکار انجام می‌شود. |
| **📡 داشبورد زنده (`Live Dashboard`)** | نمایش لحظه‌ای وضعیت هر ۴ مسیر با پینگ، پایداری و امتیاز سلامت. |

### مقایسه عملکرد در شرایط مختلف شبکه:

| شرایط شبکه | قبل از نسخه ۲.۳ | بعد از نسخه ۲.۳ |
|---|---|---|
| شرایط عادی | ✅ متصل | ✅ متصل با سریع‌ترین مسیر |
| اختلال و `DPI` سنگین اپراتور | ❌ قطع ارتباط / تغییر دستی | ✅ سوئیچ خودکار در ۱۵ ثانیه |
| قطعی سنگین اینترنت بین‌الملل | ❌ قطع کامل | ✅ سوئیچ به `CDN` ایرانی |
| قطعی ۱۰۰٪ بین‌الملل (شبکه ملی) | ❌ قطع کامل اتصال | ✅ فعال شدن `Panic Mode` و تونل `DNS` |
| سرور شلوغ و پر ترافیک | ❌ افت شدید سرعت | ✅ توزیع بار خودکار (`Load Balancer`) |

---

## 🚀 قابلیت‌های جدید در نسخه v2.4.0 (The Power & Customization Update)

### 🌐 ۱. پشتیبانی از دامنه اختصاصی و CDN کلودفلر (`Custom Domain & CDN Mapping`)
* **اتصال دامنه و ساب‌دامین:** امکان تنظیم دامنه سرور (مثلاً `vpn.mydomain.com` یا دامنه CDN کلودفلر) در تب تنظیمات و اتصال آن به عنوان هاست اصلی در تمام لینک‌های تولیدی، سابسکریپشن‌ها، سینگ‌باکس و کلش به جای IP خام سرور.
* **پشتیبانی از دامنه اختصاصی به ازای هر اینباند:** قابلیت تعیین دامنه یا هاست مجزا برای هر اینباند به صورت مستقل.

### ⚡ ۲. شخصی‌سازی پیشرفته پکت فرگمنت در پنل (`Advanced Fragment Tuning`)
* **تنظیم دقیق بازه پکت‌ها و اینتروال:** امکان تنظیم دستی `Fragment Length` (مثلاً `100-200`) و `Fragment Interval` (مثلاً `10-20`) در فرم ساخت و ویرایش اینباندها.
* **پریست‌های بهینه‌سازی‌شده اپراتورها:** دارای دکمه‌های سریع برای انتخاب خودکار بهترین مقادیر تست‌شده برای **همراه اول**، **ایرانسل** و **ترافیک داخلی**.

### 🚀 ۳. پشتیبانی از ترنسپورت نسل جدید `XHTTP (SplitHTTP)` و `gRPC` و پروتکل `Trojan`
* **پروتکل XHTTP:** جدیدترین نوآوری هسته Xray برای عبور از فیلترینگ شدید و دور زدن مسدودی وب‌سوکت‌ها.
* **تنوع کامل پروتکل‌ها:** پشتیبانی کامل از `VLESS`, `VMess`, `Trojan` روی ترنسپورت‌های `TCP Reality`, `WebSocket`, `XHTTP`, `gRPC`.

### 🔍 ۴. جستجو و فیلتر زنده در لیست کاربران و اینباندها (`Instant Live Search`)
* **سرچ سریع کاربران:** فیلتر لحظه‌ای کاربران بر اساس نام کاربری، شناسه UUID یا وضعیت (Active/Expired).
* **سرچ سریع اینباندها:** جستجوی فوری بر اساس عنوان اینباند، پورت، پروتکل، SNI یا دامنه اختصاصی.

### 🎨 ۵. شخصی‌سازی کامل صفحه ساب مشتری و برندینگ اختصاصی (`Sub Portal Custom Branding`)
* **برندینگ نام و لوگو:** امکان تعریف نام برند و آدرس لوگوی دلخواه در تب تنظیمات برای نمایش اختصاصی در صفحه وب مشترکین (`/subinfo/:uuid`).
* **ارتباط با پشتیبانی و تمدید اشتراک:** قرار دادن دکمه‌های مستقیم آیدی پشتیبانی تلگرام و کانال تلگرام برای راهنمایی یا خرید/تمدید کاربران.
* **کادر اطلاعیه و راهنمای مشتری:** درج پیام‌ها و نکات آموزشی برای مشتریان بالای صفحه اشتراک.
* **دانلود ۱-کلیک اپلیکیشن‌های کلاینت:** باکس‌های اختصاصی دانلود نرم‌افزارهای اندروید (v2rayNG)، آیفون (Streisand) و ویندوز (v2rayN).

---

## 📦 قابلیت‌های کلیدی نسخه v2.3.0

<p align="center">
  <img src="media_v23_release.jpg" alt="Nyx Panel v2.3.0 Release Banner" width="100%" />
</p>

### ⚛️ ۱. موتور پایش و مسیریابی زنده ۴ مسیره (`Quantum MultiPath Engine`)
* **پایش موازی در هر ۱۵ ثانیه:** پایش همزمان ۴ مسیر ارتباطی مختلف بدون تداخل با پردازش موازی (`Promise.allSettled`).
* **پوشش ۴ لایه شبکه:** مسیر ۱ (مستقیم `VLESS Reality`)، مسیر ۲ (`CDN` ابر آروان در شرایط `DPI`)، مسیر ۳ (پورت ۵۳ تونل `DNS` برای قطعی‌های سنگین) و مسیر ۴ (پینگ لایه ۳ `ICMP`).
* **سوئیچ هوشمند:** در صورت افت کیفیت یک مسیر، بدون قطعی کاربر بهترین مسیر جایگزین می‌شود.

### ⚖️ ۲. لودبالانسر هوشمند و اولویت‌بندی سابسکریپشن (`Smart Health Load Balancer`)
* **رتبه‌بندی لحظه‌ای سرورها:** هر ۳۰ ثانیه تمام اینباندهای فعال بر اساس تاخیر زمانی، پایداری و نرخ آپتایم نمره‌دهی (۰ تا ۱۰۰) می‌شوند.
* **بهترین سرور همیشه در ردیف اول:** هر زمان کاربر یا کلاینت لینک سابسکریپشن را آپدیت کند، پایدارترین و سریع‌ترین سرور به صورت خودکار در بالاترین ردیف قرار می‌گیرد.

### 🚨 ۳. سیستم مدیریت بحران و آژیر قطعی کامل (`Panic Mode Emergency Response`)
* **تشخیص قطعی ۱۰۰٪ بین‌الملل:** استفاده از منطق `Hysteresis` (نیاز به ۳ تست متوالی ناموفق برای جلوگیری از آلارم کاذب).
* **ارسال گزارش فوری به تلگرام ادمین:** اطلاع‌رسانی بلادرنگ قطعی نت به ربات تلگرام ادمین و ارسال پیام رفع بحران به همراه مدت زمان دقیق قطعی (دقیقه و ثانیه) پس از اتصال مجدد.

### 📊 ۴. داشبورد زنده پایش مسیرهای اینترنت ایران (`Live Network Health Dashboard`)
* **کارت‌های زنده ۴ مسیر:** نمایش زنده پینگ (`ms`)، امتیاز پایداری با رنگ‌بندی داینامیک و برچسب `BEST` برای مسیر بهینه.
* **دکمه تست اجباری (`Force Recheck`):** امکان سنجش فوری وضعیت هر ۴ مسیر تنها با ۱ کلیک از پنل وب.

### 🎨 ۵. بازطراحی کامل محیط کاربری (`Warm Luxury Glassmorphism & Soft UI`)
* **پالت رنگی گرم و چشم‌نواز:** جایگزینی تم‌های تند نئونی با ابسیدین گرم، گرادیانت‌های کهربایی (`Amber Gold`)، زمردی (`Emerald`) و رز (`Rose`) همراه با هاله‌های نوری محو معلق.
* **ریسپانسیو ۱۰۰٪ بی‌نقص روی گوشی‌های موبایل:** بهینه‌سازی کامل تمام کارت‌ها، دکمه‌ها و منوها برای انواع گوشی، تبلت و دسکتاپ.

---

## 📦 قابلیت‌های کلیدی نسخه v2.2.0

### 💾 ۱. بکاپ‌گیری خودکار دیتابیس در تلگرام و بازیابی سریع (`Auto DB Backup & 1-Click Restore`)
* **بکاپ‌گیری ۲۴ ساعته خودکار:** ارسال خودکار فایل دیتابیس رمزشده به تلگرام ادمین با کد اعتبارسنجی `SHA-256`.
* **بازیابی سریع در ۳ ثانیه:** با ارسال مجدد فایل بکاپ به ربات تلگرام، تمام کاربران و تنظیمات فوراً بازگردانی می‌شوند.

### 🛡️ ۲. سامانه هوشمند سوئیچ خودکار `SNI` در زمان قطعی نت (`Smart Auto-Failover Daemon`)
* پایش زنده اتصال `TLS` تمام اینباندها و سوئیچ خودکار به دامنه‌های لیست سفید در زمان فیلتر شدن `SNI` بدون تغییر لینک کاربران.

### 🌐 ۳. خروجی کلودفلر `WARP` و مدیریت سیستم (`Cloudflare WARP Outbound`)
* رفع تحریم کامل سرویس‌های `OpenAI`، `ChatGPT`، `Netflix` و مخفی‌سازی `IP` سرور به همراه امکان ریستارت سرویس از وب‌داشبورد.

<br />

<p align="center">
  <img src="media_warp_backup.png" alt="Nyx Panel Dashboard" width="100%" />
  <br />
  <i>نمای تب تنظیمات، خروجی کلودفلر WARP و بکاپ‌گیری خودکار دیتابیس</i>
</p>

---

## 📌 چرا پنل نیکس؟ (`Why Nyx Panel?`)

در شرایط اختلالات شبکه در ایران، الگوهای فیلترینگ و تحلیل پکت (`DPI`) اپراتورها (همراه اول، ایرانسل و مخابرات) به صورت مداوم تغییر می‌کنند. اکثر پنل‌های سنتی به دلیل مصرف بالای رم (بیش از ۳۰۰ مگابایت)، پیچیدگی‌های ساختاری یا عدم پایش هوشمند، در اختلالات شدید دچار قطعی کامل می‌شوند.

پروژه **Nyx Panel** با هدف ارائه یک راهکار سبک، پایدار و فوق‌العاده کم‌مصرف بر پایه تکنولوژی‌های روز `Xray` توسعه یافته است. مصرف حافظه رم این پنل تنها حدود **۷۰ تا ۱۰۰ مگابایت** است و امکاناتی مثل **ربات دکمه‌ای ادمین**، **پورتال اختصاصی برای هر کاربر**، **تست زنده اتصال `SNI`**، **سوئیچ خودکار در زمان مسدودی** و **اسکریپت‌ساز هوشمند تونل** را در اختیارتان قرار می‌دهد.

---

## 📊 جدول مقایسه فنی Nyx Panel با سایر پنل‌ها

<p align="center">
  <img src="media_comparison.jpg" alt="Nyx Panel Comparison Infographic" width="100%" />
</p>

</div>

<div dir="ltr" align="center">

| Feature / Capability | 🛡️ Nyx Panel v2.3 | 3x-ui (Sanaei) | Marzban |
|---|:---:|:---:|:---:|
| **⚛️ Quantum MultiPath 4-Route Engine** | **Yes (4 Parallel Live Routes)** | No | No |
| **⚖️ Smart Health Load Balancer for Subscriptions** | **Yes (Auto-sorts healthiest server)** | No | No |
| **🚨 Panic Mode Blackout Detection & Telegram Alert** | **Yes (Hysteresis-based)** | No | No |
| **Cross-Platform (Linux + Windows Server)** | **Yes (Native PowerShell + Bash)** | Linux Only | Linux Only |
| **RAM Footprint (Memory)** | **Lightweight (~70 MB)** | Moderate (~250 MB) | Heavy (~400 MB+) |
| **Automated Telegram DB Backup & 1-Click Restore** | **Yes (Auto 24h & Telegram Upload)** | Complex Manual | Manual Script |
| **Smart Auto-Failover SNI Daemon** | **Yes (DPI Blackout Auto-Switch)** | No | No |
| **1-Click Cloudflare WARP Outbound** | **Yes (Anti-Sanction & IP Shield)** | Complex Manual | Complex Manual |
| **Token-based Authentication** | **Yes (Secure Auth)** | Yes | Yes |
| **Live Traffic Sync via gRPC** | **Yes (Every 20 seconds)** | Yes | Yes |
| **Live TLS SNI Handshake Tester** | **Built-in Panel Tool** | No | No |
| **100% Button-driven Telegram Bot** | **Yes (Step-by-step Wizard)** | Limited | Command-based |
| **Standalone User Web Page** | **Yes (`/subinfo/UUID`)** | No | Basic |
| **Intranet Tunnel Generator** | **Yes (Gost v3 / ICMP / DNS)** | No | No |
| **VLESS + REALITY Support** | **Yes (X25519 Keypair)** | Yes | Yes |

</div>

<div dir="rtl">

---

> 🪟 **پشتیبانی کامل از ویندوز سرور:** پنل Nyx علاوه بر لینوکس، به صورت کاملاً نیتیو روی تمام نسخه‌های ویندوز سرور (۲۰۱۶ تا ۲۰۲۲) و ویندوز ۱۰ و ۱۱ نیز نصب و اجرا می‌شود.

---

## 💻 راهنمای نصب سریع روی سرور لینوکس و ویندوز

### 🐧 ۱. نصب روی سرور لینوکس (`Ubuntu / Debian / CentOS`):
دستور زیر را با دسترسی **root** در ترمینال لینوکس اجرا کنید:

</div>

<div dir="ltr">

```bash
bash <(curl -Ls https://raw.githubusercontent.com/icynetx/Nyx/main/install.sh)
```

</div>

<div dir="rtl">

---

### 🪟 ۲. نصب روی سرور ویندوز (`Windows Server / Windows 10/11`):
ترمینال **PowerShell** را به صورت **Run as Administrator** باز کرده و دستور زیر را اجرا کنید:

</div>

<div dir="ltr">

```powershell
iwr -useb https://raw.githubusercontent.com/icynetx/Nyx/main/install.ps1 | iex
```

</div>

<div dir="rtl">

---

### ☁️ ۳. راه‌اندازی رایگان روی سرورهای ابری (`Railway / Render / Docker`):

اگر سرور مجازی (`VPS`) ندارید یا نمی‌خواهید هزینه ماهانه سرور خارجی پرداخت کنید، می‌توانید پنل Nyx را روی پلتفرم‌های ابری رایگان مثل **Railway.app** بالا بیاورید.

#### 💡 مزایای راه‌اندازی روی سرورهای ابری (`Railway`):
* 💸 **بدون نیاز به خرید سرور:** بدون پرداخت هیچ هزینه‌ای پنل و فیلترشکن اختصاصی خودتان را روشن کنید.
* 🛡️ **عبور از فیلترینگ با شبکه `CDN` و `HTTPS`:** ترافیک در قالب پروتکل **VLESS WebSocket روی پورت امن ۴۴۳ با گواهی TLS** رد و بدل می‌شود و فیلترچی نمی‌تواند IP را مسدود کند.
* ⚡ **پایداری بالا:** مجهز به سیستم مالتی‌پلکسر هوشمند وب‌سوکت برای حفظ دائمی اتصال در شرایط اختلال نت.

---

#### 🚀 راهنمای قدم‌به‌قدم راه‌اندازی روی Railway (در کمتر از ۱ دقیقه):

> 💡 **نکته:** برای استفاده از Railway فقط به یک اکانت ساده و رایگان گیت‌هاب نیاز دارید و هیچ‌گونه کارت اعتباری یا شماره خارجی لازم نیست.

1. **ورود به سایت:** وارد سایت [railway.com](https://railway.com) شوید و با زدن روی **Login with GitHub** وارد شوید.
2. **ساخت پروژه:** روی دکمه بنفش **`+ New Project`** در بالای صفحه کلیک کنید.
3. **اتصال به گیت‌هاب:** گزینه **`Deploy from GitHub repo`** را انتخاب کنید.
4. **انتخاب پروژه Nyx:** آدرس مخزن را جستجو کرده یا عبارت زیر را وارد کنید:
   ```text
   icynetx/Nyx
   ```
   *(یا مستقیماً آدرس کامل `https://github.com/icynetx/Nyx`)*
5. **شروع راه‌اندازی:** روی دکمه **`Deploy Now`** کلیک کنید. ریلوِی به صورت خودکار پروژه را بیلد کرده و هسته Xray و پنل را روشن می‌کند (حدود ۱ دقیقه زمان می‌برد).
6. **گرفتن دامنه اینترنتی رایگان (`HTTPS`):**
   * بعد از اینکه وضعیت سرویس سبز شد (`Active 🟢`)، روی باکس پروژه کلیک کنید.
   * وارد تب **Settings** شوید.
   * به سمت پایین اسکرول کنید تا به بخش **Networking** برسید.
   * روی دکمه **Generate Domain** کلیک کنید. ریلوِی یک دامنه اختصاصی HTTPS رایگان (مثلاً `nyx-production.up.railway.app`) به شما می‌دهد.
7. **ورود به پنل و ساخت کانفیگ:**
   * آدرس دامنه را در مرورگر باز کنید.
   * با مشخصات پیش‌فرض زیر وارد پنل شوید:
     * **نام کاربری:** `admin`
     * **رمز عبور:** `nyx2026!`
   * وارد بخش **کاربران** شوید و لینک سابسکریپشن را کپی کنید.
   * کانفیگ‌های `⚡ Railway-Cloud-WSS` به صورت خودکار روی پورت ۴۴۳ تولید شده و در اپلیکیشن‌های v2rayNG ،Streisand ،Shadowrocket و... آماده اتصال هستند!

---

#### 🐳 اجرای با Docker و Docker Compose (روی سرور شخصی):

اگر سرور لینوکس شخصی دارید و می‌خواهید پنل را با داکر بالا بیاورید:

</div>

<div dir="ltr">

```bash
# اجرا با Docker Compose
docker-compose up -d

# یا اجرا به صورت مستقیم با داکر
docker run -d \
  --name nyx-panel \
  -p 3000:3000 \
  -p 443:443 \
  -v nyx_data:/data \
  --restart unless-stopped \
  ghcr.io/icynetx/nyx:latest
```

</div>

<div dir="rtl">

### 🔑 مراحل تعاملی هنگام نصب:
در ابتدای نصب، اسکریپت موارد زیر را از شما می‌پرسد (در صورت فشردن Enter، مقادیر پیش‌فرض تنظیم می‌شوند):
1. 👤 **نام کاربری ادمین** (پیش‌فرض: `admin`)
2. 🔐 **کلمه عبور ادمین** (پیش‌فرض: `nyx2026!`)
3. 🌐 **پورت اجرای پنل** (پیش‌فرض: `3000`)

پس از اتمام نصب، اطلاعات ورود به پنل در ترمینال نمایش داده می‌شود:

</div>

<div dir="ltr">

```text
====================================================
✅ Nyx Panel Successfully Installed & Started!
====================================================
🌐 Dashboard Web UI: http://YOUR_SERVER_IP:3000
👤 Admin Username:  admin
🔐 Admin Password:  nyx2026!
🔒 Status: Active & Systemd Enabled (nyx.service)
====================================================
```

</div>

<div dir="rtl">

---

## 🧩 توضیحات تفصیلی امکانات پنل

### 📦 ۱. بکاپ‌گیری خودکار دیتابیس در تلگرام و بازیابی سریع (`Auto DB Backup & Restore`)
- **ارسال خودکار فایل دیتابیس به تلگرام:** سرویس پس‌زمینه هوشمند که هر ۲۴ ساعت یک‌بار فایل کامل دیتابیس رمزشده (`.db`) شامل تمام کاربران، حجم‌ها، تاریخ‌ها و اینباندها را مستقیم به پیوی تلگرام ادمین ارسال می‌کند.
- **بازیابی ۱-کلیکه در سرور جدید (`1-Click Restore`):** در صورت سوختن سرور یا خرید VPS جدید، کافیست فایل `.db` بکاپ را در ربات تلگرام آپلود کنید؛ پنل در ۳ ثانیه دیتابیس را بازگردانی کرده و تمام کاربران را زنده می‌کند!
- **بررسی کد اعتبار سنجی `SHA-256`:** جهت اطمینان از سلامت کامل فایل بکاپ هنگام انتقال شبکه.
- **دانلود مستقیم و کلید دستی در وب‌پنل:** امکان دریافت فایل بکاپ از تب تنظیمات و ارسال دکمه‌ای به تلگرام.

### 🛡️ ۲. سامانه هوشمند سوئیچ خودکار `SNI` در زمان قطعی نت (`Smart Auto-Failover`)
- **پایش لایو پس‌زمینه (`Background Daemon`):** تست خودکار و مداوم اتصال `TLS 1.3` تمام اینباندهای فعال هر ۶۰ ثانیه.
- **تشخیص اتوماتیک مسدودی اپراتورها (`DPI Detection`):** اگر دامنه‌ای روی همراه اول یا ایرانسل فیلتر بشه، پنل بلافاصله مسدودی را تشخیص می‌دهد.
- **سوئیچ بدون تغییر لینک کاربران (`Seamless Whitelist Fallback`):** به صورت هوشمند سالم‌ترین دامنه لیست سفید (مانند `ebanking.banksepah.ir` یا `arvancloud.ir`) را جایگزین دامنه مسدودشده کرده و هسته Xray را ریلود می‌کند. **لینک سابسکریپشن کاربران بدون نیاز به تغییر متصل می‌ماند!**
- **هشدار فوری تلگرام:** ارسال گزارش کامل سوئیچ به همراه میزان تاخیر میلی‌ثانیه‌ای به پیوی تلگرام ادمین.
- **دکمه اجرای دستی ۱-کلیکه:** امکان اجرای پایش و سوئیچ آنی از طریق وب‌پنل و دکمه `🛡️ Auto-Failover SNI` در ربات تلگرام.

### 🌐 ۳. خروجی کلودفلر `WARP` و مخفی‌سازی سرور (`Cloudflare WARP Outbound`)
- **ساخت خودکار اکانت `WireGuard` کلودفلر:** دریافت مستقیم `IP` و کلیدهای اختصاصی `IPv4/IPv6` از API رسمی کلودفلر.
- **رفع تحریم کامل وب‌سایت‌های بین‌المللی:** باز کردن خودکار سایت‌های تحریمی نظیر `ChatGPT`، `OpenAI`، `Netflix` و `Spotify`.
- **مخفی‌سازی IP اصلی سرور (`IP Shielding`):** ترافیک خروجی سرور از شبکه کلودفلر رد شده و IP اصلی سرور شما مخفی می‌ماند.
- **دو حالت روتینگ هوشمند:**
  - 🌐 **ترافیک ۱۰۰٪ (`ALL`):** روت کل ترافیک سرور از کلودفلر برای بالاترین سطح امنیت.
  - 🤖 **سایت‌های تحریمی (`SANCTIONED`):** روت هوشمند فقط سرویس‌های تحریمی و هوش مصنوعی.

### 🔒 ۴. پروتکل `VLESS + REALITY` با کلیدهای اختصاصی `X25519`
- **عدم نیاز به دامنه یا گواهی SSL:** شبیه‌سازی اتصال واقعی TLS به سمت دامنه‌های معتبر جهانی بدون نیاز به ثبت دامنه.
- **دامنه‌های واقعی شبیه‌سازی‌شده (`SNI`):**
  - **مخازن نرم‌افزاری:** `archive.ubuntu.com`, `pypi.org`, `registry.npmjs.org`, `download.docker.com`
  - **مراجع صدور گواهی امنیتی:** `acme-v02.api.letsencrypt.org`, `r3.o.lencr.org`, `ocsp.digicert.com`
  - **دامنه‌های زیرساختی و بانکی:** `ebanking.banksepah.ir`, `bmi.ir`, `arvancloud.ir`
- **کلیدهای اختصاصی `X25519`:** تولید خودکار کلیدهای رمزشده اختصاصی برای هر اینباند (بدون استفاده از کلیدهای تکراری).

### ⚡ ۵. تکه‌تکه‌سازی پکت‌ها (`Xray Packet Fragment`)
- **عبور از سیستم‌های تحلیل پکت (`DPI`):** خرد کردن پکت‌های `TLS Client Hello` جهت کاهش حساسیت فیلترینگ.
- **تنظیمات اختصاصی بر اساس اپراتور:**
  - 📱 **همراه اول (`MCI`):** الگوی پکت `100-200,10-20,tlshello`
  - 📡 **ایرانسل (`IRANCELL`):** الگوی پکت `50-150,5-15,tlshello`
  - ⚡ **ترافیک شبکه استانی (`WHITE_SNI`):** الگوی پکت `10-100,2-10,tlshello`

### 🤖 ۶. ربات تلگرام ادمین (۱۰۰٪ دکمه‌ای بدون نیاز به تایپ)
- **ورود خودکار ادمین با `Chat ID`:** بدون نیاز به تایپ پسورد در هر بار استفاده.
- **ساخت کاربر جدید مرحله‌به‌مرحله (`Wizard`):**
  1. لمس دکمه «➕ ساخت کاربر جدید»
  2. تایپ نام کاربر (مثلاً `ali`)
  3. انتخاب سقف حجم با دکمه‌های شیشه‌ای (`[10 گیگ]`, `[20 گیگ]`, `[50 گیگ]`, `[نامحدود]`)
  4. انتخاب مدت زمان با دکمه‌های شیشه‌ای (`[1 ماه]`, `[2 ماه]`, `[3 ماه]`, `[نامحدود]`)
  5. تحویل فوری لینک سابسکریپشن + صفحه وب اختصاصی کاربر به ادمین.
- **مدیریت کامل کاربران:** مشاهده لیست کاربران، دریافت لینک سابسکریپشن، دانلود دیتابیس و حذف کاربر با دکمه‌های شیشه‌ای.

### 🌐 ۷. صفحه وب اختصاصی برای هر کاربر (`/subinfo/:uuid`)
- **وب‌اپلیکیشن بدون نیاز به لاگین:** قابل مشاهده در هر مرورگر موبایل یا دسکتاپ با آدرس `http://SERVER_IP:3000/subinfo/UUID`.
- **نمایش نوار پیشرفت مصرف ترافیک (`Progress Bar`):** محاسبه حجم مصرف‌شده، حجم باقی‌مانده و درصد مصرف به گیگابایت.
- **روزهای باقی‌مانده و تاریخ انقضا:** محاسبه خودکار روزهای اعتبار به همراه وضعیت فعال یا منقضی.
- **تغییر دهنده هوشمند اپراتورها:** دکمه‌های انتخاب سریع همراه اول، ایرانسل، عمومی و SNI سفید.
- **کپی ۱-کلیکه کدهای اتصال:** دریافت کدهای VLESS, Clash Meta YAML, Sing-Box JSON و Base64.
- **بارکد QR هوشمند:** اسکن مستقیم با دوربین گوشی توسط تمام نرم‌افزارهای کلاینت.

</div>

---

<div dir="rtl">

## 🤖 راهنمای کامل پیکربندی و استفاده از ربات تلگرام

</div>

```mermaid
graph LR
    A["1. ساخت ربات در @BotFather"] --> B["2. گرفتن Chat ID از @userinfobot"]
    B --> C["3. ثبت در تب «ربات و تنظیمات» پنل"]
    C --> D["🚀 فعال‌سازی زنده مدیریت دکمه‌ای"]
```

<div dir="rtl">

1. وارد تب **«ربات و تنظیمات»** در داشبورد وب پنل شوید.
2. توکن دریافت شده از [@BotFather](https://t.me/BotFather) را در بخش **Bot Token** وارد کنید.
3. چت‌آیدی عددی تلگرام خود را (از ربات [@userinfobot](https://t.me/userinfobot)) در بخش **Admin Chat ID** وارد کرده و دکمه **«ذخیره و شروع ربات»** را بزنید.
4. با پیام دادن به ربات، حساب شما به‌صورت ادمین شناسایی شده و منوی دکمه‌ای مدیریت برایتان فعال می‌شود!

</div>

---

<div dir="rtl">

## 📱 راهنمای استفاده در نرم‌افزارهای کلاینت

</div>

<div dir="ltr" align="center">

| Client Application | Platform | Input Configuration | How to Add |
|---|---|---|---|
| **v2rayNG** | Android | Base64 Subscription or VLESS Link | Import from Clipboard / Scan QR |
| **Streisand** | iOS (iPhone / iPad) | VLESS Link or Subscription | Scan QR Code or Paste Link |
| **Sing-Box** | Android / iOS / Windows | Subscription URL or JSON | Add Subscription / Remote |
| **V2rayN** | Windows | VLESS Link or Subscription | `Ctrl+V` or Add Subscription |
| **MahsaNG** | Android | VLESS Link / Subscription | Copy link and tap + |
| **Shadowrocket** | iOS (iPhone / iPad) | VLESS Link or QR Code | Scan QR Code or Paste Link |
| **Hiddify** | All Platforms | Subscription URL | Paste Subscription Link |
| **Clash Meta / Stash** | Windows / macOS / iOS | YAML File / Sub | Import YAML or Remote Sub |

</div>

---

<div dir="rtl">

## 🌐 راهنمای راه‌اندازی تونل انتقال ترافیک (سرور ایران به خارج)

در صورت بروز اختلال در ارتباط مستقیم با سرور خارج، ترافیک کاربران ابتدا به سرور داخل ایران هدایت شده و از طریق تونل امن به سرور خارج منتقل می‌شود:

</div>

```mermaid
flowchart LR
    User["👤 کاربر (ایران)"] -->|VLESS/REALITY| IranServer["🇮🇷 سرور ایران (Relay)"]
    IranServer -->|Gost v3 / ICMP Tunnel| KharejServer["🌐 سرور خارج (Master)"]
    KharejServer -->|ترافیک آزاد| Internet["🌍 اینترنت بین‌الملل"]
```

<div dir="rtl">

1. وارد تب **«تونل قطعی نت»** در وب‌داشبورد شوید.
2. **آدرس IP سرور ایران** و **آدرس IP سرور خارج** را در فیلدهای مربوطه وارد کنید.
3. پروتکل تونل دلخواه را انتخاب کنید:
   * ⚡ **Gost v3 (Websocket + TLS):** پایدارترین روش با رمزنگاری TLS.
   * 🕳️ **Rathole (Secure Reverse Proxy):** تونل معکوس امن با مصرف منابع بسیار پایین.
   * 📡 **PingTunnel (ICMP):** عبور از فیلترینگ شدید با پکت‌های Ping لایه ۳.
   * 🌐 **dnstt (DNS Tunnel):** انتقال ترافیک روی پورت ۵۳ (مخصوص زمان ملی‌شدن نت).
   * 🔀 **IPTables NAT Forward:** فوروارد سریع پورت بدون نیاز به نرم‌افزار جانبی.
4. دکمه **«تولید اسکریپت و راهنمای نصب»** را بزنید.
5. اسکریپت سرور ایران را روی سرور داخل و اسکریپت سرور خارج را روی سرور خارج کپی و پیست کنید (سرویس‌ها به صورت خودکار با Systemd تنظیم و فعال می‌شوند).

---

## 🛠️ دستورات مدیریت سرویس در لینوکس (`Systemd Commands`)

- **مشاهده وضعیت سرویس:** `systemctl status nyx`
- **راه‌اندازی مجدد سرویس (Restart):** `systemctl restart nyx`
- **مشاهده لاگ‌های زنده سیستم:** `journalctl -u nyx -f`
- **توقف سرویس:** `systemctl stop nyx`

---

## 🗑️ راهنمای حذف کامل و پاکسازی پنل

در صورت نیاز به حذف کامل پنل و تمامی فایل‌های وابسته، از دستورات زیر استفاده کنید:

### 🐧 ۱. حذف کامل روی سرور لینوکس (`Linux`):
دستور زیر را با دسترسی **root** در ترمینال لینوکس اجرا کنید:

</div>

<div dir="ltr">

```bash
curl -sSL "https://raw.githubusercontent.com/icynetx/Nyx/main/uninstall.sh" | sudo bash
```

</div>

<div dir="rtl">

این اسکریپت تمام بخش‌های پنل و سرویس‌ها را به صورت کامل پاک می‌کنه:
- توقف و حذف سرویس `nyx.service` از systemd
- آزاد کردن پورت‌های 3080، 3000 و 10085 و متوقف کردن پروسه‌های Node.js و Xray
- پاکسازی کامل دایرکتوری `/opt/nyx` و فایل‌های موقت `/tmp`

---

### 🪟 ۲. حذف کامل روی ویندوز سرور (`Windows Server`):
ترمینال **PowerShell** را به صورت **Run as Administrator** باز کرده و دستورات زیر را اجرا کنید:

</div>

<div dir="ltr">

```powershell
Unregister-ScheduledTask -TaskName "NyxPanelService" -Confirm:$false -ErrorAction SilentlyContinue
Get-Process -Name "node", "xray" -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Path "C:\Nyx" -Recurse -Force -ErrorAction SilentlyContinue
```

</div>

<div dir="rtl">

---

## 📢 تیم توسعه و شبکه اجتماعی ساینت (Cynet Security Team)

پروژه **Nyx Panel** به صورت متن‌باز توسط **تیم امنیتی ساینت (Cynet)** توسعه داده شده است. 

> ⭐️ **یادآوری مهم:** با **ستاره (Star ⭐️) دادن به این مخزن** ما را در **توسعه مداوم، انتشار آپدیت‌های سریع و افزودن ویژگی‌های جدید** همراهی کنید! جهت گزارش باگ، پیشنهادات و پشتیبانی فنی مستقیم در تلگرام پیام دهید:

- 📢 **کانال تلگرام پشتیبانی و گزارش باگ:** [t.me/cynetx](https://t.me/cynetx)
- 🎥 **کانال یوتیوب:** [youtube.com/@cynetxir](https://www.youtube.com/@cynetxir)
- 🌐 **وب‌سایت رسمی:** [cynetx.ir](https://cynetx.ir)

---

## 📄 لایسنس

این پروژه به صورت متن‌باز تحت لایسنس **MIT** منتشر شده است.

</div>
