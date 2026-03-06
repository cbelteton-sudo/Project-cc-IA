import axios from 'axios';

// Create a dedicated Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Single-flight refresh logic
let refreshPromise: Promise<any> | null = null;
const isRefreshing = false;

export const refreshSessionOnce = async () => {
  if (refreshPromise) return refreshPromise;

  const localRefreshToken = localStorage.getItem('fieldclose_refresh_token');

  refreshPromise = api
    .post('/auth/refresh', { refreshToken: localRefreshToken })
    .then((res) => {
      refreshPromise = null;
      return res;
    })
    .catch((err) => {
      refreshPromise = null;
      throw err;
    });

  return refreshPromise;
};
