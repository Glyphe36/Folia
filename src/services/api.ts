import { Plant, CareLog, UserProfile, ReminderPreferences, CareType } from '../types/plant';

// URL par défaut demandée : VITE_API_URL=http://192.168.1.157:3001/api
const ENV_API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.157:3001/api';
const LOCAL_STORAGE_KEY = 'folia_api_url_override';

let activeFallbackUrl: string | null = null;
let lastKnownHealth: {
  connected: boolean;
  url: string;
  isFallback: boolean;
  database?: string;
  phpVersion?: string;
  counts?: { plants: number; careLogs: number; users: number };
  timestamp?: string;
  error?: string;
} | null = null;

export function getTargetApiUrl(): string {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (override && override.trim()) {
      return override.trim().replace(/\/+$/, '');
    }
  }
  return ENV_API_URL.replace(/\/+$/, '');
}

export function setCustomApiUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url.trim() || url === ENV_API_URL) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
    }
    activeFallbackUrl = null;
  }
}

export function resetCustomApiUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    activeFallbackUrl = null;
  }
}

export function getActiveApiUrl(): string {
  if (activeFallbackUrl) {
    return activeFallbackUrl;
  }
  return getTargetApiUrl();
}

/**
 * Exécute une requête avec bascule transparente vers l'API locale /api
 * si l'IP distante 192.168.1.157:3001 est inaccessible (ex. Mixed Content en prévisualisation HTTPS)
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const targetBase = getTargetApiUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Déterminer la première URL à essayer
  const primaryUrl = activeFallbackUrl
    ? `${activeFallbackUrl}${normalizedEndpoint}`
    : `${targetBase}${normalizedEndpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(primaryUrl, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (primaryErr: any) {
    // Si l'erreur est un échec réseau (ex. 192.168.1.157 injoignable ou Mixed Content bloqué par le navigateur)
    // et que nous n'étions pas déjà sur le fallback /api, tenter la route locale /api du conteneur
    if (!activeFallbackUrl && targetBase !== '/api' && !targetBase.endsWith('/api') || primaryErr.name === 'TypeError') {
      const fallbackBase = '/api';
      const fallbackUrl = `${fallbackBase}${normalizedEndpoint}`;
      try {
        console.warn(
          `[Folia API] Serveur cible (${targetBase}) inaccessible : "${primaryErr.message}". Bascule automatique sur l'API locale PHP/SQLite (/api)...`
        );
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
          headers,
        });

        if (fallbackRes.ok) {
          activeFallbackUrl = fallbackBase;
          return (await fallbackRes.json()) as T;
        }
      } catch {
        // Ignorer l'erreur du fallback et renvoyer l'erreur originelle
      }
    }

    throw primaryErr;
  }
}

export const plantApi = {
  // Statut & Santé
  async checkHealth() {
    try {
      const data = await request<any>('/health');
      lastKnownHealth = {
        connected: true,
        url: getActiveApiUrl(),
        isFallback: activeFallbackUrl !== null,
        database: data.database,
        phpVersion: data.phpVersion,
        counts: data.counts,
        timestamp: data.timestamp,
      };
      return lastKnownHealth;
    } catch (err: any) {
      lastKnownHealth = {
        connected: false,
        url: getTargetApiUrl(),
        isFallback: false,
        error: err.message,
      };
      return lastKnownHealth;
    }
  },

  getLastKnownHealth() {
    return lastKnownHealth;
  },

  // Plantes
  async getPlants(): Promise<Plant[]> {
    return request<Plant[]>('/plants');
  },

  async getPlant(id: string): Promise<Plant> {
    return request<Plant>(`/plants/${encodeURIComponent(id)}`);
  },

  async createPlant(plant: Omit<Plant, 'id' | 'addedDate'>): Promise<Plant> {
    return request<Plant>('/plants', {
      method: 'POST',
      body: JSON.stringify(plant),
    });
  },

  async updatePlant(id: string, updates: Partial<Plant>): Promise<Plant> {
    return request<Plant>(`/plants/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deletePlant(id: string): Promise<void> {
    await request<void>(`/plants/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async toggleFavorite(id: string): Promise<Plant> {
    return request<Plant>(`/plants/${encodeURIComponent(id)}/favorite`, {
      method: 'PATCH',
    });
  },

  async waterPlant(
    id: string,
    performedBy?: string,
    amountOrDetails?: string,
    notes?: string
  ): Promise<{ plant: Plant; log: CareLog }> {
    return request<{ plant: Plant; log: CareLog }>(`/plants/${encodeURIComponent(id)}/water`, {
      method: 'POST',
      body: JSON.stringify({ performedBy, amountOrDetails, notes }),
    });
  },

  async mistPlant(
    id: string,
    performedBy?: string,
    amountOrDetails?: string,
    notes?: string
  ): Promise<{ plant: Plant; log: CareLog }> {
    return request<{ plant: Plant; log: CareLog }>(`/plants/${encodeURIComponent(id)}/mist`, {
      method: 'POST',
      body: JSON.stringify({ performedBy, amountOrDetails, notes }),
    });
  },

  async fertilizePlant(
    id: string,
    performedBy?: string,
    amountOrDetails?: string,
    notes?: string
  ): Promise<{ plant: Plant; log: CareLog }> {
    return request<{ plant: Plant; log: CareLog }>(`/plants/${encodeURIComponent(id)}/fertilize`, {
      method: 'POST',
      body: JSON.stringify({ performedBy, amountOrDetails, notes }),
    });
  },

  // Journal des soins
  async getLogs(plantId?: string, limit?: number): Promise<CareLog[]> {
    const params = new URLSearchParams();
    if (plantId) params.append('plantId', plantId);
    if (limit) params.append('limit', String(limit));
    const qs = params.toString();
    return request<CareLog[]>(`/logs${qs ? `?${qs}` : ''}`);
  },

  async createLog(data: {
    plantId: string;
    type: CareType;
    amountOrDetails?: string;
    performedBy?: string;
    notes?: string;
    date?: string;
  }): Promise<CareLog> {
    return request<CareLog>('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteLog(id: string): Promise<void> {
    await request<void>(`/logs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Utilisateurs
  async getUsers(): Promise<UserProfile[]> {
    return request<UserProfile[]>('/users');
  },

  async createUser(name: string, role: UserProfile['role'] = 'Secondaire'): Promise<UserProfile> {
    return request<UserProfile>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, role }),
    });
  },

  async deleteUser(id: string): Promise<void> {
    await request<void>(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Préférences
  async getPreferences(): Promise<ReminderPreferences> {
    return request<ReminderPreferences>('/preferences');
  },

  async updatePreferences(updates: Partial<ReminderPreferences>): Promise<ReminderPreferences> {
    return request<ReminderPreferences>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Checks quotidiens
  async getCompletedChecks(): Promise<{ date: string; completedCheckIds: string[] }> {
    return request<{ date: string; completedCheckIds: string[] }>('/checks/completed');
  },

  async completeCheck(checkId: string): Promise<{ success: boolean; checkId: string }> {
    return request<{ success: boolean; checkId: string }>('/checks/complete', {
      method: 'POST',
      body: JSON.stringify({ checkId }),
    });
  },

  // Sauvegarde & Restauration
  async exportData(): Promise<any> {
    return request<any>('/backup/export');
  },

  async importData(payload: any): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/backup/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async resetData(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/backup/reset', {
      method: 'POST',
    });
  },
};
