import axios, { type AxiosResponse } from 'axios';

// Create a dedicated Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Single-flight refresh logic
let refreshPromise: Promise<AxiosResponse> | null = null;

export const refreshSessionOnce = async () => {
  if (refreshPromise) return refreshPromise;

  const localRefreshToken = localStorage.getItem('fieldclose_refresh_token');

  refreshPromise = api
    .post('/auth/refresh', { refreshToken: localRefreshToken })
    .then((res) => {
      // Store token immediately to avoid race conditions
      if (res.data?.refresh_token) {
        localStorage.setItem('fieldclose_refresh_token', res.data.refresh_token);
      }

      // Delay clearing the promise to allow trailing 401 errors from the same
      // failing batch to piggyback instead of triggering a consecutive refresh rotation.
      setTimeout(() => {
        refreshPromise = null;
      }, 2000);

      return res;
    })
    .catch((err) => {
      refreshPromise = null;
      throw err;
    });

  return refreshPromise;
};
