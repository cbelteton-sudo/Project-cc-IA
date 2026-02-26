import axios from 'axios';

// Create a dedicated Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Single-flight refresh logic
let refreshPromise: Promise<any> | null = null;

export const refreshSessionOnce = async () => {
  // If a refresh is already in progress, return the existing promise
  if (refreshPromise) {
    return refreshPromise;
  }

  // Otherwise, start a new refresh request
  refreshPromise = api
    .post('/auth/refresh')
    .then((res) => {
      refreshPromise = null; // Clear promise on success
      return res;
    })
    .catch((err) => {
      refreshPromise = null; // Clear promise on error
      throw err;
    });

  return refreshPromise;
};
