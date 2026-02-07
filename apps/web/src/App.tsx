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

import FieldLayout from './layouts/FieldLayout';
import { FieldDashboard } from './pages/field/FieldDashboard';
import { FieldToday } from './pages/field/FieldToday';
import { FieldEntryDetail } from './pages/field/FieldEntryDetail';
import { FieldDailySummary } from './pages/field/FieldDailySummary';
import { ActivityUpdate } from './pages/field/ActivityUpdate';
import { IssueTracker } from './pages/field/IssueTracker';
import { DailyLogView } from './pages/field/DailyLogView';
import { ProjectReport } from './pages/ProjectReport';
import { WhatsappSimulator } from './pages/WhatsappSimulator';
import { Dashboard } from './pages/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { Contractors } from './pages/admin/Contractors';
import { PortalLayout } from './components/layout/PortalLayout';
import { PortalDashboard } from './pages/portal/PortalDashboard';
import { PortalProjects, PortalTasks, PortalOrders } from './pages/portal/PortalLists';
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


          <Route path="/field" element={<FieldLayout />}>
            <Route index element={<Navigate to="today" replace />} />
            <Route path="today" element={<FieldToday />} />
            <Route path="entry/:id" element={<FieldEntryDetail />} />
            <Route path="activity/:id/update" element={<ActivityUpdate />} />
            <Route path="issues" element={<IssueTracker />} />
            <Route path="daily" element={<FieldDailySummary />} />
            <Route path="logs" element={<DailyLogView />} />
          </Route>

          <Route path="/whatsapp" element={<WhatsappSimulator />} />

          <Route path="/reports/project/:id" element={<ProjectReport />} />

          {/* Admin Routes */}
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/contractors" element={<Contractors />} />



          <Route path="*" element={<div className="p-10"><h1>404 - Page Coming Soon</h1><p>This module is currently being integrated.</p></div>} />
        </Route>

        {/* Portal Routes (Scoped Layout) */}
        <Route path="/portal" element={<PortalLayout />}>
          <Route path="dashboard" element={<PortalDashboard />} />
          <Route path="projects" element={<PortalProjects />} />
          <Route path="tasks" element={<PortalTasks />} />
          <Route path="orders" element={<PortalOrders />} />
          <Route path="profile" element={<div className="p-10"><h1>Perfil de Proveedor</h1><p>Gestión de ficha técnica aquí.</p></div>} />
        </Route>

      </Routes>
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
