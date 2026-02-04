import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Projects } from './pages/Projects';
import { ProjectBudget } from './pages/ProjectBudget';
import { MaterialRequests } from './pages/MaterialRequests';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Invoices } from './pages/Invoices';
import { Field } from './pages/Field';
import { WhatsappSimulator } from './pages/WhatsappSimulator';
import { Dashboard } from './pages/Dashboard';
import { ProjectReport } from './pages/ProjectReport';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};



const App = () => {
  return (
    <Router />
  );
};

const Router = () => (
  <BrowserRouter>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectBudget />} />
            <Route path="procurement/requests" element={<MaterialRequests />} />
            <Route path="procurement/orders" element={<PurchaseOrders />} />
            <Route path="invoices" element={
              <ErrorBoundary>
                <Invoices />
              </ErrorBoundary>
            } />
            <Route path="field" element={<Field />} />
            <Route path="whatsapp" element={<WhatsappSimulator />} />
            <Route path="reports/project/:id" element={<ProjectReport />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="login" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </QueryClientProvider>
    </AuthProvider>
  </BrowserRouter>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
