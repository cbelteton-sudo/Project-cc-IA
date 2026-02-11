import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Home, FolderKanban, Banknote, ShoppingCart, FileText, Settings, Hammer, ClipboardList, MessageSquare, Users, Briefcase, AlertCircle, BarChart2, PlusCircle, AlertTriangle, Check, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRegion } from '../../context/RegionContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../common/NotificationBell';
import { useQuickCapture } from '../../context/QuickCaptureContext';
import { QuickCaptureModal } from '../field/QuickCaptureModal';

const SidebarItem = ({ to, icon: Icon, label, collapsed }: any) => (
    <Link to={to} className={`flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-md transition-colors ${collapsed ? 'justify-center' : ''}`} title={collapsed ? label : ''}>
        <Icon size={20} className="shrink-0" />
        {!collapsed && <span className="font-medium text-sm truncate">{label}</span>}
    </Link>
);

export const Layout = () => {
    const { t, i18n } = useTranslation();
    const { country, setCountry } = useRegion();
    const { user, logout } = useAuth();
    const { openCapture } = useQuickCapture();
    const [collapsed, setCollapsed] = useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex h-screen w-full bg-gray-50 print:h-auto print:block">
            {/* Sidebar */}
            <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-field-blue border-r border-white/5 flex flex-col print:hidden transition-all duration-300 relative`}>

                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-8 bg-field-blue border border-white/10 rounded-full p-1 text-gray-400 hover:text-white z-50 shadow-md"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-0' : 'px-6'} border-b border-white/5 bg-field-blue transition-all`}>
                    <div className="flex items-center gap-2">
                        {/* Logo Icon - Checkmark REMOVED */}
                        {!collapsed && (
                            <span className="font-bold text-white text-lg tracking-tight">FIELD<span className="text-field-orange">CLOSE</span></span>
                        )}
                        {collapsed && (
                            <span className="font-bold text-white text-lg tracking-tight">FC</span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
                    {['ADMIN', 'ADMINISTRADOR', 'DIRECTOR'].includes(user?.role || '') && (
                        <SidebarItem to="/" icon={Home} label={t('sidebar.dashboard')} collapsed={collapsed} />
                    )}

                    {['ADMIN', 'ADMINISTRADOR', 'DIRECTOR'].includes(user?.role || '') && (
                        <>
                            {!collapsed && <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-200">{t('sidebar.projectMgmt')}</div>}
                            <SidebarItem to="/projects" icon={FolderKanban} label={t('sidebar.projects')} collapsed={collapsed} />

                            {/* NEW SCRUM MODULE */}
                            <SidebarItem to="/scrum" icon={CalendarClock} label="Semanas de Obra" collapsed={collapsed} />

                            <SidebarItem to="/budgets" icon={Banknote} label={t('sidebar.budgets')} collapsed={collapsed} />

                            {!collapsed && <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-200">{t('sidebar.procurement')}</div>}
                            <SidebarItem to="/procurement/requests" icon={ShoppingCart} label={t('sidebar.materialRequests')} collapsed={collapsed} />
                            <SidebarItem to="/procurement/orders" icon={FileText} label={t('sidebar.purchaseOrders')} collapsed={collapsed} />

                            {!collapsed && <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-200">{t('sidebar.financials')}</div>}
                            <SidebarItem to="/invoices" icon={Banknote} label={t('sidebar.invoices')} collapsed={collapsed} />
                        </>
                    )}

                    {['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'RESIDENTE', 'USER', 'PM', 'DIRECTOR'].includes(user?.role || '') && (
                        <>
                            {!collapsed && <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-200">{t('sidebar.field')}</div>}

                            {['ADMIN', 'ADMINISTRADOR', 'PM', 'DIRECTOR', 'SUPERVISOR'].includes(user?.role || '') && (
                                <SidebarItem to="/field/dashboard" icon={BarChart2} label="Dashboard" collapsed={collapsed} />
                            )}

                            <SidebarItem to="/field" icon={ClipboardList} label={t('sidebar.fieldMgmt')} collapsed={collapsed} />
                            <SidebarItem to="/field/daily" icon={FileText} label="Bitácora" collapsed={collapsed} />
                            <SidebarItem to="/field/issues" icon={AlertCircle} label="Problemas" collapsed={collapsed} />
                            <SidebarItem to="/field/punch-list" icon={AlertTriangle} label="Punch List" collapsed={collapsed} />

                            <button
                                onClick={() => openCapture()}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-field-orange hover:bg-white/10 hover:text-orange-400 rounded-md transition-colors mt-2 ${collapsed ? 'justify-center' : ''}`}
                            >
                                <PlusCircle size={20} />
                                {!collapsed && <span className="font-bold text-sm">Captura Rápida</span>}
                            </button>

                            <SidebarItem to="/whatsapp" icon={MessageSquare} label={t('sidebar.whatsappSim')} collapsed={collapsed} />
                        </>
                    )}

                    {['ADMIN', 'ADMINISTRADOR'].includes(user?.role || '') && (
                        <>
                            {!collapsed && <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-200">{t('sidebar.admin')}</div>}
                            <SidebarItem to="/admin/users" icon={Users} label="Usuarios" collapsed={collapsed} />
                            <SidebarItem to="/admin/contractors" icon={Briefcase} label="Contratistas" collapsed={collapsed} />
                            <SidebarItem to="/settings" icon={Settings} label={t('sidebar.settings')} collapsed={collapsed} />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuario'}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => { logout(); window.location.href = '/login'; }}
                        className={`w-full bg-white/5 hover:bg-white/10 text-gray-300 text-xs py-2 rounded font-medium ${collapsed ? 'text-center' : ''}`}
                    >
                        {collapsed ? <div className="mx-auto"><Settings size={16} /></div> : t('common.logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:h-auto">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 print:hidden">
                    <h1 className="text-xl font-semibold text-gray-800">{t('dashboard.title')}</h1>
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
                            <button onClick={() => changeLanguage('es')} className={`text-xs px-2 py-1 rounded font-semibold transition ${i18n.language === 'es' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-500'}`}>ES</button>
                            <button onClick={() => changeLanguage('en')} className={`text-xs px-2 py-1 rounded font-semibold transition ${i18n.language === 'en' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-500'}`}>EN</button>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{t('common.tenant')}: Constructora Demo</span>
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
