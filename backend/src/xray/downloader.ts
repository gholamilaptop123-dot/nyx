import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';

const XRAY_DIR = path.join(process.cwd(), 'bin');
const XRAY_EXEC = process.platform === 'win32' ? path.join(XRAY_DIR, 'xray.exe') : path.join(XRAY_DIR, 'xray');

export async function ensureXrayBinary(): Promise<string> {
  if (!fs.existsSync(XRAY_DIR)) {
    fs.mkdirSync(XRAY_DIR, { recursive: true });
  }

  // 1. Check if binary already exists locally
  if (fs.existsSync(XRAY_EXEC)) {
    if (process.platform !== 'win32') {
      try { fs.chmodSync(XRAY_EXEC, '755'); } catch (e) {}
    }
    console.log(`[Xray Downloader] ✅ Using local Xray binary at: ${XRAY_EXEC}`);
    return XRAY_EXEC;
  }

  // 2. Check if a local xray.zip was manually placed in bin/
  const zipPath = path.join(XRAY_DIR, 'xray.zip');
  if (fs.existsSync(zipPath)) {
    console.log('[Xray Downloader] Found local xray.zip! Extracting...');
    try {
      if (process.platform === 'win32') {
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${XRAY_DIR}' -Force"`);
      } else {
        execSync(`unzip -o "${zipPath}" -d "${XRAY_DIR}" && chmod +x "${XRAY_EXEC}"`);
      }
      if (fs.existsSync(XRAY_EXEC)) {
        console.log(`[Xray Downloader] ✅ Extracted local binary to: ${XRAY_EXEC}`);
        return XRAY_EXEC;
      }
    } catch (err) {
      console.warn('[Xray Downloader] Failed to extract local xray.zip, attempting web download...');
    }
  }

  console.log('[Xray Downloader] Binary not found. Fetching release info from GitHub...');
  
  const platform = process.platform === 'win32' ? 'windows-64' : 'linux-64';
  const assetFilename = `Xray-${platform}.zip`;

  let latestTag = 'v24.11.30'; // Hardcoded safe fallback version
  let directAssetUrl = '';

  // 3. Try to query GitHub API for exact tag and asset URL
  try {
    const apiRes = await axios.get('https://api.github.com/repos/XTLS/Xray-core/releases/latest', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    if (apiRes.data && apiRes.data.tag_name) {
      latestTag = apiRes.data.tag_name;
      const asset = apiRes.data.assets?.find((a: any) => a.name === assetFilename);
      if (asset && asset.browser_download_url) {
        directAssetUrl = asset.browser_download_url;
      }
    }
  } catch (err: any) {
    console.warn('[Xray Downloader] GitHub API check skipped/failed, using mirror fallback tag:', latestTag);
  }

  // 4. Candidate Download URLs (Direct + Anti-Block Mirrors)
  const candidateUrls: string[] = [];
  if (directAssetUrl) {
    candidateUrls.push(directAssetUrl);
  }
  candidateUrls.push(
    `https://github.com/XTLS/Xray-core/releases/download/${latestTag}/${assetFilename}`,
    `https://ghproxy.net/https://github.com/XTLS/Xray-core/releases/download/${latestTag}/${assetFilename}`,
    `https://mirror.ghproxy.com/https://github.com/XTLS/Xray-core/releases/download/${latestTag}/${assetFilename}`,
    `https://github.com/XTLS/Xray-core/releases/latest/download/${assetFilename}`
  );

  let downloadedSuccessfully = false;

  for (const url of candidateUrls) {
    try {
      console.log(`[Xray Downloader] Attempting download from: ${url}`);
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        maxRedirects: 10,
        timeout: 25000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      if (response.status === 200 && response.data && response.data.byteLength > 1000000) {
        fs.writeFileSync(zipPath, response.data);
        console.log(`[Xray Downloader] Downloaded ${response.data.byteLength} bytes successfully!`);
        downloadedSuccessfully = true;
        break;
      }
    } catch (err: any) {
      console.warn(`[Xray Downloader] Mirror failed (${url}):`, err.message || err);
    }
  }

  if (!downloadedSuccessfully) {
    console.error('[Xray Downloader] ⚠️ Automatic download failed due to network restriction/404.');
    console.log(`📌 [Manual Setup Hint]: You can manually copy 'xray' (for Linux) or 'xray.exe' (for Windows) into: ${XRAY_DIR}`);
    return XRAY_EXEC;
  }

  // 5. Extract Archive
  try {
    console.log('[Xray Downloader] Extracting Xray archive...');
    if (process.platform === 'win32') {
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${XRAY_DIR}' -Force"`);
    } else {
      execSync(`unzip -o "${zipPath}" -d "${XRAY_DIR}" && chmod +x "${XRAY_EXEC}"`);
    }

    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    console.log(`[Xray Downloader] ✅ Xray-core binary successfully installed at: ${XRAY_EXEC}`);
  } catch (extractErr) {
    console.error('[Xray Downloader] Failed to extract archive:', extractErr);
  }

  return XRAY_EXEC;
}
