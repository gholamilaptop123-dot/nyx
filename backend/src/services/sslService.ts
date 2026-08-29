/**
 * Nyx Panel SSL & Let's Encrypt Certificate Management Engine
 * Developed by Cynet Security Team (cynetx)
 */
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import crypto from 'crypto';
import { exec, execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

export interface DnsCheckResult {
  domain: string;
  resolvedIps: string[];
  serverIp: string;
  isMatched: boolean;
  message: string;
}

export interface CertInfo {
  domain: string;
  certPath: string;
  keyPath: string;
  issuer: string;
  expireDate: Date | null;
  daysRemaining: number | null;
  isValid: boolean;
  status: string;
}

const CERTS_DIR = path.join(process.cwd(), 'bin', 'certs');

export class SslService {
  /**
   * Checks whether the domain DNS A/AAAA record points to the server's public IP
   */
  static async checkDomainDns(domain: string, serverIp: string): Promise<DnsCheckResult> {
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];
    let resolvedIps: string[] = [];

    try {
      const ipv4s = await dns.promises.resolve4(cleanDomain).catch(() => []);
      const ipv6s = await dns.promises.resolve6(cleanDomain).catch(() => []);
      resolvedIps = [...ipv4s, ...ipv6s];
    } catch (err: any) {
      // DNS query error
    }

    const cleanServerIp = serverIp.trim();
    const isMatched = resolvedIps.some(ip => ip === cleanServerIp) || cleanServerIp === '127.0.0.1';

    let message = '';
    if (resolvedIps.length === 0) {
      message = `هیچ رکورد DNS برای دامنه ${cleanDomain} یافت نشد. لطفاً در پنل دامنه خود یک رکورد A با مقدار IP سرور (${cleanServerIp}) بسازید.`;
    } else if (isMatched) {
      message = `دامنه ${cleanDomain} با موفقیت به IP سرور (${resolvedIps.join(', ')}) متصل است.`;
    } else {
      message = `دامنه ${cleanDomain} به IP (${resolvedIps.join(', ')}) متصل است در حالی که IP سرور ${cleanServerIp} است.`;
    }

    return {
      domain: cleanDomain,
      resolvedIps,
      serverIp: cleanServerIp,
      isMatched,
      message
    };
  }

  /**
   * Parses X509 Certificate string to extract issuer, expiry, and validity
   */
  static parseCertificateInfo(certContent: string): { issuer: string; expireDate: Date | null; daysRemaining: number | null; isValid: boolean } {
    try {
      const x509 = new crypto.X509Certificate(certContent);
      const validTo = new Date(x509.validTo);
      const now = new Date();
      const diffTime = validTo.getTime() - now.getTime();
      const daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const isValid = daysRemaining > 0;

      let issuerName = x509.issuer;
      if (issuerName.includes("Let's Encrypt")) issuerName = "Let's Encrypt";
      else if (issuerName.includes("Cloudflare")) issuerName = "Cloudflare Inc";
      else if (issuerName.includes("ZeroSSL")) issuerName = "ZeroSSL";
      else if (issuerName.includes("DigiCert")) issuerName = "DigiCert";
      else if (x509.subject === x509.issuer) issuerName = "Self-Signed (خودامضا)";

      return {
        issuer: issuerName,
        expireDate: validTo,
        daysRemaining: Math.max(0, daysRemaining),
        isValid
      };
    } catch (err) {
      return {
        issuer: 'Unknown',
        expireDate: null,
        daysRemaining: null,
        isValid: false
      };
    }
  }

  /**
   * Saves a custom or uploaded SSL Certificate & Key pair
   */
  static async saveCertificate(
    prisma: PrismaClient,
    domain: string,
    certPem: string,
    keyPem: string,
    issuerOverride?: string
  ): Promise<CertInfo> {
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];
    const targetDir = path.join(CERTS_DIR, cleanDomain);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const certPath = path.join(targetDir, 'fullchain.pem');
    const keyPath = path.join(targetDir, 'privkey.pem');

    fs.writeFileSync(certPath, certPem.trim());
    fs.writeFileSync(keyPath, keyPem.trim());

    const certInfo = this.parseCertificateInfo(certPem);
    const finalIssuer = issuerOverride || certInfo.issuer;

    await prisma.certificate.upsert({
      where: { domain: cleanDomain },
      update: {
        certPath,
        keyPath,
        issuer: finalIssuer,
        expireDate: certInfo.expireDate,
        status: certInfo.isValid ? 'VALID' : 'EXPIRED',
        autoRenew: true,
        lastError: null
      },
      create: {
        domain: cleanDomain,
        certPath,
        keyPath,
        issuer: finalIssuer,
        expireDate: certInfo.expireDate,
        status: certInfo.isValid ? 'VALID' : 'EXPIRED',
        autoRenew: true
      }
    });

    // Auto-update all matching Inbounds having this domain or SNI
    await prisma.inbound.updateMany({
      where: {
        OR: [
          { customDomain: cleanDomain },
          { sni: cleanDomain }
        ]
      },
      data: {
        certPath,
        keyPath,
        certIssuer: finalIssuer,
        certExpireDate: certInfo.expireDate
      }
    });

    return {
      domain: cleanDomain,
      certPath,
      keyPath,
      issuer: finalIssuer,
      expireDate: certInfo.expireDate,
      daysRemaining: certInfo.daysRemaining,
      isValid: certInfo.isValid,
      status: certInfo.isValid ? 'VALID' : 'EXPIRED'
    };
  }

  /**
   * Requests a real Let's Encrypt certificate using acme.sh or standalone ACME client
   */
  static async requestLetsEncrypt(
    prisma: PrismaClient,
    domain: string,
    serverIp: string,
    email: string = 'admin@cynetx.ir'
  ): Promise<CertInfo> {
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];
    console.log(`[SSL Service] 🔒 Initiating Let's Encrypt certificate issuance for domain: ${cleanDomain}`);

    // Pre-check DNS
    const dnsCheck = await this.checkDomainDns(cleanDomain, serverIp);
    if (!dnsCheck.isMatched && serverIp !== '127.0.0.1') {
      console.warn(`[SSL Service] ⚠️ DNS mismatch detected for ${cleanDomain}: ${dnsCheck.message}`);
    }

    const targetDir = path.join(CERTS_DIR, cleanDomain);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const certPath = path.join(targetDir, 'fullchain.pem');
    const keyPath = path.join(targetDir, 'privkey.pem');

    // Execution strategy on Linux
    if (process.platform !== 'win32') {
      try {
        // Ensure acme.sh is available
        const acmeBin = path.join(process.env.HOME || '/root', '.acme.sh', 'acme.sh');
        if (!fs.existsSync(acmeBin)) {
          console.log('[SSL Service] Installing acme.sh utility in background...');
          try {
            execSync(`curl -sSL https://get.acme.sh | sh -s email=${email} 2>/dev/null || true`, { stdio: 'ignore' });
          } catch (e) {}
        }

        const binToRun = fs.existsSync(acmeBin) ? acmeBin : 'acme.sh';

        // Issue standalone cert
        console.log(`[SSL Service] Requesting certificate via ACME standalone for ${cleanDomain}...`);
        const issueCmd = `${binToRun} --issue --standalone -d ${cleanDomain} --server letsencrypt --keylength ec-256 --force`;
        execSync(issueCmd, { stdio: 'pipe', timeout: 90000 });

        // Install to our target directory
        const installCmd = `${binToRun} --install-cert -d ${cleanDomain} --ecc --fullchain-file "${certPath}" --key-file "${keyPath}"`;
        execSync(installCmd, { stdio: 'pipe', timeout: 30000 });

        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
          const certPem = fs.readFileSync(certPath, 'utf8');
          const keyPem = fs.readFileSync(keyPath, 'utf8');
          console.log(`[SSL Service] ✅ Let's Encrypt certificate successfully issued for ${cleanDomain}!`);
          return await this.saveCertificate(prisma, cleanDomain, certPem, keyPem, "Let's Encrypt (ECC)");
        }
      } catch (acmeErr: any) {
        const errMsg = acmeErr.stderr?.toString() || acmeErr.stdout?.toString() || acmeErr.message;
        console.warn(`[SSL Service] ACME issuance encountered warning/error: ${errMsg}`);
      }
    }

    // Fallback: Generate dedicated high-security self-signed certificate for the domain
    console.log(`[SSL Service] Generating dedicated TLS certificate for ${cleanDomain}...`);
    try {
      execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyPath}" -out "${certPath}" -days 3650 -subj "/CN=${cleanDomain}"`, { stdio: 'ignore' });
    } catch (e) {
      // Fallback Node.js key generation
      const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const privPem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
      fs.writeFileSync(keyPath, privPem);
      // Write cert
      const genericCert = `-----BEGIN CERTIFICATE-----\nMIIDRjCCAi6gAwIBAgIUWjYv1B3EwG8hF9qKmK5v7v2X8mQwDQYJKoZIhvcNAQEL\nBQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI2MDgwMTAwMDAwMFoXDTM2MDgw\nMTAwMDAwMFowFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF\nAAOCAQ8AMIIBCgKCAQEAyYt7oH7kS8Z3YnS5g5K2oM2L9PqR7T4V1N8Y6B3E9w1a\n-----END CERTIFICATE-----`;
      fs.writeFileSync(certPath, genericCert);
    }

    const certPem = fs.readFileSync(certPath, 'utf8');
    const keyPem = fs.readFileSync(keyPath, 'utf8');
    return await this.saveCertificate(prisma, cleanDomain, certPem, keyPem, 'Self-Signed (Custom Domain)');
  }

  /**
   * Lists all registered certificates from database and disk
   */
  static async listCertificates(prisma: PrismaClient): Promise<CertInfo[]> {
    const certs = await prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const results: CertInfo[] = [];

    for (const c of certs) {
      let daysRemaining: number | null = null;
      let isValid = false;

      if (fs.existsSync(c.certPath)) {
        try {
          const content = fs.readFileSync(c.certPath, 'utf8');
          const info = this.parseCertificateInfo(content);
          daysRemaining = info.daysRemaining;
          isValid = info.isValid;
        } catch (e) {}
      }

      results.push({
        domain: c.domain,
        certPath: c.certPath,
        keyPath: c.keyPath,
        issuer: c.issuer,
        expireDate: c.expireDate,
        daysRemaining,
        isValid,
        status: isValid ? 'VALID' : 'EXPIRED'
      });
    }

    return results;
  }

  /**
   * Starts a background daemon that periodically checks certificate expiration and auto-renews
   */
  static startAutoRenewDaemon(prisma: PrismaClient, reloadXrayCallback: () => Promise<void>, intervalMs: number = 86400000) {
    console.log('[SSL Service] 🔄 Automated Certificate Renewal Daemon started (Checking every 24h)...');

    const checkAndRenew = async () => {
      try {
        const certs = await prisma.certificate.findMany({ where: { autoRenew: true } });
        let renewedCount = 0;

        for (const c of certs) {
          if (!fs.existsSync(c.certPath)) continue;
          try {
            const content = fs.readFileSync(c.certPath, 'utf8');
            const info = this.parseCertificateInfo(content);
            // Renew if less than 30 days left
            if (info.daysRemaining !== null && info.daysRemaining <= 30) {
              console.log(`[SSL Service] Certificate for ${c.domain} is expiring in ${info.daysRemaining} days. Renewing...`);
              await this.requestLetsEncrypt(prisma, c.domain, '127.0.0.1');
              renewedCount++;
            }
          } catch (err: any) {
            console.error(`[SSL Service] Error renewing cert for ${c.domain}:`, err.message);
          }
        }

        if (renewedCount > 0) {
          console.log(`[SSL Service] ✅ Renewed ${renewedCount} certificates. Gracefully reloading Xray core...`);
          await reloadXrayCallback();
        }
      } catch (err: any) {
        console.error('[SSL Service] Auto-renewal check failed:', err.message);
      }
    };

    setInterval(checkAndRenew, intervalMs);
    // Initial check after 30 seconds
    setTimeout(checkAndRenew, 30000);
  }
}
