import { Outlet, Link } from 'react-router-dom';
import { Home, FolderKanban, Banknote, ShoppingCart, FileText, Settings, Hammer, ClipboardList, MessageSquare, Users, Briefcase, AlertCircle, BarChart2, PlusCircle } from 'lucide-react';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRegion } from '../../context/RegionContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../common/NotificationBell';
import { useQuickCapture } from '../../context/QuickCaptureContext';
import { QuickCaptureModal } from '../field/QuickCaptureModal';

const SidebarItem = ({ to, icon: Icon, label }: any) => (
    <Link to={to} className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
    </Link>
);

export const Layout = () => {
    const { t, i18n } = useTranslation();
    const { country, setCountry } = useRegion();
    const { user, logout } = useAuth();
    const { openCapture } = useQuickCapture();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex h-screen w-full bg-gray-50 print:h-auto print:block">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col print:hidden">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <span className="font-bold text-white text-lg tracking-tight">Admin<span className="text-blue-500">Panel</span></span>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {['ADMIN', 'ADMINISTRADOR', 'DIRECTOR'].includes(user?.role || '') && (
                        <SidebarItem to="/" icon={Home} label={t('sidebar.dashboard')} />
                    )}

                    {['ADMIN', 'ADMINISTRADOR', 'DIRECTOR'].includes(user?.role || '') && (
                        <>
                            <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sidebar.projectMgmt')}</div>
                            <SidebarItem to="/projects" icon={FolderKanban} label={t('sidebar.projects')} />
                            <SidebarItem to="/budgets" icon={Banknote} label={t('sidebar.budgets')} />
                            <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sidebar.procurement')}</div>
                            <SidebarItem to="/procurement/requests" icon={ShoppingCart} label={t('sidebar.materialRequests')} />
                            <SidebarItem to="/procurement/orders" icon={FileText} label={t('sidebar.purchaseOrders')} />

                            <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sidebar.financials')}</div>
                            <SidebarItem to="/invoices" icon={Banknote} label={t('sidebar.invoices')} />
                        </>
                    )}

                    {['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'RESIDENTE', 'USER', 'PM', 'DIRECTOR'].includes(user?.role || '') && (
                        <>
                            <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sidebar.field')}</div>

                            {['ADMIN', 'ADMINISTRADOR', 'PM', 'DIRECTOR', 'SUPERVISOR'].includes(user?.role || '') && (
                                <SidebarItem to="/field/dashboard" icon={BarChart2} label="Dashboard" />
                            )}

                            <SidebarItem to="/field" icon={ClipboardList} label={t('sidebar.fieldMgmt')} />
                            <SidebarItem to="/field/daily" icon={FileText} label="Bitácora" />
                            <SidebarItem to="/field/issues" icon={AlertCircle} label="Problemas" />

                            <button
                                onClick={() => openCapture()}
                                className="w-full flex items-center gap-3 px-3 py-2 text-blue-400 hover:bg-slate-800 hover:text-blue-300 rounded-md transition-colors mt-2"
                            >
                                <PlusCircle size={20} />
                                <span className="font-bold text-sm">Captura Rápida</span>
                            </button>

                            <SidebarItem to="/whatsapp" icon={MessageSquare} label={t('sidebar.whatsappSim')} />
                        </>
                    )}

                    {['ADMIN', 'ADMINISTRADOR'].includes(user?.role || '') && (
                        <>
                            <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sidebar.admin')}</div>
                            <SidebarItem to="/admin/users" icon={Users} label="Usuarios" />
                            <SidebarItem to="/admin/contractors" icon={Briefcase} label="Contratistas" />
                            <SidebarItem to="/settings" icon={Settings} label={t('sidebar.settings')} />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuario'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); window.location.href = '/login'; }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs py-2 rounded font-medium"
                    >
                        {t('common.logout')}
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
