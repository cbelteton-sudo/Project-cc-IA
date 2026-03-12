import React, { useState } from 'react';
import { Outlet, Link, useLocation, matchPath } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings, LogOut } from 'lucide-react';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../common/NotificationBell';
import { QuickCaptureModal } from '../field/QuickCaptureModal';
import { getNavItems } from '../../config/navigation';
import { useProjects } from '../../hooks/useProjects';
import { ContextSwitcher } from './ContextSwitcher';
import { LogoIcon } from '../common/LogoIcon';
import { useEffect } from 'react';
import { api } from '../../lib/api';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active: boolean;
}

const SidebarItem = ({
  to,
  icon: Icon,
  label,
  collapsed,
  active,
  onClick,
}: SidebarItemProps & { onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
      active
        ? 'bg-brand-ambar/10 text-brand-ambar font-semibold'
        : 'text-slate-300 hover:bg-brand-acero/50 hover:text-white font-medium'
    } ${collapsed ? 'justify-center' : ''}`}
    title={collapsed ? label : ''}
  >
    <Icon
      size={20}
      className={`shrink-0 ${active ? 'text-brand-ambar' : 'text-slate-400 group-hover:text-slate-300'}`}
    />
    {!collapsed && <span className="text-sm truncate">{label}</span>}
  </Link>
);

export const Layout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const match = matchPath({ path: '/projects/:id/*' }, location.pathname);
  const projectId = match?.params.id;

  const { data: projects } = useProjects();
  const currentProject = React.useMemo(() => {
    if (!projects || !projectId) return null;
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('');

  useEffect(() => {
    if (user?.tenantId) {
      api
        .get('/tenants/current')
        .then((res) => {
          const data = res.data;
          if (data?.logoUrl) {
            setTenantLogo(data.logoUrl);
          }
          if (data?.name) {
            setTenantName(data.name);
          }
        })
        .catch((err) => console.error('Error loading tenant details', err));
    }
  }, [user?.tenantId]);

  const navSections = getNavItems(user, projectId, currentProject);

  // Check if current user is ONLY an operator in this project
  const projectMembership = projectId
    ? user?.projectMembers?.find((m) => m.projectId === projectId)
    : null;
  const isOperator = projectMembership?.role === 'FIELD_OPERATOR';

  // Determine if strictly field user
  const isGlobalStaff = user ? ['ADMIN', 'ORG_ADMIN', 'PLATFORM_ADMIN'].includes(user.role) : false;
  const isStrictlyFieldUser =
    user &&
    !isGlobalStaff &&
    user.projectMembers &&
    user.projectMembers.length > 0 &&
    user.projectMembers.every((m) => ['FIELD_OPERATOR', 'RESIDENTE'].includes(m.role));

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden for strictly field users */}
      {!isStrictlyFieldUser && (
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${collapsed ? 'w-20' : 'w-64'} fixed md:relative inset-y-0 left-0 bg-brand-pizarra border-r border-brand-acero flex flex-col print:hidden transition-transform duration-300 z-40 h-screen`}
        >
          {/* Toggle Button (Desktop Only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex absolute -right-3 top-6 bg-brand-acero border border-brand-pizarra rounded-full p-1 text-slate-300 hover:text-white z-50 shadow-sm transition-colors hover:shadow"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div
            className={`h-16 flex items-center ${collapsed ? 'justify-center px-0' : 'px-6'} border-b border-brand-acero bg-brand-pizarra transition-all shrink-0`}
          >
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {tenantLogo ? (
                <img src={tenantLogo} alt="Logo" className="w-8 h-8 object-contain shrink-0" />
              ) : (
                <LogoIcon className="w-8 h-8 shrink-0" />
              )}
              {!collapsed && !tenantLogo && (
                <span className="text-xl tracking-tight flex items-center">
                  <span
                    className="text-white"
                    style={{
                      fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                      fontWeight: '400',
                    }}
                  >
                    Field
                  </span>
                  <span
                    className="text-brand-ambar"
                    style={{ fontFamily: '"Mangal Pro", Mangal, sans-serif', fontWeight: 'bold' }}
                  >
                    Close
                  </span>
                </span>
              )}
              {collapsed && <span className="sr-only">FIELDCLOSE</span>}
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden min-h-0">
            {projectId && !isOperator && (
              <div className="mb-6">
                <Link
                  to="/projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-slate-300 hover:bg-brand-acero/50 hover:text-white font-medium text-sm group ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? 'Todos los Proyectos' : ''}
                >
                  <ChevronLeft
                    size={20}
                    className="shrink-0 text-slate-400 group-hover:text-slate-300"
                  />
                  {!collapsed && <span className="truncate">Volver a Todos los Proyectos</span>}
                </Link>
              </div>
            )}
            {navSections.map((section, idx) => (
              <div key={idx} className="mb-6">
                {section.title && !collapsed && (
                  <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {section.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = item.exact
                      ? location.pathname === item.to
                      : location.pathname.startsWith(item.to);

                    return (
                      <SidebarItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        label={item.label}
                        collapsed={collapsed}
                        active={isActive}
                        onClick={() => setMobileMenuOpen(false)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-brand-acero bg-brand-pizarra shrink-0">
            <div className={`flex items-center gap-3 mb-4 ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-brand-acero border border-brand-acero/50 flex items-center justify-center text-brand-ambar font-bold text-sm shrink-0 uppercase">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                await logout();
                window.location.href = '/login';
              }}
              className={`w-full bg-brand-acero hover:bg-brand-acero/80 border border-transparent text-slate-300 hover:text-red-400 text-sm py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${collapsed ? 'px-0' : ''}`}
              title="Cerrar sesión"
            >
              <Settings size={16} />
              {!collapsed && <span>{t('common.logout')}</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden max-w-full print:overflow-visible print:h-auto">
        {/* Header - Minimal for strictly field users, Full for others */}
        {isStrictlyFieldUser ? (
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 print:hidden relative z-10 w-full overflow-hidden">
            <div className="flex items-center gap-2">
              {tenantLogo ? (
                <img src={tenantLogo} alt="Logo" className="w-8 h-8 object-contain shrink-0" />
              ) : (
                <LogoIcon className="w-8 h-8 shrink-0" />
              )}
              {!tenantLogo && (
                <span className="text-xl tracking-tight hidden sm:flex items-center">
                  <span
                    className="text-brand-pizarra"
                    style={{
                      fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                      fontWeight: '400',
                    }}
                  >
                    Field
                  </span>
                  <span
                    className="text-brand-ambar"
                    style={{ fontFamily: '"Mangal Pro", Mangal, sans-serif', fontWeight: 'bold' }}
                  >
                    Close
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-pizarra border border-brand-acero flex items-center justify-center text-white font-bold text-sm shrink-0 uppercase">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-slate-700 truncate max-w-[120px] sm:max-w-none">
                  {user?.name || 'Usuario'}
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
                className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                title="Cerrar sesión"
              >
                <LogOut size={16} className="sm:hidden" />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </button>
            </div>
          </header>
        ) : (
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 print:hidden relative z-10 w-full overflow-hidden">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden shrink-0 mr-3 text-slate-500 hover:text-slate-800 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* LEFT: Context Switcher & Title */}
            <div className="flex items-center gap-2 md:gap-6 min-w-0 flex-1">
              <ContextSwitcher />
              <h1 className="text-lg font-semibold text-gray-800 hidden lg:block truncate pr-2">
                {projectId ? 'Panel de Proyecto' : t('dashboard.title')}
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <span className="hidden sm:inline-block px-3 py-1 bg-brand-acero/10 text-brand-pizarra rounded-full text-xs font-semibold truncate max-w-[200px]">
                {t('common.tenant')}: {tenantName || 'Constructora Demo'}
              </span>
              <div className="sm:border-l sm:pl-4 sm:ml-2">
                <NotificationBell />
              </div>
            </div>
          </header>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain p-0 md:p-8 print:overflow-visible print:h-auto print:p-0 relative min-h-0">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-right" richColors />
      <QuickCaptureModal />
    </div>
  );
};
