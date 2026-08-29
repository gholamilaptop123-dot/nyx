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
   * Generates Base64 VLESS / VMess / Trojan link (Supports 3 or 4 arguments)
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

    // When called as (user, inbound, serverIp, isp), use the user's own UUID for correct
    // per-user traffic attribution in Xray stats and proper per-user access control.
    // When called as (inbound, serverIp, isp), fall back to the inbound's UUID.
    const uuid = (arg4 !== undefined && arg1?.uuid)
      ? arg1.uuid
      : (inbound?.uuid || inbound?.id || '11111111-2222-3333-4444-555555555555');
    // Priority: Inbound custom domain > Global serverIp/domain
    const effectiveHost = inbound?.customDomain?.trim() || serverIp;
    const isPaaS = effectiveHost.includes('.railway.app') ||
                   effectiveHost.includes('.onrender.com') ||
                   effectiveHost.includes('.fly.dev') ||
                   effectiveHost.includes('.koyeb.app') ||
                   effectiveHost.includes('.app.github.dev') ||
                   effectiveHost.includes('.github.dev') ||
                   effectiveHost.includes('.hf.space') ||
                   effectiveHost.includes('.zeabur.app');
    const port = isPaaS ? 443 : (inbound?.port || 443);
    const proto = (inbound?.protocol || 'vless').toLowerCase();
    const net = (inbound?.network || 'tcp').toLowerCase();
    const remark = encodeURIComponent(`Nyx-${inbound?.remark || 'Config'}-${isp}`);

    let sni = inbound?.sni || (isPaaS ? effectiveHost : 'yahoo.com');
    // If running on a cloud domain (Codespaces, Railway, Render) or WS with TLS,
    // ensure SNI matches the cloud domain rather than default yahoo.com so TLS handshake succeeds
    if (isPaaS && (sni === 'yahoo.com' || !inbound?.sni)) {
      sni = effectiveHost;
    }
    if (isp === 'WHITE_SNI') {
      sni = this.WHITE_IRAN_SNIS[0];
    }

    const isReality = inbound?.security === 'reality';
    const pbk = inbound?.publicKey || '';
    const sid = inbound?.shortId || '6ba7b810';
    const fp = inbound?.fingerprint || 'chrome';
    const sec = isReality ? 'reality' : ((isPaaS || inbound?.security === 'tls') ? 'tls' : (inbound?.security || 'none'));
    const fragQuery = (inbound?.enableFragment && !isPaaS)
      ? `&fragment=${encodeURIComponent(`${inbound?.fragmentLength || '100-200'},${inbound?.fragmentInterval || '10-20'},tlshello`)}`
      : '';

    // 0. Shadowsocks Protocol
    if (proto === 'shadowsocks') {
      const cipher = inbound?.ssCipher || 'chacha20-ietf-poly1305';
      const password = inbound?.ssPassword || inbound?.uuid || uuid || 'nyx-ss-default';
      const ssUserInfo = Buffer.from(`${cipher}:${password}`).toString('base64');
      return `ss://${ssUserInfo}@${effectiveHost}:${port}#${remark}`;
    }

    // 1. WebSocket Transport (WS)
    if (net === 'ws') {
      const wsPath = encodeURIComponent('/nyx');
      const wsHost = encodeURIComponent(sni);
      const tlsQuery = sec === 'tls' ? `&fp=${fp}` : '';

      if (proto === 'vmess') {
        const vmessObj = {
          v: "2",
          ps: `Nyx-${inbound?.remark || 'VMess'}-${isp}`,
          add: effectiveHost,
          port: String(port),
          id: uuid,
          aid: "0",
          scy: "auto",
          net: "ws",
          type: "none",
          host: sni,
          path: "/nyx",
          tls: sec === 'tls' ? "tls" : "",
          sni: sni,
          fp: fp
        };
        return `vmess://${Buffer.from(JSON.stringify(vmessObj)).toString('base64')}`;
      }

      if (proto === 'trojan') {
        return `trojan://${uuid}@${effectiveHost}:${port}?security=${sec}&sni=${sni}&type=ws&path=${wsPath}&host=${wsHost}${tlsQuery}${fragQuery}#${remark}`;
      }

      return `vless://${uuid}@${effectiveHost}:${port}?encryption=none&type=ws&security=${sec}&sni=${sni}&path=${wsPath}&host=${wsHost}${tlsQuery}${fragQuery}#${remark}`;
    }

    // 2. XHTTP / SplitHTTP Transport (Next-Gen Anti-Censorship)
    if (net === 'xhttp' || net === 'splithttp') {
      const xhttpPath = '/nyx-xhttp';
      const realityParams = isReality ? `&pbk=${pbk}&sid=${sid}&fp=${fp}` : '';
      const tlsParams = (sec === 'tls' && !isReality) ? `&fp=${fp}` : '';

      if (proto === 'trojan') {
        return `trojan://${uuid}@${effectiveHost}:${port}?security=${sec}&sni=${sni}&type=xhttp&path=${encodeURIComponent(xhttpPath)}&host=${encodeURIComponent(sni)}&mode=auto${realityParams}${tlsParams}${fragQuery}#${remark}`;
      }

      return `vless://${uuid}@${effectiveHost}:${port}?encryption=none&type=xhttp&security=${sec}&sni=${sni}&path=${encodeURIComponent(xhttpPath)}&host=${encodeURIComponent(sni)}&mode=auto${realityParams}${tlsParams}${fragQuery}#${remark}`;
    }

    // 3. gRPC Transport
    if (net === 'grpc') {
      const serviceName = encodeURIComponent('nyx-grpc');
      const realityParams = isReality ? `&pbk=${pbk}&sid=${sid}&fp=${fp}` : '';
      const tlsParams = (sec === 'tls' && !isReality) ? `&fp=${fp}` : '';

      if (proto === 'trojan') {
        return `trojan://${uuid}@${effectiveHost}:${port}?security=${sec}&sni=${sni}&type=grpc&serviceName=${serviceName}${realityParams}${tlsParams}${fragQuery}#${remark}`;
      }
      return `vless://${uuid}@${effectiveHost}:${port}?encryption=none&type=grpc&security=${sec}&sni=${sni}&serviceName=${serviceName}${realityParams}${tlsParams}${fragQuery}#${remark}`;
    }

    // 4. VLESS / Trojan + REALITY (TCP)
    if (isReality) {
      const flow = net === 'tcp' ? 'xtls-rprx-vision' : '';
      if (proto === 'trojan') {
        return `trojan://${uuid}@${effectiveHost}:${port}?security=reality&pbk=${pbk}&fp=${fp}&sni=${sni}&sid=${sid}&headerType=none${fragQuery}#${remark}`;
      }
      return `vless://${uuid}@${effectiveHost}:${port}?encryption=none&type=${net}&security=reality&pbk=${pbk}&fp=${fp}&sni=${sni}&sid=${sid}${flow ? `&flow=${flow}` : ''}&headerType=none${fragQuery}#${remark}`;
    }

    // 5. Standard TCP / TLS
    if (proto === 'trojan') {
      const tlsQuery = sec === 'tls' ? `&fp=${fp}` : '';
      return `trojan://${uuid}@${effectiveHost}:${port}?security=${sec}&sni=${sni}${tlsQuery}&headerType=none${fragQuery}#${remark}`;
    }

    const tlsQuery = sec === 'tls' ? `&fp=${fp}` : '';
    return `vless://${uuid}@${effectiveHost}:${port}?encryption=none&type=${net}&security=${sec}&sni=${sni}${tlsQuery}&headerType=none${fragQuery}#${remark}`;
  }

  /**
   * Generates Base64 subscription (Supports 3 or 4 arguments)
   */
  static generateBase64Sub(arg1: any, arg2: any, arg3?: string, arg4?: string): string {
    let inbounds = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : [arg1 || arg2]);
    let serverIp = typeof arg2 === 'string' ? arg2 : (arg3 || '127.0.0.1');
    let isp = arg4 || (typeof arg3 === 'string' ? arg3 : 'DEFAULT');

    // Preserve user object so each link uses the correct per-user UUID
    const user = (arg4 !== undefined) ? arg1 : null;
    if (user?.inboundIds && user.inboundIds.trim()) {
      const allowed = user.inboundIds.split(',').map((s: string) => s.trim());
      const filtered = inbounds.filter(ib => allowed.includes(ib.id) || allowed.includes(ib.uuid));
      if (filtered.length > 0) inbounds = filtered;
    }

    const links = inbounds.map(inbound =>
      user
        ? this.generateVlessLink(user, inbound, serverIp, isp)
        : this.generateVlessLink(inbound, serverIp, isp)
    );
    return Buffer.from(links.join('\n')).toString('base64');
  }

  /**
   * Generates Sing-Box JSON Config (Supports 3 or 4 arguments)
   */
  static generateSingBoxJson(arg1: any, arg2: any, arg3?: string, arg4?: string): any {
    let inbounds = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : [arg1 || arg2]);
    let serverIp = typeof arg2 === 'string' ? arg2 : (arg3 || '127.0.0.1');
    let isp = arg4 || (typeof arg3 === 'string' ? arg3 : 'DEFAULT');
    // Capture user for per-user UUID attribution in outbound configs
    const singboxUser = (arg4 !== undefined) ? arg1 : null;

    if (singboxUser?.inboundIds && singboxUser.inboundIds.trim()) {
      const allowed = singboxUser.inboundIds.split(',').map((s: string) => s.trim());
      const filtered = inbounds.filter(ib => allowed.includes(ib.id) || allowed.includes(ib.uuid));
      if (filtered.length > 0) inbounds = filtered;
    }

    const isPaaS = serverIp.includes('.railway.app') ||
                   serverIp.includes('.onrender.com') ||
                   serverIp.includes('.fly.dev') ||
                   serverIp.includes('.koyeb.app') ||
                   serverIp.includes('.app.github.dev') ||
                   serverIp.includes('.github.dev') ||
                   serverIp.includes('.hf.space') ||
                   serverIp.includes('.zeabur.app');
    const sni = isp === 'WHITE_SNI' ? this.WHITE_IRAN_SNIS[0] : (isPaaS ? serverIp : 'yahoo.com');

    const outbounds: any[] = inbounds.map(inbound => {
      const effectiveHost = inbound?.customDomain?.trim() || serverIp;
      const net = (inbound?.network || 'tcp').toLowerCase();
      const proto = (inbound?.protocol || 'vless').toLowerCase();
      const port = isPaaS ? 443 : (inbound?.port || 443);
      const isReality = inbound?.security === 'reality';
      const isTls = isPaaS || inbound?.security === 'tls' || isReality;
      let effectiveSni = inbound?.sni || (isPaaS ? effectiveHost : 'yahoo.com');
      if (isPaaS && (effectiveSni === 'yahoo.com' || !inbound?.sni)) {
        effectiveSni = effectiveHost;
      }

      let transportConfig: any = undefined;
      if (net === 'ws') {
        transportConfig = {
          type: "ws",
          path: "/nyx",
          headers: { Host: inbound?.sni || sni }
        };
      } else if (net === 'grpc') {
        transportConfig = {
          type: "grpc",
          service_name: "nyx-grpc"
        };
      } else if (net === 'xhttp' || net === 'splithttp') {
        transportConfig = {
          type: "http",
          path: "/nyx-xhttp",
          host: [inbound?.sni || sni]
        };
      }

      if (proto === 'shadowsocks') {
        const cipher = inbound?.ssCipher || 'chacha20-ietf-poly1305';
        const password = inbound?.ssPassword || inbound?.uuid || singboxUser?.uuid || 'nyx-ss-default';
        return {
          type: "shadowsocks",
          tag: `Nyx-${inbound?.remark || 'Config'}`,
          server: effectiveHost,
          server_port: port,
          method: cipher,
          password: password,
          network: "tcp"
        };
      }

      return {
        type: proto === 'trojan' ? 'trojan' : (proto === 'vmess' ? 'vmess' : 'vless'),
        tag: `Nyx-${inbound?.remark || 'Config'}`,
        server: effectiveHost,
        server_port: port,
        uuid: singboxUser?.uuid || inbound?.uuid || inbound?.id,
        flow: isReality && net === 'tcp' ? "xtls-rprx-vision" : "",
        tls: {
          enabled: isTls,
          server_name: inbound?.sni || sni,
          utls: { enabled: true, fingerprint: inbound?.fingerprint || "chrome" },
          reality: {
            enabled: isReality,
            public_key: inbound?.publicKey || "",
            short_id: inbound?.shortId || "6ba7b810"
          }
        },
        transport: transportConfig
      };
    });

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
    // Capture user for per-user UUID attribution in Clash proxy configs
    const clashUser = (arg4 !== undefined) ? arg1 : null;

    if (clashUser?.inboundIds && clashUser.inboundIds.trim()) {
      const allowed = clashUser.inboundIds.split(',').map((s: string) => s.trim());
      const filtered = inbounds.filter(ib => allowed.includes(ib.id) || allowed.includes(ib.uuid));
      if (filtered.length > 0) inbounds = filtered;
    }

    const isPaaS = serverIp.includes('.railway.app') ||
                   serverIp.includes('.onrender.com') ||
                   serverIp.includes('.fly.dev') ||
                   serverIp.includes('.koyeb.app') ||
                   serverIp.includes('.app.github.dev') ||
                   serverIp.includes('.github.dev') ||
                   serverIp.includes('.hf.space') ||
                   serverIp.includes('.zeabur.app');
    const sni = isp === 'WHITE_SNI' ? this.WHITE_IRAN_SNIS[0] : (isPaaS ? serverIp : 'yahoo.com');

    const proxies = inbounds.map(inbound => {
      const effectiveHost = inbound?.customDomain?.trim() || serverIp;
      const proxyName = `Nyx-${inbound?.remark || 'Config'}`;
      const uuid = clashUser?.uuid || inbound?.uuid || inbound?.id;
      const port = isPaaS ? 443 : (inbound?.port || 443);
      const net = (inbound?.network || 'tcp').toLowerCase();
      const proto = (inbound?.protocol || 'vless').toLowerCase();
      const fp = inbound?.fingerprint || 'chrome';

      if (proto === 'shadowsocks') {
        const cipher = inbound?.ssCipher || 'chacha20-ietf-poly1305';
        const password = inbound?.ssPassword || inbound?.uuid || uuid || 'nyx-ss-default';
        return `  - name: "${proxyName}"
    type: ss
    server: ${effectiveHost}
    port: ${port}
    cipher: ${cipher}
    password: "${password}"
    udp: true`;
      }

      if (net === 'ws') {
        return `  - name: "${proxyName}"
    type: ${proto}
    server: ${effectiveHost}
    port: ${port}
    uuid: ${uuid}
    network: ws
    tls: true
    udp: true
    servername: ${inbound?.sni || sni}
    ws-opts:
      path: "/nyx"
      headers:
        Host: ${inbound?.sni || sni}
    client-fingerprint: ${fp}`;
      }

      if (net === 'grpc') {
        return `  - name: "${proxyName}"
    type: ${proto}
    server: ${effectiveHost}
    port: ${port}
    uuid: ${uuid}
    network: grpc
    tls: true
    udp: true
    servername: ${inbound?.sni || sni}
    grpc-opts:
      grpc-service-name: "nyx-grpc"
    client-fingerprint: ${fp}`;
      }

      if (inbound?.security === 'reality') {
        return `  - name: "${proxyName}"
    type: ${proto}
    server: ${effectiveHost}
    port: ${port}
    uuid: ${uuid}
    network: ${net}
    tls: true
    udp: true
    flow: ${net === 'tcp' ? 'xtls-rprx-vision' : ''}
    servername: ${inbound?.sni || sni}
    reality-opts:
      public-key: ${inbound?.publicKey || ''}
      short-id: ${inbound?.shortId || '6ba7b810'}
    client-fingerprint: ${fp}`;
      }

      return `  - name: "${proxyName}"
    type: ${proto}
    server: ${effectiveHost}
    port: ${port}
    uuid: ${uuid}
    network: ${net}
    tls: ${inbound?.security === 'tls'}
    udp: true
    client-fingerprint: ${fp}
    servername: ${inbound?.sni || sni}`;
    });

    const proxyNamesList = inbounds.map(i => `      - "Nyx-${i?.remark || 'Config'}"`).join('\n');
    const hasProxies = inbounds.length > 0;
    const proxiesYaml = hasProxies ? proxies.join('\n\n') : '  - name: "DIRECT"\n    type: direct';
    const namesYaml = hasProxies ? proxyNamesList : '      - DIRECT';

    return `# Nyx Panel v2.4 - Clash Meta Config
# ISP: ${isp} | Host: ${serverIp}

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
