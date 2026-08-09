import { ref } from 'vue';

export type Language = 'en' | 'fa';

const storedLang = (localStorage.getItem('nyx_lang') as Language) || 'en';
export const currentLang = ref<Language>(storedLang);

export function setLanguage(lang: Language) {
  currentLang.value = lang;
  localStorage.setItem('nyx_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
}

// Initialize direction
setLanguage(currentLang.value);

export const tMap = {
  en: {
    // General
    panelName: 'Nyx Panel',
    panelSub: 'Next-Gen Anti-Censorship Server Manager',
    statusOnline: 'ONLINE 🟢',
    statusOffline: 'OFFLINE 🔴',
    readyBypass: 'Anti-Censorship Ready',
    logout: 'Logout',
    copy: 'Copy',
    copied: 'Copied!',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    actions: 'Actions',
    search: 'Search...',
    loading: 'Loading...',
    byCynet: 'Developed by Cynet Security Team',

    // Tabs
    tabDashboard: 'Dashboard',
    tabUsers: 'Users',
    tabInbounds: 'Inbounds',
    tabNodes: 'Nodes',
    tabTunnels: 'Tunnels',
    tabSettings: 'Telegram & Settings',

    // Login
    loginTitle: 'Login to Nyx Panel',
    loginSub: 'VPN & Anti-Censorship Server Manager',
    usernameLabel: 'Admin Username',
    passwordLabel: 'Password',
    loginButton: 'Login to Dashboard',
    authenticating: 'Checking credentials...',
    invalidAuth: 'Invalid username or password.',

    // Dashboard
    activeUsers: 'Active Users',
    totalInbounds: 'Total Inbounds',
    cpuUsage: 'CPU Usage',
    ramUsage: 'RAM Usage',
    bandwidthTotal: 'Total Traffic',
    xrayEngineStatus: 'Xray Core Status',
    sniTesterTitle: 'Live TLS SNI Handshake Tester',
    sniTesterSub: 'Test TLS 1.3 handshake latency on port 443',
    sniInputPlaceholder: 'e.g. yahoo.com or pypi.org',
    testSniButton: 'Test Handshake',

    // Users
    usersTitle: 'Subscriber Management',
    createUserBtn: '➕ Create User',
    usernameHeader: 'Username',
    trafficHeader: 'Data Usage',
    expiryHeader: 'Expiry Date',
    statusHeader: 'Status',
    subLinkHeader: 'Subscription Link',
    activeStatus: 'Active',
    expiredStatus: 'Expired',
    disabledStatus: 'Disabled',
    unlimited: 'Unlimited',
    createUserWizard: 'Create User Wizard',
    selectTraffic: 'Traffic Limit',
    selectExpiry: 'Validity Period',
    daysCount: 'Days',
    copySubLink: 'Copy Subscription Link',
    openUserPage: 'Web Portal',
    showQr: 'QR Code',

    // Inbounds
    inboundsTitle: 'Inbound Configurations',
    createInboundBtn: '➕ Create Inbound',
    remark: 'Remark Name',
    protocol: 'Protocol',
    port: 'Port',
    network: 'Network Transport',
    security: 'Security Type',
    sniDomain: 'SNI Target Domain',
    packetFragment: 'Packet Fragment',
    fragmentSettings: 'Fragment Settings',
    applyFragment: 'Apply Fragment Pattern',

    // Tunnels
    tunnelsTitle: 'Iran <-> Kharej Intranet Tunnel Generator',
    tunnelType: 'Tunnel Method',
    kharejIp: 'Kharej Server IP',
    iranIp: 'Iran Server IP',
    generateScriptBtn: 'Generate 1-Click Installation Scripts',
    iranScriptTitle: '1. Execute on Iran Relay Server:',
    kharejScriptTitle: '2. Execute on Kharej Master Server:',

    // Settings
    settingsTitle: 'Telegram Bot & System Settings',
    botTokenLabel: 'Telegram Bot Token',
    adminChatIdLabel: 'Admin Chat ID',
    saveSettingsBtn: 'Save & Restart Bot',

    // SubUser Portal
    userSubTitle: 'User Subscription Status',
    uuidLabel: 'UUID',
    usedTraffic: 'Used Traffic',
    remainingTraffic: 'Remaining',
    daysLeft: 'Days Remaining',
    copyVless: 'Copy VLESS REALITY Link',
    copyClash: 'Copy Clash Meta YAML',
    copySingBox: 'Copy Sing-Box JSON',
    operatorMci: 'MCI (Hamrah Aval)',
    operatorIrancell: 'Irancell',
    operatorWhite: 'White SNI'
  },
  fa: {
    // General
    panelName: 'Nyx Panel (نیکس پنل)',
    panelSub: 'سامانه مدیریت VPN و شبکه اختصاصی',
    statusOnline: 'فعال و آنلاین 🟢',
    statusOffline: 'غیرفعال 🔴',
    readyBypass: 'آماده عبور از قطعی نت',
    logout: 'خروج',
    copy: 'کپی',
    copied: 'کپی شد!',
    close: 'بستن',
    save: 'ذخیره',
    cancel: 'انصراف',
    delete: 'حذف',
    edit: 'ویرایش',
    actions: 'عملیات',
    search: 'جستجو...',
    loading: 'در حال دریافت...',
    byCynet: 'توسعه‌داده‌شده توسط تیم امنیتی ساینت (Cynet)',

    // Tabs
    tabDashboard: 'داشبورد',
    tabUsers: 'مدیریت کاربران',
    tabInbounds: 'اینباندها',
    tabNodes: 'نودها',
    tabTunnels: 'تونل قطعی نت',
    tabSettings: 'ربات و تنظیمات',

    // Login
    loginTitle: 'ورود به Nyx Panel',
    loginSub: 'سامانه مدیریت ضد فیلترینگ و شبکه ملی',
    usernameLabel: 'نام کاربری ادمین',
    passwordLabel: 'کلمه عبور',
    loginButton: 'ورود به داشبورد',
    authenticating: 'در حال بررسی…',
    invalidAuth: 'نام کاربری یا کلمه عبور اشتباه است.',

    // Dashboard
    activeUsers: 'کاربران فعال',
    totalInbounds: 'تعداد اینباندها',
    cpuUsage: 'مصرف پردازنده',
    ramUsage: 'مصرف حافظه رم',
    bandwidthTotal: 'کل ترافیک مصرفی',
    xrayEngineStatus: 'وضعیت هسته Xray',
    sniTesterTitle: 'تست زنده دست‌تکانی TLS SNI',
    sniTesterSub: 'سنجش زنده تأخیر دست‌تکانی روی پورت ۴۴۳',
    sniInputPlaceholder: 'مثلاً yahoo.com یا pypi.org',
    testSniButton: 'شروع تست دست‌تکانی',

    // Users
    usersTitle: 'مدیریت مشترکین',
    createUserBtn: '➕ ساخت کاربر جدید',
    usernameHeader: 'نام کاربر',
    trafficHeader: 'مصرف ترافیک',
    expiryHeader: 'تاریخ انقضا',
    statusHeader: 'وضعیت',
    subLinkHeader: 'لینک سابسکریپشن',
    activeStatus: 'فعال',
    expiredStatus: 'منقضی',
    disabledStatus: 'غیرفعال',
    unlimited: 'نامحدود',
    createUserWizard: 'ساخت کاربر جدید',
    selectTraffic: 'سقف حجم ترافیک',
    selectExpiry: 'مدت زمان اعتبار',
    daysCount: 'روز',
    copySubLink: 'کپی لینک سابسکریپشن',
    openUserPage: 'وب‌صفحه کاربر',
    showQr: 'بارکد QR',

    // Inbounds
    inboundsTitle: 'تنظیمات اینباندها',
    createInboundBtn: '➕ ساخت اینباند جدید',
    remark: 'نام اینباند',
    protocol: 'پروتکل',
    port: 'پورت',
    network: 'پروتکل شبکه',
    security: 'نوع امنیت',
    sniDomain: 'دامنه وانمودی (SNI)',
    packetFragment: 'تکه‌تکه‌سازی پکت (Fragment)',
    fragmentSettings: 'تنظیمات Fragment',
    applyFragment: 'اعمال الگوی Fragment',

    // Tunnels
    tunnelsTitle: 'مولد اتوماتیک تونل سرور ایران به خارج',
    tunnelType: 'متد تونل‌زنی',
    kharejIp: 'IP سرور خارج',
    iranIp: 'IP سرور ایران',
    generateScriptBtn: 'تولید اسکریپت‌های ۱-کلیکه نصب',
    iranScriptTitle: '۱. اجرای دستور روی سرور ایران (Relay):',
    kharejScriptTitle: '۲. اجرای دستور روی سرور خارج (Master):',

    // Settings
    settingsTitle: 'تنظیمات ربات تلگرام و سیستم',
    botTokenLabel: 'توکن ربات تلگرام',
    adminChatIdLabel: 'چت‌آیدی ادمین',
    saveSettingsBtn: 'ذخیره و راه‌اندازی ربات',

    // SubUser Portal
    userSubTitle: 'وضعیت اشتراک کاربر',
    uuidLabel: 'شناسه اختصاصی UUID',
    usedTraffic: 'حجم مصرف‌شده',
    remainingTraffic: 'باقی‌مانده',
    daysLeft: 'روزهای باقی‌مانده',
    copyVless: 'کپی لینک VLESS REALITY',
    copyClash: 'کپی کانفیگ Clash Meta',
    copySingBox: 'کپی کانفیگ Sing-Box',
    operatorMci: 'همراه اول (MCI)',
    operatorIrancell: 'ایرانسل',
    operatorWhite: 'SNI سفید'
  }
};

export function t(key: keyof typeof tMap['en']): string {
  const lang = currentLang.value;
  return tMap[lang]?.[key] || tMap['en'][key] || (key as string);
}
