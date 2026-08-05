import { User, Inbound } from '@prisma/client';

export class SubscriptionService {
  /**
   * === لیست جامع SNI بر اساس شرایط مختلف فیلترینگ ===
   * 
   * استراتژی: در زمان قطعی اینترنت بین‌الملل، دولت نیاز دارد
   * برخی سرویس‌های بین‌المللی را برای زیرساخت فعال نگه دارد:
   * 1. سرورهای بروزرسانی نرم‌افزار (امنیتی/اجباری)
   * 2. مراجع صدور گواهی SSL (OCSP/CRL)
   * 3. مخازن بسته‌های اپن‌سورس (مورد نیاز شرکت‌ها)
   * 4. سرویس‌های بانکی بین‌الملل (ضروری اقتصادی)
   * 5. سایت‌های آموزشی/علمی (تحریم محدودتر)
   */

  // ✅ حالت عادی (همه اپراتورها)
  static SNI_DEFAULT = [
    'yahoo.com',
    'www.google.com',
    'dl.google.com',
    'www.microsoft.com',
    'speed.cloudflare.com',
    'www.amazon.com',
    'www.apple.com',
    'github.com',
  ];

  // 📦 مخازن نرم‌افزاری — احتمال بالای باز ماندن حتی در نت ملی
  static SNI_SOFTWARE_REPOS = [
    // Ubuntu & Debian (سرور اصلی به روزرسانی لینوکس)
    'archive.ubuntu.com',
    'security.ubuntu.com',
    'releases.ubuntu.com',
    'changelogs.ubuntu.com',
    'deb.debian.org',
    'ftp.debian.org',
    // Python & PyPI (مورد نیاز سرورها/دولت)
    'pypi.org',
    'files.pythonhosted.org',
    'python.org',
    // Node.js & npm (بسیاری شرکت‌ها استفاده می‌کنند)
    'registry.npmjs.org',
    'nodejs.org',
    // Docker Hub (زیرساخت کانتینر)
    'registry-1.docker.io',
    'download.docker.com',
    // Git & ابزارهای dev
    'objects.githubusercontent.com',
    // Ruby & Gems
    'rubygems.org',
  ];

  // 🏛️ مراجع گواهی SSL — لازمه عملکرد HTTPS همه سایت‌ها
  static SNI_CERTIFICATE_AUTHORITIES = [
    // Let's Encrypt (بزرگترین CA مجانی)
    'acme-v02.api.letsencrypt.org',
    'acme-staging-v02.api.letsencrypt.org',
    'r3.o.lencr.org',
    'e1.o.lencr.org',
    // DigiCert (CA اصلی بانک‌ها)
    'ocsp.digicert.com',
    'crl3.digicert.com',
    'crl4.digicert.com',
    // Sectigo / Comodo
    'ocsp.sectigo.com',
    'crl.sectigo.com',
    // GlobalSign
    'ocsp2.globalsign.com',
    'crl.globalsign.com',
    // Cloudflare PKI
    'cloudflare-pki.com',
  ];

  // 🔄 سرورهای بروزرسانی OS — حکومت نمی‌تواند قطع کند
  static SNI_OS_UPDATES = [
    // Microsoft Windows Update
    'download.microsoft.com',
    'windowsupdate.microsoft.com',
    'update.microsoft.com',
    'ntservicepack.microsoft.com',
    // Apple Update
    'mesu.apple.com',
    'updates.cdn-apple.com',
    'gdmf.apple.com',
    'swscan.apple.com',
    // Fedora/CentOS/RHEL
    'mirrors.fedoraproject.org',
    'download.fedoraproject.org',
    // Kaspersky/Antivirus (اغلب استثنا دارند)
    'downloads.kaspersky.com',
    'update.kaspersky.com',
  ];

  // 🌐 CDN و زیرساخت شبکه — کور کردن یعنی اختلال کل اینترنت داخلی
  static SNI_INFRASTRUCTURE = [
    // Cloudflare (CDN صدها هزار سایت)
    'cloudflare.com',
    'www.cloudflare.com',
    'api.cloudflare.com',
    'cdn.cloudflare.com',
    // Fastly CDN
    'api.fastly.com',
    // Akamai (CDN بانک‌های ایران هم استفاده می‌کنند)
    'dl.delivery.mp.microsoft.com',
    // DNS-over-HTTPS
    'cloudflare-dns.com',
    'dns.google',
    // AWS (برخی سرویس‌های ضروری)
    's3.amazonaws.com',
    'ec2.us-east-1.amazonaws.com',
  ];

  // 📚 سایت‌های علمی/آموزشی — اغلب استثنا در فیلترینگ ایران
  static SNI_EDUCATIONAL = [
    // ArXiv (مقالات علمی — ایران استثنا می‌دهد)
    'arxiv.org',
    // Wikipedia (اغلب باز است یا نیمه‌باز)
    'wikipedia.org',
    'www.wikipedia.org',
    // MIT OpenCourseWare
    'ocw.mit.edu',
    // IEEE
    'ieeexplore.ieee.org',
    // Coursera
    'www.coursera.org',
  ];

  // 🇮🇷 سایت‌های ایرانی سفید (داخلی — همیشه در دسترس)
  static SNI_IRAN_WHITE = [
    // بانک‌ها و مالی
    'ebanking.banksepah.ir',
    'bmi.ir',
    'bank-maskan.ir',
    'tejarat24.ir',
    'en.sb24.com',
    // مخابرات
    'irancell.ir',
    'mci.ir',
    'rightel.ir',
    'asiatech.ir',
    // ابری و CDN داخلی
    'arvancloud.ir',
    'iran.liara.run',
    'storage.iran.liara.ir',
    // تجارت الکترونیک
    'divar.ir',
    'sheypoor.com',
    'snapp.ir',
    'digikala.com',
    'torob.com',
    // دولتی
    'eservices.gov.ir',
    'my.gov.ir',
  ];

  // ⚡ بهترین SNI برای حالت قطعی کامل (محاسبه‌شده بر پایه احتمال دسترسی)
  static WHITE_IRAN_SNIS = [
    // اول: بانکی (حتماً باز می‌مانند)
    'ebanking.banksepah.ir',
    'bmi.ir',
    // دوم: زیرساخت نرم‌افزار (دولت نمی‌تواند قطع کند بدون آسیب به سرورهایش)
    'pypi.org',
    'archive.ubuntu.com',
    'registry.npmjs.org',
    // سوم: CA SSL (قطع = همه HTTPS می‌میرند)
    'acme-v02.api.letsencrypt.org',
    'ocsp.digicert.com',
    // چهارم: ارانی
    'arvancloud.ir',
    'divar.ir',
  ];

  /**
   * Generates Base64 VLESS / REALITY link for V2rayN, Shadowrocket, MahsaNG, Hiddify
   */
  static generateVlessLink(user: User, inbound: Inbound, serverIp: string, isp: string = 'DEFAULT'): string {
    const uuid = user.uuid;
    const port = inbound.port;
    const remark = encodeURIComponent(`Nyx-${user.username}-${inbound.remark}-${isp}`);
    
    // Select SNI: If WHITE_SNI mode is requested, use an Iranian whitelisted domestic SNI
    let sni = inbound.sni || 'yahoo.com';
    if (isp === 'WHITE_SNI') {
      sni = this.WHITE_IRAN_SNIS[0]; // e.g. ebanking.banksepah.ir
    }

    // Fragment tuning based on ISP
    let fragmentParams = '';
    if (inbound.enableFragment) {
      if (isp === 'MCI') {
        fragmentParams = '&fragment=100-200,10-20,tlshello';
      } else if (isp === 'IRANCELL') {
        fragmentParams = '&fragment=50-150,5-15,tlshello';
      } else if (isp === 'WHITE_SNI') {
        fragmentParams = '&fragment=10-100,2-10,tlshello';
      } else {
        fragmentParams = '&fragment=100-200,10-20,tlshello';
      }
    }

    if (inbound.security === 'reality') {
      const pbk = inbound.publicKey || '';
      const sid = inbound.shortId || '6ba7b810';
      const flow = 'xtls-rprx-vision';

      return `vless://${uuid}@${serverIp}:${port}?type=${inbound.network}&security=reality&pbk=${pbk}&fp=chrome&sni=${sni}&sid=${sid}&flow=${flow}${fragmentParams}#${remark}`;
    }

    // Standard VLESS
    return `vless://${uuid}@${serverIp}:${port}?type=${inbound.network}&security=${inbound.security}&sni=${sni}#${remark}`;
  }

  /**
   * Generates full Base64 subscription response for a user across all active inbounds
   */
  static generateBase64Sub(user: User, inbounds: Inbound[], serverIp: string, isp: string = 'DEFAULT'): string {
    const links = inbounds.map(inbound => this.generateVlessLink(user, inbound, serverIp, isp));
    return Buffer.from(links.join('\n')).toString('base64');
  }

  /**
   * Generates Sing-Box JSON Config for Sing-Box / Nekobox clients
   */
  static generateSingBoxJson(user: User, inbounds: Inbound[], serverIp: string, isp: string = 'DEFAULT'): any {
    const sni = isp === 'WHITE_SNI' ? this.WHITE_IRAN_SNIS[0] : 'yahoo.com';

    const outbounds: any[] = inbounds.map(inbound => ({
      type: "vless",
      tag: `Nyx-${inbound.remark}`,
      server: serverIp,
      server_port: inbound.port,
      uuid: user.uuid,
      flow: inbound.security === 'reality' ? "xtls-rprx-vision" : "",
      tls: {
        enabled: true,
        server_name: inbound.sni || sni,
        utls: {
          enabled: true,
          fingerprint: "chrome"
        },
        reality: {
          enabled: inbound.security === 'reality',
          public_key: inbound.publicKey || "",
          short_id: inbound.shortId || ""
        }
      }
    }));

    outbounds.push({ type: "direct", tag: "direct" });
    outbounds.push({ type: "block", tag: "block" });

    return {
      log: { level: "info" },
      dns: {
        servers: [
          { tag: "remote", address: "tls://1.1.1.1", detour: outbounds[0]?.tag },
          { tag: "local", address: "223.5.5.5", detour: "direct" }
        ]
      },
      outbounds,
      route: {
        rules: [
          { geoip: ["ir"], outbound: "direct" },
          { geosite: ["ir"], outbound: "direct" }
        ],
        auto_detect_interface: true
      }
    };
  }

  /**
   * Generates Clash Meta YAML config for Clash / Stash / Mihomo clients
   */
  static generateClashYaml(user: User, inbounds: Inbound[], serverIp: string, isp: string = 'DEFAULT'): string {
    const sni = isp === 'WHITE_SNI' ? this.WHITE_IRAN_SNIS[0] : 'yahoo.com';

    const proxies = inbounds.map(inbound => {
      const proxyName = `Nyx-${user.username}-${inbound.remark}`;
      if (inbound.security === 'reality') {
        return `  - name: "${proxyName}"
    type: vless
    server: ${serverIp}
    port: ${inbound.port}
    uuid: ${user.uuid}
    network: ${inbound.network || 'tcp'}
    tls: true
    udp: true
    flow: xtls-rprx-vision
    servername: ${inbound.sni || sni}
    reality-opts:
      public-key: ${inbound.publicKey || ''}
      short-id: ${inbound.shortId || '6ba7b810'}
    client-fingerprint: chrome`;
      }
      return `  - name: "${proxyName}"
    type: vless
    server: ${serverIp}
    port: ${inbound.port}
    uuid: ${user.uuid}
    network: ${inbound.network || 'tcp'}
    tls: ${inbound.security === 'tls'}
    udp: true
    servername: ${inbound.sni || sni}`;
    });

    const proxyNames = inbounds.map(i => `      - "Nyx-${user.username}-${i.remark}"`).join('\n');

    return `# Nyx Panel - Clash Meta Config
# Generated for: ${user.username} | ISP: ${isp}
# Server: ${serverIp}

mixed-port: 7890
allow-lan: true
mode: rule
log-level: info

dns:
  enable: true
  enhanced-mode: fake-ip
  nameserver:
    - 1.1.1.1
    - 8.8.8.8

proxies:
${proxies.join('\n\n')}

proxy-groups:
  - name: "🚀 Nyx Auto"
    type: url-test
    proxies:
${proxyNames}
    url: "http://www.gstatic.com/generate_204"
    interval: 300

  - name: "🛡️ Select"
    type: select
    proxies:
${proxyNames}
      - DIRECT

rules:
  - GEOIP,IR,DIRECT
  - MATCH,🚀 Nyx Auto
`;
  }
}
