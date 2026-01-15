/**
 * API client for making authenticated requests to the backend
 */

import type {
  Driver,
  Milestone,
  Action,
  UserSettings,
  UpdateUserSettingsInput,
  CreateDriverInput,
  UpdateDriverInput,
  CreateMilestoneInput,
  CreateActionInput,
  DayOfWeekString,
} from '@time-management/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Settings API
export const settingsApi = {
  getSettings: () => fetchWithAuth<UserSettings>('/api/user/settings'),

  updateSettings: (data: UpdateUserSettingsInput) =>
    fetchWithAuth<UserSettings>('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Review API
export const reviewApi = {
  getStatus: () =>
    fetchWithAuth<{
      userId: string;
      reviewDay: DayOfWeekString;
      lastCompletedAt?: string;
      isDue: boolean;
    }>('/api/review/status'),

  complete: () =>
    fetchWithAuth<{ userId: string; completedAt: string; success: boolean }>(
      '/api/review/complete',
      {
        method: 'POST',
      }
    ),
};

// Driver API
export const driverApi = {
  list: (includeArchived = false) =>
    fetchWithAuth<{ drivers: Driver[]; count: number }>(
      `/api/drivers?includeArchived=${includeArchived}`
    ),

  get: (driverId: string) => fetchWithAuth<Driver>(`/api/drivers/${driverId}`),

  create: (data: CreateDriverInput) =>
    fetchWithAuth<Driver>('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (driverId: string, data: UpdateDriverInput) =>
    fetchWithAuth<Driver>(`/api/drivers/${driverId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (driverId: string) =>
    fetchWithAuth<void>(`/api/drivers/${driverId}`, {
      method: 'DELETE',
    }),
};

// Milestone API
export const milestoneApi = {
  create: (driverId: string, data: CreateMilestoneInput) =>
    fetchWithAuth<Milestone>(`/api/drivers/${driverId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Action API
export const actionApi = {
  create: (milestoneId: string, data: CreateActionInput) =>
    fetchWithAuth<Action>(`/api/milestones/${milestoneId}/actions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
