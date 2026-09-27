import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL) ||
  '/api';

export const TOKEN_STORAGE_KEY = 'GoFlexi_access_token';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

export interface ApiError {
  message: string;
  status: number;
  isNetworkError: boolean;
}

export const isApiError = (e: unknown): e is ApiError =>
  typeof e === 'object' && e !== null && 'isNetworkError' in e;

export const parseApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;

    if (!axiosErr.response) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      return {
        message: isOffline ? 'You are offline. Please reconnect to continue.' : 'Unable to connect to server',
        status: 0,
        isNetworkError: true,
      };
    }

    const status = axiosErr.response.status;
    const data = axiosErr.response.data as
      | { detail?: string | Array<{ msg?: string }> }
      | undefined;

    let message: string;
    if (data && typeof data.detail === 'string') {
      message = data.detail;
    } else if (data && Array.isArray(data.detail)) {
      message = data.detail
        .map((d) => (d && typeof d.msg === 'string' ? d.msg : 'validation error'))
        .join(', ');
    } else {
      message = axiosErr.message;
    }

    return { message, status, isNetworkError: false };
  }

  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    status: 0,
    isNetworkError: false,
  };
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const hasAuthToken = (): boolean => !!getAuthToken();
