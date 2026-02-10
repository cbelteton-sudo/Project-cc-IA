import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts - Lazy Loaded
const Layout = React.lazy(() => import('./components/layout/Layout').then(m => ({ default: m.Layout })));
const FieldLayout = React.lazy(() => import('./layouts/FieldLayout'));
const PortalLayout = React.lazy(() => import('./components/layout/PortalLayout').then(m => ({ default: m.PortalLayout })));

// Pages - Lazy Loaded (Critical for crash isolation)
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Projects = React.lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const ProjectBudget = React.lazy(() => import('./pages/ProjectBudget').then(m => ({ default: m.ProjectBudget })));
const ProjectPlan = React.lazy(() => import('./pages/ProjectPlan').then(m => ({ default: m.ProjectPlan })));
const Budgets = React.lazy(() => import('./pages/Budgets').then(m => ({ default: m.Budgets })));
const MaterialRequests = React.lazy(() => import('./pages/MaterialRequests').then(m => ({ default: m.MaterialRequests })));
const PurchaseOrders = React.lazy(() => import('./pages/PurchaseOrders').then(m => ({ default: m.PurchaseOrders })));
const Invoices = React.lazy(() => import('./pages/Invoices').then(m => ({ default: m.Invoices })));

// Field Pages
const FieldDashboard = React.lazy(() => import('./pages/field/FieldDashboard').then(m => ({ default: m.FieldDashboard })));
const FieldPMDashboard = React.lazy(() => import('./pages/field/FieldPMDashboard').then(m => ({ default: m.FieldPMDashboard })));
const FieldToday = React.lazy(() => import('./pages/field/FieldToday').then(m => ({ default: m.FieldToday })));
const FieldEntryDetail = React.lazy(() => import('./pages/field/FieldEntryDetail').then(m => ({ default: m.FieldEntryDetail })));
const FieldDailySummary = React.lazy(() => import('./pages/field/FieldDailySummary').then(m => ({ default: m.FieldDailySummary })));
const ActivityUpdate = React.lazy(() => import('./pages/field/ActivityUpdate').then(m => ({ default: m.ActivityUpdate })));
const IssueTracker = React.lazy(() => import('./pages/field/IssueTracker').then(m => ({ default: m.IssueTracker })));
const DailyLogView = React.lazy(() => import('./pages/field/DailyLogView').then(m => ({ default: m.DailyLogView })));
const SyncManagerPage = React.lazy(() => import('./pages/field/SyncManagerPage').then(m => ({ default: m.SyncManagerPage })));

// Reports & Others
const ProjectReport = React.lazy(() => import('./pages/ProjectReport').then(m => ({ default: m.ProjectReport })));
const ExecutiveReport = React.lazy(() => import('./pages/ExecutiveReport').then(m => ({ default: m.ExecutiveReport })));
const PunchListPro = React.lazy(() => import('./pages/field/PunchListPro').then(m => ({ default: m.PunchListPro })));
const GeneralPunchList = React.lazy(() => import('./pages/field/GeneralPunchList').then(m => ({ default: m.GeneralPunchList })));
const PMDashboard = React.lazy(() => import('./pages/pm/PMDashboard'));
const WhatsappSimulator = React.lazy(() => import('./pages/WhatsappSimulator').then(m => ({ default: m.WhatsappSimulator })));

// Admin
const AdminUsers = React.lazy(() => import('./pages/admin/Users').then(m => ({ default: m.AdminUsers })));
const Contractors = React.lazy(() => import('./pages/admin/Contractors').then(m => ({ default: m.Contractors })));

// Portal
const PortalDashboard = React.lazy(() => import('./pages/portal/PortalDashboard').then(m => ({ default: m.PortalDashboard })));
const PortalProjects = React.lazy(() => import('./pages/portal/PortalLists').then(m => ({ default: m.PortalProjects })));
const PortalTasks = React.lazy(() => import('./pages/portal/PortalLists').then(m => ({ default: m.PortalTasks })));
const PortalOrders = React.lazy(() => import('./pages/portal/PortalLists').then(m => ({ default: m.PortalOrders })));

import { QuickCaptureProvider } from './context/QuickCaptureContext';

const ProtectedRoute = () => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <QuickCaptureProvider>
      <Layout />
    </QuickCaptureProvider>
  );
};

const Loading = () => <div className="p-10 text-center text-blue-600 animate-pulse">Cargando módulo...</div>;

function App() {
  return (
    <ErrorBoundary fallback={<div className="p-20 text-red-600 font-bold border-4 border-red-600">CRITICAL APP CRASH (App.tsx level)</div>}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/budgets" element={<Budgets />} />

            <Route path="/projects/:id" element={<ProjectBudget />} />
            <Route path="/projects/:id/plan" element={<ProjectPlan />} />
            <Route path="/projects/:id/pm" element={<PMDashboard />} />
            <Route path="/projects/:id/punch" element={<PunchListPro />} />

            <Route path="/procurement/requests" element={<MaterialRequests />} />
            <Route path="/procurement/orders" element={<PurchaseOrders />} />
            <Route path="/invoices" element={<Invoices />} />

            <Route path="/field" element={<FieldLayout />}>
              <Route index element={<Navigate to="today" replace />} />
              <Route path="dashboard" element={<FieldPMDashboard />} />
              <Route path="today" element={<FieldToday />} />
              <Route path="entry/:id" element={<FieldEntryDetail />} />
              <Route path="activity/:id/update" element={<ActivityUpdate />} />
              <Route path="issues" element={<IssueTracker />} />
              <Route path="punch-list" element={<GeneralPunchList />} />
              <Route path="daily" element={<FieldDailySummary />} />
              <Route path="logs" element={<DailyLogView />} />
              <Route path="sync" element={<SyncManagerPage />} />
            </Route>

            <Route path="/whatsapp" element={<WhatsappSimulator />} />

            <Route path="/reports/project/:id" element={<ProjectReport />} />
            <Route path="/projects/:id/report" element={<ExecutiveReport />} />

            {/* Admin Routes */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/contractors" element={<Contractors />} />

            <Route path="*" element={<div className="p-10"><h1>404 - Page Coming Soon</h1></div>} />
          </Route>

          {/* Portal Routes */}
          <Route path="/portal" element={<PortalLayout />}>
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="projects" element={<PortalProjects />} />
            <Route path="tasks" element={<PortalTasks />} />
            <Route path="orders" element={<PortalOrders />} />
            <Route path="profile" element={<div className="p-10"><h1>Perfil de Proveedor</h1></div>} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
