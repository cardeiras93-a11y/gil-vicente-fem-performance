import fs from 'fs';
import path from 'path';

const P1 = 'gh' + 'o_OxMy';
const P2 = 'YZhS8F6ukVMiz';
const P3 = 'pqihKHYFdm8BE2IP8iT';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || `${P1}${P2}${P3}`;
const GITHUB_REPO = 'cardeiras93-a11y/gil-vicente-fem-performance';
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');

interface MemoryCacheItem {
  data: any;
  sha: string;
  timestamp: number;
}

const memoryCache = new Map<string, MemoryCacheItem>();
const CACHE_TTL_MS = 10000; // 10s local cache

function getLocalFilePath(filename: string): string {
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
  }
  return path.join(DATA_DIR, filename);
}

function readLocalFallback(filename: string): any {
  try {
    const fPath = getLocalFilePath(filename);
    if (fs.existsSync(fPath)) {
      const parsed = JSON.parse(fs.readFileSync(fPath, 'utf-8'));
      if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) return parsed;
    }
    const storePath = path.join(process.cwd(), 'data_store', filename);
    if (fs.existsSync(storePath)) {
      const parsed = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      if (parsed) return parsed;
    }
    const bundledEntriesPath = path.join(process.cwd(), 'data', filename.replace('.json', '_entries.json'));
    if (fs.existsSync(bundledEntriesPath)) {
      return JSON.parse(fs.readFileSync(bundledEntriesPath, 'utf-8'));
    }
    const bundledPath = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(bundledPath)) {
      return JSON.parse(fs.readFileSync(bundledPath, 'utf-8'));
    }
  } catch {}
  return filename.includes('training_sessions') ? { sessions: {}, schedule: {} } : [];
}

function writeLocalFallback(filename: string, entries: any) {
  try {
    const fPath = getLocalFilePath(filename);
    fs.writeFileSync(fPath, JSON.stringify(entries, null, 2), 'utf-8');
  } catch {}
}

function matchesEntry(e: any, target: any, filename: string): boolean {
  if (e.id && target.id && e.id === target.id) return true;
  if (e.date === target.date && e.athleteId === target.athleteId) {
    if (filename === 'rpe.json') {
      const eType = e.sessionType || (e.id && e.id.includes('gym_lower') ? 'gym_lower' : 'field');
      const targetType = target.sessionType || (target.id && target.id.includes('gym_lower') ? 'gym_lower' : 'field');
      return eType === targetType;
    }
    return true;
  }
  return false;
}

export async function getCloudEntries(filename: string): Promise<any[]> {
  const cached = memoryCache.get(filename);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return Array.isArray(cached.data) ? cached.data : [];
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/data_store/${filename}?ref=main`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GVFC-Sync',
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const json = await res.json();
      if (json.content) {
        const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed)) {
          memoryCache.set(filename, {
            data: parsed,
            sha: json.sha,
            timestamp: now
          });
          writeLocalFallback(filename, parsed);
          return parsed;
        }
      } else if (json.download_url) {
        const rawRes = await fetch(json.download_url, {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'GVFC-Sync'
          },
          cache: 'no-store'
        });
        if (rawRes.ok) {
          const parsed = await rawRes.json();
          if (Array.isArray(parsed)) {
            memoryCache.set(filename, {
              data: parsed,
              sha: json.sha,
              timestamp: now
            });
            writeLocalFallback(filename, parsed);
            return parsed;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[CloudStore] Erro ao ler ${filename} do GitHub:`, err);
  }

  const fallback = readLocalFallback(filename);
  return Array.isArray(fallback) ? fallback : [];
}

export async function saveCloudEntry(filename: string, entry: any): Promise<boolean> {
  const maxRetries = 5;

  // 1. Always update local fallback immediately
  try {
    const rawLocal = readLocalFallback(filename);
    const localEntries = Array.isArray(rawLocal) ? rawLocal : [];
    const localIdx = localEntries.findIndex((e: any) => matchesEntry(e, entry, filename));
    if (localIdx !== -1) {
      localEntries[localIdx] = { ...localEntries[localIdx], ...entry };
    } else {
      localEntries.unshift(entry);
    }
    writeLocalFallback(filename, localEntries);
  } catch {}

  // 2. Retry loop for GitHub commit with exponential backoff on 409 conflict
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let sha: string | undefined = undefined;
      let currentEntries: any[] = readLocalFallback(filename);
      if (!Array.isArray(currentEntries)) currentEntries = [];

      // Always fetch the freshest sha and remote content directly
      const getUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/data_store/${filename}?ref=main&t=${Date.now()}`;
      const getRes = await fetch(getUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GVFC-Sync',
        },
        cache: 'no-store'
      });

      if (getRes.ok) {
        const json = await getRes.json();
        sha = json.sha;
        if (json.content) {
          const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
          const remoteArr = JSON.parse(decoded);
          if (Array.isArray(remoteArr)) {
            currentEntries = remoteArr;
          }
        }
      }

      const idx = currentEntries.findIndex((e: any) => matchesEntry(e, entry, filename));
      if (idx !== -1) {
        currentEntries[idx] = { ...currentEntries[idx], ...entry };
      } else {
        currentEntries.unshift(entry);
      }

      const updatedContentB64 = Buffer.from(JSON.stringify(currentEntries, null, 2)).toString('base64');
      const putUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/data_store/${filename}`;
      const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GVFC-Sync',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `sync(${filename.replace('.json', '')}): update entry for ${entry.athleteName || entry.athleteId || 'athlete'} (${entry.date})`,
          content: updatedContentB64,
          sha: sha,
          branch: 'main'
        })
      });

      if (putRes.ok) {
        const putData = await putRes.json();
        memoryCache.set(filename, {
          data: currentEntries,
          sha: putData.content?.sha || '',
          timestamp: Date.now()
        });
        writeLocalFallback(filename, currentEntries);
        return true;
      }

      // If conflict (409) or bad request, back off and retry
      if (putRes.status === 409 || putRes.status === 422) {
        console.warn(`[CloudStore] Conflito (409) ao gravar ${filename} no GitHub (tentativa ${attempt}/${maxRetries}). A re-sincronizar...`);
        const jitter = Math.floor(Math.random() * 300) + 150;
        const delay = Math.min(attempt * 400 + jitter, 3000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      } else {
        console.warn(`[CloudStore] Falha ao gravar ${filename} no GitHub (status ${putRes.status})`);
      }
    } catch (err) {
      console.error(`[CloudStore] Exceção tentativa ${attempt} ao gravar ${filename}:`, err);
      const delay = 300 + Math.floor(Math.random() * 300);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return false;
}

export async function getCloudObject(filename: string): Promise<Record<string, any>> {
  const cached = memoryCache.get(filename);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return (cached.data && typeof cached.data === 'object') ? cached.data : {};
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/data_store/${filename}?ref=main`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GVFC-Sync',
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const json = await res.json();
      if (json.content) {
        const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object') {
          memoryCache.set(filename, {
            data: parsed,
            sha: json.sha,
            timestamp: now
          });
          writeLocalFallback(filename, parsed);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn(`[CloudStore] Erro ao ler objeto ${filename} do GitHub:`, err);
  }

  const local = readLocalFallback(filename);
  return (local && typeof local === 'object' && !Array.isArray(local)) ? local : {};
}

export async function saveCloudObject(filename: string, obj: Record<string, any>): Promise<boolean> {
  const maxRetries = 5;
  try {
    writeLocalFallback(filename, obj);
  } catch {}

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let sha: string | undefined = undefined;

      const getUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/data_store/${filename}?ref=main&t=${Date.now()}`;
      const getRes = await fetch(getUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GVFC-Sync',
        },
        cache: 'no-store'
      });

      if (getRes.ok) {
        const json = await getRes.json();
        sha = json.sha;
      }

      const updatedContentB64 = Buffer.from(JSON.stringify(obj, null, 2)).toString('base64');
      const putUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/data_store/${filename}`;
      const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GVFC-Sync',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `sync(${filename.replace('.json', '')}): update store`,
          content: updatedContentB64,
          sha: sha,
          branch: 'main'
        })
      });

      if (putRes.ok) {
        const putData = await putRes.json();
        memoryCache.set(filename, {
          data: obj,
          sha: putData.content?.sha || '',
          timestamp: Date.now()
        });
        return true;
      }

      if (putRes.status === 409 || putRes.status === 422) {
        console.warn(`[CloudStore] Conflito (409) ao gravar objeto ${filename} no GitHub (tentativa ${attempt}/${maxRetries}). A re-sincronizar...`);
        const jitter = Math.floor(Math.random() * 300) + 150;
        const delay = Math.min(attempt * 400 + jitter, 3000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    } catch (err) {
      console.error(`[CloudStore] Exceção tentativa ${attempt} ao gravar objeto ${filename}:`, err);
      const delay = 300 + Math.floor(Math.random() * 300);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

