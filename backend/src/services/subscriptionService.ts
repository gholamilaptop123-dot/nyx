import { User, Inbound } from '@prisma/client';

export class SubscriptionService {
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

  static WHITE_IRAN_SNIS = [
    'arvancloud.ir',
    'n2a.arvancloud.ir',
    'shaparak.ir',
    'pep.shaparak.ir',
    'iran.liara.run',
    'ebanking.banksepah.ir',
    'bmi.ir',
    'pypi.org',
    'archive.ubuntu.com',
    'registry.npmjs.org',
    'acme-v02.api.letsencrypt.org',
    'ocsp.digicert.com',
    'divar.ir',
    'snapp.ir',
    'digikala.com'
  ];

  /**
   * Generates Base64 VLESS / REALITY link (Supports 3 or 4 arguments)
   */
  static generateVlessLink(arg1: any, arg2: any, arg3?: string, arg4?: string): string {
    let inbound = arg1;
    let serverIp = arg2;
    let isp = arg3 || 'DEFAULT';

    if (arg4 !== undefined) {
      // 4 args passed: (user, inbound, serverIp, isp)
      inbound = arg2;
      serverIp = arg3;
      isp = arg4;
    }

    const uuid = inbound?.uuid || inbound?.id || '11111111-2222-3333-4444-555555555555';
    const port = inbound?.port || 443;
    const remark = encodeURIComponent(`Nyx-${inbound?.remark || 'Config'}-${isp}`);
    
    let sni = inbound?.sni || 'yahoo.com';
    if (isp === 'WHITE_SNI') {
      sni = this.WHITE_IRAN_SNIS[0];
    }

    if (inbound?.security === 'reality') {
      const pbk = inbound?.publicKey || '';
      const sid = inbound?.shortId || '6ba7b810';
      const flow = 'xtls-rprx-vision';

      return `vless://${uuid}@${serverIp}:${port}?encryption=none&type=${inbound?.network || 'tcp'}&security=reality&pbk=${pbk}&fp=chrome&sni=${sni}&sid=${sid}&flow=${flow}#${remark}`;
    }

    return `vless://${uuid}@${serverIp}:${port}?encryption=none&type=${inbound?.network || 'tcp'}&security=${inbound?.security || 'none'}&sni=${sni}#${remark}`;
  }

  /**
   * Generates Base64 subscription (Supports 3 or 4 arguments)
   */
  static generateBase64Sub(arg1: any, arg2: any, arg3?: string, arg4?: string): string {
    let inbounds = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : [arg1 || arg2]);
    let serverIp = typeof arg2 === 'string' ? arg2 : (arg3 || '127.0.0.1');
    let isp = arg4 || (typeof arg3 === 'string' ? arg3 : 'DEFAULT');

    const links = inbounds.map(inbound => this.generateVlessLink(inbound, serverIp, isp));
    return Buffer.from(links.join('\n')).toString('base64');
  }

  /**
   * Generates Sing-Box JSON Config (Supports 3 or 4 arguments)
   */
  static generateSingBoxJson(arg1: any, arg2: any, arg3?: string, arg4?: string): any {
    let inbounds = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : [arg1 || arg2]);
    let serverIp = typeof arg2 === 'string' ? arg2 : (arg3 || '127.0.0.1');
    let isp = arg4 || (typeof arg3 === 'string' ? arg3 : 'DEFAULT');

    const sni = isp === 'WHITE_SNI' ? this.WHITE_IRAN_SNIS[0] : 'yahoo.com';

    const outbounds: any[] = inbounds.map(inbound => ({
      type: "vless",
      tag: `Nyx-${inbound?.remark || 'Config'}`,
      server: serverIp,
      server_port: inbound?.port || 443,
      uuid: inbound?.uuid || inbound?.id,
      flow: inbound?.security === 'reality' ? "xtls-rprx-vision" : "",
      tls: {
        enabled: true,
        server_name: inbound?.sni || sni,
        utls: { enabled: true, fingerprint: "chrome" },
        reality: {
          enabled: inbound?.security === 'reality',
          public_key: inbound?.publicKey || "",
          short_id: inbound?.shortId || ""
        }
      }
    }));

    outbounds.push({ type: "direct", tag: "direct" });
    outbounds.push({ type: "block", tag: "block" });

    const defaultDetour = outbounds.length > 2 ? outbounds[0].tag : "direct";

    return {
      log: { level: "info" },
      dns: {
        servers: [
          { tag: "remote", address: "tls://1.1.1.1", detour: defaultDetour },
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
   * Generates Clash Meta YAML config (Supports 3 or 4 arguments)
   */
  static generateClashYaml(arg1: any, arg2: any, arg3?: string, arg4?: string): string {
    let inbounds = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : [arg1 || arg2]);
    let serverIp = typeof arg2 === 'string' ? arg2 : (arg3 || '127.0.0.1');
    let isp = arg4 || (typeof arg3 === 'string' ? arg3 : 'DEFAULT');

    const sni = isp === 'WHITE_SNI' ? this.WHITE_IRAN_SNIS[0] : 'yahoo.com';

    const proxies = inbounds.map(inbound => {
      const proxyName = `Nyx-${inbound?.remark || 'Config'}`;
      const uuid = inbound?.uuid || inbound?.id;
      if (inbound?.security === 'reality') {
        return `  - name: "${proxyName}"
    type: vless
    server: ${serverIp}
    port: ${inbound?.port}
    uuid: ${uuid}
    network: ${inbound?.network || 'tcp'}
    tls: true
    udp: true
    flow: xtls-rprx-vision
    servername: ${inbound?.sni || sni}
    reality-opts:
      public-key: ${inbound?.publicKey || ''}
      short-id: ${inbound?.shortId || '6ba7b810'}
    client-fingerprint: chrome`;
      }
      return `  - name: "${proxyName}"
    type: vless
    server: ${serverIp}
    port: ${inbound?.port}
    uuid: ${uuid}
    network: ${inbound?.network || 'tcp'}
    tls: ${inbound?.security === 'tls'}
    udp: true
    servername: ${inbound?.sni || sni}`;
    });

    const proxyNamesList = inbounds.map(i => `      - "Nyx-${i?.remark || 'Config'}"`).join('\n');
    const hasProxies = inbounds.length > 0;
    const proxiesYaml = hasProxies ? proxies.join('\n\n') : '  - name: "DIRECT"\n    type: direct';
    const namesYaml = hasProxies ? proxyNamesList : '      - DIRECT';

    return `# Nyx Panel - Clash Meta Config
# ISP: ${isp} | Server: ${serverIp}

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
${proxiesYaml}

proxy-groups:
  - name: "🚀 Nyx Auto"
    type: url-test
    proxies:
${namesYaml}
    url: "http://www.gstatic.com/generate_204"
    interval: 300

  - name: "🛡️ Select"
    type: select
    proxies:
${namesYaml}
      - DIRECT

rules:
  - GEOIP,IR,DIRECT
  - MATCH,🚀 Nyx Auto
`;
  }
}
