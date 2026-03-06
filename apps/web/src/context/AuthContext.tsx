import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

import { api, refreshSessionOnce } from '../lib/api';
import { toast } from 'sonner';

export interface User {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  contractorId?: string;
  name?: string;
  projectMembers?: ProjectMember[]; // Using defined type
}

export interface ProjectMember {
  projectId: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to prevent double execution in StrictMode
  const isCheckingRef = useRef(false);

  // Initial Auth Check using HttpOnly Cookie
  useEffect(() => {
    const checkAuth = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        console.log('AuthContext: Intentando restaurar sesión...');
        // Use single-flight refresh to verify session
        const { data } = await refreshSessionOnce();

        if (data.access_token) {
          let userData = data.user;

          if (!userData) {
            try {
              // Fallback decode
              const base64Url = data.access_token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                window
                  .atob(base64)
                  .split('')
                  .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                  })
                  .join(''),
              );
              userData = JSON.parse(jsonPayload);
            } catch (e) {
              console.error('Error al decodificar token de respaldo', e);
            }
          }

          if (userData) {
            console.log('AuthContext: Sesión restaurada para', userData.email);
            setToken(data.access_token);
            setUser(userData);
          } else {
            console.error('Token renovado pero sin usuario');
            setToken(null);
            setUser(null);
          }
        }
      } catch (e: any) {
        console.error('AuthContext: Falló checkAuth', e);
        if (e.response?.status === 401) {
          console.log('AuthContext: No previous session found or session expired (401)');
        } else {
          toast.error('Error al restaurar sesión', {
            description: `RAW ERROR: ${JSON.stringify(e.response?.data || e.message)}`,
            duration: 5000,
          });
        }
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
        isCheckingRef.current = false;
      }
    };

    checkAuth();
  }, []);

  // Use a ref to access current token in interceptors without re-registering
  const tokenRef = useRef<string | null>(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Axios Interceptors (Registered Once)
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Use ref to get current token
        const currentToken = tokenRef.current;
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip if it's already a refresh attempt or login attempt to avoid loops
        if (
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/login')
        ) {
          return Promise.reject(error);
        }

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt refresh using single-flight logic
            const { data } = await refreshSessionOnce();
            const newToken = data.access_token;
            if (data.refresh_token) {
              localStorage.setItem('fieldclose_refresh_token', data.refresh_token);
            }

            setToken(newToken);
            if (data.user) setUser(data.user);

            // Update header and retry
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Re-run the original request with the new token
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout
            setToken(null);
            setUser(null);
            localStorage.removeItem('fieldclose_refresh_token'); // Clear refresh token on refresh failure
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Run only once on mount

  const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
    setToken(newToken);
    setUser(newUser);
    if (newRefreshToken) {
      localStorage.setItem('fieldclose_refresh_token', newRefreshToken);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('fieldclose_refresh_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
