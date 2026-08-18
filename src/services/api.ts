import type { ApiConfig, MapAttempt, TelemetryEvent } from '../types/telemetry';

const STORAGE_KEYS = {
  BASE_URL: 'jsm_api_base_url',
  API_KEY: 'jsm_api_key',
  AUTO_REFRESH: 'jsm_auto_refresh',
};

export const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: '/api',
  apiKey: (import.meta.env.VITE_API_KEY as string) || 'FP+Ew+4i5aFXJRpE12sahP2WszxqdyEe8yayA20JYY8=',
  autoRefreshInterval: 30, // seconds
};

export function getStoredConfig(): ApiConfig {
  try {
    const storedBaseUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
    const storedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const storedAutoRefresh = localStorage.getItem(STORAGE_KEYS.AUTO_REFRESH);

    return {
      baseUrl: storedBaseUrl || DEFAULT_CONFIG.baseUrl,
      apiKey: storedApiKey !== null ? storedApiKey : DEFAULT_CONFIG.apiKey,
      autoRefreshInterval: storedAutoRefresh !== null ? Number(storedAutoRefresh) : DEFAULT_CONFIG.autoRefreshInterval,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveStoredConfig(config: Partial<ApiConfig>): void {
  try {
    if (config.baseUrl !== undefined) localStorage.setItem(STORAGE_KEYS.BASE_URL, config.baseUrl);
    if (config.apiKey !== undefined) localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey);
    if (config.autoRefreshInterval !== undefined) localStorage.setItem(STORAGE_KEYS.AUTO_REFRESH, String(config.autoRefreshInterval));
  } catch (err) {
    console.error('Failed to save config to localStorage', err);
  }
}

export function resetStoredConfig(): ApiConfig {
  try {
    localStorage.removeItem(STORAGE_KEYS.BASE_URL);
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.AUTO_REFRESH);
  } catch (err) {
    console.error('Failed to reset config', err);
  }
  return DEFAULT_CONFIG;
}

function resolveUrl(baseUrl: string, endpoint: string): string {
  let cleanBase = baseUrl.trim().replace(/\/$/, '');
  if (cleanBase === 'https://telemetry.japanesesalaryman.dev' || !cleanBase) {
    cleanBase = '/api';
  }
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

export async function fetchStats(config: ApiConfig): Promise<{ events: TelemetryEvent[]; error: string | null }> {
  const url = resolveUrl(config.baseUrl, 'stats');
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${errText || response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid response: Expected JSON array of events');
    }

    const normalizedEvents: TelemetryEvent[] = data.map((item: unknown) => {
      const raw = item as Record<string, unknown>;
      const rawDay = raw.day !== undefined ? raw.day : raw.game_day;
      return {
        player_id: typeof raw.player_id === 'string' ? raw.player_id.trim() : '',
        event_type: typeof raw.event_type === 'string' ? raw.event_type.trim() : 'unknown',
        timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
        day: (typeof rawDay === 'number' || typeof rawDay === 'string') ? rawDay : undefined,
      };
    });

    return { events: normalizedEvents, error: null };
  } catch (err) {
    if (url !== '/api/stats') {
      try {
        const fallbackRes = await fetch('/api/stats', { method: 'GET', headers });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (Array.isArray(data)) {
            const normalized: TelemetryEvent[] = data.map((item: unknown) => {
              const raw = item as Record<string, unknown>;
              const rawDay = raw.day !== undefined ? raw.day : raw.game_day;
              return {
                player_id: typeof raw.player_id === 'string' ? raw.player_id.trim() : '',
                event_type: typeof raw.event_type === 'string' ? raw.event_type.trim() : 'unknown',
                timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
                day: (typeof rawDay === 'number' || typeof rawDay === 'string') ? rawDay : undefined,
              };
            });
            return { events: normalized, error: null };
          }
        }
      } catch {
        // Continue
      }
    }

    const message = err instanceof Error ? err.message : 'Unknown network error';
    return { events: [], error: message };
  }
}

export async function fetchMapAttempts(config: ApiConfig): Promise<{
  attempts: MapAttempt[];
  isLive: boolean;
  error: string | null;
}> {
  const url = resolveUrl(config.baseUrl, 'map-attempts');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          attempts: data,
          isLive: true,
          error: null,
        };
      }
    }

    return {
      attempts: [],
      isLive: false,
      error: `GET /map-attempts is not live yet (HTTP ${response.status}).`,
    };
  } catch (err) {
    if (url !== '/api/map-attempts') {
      try {
        const fallbackRes = await fetch('/api/map-attempts', { method: 'GET', headers });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (Array.isArray(data)) {
            return { attempts: data, isLive: true, error: null };
          }
        }
      } catch {
        // Continue
      }
    }

    const message = err instanceof Error ? err.message : 'Connection failed';
    return {
      attempts: [],
      isLive: false,
      error: `GET /map-attempts: ${message}`,
    };
  }
}

export async function testConnection(baseUrl: string, apiKey: string): Promise<{
  statsOk: boolean;
  statsStatus: string;
  mapsOk: boolean;
  mapsStatus: string;
}> {
  let statsOk = false;
  let statsStatus = 'Untested';
  let mapsOk = false;
  let mapsStatus = 'Untested';

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  try {
    const statsUrl = resolveUrl(baseUrl, 'stats');
    const statsRes = await fetch(statsUrl, {
      method: 'GET',
      headers,
    });
    if (statsRes.ok) {
      const data = await statsRes.json();
      statsOk = true;
      statsStatus = `200 OK (${Array.isArray(data) ? data.length : 0} events)`;
    } else {
      statsStatus = `HTTP ${statsRes.status} (${statsRes.statusText})`;
    }
  } catch (err) {
    statsStatus = `Failed: ${err instanceof Error ? err.message : 'Network/CORS error'}`;
  }

  try {
    const mapsUrl = resolveUrl(baseUrl, 'map-attempts');
    const mapsRes = await fetch(mapsUrl, {
      method: 'GET',
      headers,
    });
    if (mapsRes.ok) {
      const data = await mapsRes.json();
      mapsOk = true;
      mapsStatus = `200 OK (${Array.isArray(data) ? data.length : 0} records)`;
    } else {
      mapsStatus = `HTTP ${mapsRes.status} (Not live yet)`;
    }
  } catch (err) {
    mapsStatus = `Failed: ${err instanceof Error ? err.message : 'Network/CORS error'}`;
  }

  return { statsOk, statsStatus, mapsOk, mapsStatus };
}
