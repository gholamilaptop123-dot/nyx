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

    outbounds.push({
      type: "direct",
      tag: "direct"
    });

    return {
      log: { level: "info" },
      outbounds: outbounds
    };
  }
}
