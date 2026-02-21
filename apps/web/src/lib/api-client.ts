/**
 * API client for making authenticated requests to the backend
 */

export type DayOfWeekString =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type ActionStatus = 'not-started' | 'in-progress' | 'complete' | 'canceled' | 'carried-over';

export interface UserSettings {
  userId: string;
  reviewDay: DayOfWeekString;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserSettingsInput {
  reviewDay: DayOfWeekString;
}

export interface Driver {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverInput {
  title: string;
  description?: string;
}

export interface UpdateDriverInput {
  title?: string;
  description?: string;
  isArchived?: boolean;
}

export interface Milestone {
  id: string;
  userId: string;
  driverId: string;
  title: string;
  description?: string;
  targetDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  targetDate?: string;
}

export interface Action {
  id: string;
  userId: string;
  driverId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: ActionStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionInput {
  title: string;
  description?: string;
  parentMilestoneId?: string;
  estimatedMinutes?: number;
  trigger?: string;
  status?: ActionStatus;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  completedAt?: string;
  archived?: boolean;
}

export interface UpdateActionInput {
  title?: string;
  description?: string;
  estimatedMinutes?: number;
  trigger?: string;
  status?: ActionStatus;
  completedAt?: string;
  archived?: boolean;
}

export interface Edge {
  PK: string;
  SK: string;
  parentNodeId: string;
  childNodeId: string;
  order: number;
  createdAt?: string;
}

export interface ValuesHierarchy {
  nodes: Array<Driver | Milestone | Action>;
  edges: Edge[];
  drivers: Driver[];
  milestones: Milestone[];
  actions: Action[];
}

const API_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: Record<string, unknown> = {}
): Promise<T> {
  const tokensJson = localStorage.getItem('auth_tokens');
  const tokens = tokensJson ? JSON.parse(tokensJson) : null;
  const token = tokens?.idToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
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
    fetchWithAuth<{ completedAt: string }>('/api/reviews/complete', {
      method: 'POST',
    }),

  getLastReview: () => fetchWithAuth<{ lastReviewDate: string | null }>('/api/reviews/last'),
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

  update: (milestoneId: string, data: UpdateMilestoneInput) =>
    fetchWithAuth<Milestone>(`/api/milestones/${milestoneId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (milestoneId: string) =>
    fetchWithAuth<void>(`/api/milestones/${milestoneId}`, {
      method: 'DELETE',
    }),
};

// Action API
export const actionApi = {
  create: (driverId: string, data: CreateActionInput) =>
    fetchWithAuth<Action>(`/api/drivers/${driverId}/actions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (actionId: string, data: UpdateActionInput) =>
    fetchWithAuth<Action>(`/api/actions/${actionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (actionId: string) =>
    fetchWithAuth<void>(`/api/actions/${actionId}`, {
      method: 'DELETE',
    }),

  convertToMilestone: (actionId: string) =>
    fetchWithAuth<Milestone>(`/api/actions/${actionId}/convert-to-milestone`, {
      method: 'POST',
    }),
};

// Values API
export const valuesApi = {
  getHierarchy: () => fetchWithAuth<ValuesHierarchy>('/api/values/hierarchy'),
};

// Onboarding API
export const onboardingApi = {
  getStatus: () =>
    fetchWithAuth<{
      userId: string;
      isOnboarded: boolean;
      onboardingVersion?: string;
      completedAt?: string;
      requiresOnboarding: boolean;
    }>('/api/user/onboarding/status'),

  initialize: () =>
    fetchWithAuth<{
      message: string;
      drivers: unknown[];
      milestones: unknown[];
      actions: unknown[];
    }>('/api/user/onboarding/initialize', {
      method: 'POST',
    }),

  reset: () =>
    fetchWithAuth<{
      message: string;
      deletedItems: number;
      onboardingResult: unknown;
    }>('/api/user/onboarding/reset', {
      method: 'POST',
    }),
};
