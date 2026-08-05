import { User, Inbound } from '@prisma/client';

export class SubscriptionService {
  // Iranian Whitelisted Domestic SNIs that remain active during National Blackouts
  static WHITE_IRAN_SNIS = [
    'ebanking.banksepah.ir',
    'bmi.ir',
    'arvancloud.ir',
    'sheypoor.com',
    'divar.ir',
    'snapp.ir',
    'asiatech.ir'
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
        rules: [{ geosite: ["cn"], outbound: "direct" }],
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
