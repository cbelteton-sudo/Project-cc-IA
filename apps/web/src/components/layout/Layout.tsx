import React, { useState } from 'react';
import { Outlet, Link, useLocation, matchPath } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRegion } from '../../context/RegionContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../common/NotificationBell';
import { QuickCaptureModal } from '../field/QuickCaptureModal';
import { getNavItems } from '../../config/navigation';
import { useProjects } from '../../hooks/useProjects';
import { ContextSwitcher } from './ContextSwitcher';
import { LogoIcon } from '../common/LogoIcon';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active: boolean;
}

const SidebarItem = ({ to, icon: Icon, label, collapsed, active }: SidebarItemProps) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
      active
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
    } ${collapsed ? 'justify-center' : ''}`}
    title={collapsed ? label : ''}
  >
    <Icon
      size={20}
      className={`shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
    />
    {!collapsed && <span className="text-sm truncate">{label}</span>}
  </Link>
);

export const Layout = () => {
  const { t, i18n } = useTranslation();
  const { country, setCountry } = useRegion();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const match = matchPath({ path: '/projects/:id/*' }, location.pathname);
  const projectId = match?.params.id;

  const { data: projects } = useProjects();
  const currentProject = React.useMemo(() => {
    if (!projects || !projectId) return null;
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  // Get dynamic nav items based on user role and context
  const navSections = getNavItems(user, projectId, currentProject);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 print:h-auto print:block">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex flex-col print:hidden transition-all duration-300 relative z-20`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-slate-800 z-50 shadow-sm transition-colors hover:shadow"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div
          className={`h-16 flex items-center ${collapsed ? 'justify-center px-0' : 'px-6'} border-b border-slate-100 bg-white transition-all shrink-0`}
        >
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <LogoIcon className="w-8 h-8 shrink-0" />
            {!collapsed && (
              <span className="text-xl tracking-tight flex items-center">
                <span
                  className="text-slate-800"
                  style={{
                    fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif',
                    fontWeight: '400',
                  }}
                >
                  Field
                </span>
                <span
                  className="text-blue-600"
                  style={{ fontFamily: '"Mangal Pro", Mangal, sans-serif', fontWeight: 'bold' }}
                >
                  Close
                </span>
              </span>
            )}
            {collapsed && <span className="sr-only">FIELDCLOSE</span>}
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {projectId && (
            <div className="mb-6">
              <Link
                to="/"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium text-sm group ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? 'Volver a Organización' : ''}
              >
                <ChevronLeft
                  size={20}
                  className="shrink-0 text-slate-400 group-hover:text-slate-600"
                />
                {!collapsed && <span className="truncate">Volver a Org</span>}
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
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className={`flex items-center gap-3 mb-4 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0 uppercase">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className={`w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 text-sm py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${collapsed ? 'px-0' : ''}`}
            title="Cerrar sesión"
          >
            <Settings size={16} />
            {!collapsed && <span>{t('common.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:h-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 print:hidden">
          {/* LEFT: Context Switcher & Title */}
          <div className="flex items-center gap-6">
            <ContextSwitcher />
            <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
              {projectId ? 'Panel de Proyecto' : t('dashboard.title')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {/* Country Switcher */}
              <button
                onClick={() => setCountry('GT')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition ${country === 'GT' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
                title="Guatemala (Quetzales)"
              >
                🇬🇹 GTQ
              </button>
              <button
                onClick={() => setCountry('SV')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition ${country === 'SV' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
                title="El Salvador (USD)"
              >
                🇸🇻 USD
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              {/* Language Switcher */}
              <button
                onClick={() => changeLanguage('es')}
                className={`text-xs px-2 py-1 rounded font-semibold transition ${i18n.language === 'es' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-500'}`}
              >
                ES
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`text-xs px-2 py-1 rounded font-semibold transition ${i18n.language === 'en' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-500'}`}
              >
                EN
              </button>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {t('common.tenant')}: Constructora Demo
            </span>
            <div className="border-l pl-4 ml-2">
              <NotificationBell />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 print:overflow-visible print:h-auto print:p-0">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-right" richColors />
      <QuickCaptureModal />
    </div>
  );
};
