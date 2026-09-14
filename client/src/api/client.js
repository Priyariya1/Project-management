import axios from 'axios';

const TOKEN_KEY = 'pms.token';
const USER_KEY = 'pms.user';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStorage = {
  get: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const unauthorizedHandlers = new Set();
export function onUnauthorized(handler) {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(Object.assign(new Error('The request timed out. Please try again.'), { status: 0 }));
    }
    if (!error.response) {
      return Promise.reject(
        Object.assign(new Error('Cannot reach the server. Check your connection and that the API is running.'), {
          status: 0,
        }),
      );
    }

    const { status, data } = error.response;
    const normalised = Object.assign(new Error(data?.message || 'Something went wrong'), {
      status,
      fieldErrors: Array.isArray(data?.errors)
        ? Object.fromEntries(data.errors.map((item) => [item.field, item.message]))
        : {},
    });

    const isLoginAttempt = error.config?.url?.includes('/auth/login');
    if (status === 401 && !isLoginAttempt) {
      tokenStorage.clear();
      unauthorizedHandlers.forEach((handler) => handler());
    }

    return Promise.reject(normalised);
  },
);

export default api;
