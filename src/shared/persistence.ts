/**
 * Tiny localStorage helpers. Every read/write is wrapped in try/catch so
 * SSR and incognito environments degrade gracefully.
 */

export function loadHiScore(key: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const v = window.localStorage.getItem(key);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveHiScore(key: string, hi: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, String(hi));
  } catch {
    /* ignore */
  }
}

export function loadAchievements<T extends string>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as T[]) : [];
  } catch {
    return [];
  }
}

export function saveAchievements<T extends string>(key: string, ids: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
