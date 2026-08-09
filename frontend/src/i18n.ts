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
    error: 'Error',
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

    // Dashboard View
    dashboardTitle: 'Nyx Panel Live Monitoring Dashboard',
    dashboardSub: 'Intelligent Monitoring & Traffic Management System for Xray & Intranet Tunnels',
    serverIp: 'Server IP Address',
    cpuLoad: 'CPU Load',
    ramUsage: 'RAM Usage',
    networkPing: 'Network Latency',
    instantSpeed: 'Instant Speed',
    serverUptime: 'Server Online Uptime',
    networkStability: 'Network Stability',
    stable: 'Stable',
    totalUsers: 'Total Users',
    activeUsers: 'Active Users',
    totalTraffic: 'Total Traffic Exchanged',
    nodesAndServers: 'Nodes & Servers',
    nodesCount: 'Nodes',
    systemHealth: 'System Engine & Service Status',
    xrayEngineStatus: 'Xray Core Engine',
    sniTesterTitle: 'Live TLS SNI Handshake Tester',
    sniTesterSub: 'Test TLS 1.3 handshake latency on port 443',
    sniInputPlaceholder: 'e.g. yahoo.com or pypi.org',
    testSniButton: 'Test Handshake',

    // Users View
    usersTitle: 'Subscriber & User Management',
    usersSub: 'Create users, track traffic usage limits, and manage subscription links',
    createUserBtn: '➕ Create New User',
    searchUserPlaceholder: 'Search username or UUID...',
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

    // Inbounds View
    inboundsTitle: 'Inbound Configurations',
    inboundsSub: 'Manage Xray proxy inbounds, transport protocols, and SNI target domains',
    createInboundBtn: '➕ Create New Inbound',
    remark: 'Remark Name',
    protocol: 'Protocol',
    port: 'Port',
    network: 'Transport Network',
    security: 'Security Type',
    sniDomain: 'SNI Target Domain',
    packetFragment: 'Packet Fragment',
    fragmentSettings: 'Fragment Settings',
    applyFragment: 'Apply Fragment Pattern',
    getConfigsBtn: 'Get Config Links',

    // Nodes View
    nodesTitle: 'Server Nodes & Relay Network',
    nodesSub: 'Manage external nodes, multi-server connections, and relay paths',
    addNodeBtn: '➕ Add New Node',
    nodeName: 'Node Name',
    nodeIp: 'Node IP',
    nodeType: 'Node Type',
    nodeStatus: 'Status',

    // Tunnels View
    tunnelsTitle: 'Iran <-> Kharej Intranet Tunnel Generator',
    tunnelsSub: 'Automated 1-click tunnel installation scripts for Gost v3, Rathole, ICMP, DNS and IPv6',
    tunnelType: 'Tunnel Method',
    kharejIp: 'Kharej Server IP',
    iranIp: 'Iran Server IP',
    generateScriptBtn: 'Generate 1-Click Installation Scripts',
    iranScriptTitle: '1. Execute on Iran Relay Server:',
    kharejScriptTitle: '2. Execute on Kharej Master Server:',

    // Settings View
    settingsTitle: 'Telegram Bot & System Settings',
    settingsSub: 'Configure Telegram admin bot token, admin chat ID, and automation options',
    botTokenLabel: 'Telegram Bot Token',
    adminChatIdLabel: 'Admin Chat ID',
    saveSettingsBtn: 'Save & Restart Bot',

    // SubUser Portal
    userSubTitle: 'User Subscription Status',
    dataUsageTitle: 'Data Traffic Usage',
    used: 'Used',
    remaining: 'Remaining',
    daysLeft: 'Days Remaining',
    expireDate: 'Expiration Date',
    maxDevices: 'Allowed Devices',
    uuidLabel: 'UUID',
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
    error: 'خطا',
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

    // Dashboard View
    dashboardTitle: 'داشبورد مانیتورینگ زنده Nyx Panel',
    dashboardSub: 'سامانه هوشمند پایش و مدیریت اتصالات Xray و تونل‌زنی',
    serverIp: 'آدرس IP سرور',
    cpuLoad: 'بار پردازنده (CPU)',
    ramUsage: 'مصرف رم (RAM)',
    networkPing: 'پینگ پاسخ‌دهی شبکه',
    instantSpeed: 'سرعت آنی',
    serverUptime: 'آپتایم آنلاین سرور',
    networkStability: 'نرخ پایداری شبکه',
    stable: 'باثبات',
    totalUsers: 'کل کاربران',
    activeUsers: 'کاربران فعال',
    totalTraffic: 'ترافیک کل تبادل شده',
    nodesAndServers: 'نودها و سرورها',
    nodesCount: 'نود',
    systemHealth: 'وضعیت سلامت هسته سیستم و سرویس‌ها',
    xrayEngineStatus: 'وضعیت هسته Xray',
    sniTesterTitle: 'تست زنده دست‌تکانی TLS SNI',
    sniTesterSub: 'سنجش زنده تأخیر دست‌تکانی روی پورت ۴۴۳',
    sniInputPlaceholder: 'مثلاً yahoo.com یا pypi.org',
    testSniButton: 'شروع تست دست‌تکانی',

    // Users View
    usersTitle: 'مدیریت مشترکین و کاربران',
    usersSub: 'تعریف کاربر جدید، پایش حجم مصرفی، تولید لینک سابسکریپشن و مدیریت کاربران',
    createUserBtn: '➕ ساخت کاربر جدید',
    searchUserPlaceholder: 'جستجوی نام کاربر یا UUID...',
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

    // Inbounds View
    inboundsTitle: 'تنظیمات اینباندها و کانفیگ‌ها',
    inboundsSub: 'مدیریت اینباندهای پروکسی Xray، پروتکل‌های شبکه و دامنه‌های وانمودی (SNI)',
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
    getConfigsBtn: 'دریافت لینک کانفیگ',

    // Nodes View
    nodesTitle: 'سرورها و نودهای شبکه',
    nodesSub: 'مدیریت نودهای خارج، ارتباطات چند سروره و مسیرهای واسط شبکه',
    addNodeBtn: '➕ افزودن نود جدید',
    nodeName: 'نام نود',
    nodeIp: 'آدرس IP نود',
    nodeType: 'نوع نود',
    nodeStatus: 'وضعیت',

    // Tunnels View
    tunnelsTitle: 'مولد اتوماتیک تونل سرور ایران به خارج',
    tunnelsSub: 'اسکریپت‌ساز ۱-کلیکه برای Gost v3، Rathole، ICMP، DNS و IPv6',
    tunnelType: 'متد تونل‌زنی',
    kharejIp: 'IP سرور خارج',
    iranIp: 'IP سرور ایران',
    generateScriptBtn: 'تولید اسکریپت‌های ۱-کلیکه نصب',
    iranScriptTitle: '۱. اجرای دستور روی سرور ایران (Relay):',
    kharejScriptTitle: '۲. اجرای دستور روی سرور خارج (Master):',

    // Settings View
    settingsTitle: 'تنظیمات ربات تلگرام و سیستم',
    settingsSub: 'تنظیم توکن ربات ادمین تلگرام، چت‌آیدی و گزینه‌های اتوماسیون',
    botTokenLabel: 'توکن ربات تلگرام',
    adminChatIdLabel: 'چت‌آیدی ادمین',
    saveSettingsBtn: 'ذخیره و راه‌اندازی ربات',

    // SubUser Portal
    userSubTitle: 'وضعیت اشتراک کاربر',
    dataUsageTitle: 'حجم مصرف‌شده ترافیک',
    used: 'مصرف‌شده',
    remaining: 'باقی‌مانده',
    daysLeft: 'روزهای باقی‌مانده',
    expireDate: 'تاریخ انقضا',
    maxDevices: 'دستگاه‌های مجاز',
    uuidLabel: 'شناسه اختصاصی UUID',
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
