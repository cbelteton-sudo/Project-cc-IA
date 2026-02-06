import { Outlet, Link } from 'react-router-dom';
import { Home, ClipboardList, FileText, Settings, LogOut, Briefcase } from 'lucide-react';
import { Toaster } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const PortalSidebarItem = ({ to, icon: Icon, label }: any) => (
    <Link to={to} className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
    </Link>
);

export const PortalLayout = () => {
    const { logout, user } = useAuth();

    return (
        <div className="flex h-screen w-full bg-gray-100">
            {/* Dark Sidebar for Portal */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-gray-300">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <span className="font-bold text-white text-lg tracking-tight">Contractor<span className="text-blue-500">Portal</span></span>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <PortalSidebarItem to="/portal/dashboard" icon={Home} label="Resumen" />
                    <PortalSidebarItem to="/portal/projects" icon={Briefcase} label="Mis Proyectos" />
                    <PortalSidebarItem to="/portal/tasks" icon={ClipboardList} label="Tareas (Backlog)" />
                    <PortalSidebarItem to="/portal/orders" icon={FileText} label="Órdenes de Compra" />

                    <div className="mt-8 pt-4 border-t border-slate-800">
                        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mi Cuenta</div>
                        <PortalSidebarItem to="/portal/profile" icon={Settings} label="Ficha Técnica" />
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            {user?.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                            <p className="text-xs text-slate-400 truncate">Contratista</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); window.location.href = '/login'; }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs py-2 rounded font-medium flex items-center justify-center gap-2"
                    >
                        <LogOut size={14} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <h1 className="text-lg font-semibold text-gray-800">Portal de Proveedores</h1>
                    <div>
                        {/* Tenant Badge */}
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                            {user?.tenantId === 'demo' ? 'Constructora Demo' : user?.tenantId}
                        </span>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
            <Toaster position="top-right" richColors />
        </div>
    );
};
