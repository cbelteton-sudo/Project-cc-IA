import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts - Lazy Loaded
const Layout = React.lazy(() =>
  import('./components/layout/Layout').then((m) => ({ default: m.Layout })),
);
const FieldLayout = React.lazy(() => import('./layouts/FieldLayout'));
const PortalLayout = React.lazy(() =>
  import('./components/layout/PortalLayout').then((m) => ({ default: m.PortalLayout })),
);

// Pages - Lazy Loaded (Critical for crash isolation)
const AcceptInvite = React.lazy(() => import('./pages/AcceptInvite'));

const Login = React.lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const Projects = React.lazy(() =>
  import('./pages/Projects').then((m) => ({ default: m.Projects })),
);

// Project Context Pages
const ProjectOverview = React.lazy(() =>
  import('./pages/project/ProjectOverview').then((m) => ({ default: m.ProjectOverview })),
);
const ProjectTeam = React.lazy(() =>
  import('./pages/project/ProjectTeam').then((m) => ({ default: m.ProjectTeam })),
);
const ProjectContractors = React.lazy(() =>
  import('./pages/project/ProjectContractors').then((m) => ({ default: m.ProjectContractors })),
);
const ProjectSettings = React.lazy(() =>
  import('./pages/project/ProjectSettings').then((m) => ({ default: m.ProjectSettings })),
);
const ProjectActivity = React.lazy(() =>
  import('./pages/project/ProjectActivity').then((m) => ({ default: m.ProjectActivity })),
);

const ProjectBudget = React.lazy(() =>
  import('./pages/ProjectBudget').then((m) => ({ default: m.ProjectBudget })),
);
const ProjectPlan = React.lazy(() =>
  import('./pages/ProjectPlan').then((m) => ({ default: m.ProjectPlan })),
);
const Budgets = React.lazy(() => import('./pages/Budgets').then((m) => ({ default: m.Budgets })));
const MaterialRequests = React.lazy(() =>
  import('./pages/MaterialRequests').then((m) => ({ default: m.MaterialRequests })),
);
const PurchaseOrders = React.lazy(() =>
  import('./pages/PurchaseOrders').then((m) => ({ default: m.PurchaseOrders })),
);
const Invoices = React.lazy(() =>
  import('./pages/Invoices').then((m) => ({ default: m.Invoices })),
);
const ChangeOrders = React.lazy(() =>
  import('./pages/ChangeOrders').then((m) => ({ default: m.ChangeOrders })),
);

// Field Pages
const FieldPMDashboard = React.lazy(() =>
  import('./pages/field/FieldPMDashboard').then((m) => ({ default: m.FieldPMDashboard })),
);
const FieldToday = React.lazy(() =>
  import('./pages/field/FieldToday').then((m) => ({ default: m.FieldToday })),
);
const FieldEntryDetail = React.lazy(() =>
  import('./pages/field/FieldEntryDetail').then((m) => ({ default: m.FieldEntryDetail })),
);
const FieldDailySummary = React.lazy(() =>
  import('./pages/field/FieldDailySummary').then((m) => ({ default: m.FieldDailySummary })),
);
const ActivityUpdate = React.lazy(() =>
  import('./pages/field/ActivityUpdate').then((m) => ({ default: m.ActivityUpdate })),
);
const IssueTracker = React.lazy(() =>
  import('./pages/field/IssueTracker').then((m) => ({ default: m.IssueTracker })),
);
const DailyLogView = React.lazy(() =>
  import('./pages/field/DailyLogView').then((m) => ({ default: m.DailyLogView })),
);
const SyncManagerPage = React.lazy(() =>
  import('./pages/field/SyncManagerPage').then((m) => ({ default: m.SyncManagerPage })),
);
const RecordDetailView = React.lazy(() => import('./pages/field/RecordDetailView'));

// Reports & Others
const ReportsHub = React.lazy(() =>
  import('./pages/ReportsHub').then((m) => ({ default: m.ReportsHub })),
);
const ReportsView = React.lazy(() =>
  import('./pages/ReportsView').then((m) => ({ default: m.ReportsView })),
);

const ExecutiveReport = React.lazy(() =>
  import('./pages/ExecutiveReport').then((m) => ({ default: m.ExecutiveReport })),
);
const SprintAssignmentsReport = React.lazy(() =>
  import('./pages/SprintAssignmentsReport').then((m) => ({ default: m.SprintAssignmentsReport })),
);
const PunchListPro = React.lazy(() =>
  import('./pages/field/PunchListPro').then((m) => ({ default: m.PunchListPro })),
);
const GeneralPunchList = React.lazy(() =>
  import('./pages/field/GeneralPunchList').then((m) => ({ default: m.GeneralPunchList })),
);
const PMDashboard = React.lazy(() => import('./pages/pm/PMDashboard'));
const WhatsappSimulator = React.lazy(() =>
  import('./pages/WhatsappSimulator').then((m) => ({ default: m.WhatsappSimulator })),
);
const ScrumProjects = React.lazy(() =>
  import('./pages/ScrumProjects').then((m) => ({ default: m.ScrumProjects })),
);
const ScrumPage = React.lazy(() =>
  import('./pages/ScrumPage').then((m) => ({ default: m.ScrumPage })),
);

// Admin
const AdminUsers = React.lazy(() =>
  import('./pages/admin/Users').then((m) => ({ default: m.AdminUsers })),
);
const Contractors = React.lazy(() =>
  import('./pages/admin/Contractors').then((m) => ({ default: m.Contractors })),
);

// Portal
const PortalDashboard = React.lazy(() =>
  import('./pages/portal/PortalDashboard').then((m) => ({ default: m.PortalDashboard })),
);
const PortalProjects = React.lazy(() =>
  import('./pages/portal/PortalLists').then((m) => ({ default: m.PortalProjects })),
);
const PortalTasks = React.lazy(() =>
  import('./pages/portal/PortalLists').then((m) => ({ default: m.PortalTasks })),
);
const PortalOrders = React.lazy(() =>
  import('./pages/portal/PortalLists').then((m) => ({ default: m.PortalOrders })),
);

import { QuickCaptureProvider } from './context/QuickCaptureContext';

const ProtectedRoute = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!token) return <Navigate to="/login" replace />;
  return (
    <QuickCaptureProvider>
      <Layout />
    </QuickCaptureProvider>
  );
};

const Loading = () => (
  <div className="p-10 text-center text-blue-600 animate-pulse">Cargando módulo...</div>
);

function App() {
  const API_URL = import.meta.env.VITE_API_URL;

  if (!API_URL) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-900/90 text-white p-4">
        <div className="max-w-md bg-black p-6 rounded-lg border-2 border-red-500 shadow-2xl">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="mb-4">
            The environment variable{' '}
            <code className="bg-red-800 px-1 py-0.5 rounded">VITE_API_URL</code> is missing.
          </p>
          <p className="text-sm opacity-80">
            Please create a <code className="bg-gray-800 px-1 py-0.5 rounded">.env</code> file in
            the web folder with:
            <br />
            <span className="block mt-2 bg-gray-900 p-2 rounded font-mono">
              VITE_API_URL=http://localhost:4180/api
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-20 text-red-600 font-bold border-4 border-red-600">
          CRITICAL APP CRASH (App.tsx level)
        </div>
      }
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route element={<ProtectedRoute />}>
            {/* ORGANIZATION CONTEXT */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/budgets" element={<Budgets />} />

            <Route path="/procurement/requests" element={<MaterialRequests />} />
            <Route path="/procurement/orders" element={<PurchaseOrders />} />
            <Route path="/invoices" element={<Invoices />} />

            {/* PROJECT CONTEXT */}
            <Route path="/projects/:id" element={<Navigate to="overview" replace />} />
            <Route path="/projects/:id/overview" element={<ProjectOverview />} />
            <Route path="/projects/:id/budget" element={<ProjectBudget />} />
            <Route path="/projects/:id/plan" element={<ProjectPlan />} />
            <Route path="/projects/:id/team" element={<ProjectTeam />} />
            <Route path="/projects/:id/contractors" element={<ProjectContractors />} />
            <Route path="/projects/:id/activity" element={<ProjectActivity />} />
            <Route path="/projects/:id/settings" element={<ProjectSettings />} />

            {/* Existing Project Routes Mapped */}
            <Route path="/projects/:id/reports" element={<ReportsView />} />
            <Route path="/projects/:id/change-orders" element={<ChangeOrders />} />
            <Route path="/projects/:id/pm" element={<PMDashboard />} />
            <Route path="/projects/:id/punch" element={<PunchListPro />} />

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
              <Route path="records/:id" element={<RecordDetailView />} />
            </Route>

            <Route path="/whatsapp" element={<WhatsappSimulator />} />

            {/* Route removed: ProjectReport */}
            <Route path="/projects/:id/report" element={<ExecutiveReport />} />
            <Route path="/projects/:id/sprint-assignments" element={<SprintAssignmentsReport />} />

            {/* Scrum Module */}
            <Route path="/scrum" element={<ScrumProjects />} />
            <Route path="/scrum/:projectId" element={<ScrumPage />} />

            {/* Admin Routes */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/contractors" element={<Contractors />} />

            {/* Reports Hub */}
            <Route path="/reports" element={<ReportsHub />} />

            <Route
              path="*"
              element={
                <div className="p-10">
                  <h1>404 - Page Coming Soon</h1>
                </div>
              }
            />
          </Route>

          {/* Portal Routes */}
          <Route path="/portal" element={<PortalLayout />}>
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="projects" element={<PortalProjects />} />
            <Route path="tasks" element={<PortalTasks />} />
            <Route path="orders" element={<PortalOrders />} />
            <Route
              path="profile"
              element={
                <div className="p-10">
                  <h1>Perfil de Proveedor</h1>
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
