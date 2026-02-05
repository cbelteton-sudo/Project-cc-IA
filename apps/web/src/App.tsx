import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/layout/Layout';
import { Projects } from './pages/Projects';
import { ProjectBudget } from './pages/ProjectBudget';
import { ProjectPlan } from './pages/ProjectPlan';
import { Budgets } from './pages/Budgets'; // Imported New Page
import { MaterialRequests } from './pages/MaterialRequests';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Invoices } from './pages/Invoices';
import { Field } from './pages/Field';
import { ProjectReport } from './pages/ProjectReport';
import { WhatsappSimulator } from './pages/WhatsappSimulator';
import { Dashboard } from './pages/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedRoute = () => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Layout />;
};

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/budgets" element={<Budgets />} /> {/* Added Route */}

          <Route path="/projects/:id" element={<ProjectBudget />} />
          <Route path="/projects/:id/plan" element={<ProjectPlan />} />

          <Route path="/procurement/requests" element={<MaterialRequests />} />
          <Route path="/procurement/orders" element={<PurchaseOrders />} />

          <Route path="/invoices" element={<Invoices />} />
          <Route path="/field" element={<Field />} />
          <Route path="/whatsapp" element={<WhatsappSimulator />} />
          <Route path="/reports/project/:id" element={<ProjectReport />} />

          <Route path="*" element={<div className="p-10"><h1>404 - Page Coming Soon</h1><p>This module is currently being integrated.</p></div>} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
