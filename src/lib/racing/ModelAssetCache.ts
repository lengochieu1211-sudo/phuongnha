/**
 * Persistent raw model cache for large FBX/GLB assets.
 * Cache Storage survives page reloads and lets the game reuse model bytes locally.
 * Parsing still happens in Three.js, so this removes network cost but does not pretend
 * that a 20 MB ASCII FBX becomes free to parse.
 */

const CACHE_NAME = 'phuong-nha-model-assets-v5.41';
const CACHE_PREFIX = 'phuong-nha-model-assets-';

function canUseCacheStorage(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

function absoluteUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  return new URL(url, window.location.href).href;
}

async function openModelCache(): Promise<Cache | null> {
  if (!canUseCacheStorage()) return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

/** Remove old model-pack cache namespaces after an app upgrade. */
export async function cleanupOldModelCaches(): Promise<void> {
  if (!canUseCacheStorage()) return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    );
  } catch {
    // Storage can be disabled by private browsing / browser policy.
  }
}


/** Ask the browser to make cached model data less likely to be evicted. */
export async function requestPersistentModelStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function isModelAssetCached(url: string): Promise<boolean> {
  const cache = await openModelCache();
  if (!cache) return false;
  try {
    return Boolean(await cache.match(absoluteUrl(url)));
  } catch {
    return false;
  }
}

/**
 * Return model bytes, preferring the persistent local cache.
 * On first use the network response is written into Cache Storage before parsing.
 */
export async function getModelAssetArrayBuffer(url: string): Promise<ArrayBuffer> {
  const resolved = absoluteUrl(url);
  const cache = await openModelCache();

  if (cache) {
    try {
      const cached = await cache.match(resolved);
      if (cached) return await cached.arrayBuffer();
    } catch {
      // Fall through to network.
    }
  }

  const response = await fetch(resolved, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Model download failed: HTTP ${response.status}`);

  if (cache) {
    try {
      await cache.put(resolved, response.clone());
    } catch {
      // Quota/full storage must never stop gameplay; parse the network response anyway.
    }
  }

  return await response.arrayBuffer();
}

/** Download one model into persistent local storage without parsing it. */
export async function cacheModelAsset(url: string): Promise<boolean> {
  const resolved = absoluteUrl(url);
  const cache = await openModelCache();
  if (!cache) {
    // Still warm normal HTTP cache when Cache Storage is unavailable. Consume the
    // whole body so the browser is allowed to retain the completed response.
    const response = await fetch(resolved, { cache: 'force-cache' });
    if (!response.ok) return false;
    await response.arrayBuffer();
    return true;
  }

  try {
    if (await cache.match(resolved)) return true;
    const response = await fetch(resolved, { cache: 'force-cache' });
    if (!response.ok) return false;
    await cache.put(resolved, response.clone());
    // Ensure the body was actually consumed before declaring the item ready.
    await response.arrayBuffer();
    return true;
  } catch {
    return false;
  }
}

export interface ModelPackProgress {
  done: number;
  total: number;
  currentUrl: string;
  ok: boolean;
}

/**
 * Download a pack serially. Serial transfer is deliberate: starting many 20 MB FBXs at
 * once spikes RAM and can freeze Android WebView / Mi Box.
 */
export async function cacheModelPack(
  urls: string[],
  onProgress?: (progress: ModelPackProgress) => void,
): Promise<{ ok: number; failed: number }> {
  const unique = Array.from(new Set(urls.map(absoluteUrl)));
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < unique.length; i += 1) {
    const currentUrl = unique[i];
    const success = await cacheModelAsset(currentUrl);
    if (success) ok += 1;
    else failed += 1;
    onProgress?.({ done: i + 1, total: unique.length, currentUrl, ok: success });
  }

  return { ok, failed };
}

export async function getCachedModelCount(urls: string[]): Promise<number> {
  const cache = await openModelCache();
  if (!cache) return 0;
  let count = 0;
  for (const url of Array.from(new Set(urls.map(absoluteUrl)))) {
    try {
      if (await cache.match(url)) count += 1;
    } catch {
      // Ignore one bad entry.
    }
  }
  return count;
}

export async function clearPersistentModelCache(): Promise<boolean> {
  if (!canUseCacheStorage()) return false;
  try {
    return await caches.delete(CACHE_NAME);
  } catch {
    return false;
  }
}

export function supportsPersistentModelCache(): boolean {
  return canUseCacheStorage();
}
