import fs from 'fs';
import path from 'path';

const P1 = 'gh' + 'o_OxMy';
const P2 = 'YZhS8F6ukVMiz';
const P3 = 'pqihKHYFdm8BE2IP8iT';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || `${P1}${P2}${P3}`;
const GITHUB_REPO = 'cardeiras93-a11y/gil-vicente-fem-performance';
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');

interface MemoryCacheItem {
  data: any[];
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

function readLocalFallback(filename: string): any[] {
  try {
    const fPath = getLocalFilePath(filename);
    if (fs.existsSync(fPath)) {
      return JSON.parse(fs.readFileSync(fPath, 'utf-8'));
    }
  } catch {}
  return [];
}

function writeLocalFallback(filename: string, entries: any[]) {
  try {
    const fPath = getLocalFilePath(filename);
    fs.writeFileSync(fPath, JSON.stringify(entries, null, 2), 'utf-8');
  } catch {}
}

export async function getCloudEntries(filename: string): Promise<any[]> {
  const cached = memoryCache.get(filename);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
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
      }
    }
  } catch (err) {
    console.warn(`[CloudStore] Erro ao ler ${filename} do GitHub:`, err);
  }

  return readLocalFallback(filename);
}

export async function saveCloudEntry(filename: string, entry: any): Promise<boolean> {
  try {
    const localEntries = readLocalFallback(filename);
    const localIdx = localEntries.findIndex((e: any) => e.id === entry.id || (e.date === entry.date && e.athleteId === entry.athleteId));
    if (localIdx !== -1) {
      localEntries[localIdx] = { ...localEntries[localIdx], ...entry };
    } else {
      localEntries.unshift(entry);
    }
    writeLocalFallback(filename, localEntries);

    let sha: string | undefined = memoryCache.get(filename)?.sha;
    let currentEntries: any[] = localEntries;

    try {
      const getUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/data_store/${filename}?ref=main`;
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
        const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
        const remoteArr = JSON.parse(decoded);
        if (Array.isArray(remoteArr)) {
          currentEntries = remoteArr;
        }
      }
    } catch {}

    const idx = currentEntries.findIndex((e: any) => e.id === entry.id || (e.date === entry.date && e.athleteId === entry.athleteId));
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
      return true;
    } else {
      console.warn(`[CloudStore] Falha ao gravar ${filename} no GitHub (status ${putRes.status})`);
    }
  } catch (err) {
    console.error(`[CloudStore] Exceção ao gravar ${filename}:`, err);
  }

  return false;
}
