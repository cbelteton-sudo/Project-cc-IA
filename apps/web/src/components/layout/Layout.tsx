import { Outlet, Link } from 'react-router-dom';
import { Home, FolderKanban, Banknote, ShoppingCart, FileText, Settings, Hammer, ClipboardList, MessageSquare } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }: any) => (
    <Link to={to} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors">
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
    </Link>
);

export const Layout = () => {
    return (
        <div className="flex h-screen w-full bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-gray-200"></div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <SidebarItem to="/" icon={Home} label="Dashboard" />
                    <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Mgmt</div>
                    <SidebarItem to="/projects" icon={FolderKanban} label="Projects" />
                    <SidebarItem to="/budgets" icon={Banknote} label="Budgets" />
                    <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Procurement</div>
                    <SidebarItem to="/procurement/requests" icon={ShoppingCart} label="Material Requests" />
                    <SidebarItem to="/procurement/orders" icon={FileText} label="Purchase Orders" />

                    <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Financials</div>
                    <SidebarItem to="/invoices" icon={Banknote} label="Invoices" />

                    <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Field</div>
                    <SidebarItem to="/field" icon={ClipboardList} label="Field Mgmt" />
                    <SidebarItem to="/whatsapp" icon={MessageSquare} label="WhatsApp Sim" />

                    <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</div>
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">AD</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                            <p className="text-xs text-gray-500 truncate">admin@demo.com</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 rounded font-medium"
                    >
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <h1 className="text-xl font-semibold text-gray-800">Overview</h1>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Tenant: Constructora Demo</span>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
