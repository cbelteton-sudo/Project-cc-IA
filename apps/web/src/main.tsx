import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import './i18n';
import './index.css';

// Lazy Load Everything to catch import errors
const AuthProvider = React.lazy(() => import('./context/AuthContext').then(m => ({ default: m.AuthProvider })));
const RegionProvider = React.lazy(() => import('./context/RegionContext').then(m => ({ default: m.RegionProvider })));
const NetworkProvider = React.lazy(() => import('./context/NetworkContext').then(m => ({ default: m.NetworkProvider })));
const App = React.lazy(() => import('./App'));

const queryClient = new QueryClient();

const Loading = () => <div className="p-10 text-blue-600">Loading Modules...</div>;

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                <AuthProvider>
                  <ErrorBoundary>
                    <RegionProvider>
                      <ErrorBoundary>
                        <NetworkProvider>
                          <ErrorBoundary>
                            <App />
                          </ErrorBoundary>
                        </NetworkProvider>
                      </ErrorBoundary>
                    </RegionProvider>
                  </ErrorBoundary>
                </AuthProvider>
              </ErrorBoundary>
            </Suspense>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
} catch (e) {
  document.body.innerHTML += `<div style="color:red; font-size:20px;">REACT RENDER CRASH: ${e}</div>`;
}
