import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';
import { Wifi, WifiOff, Home, List, AlertCircle, FileText } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const FieldLayout: React.FC = () => {
    const { isOnline, syncNow } = useNetwork();
    const location = useLocation();

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Top Bar Removed per user request for more space */}

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto pb-24">
                <ErrorBoundary fallback={<div className="p-10 text-center text-red-500">Error al cargar la página. Por favor recarga.</div>}>
                    <React.Suspense fallback={<div className="p-10 text-center text-blue-500">Cargando sección de campo...</div>}>
                        <Outlet />
                    </React.Suspense>
                </ErrorBoundary>
            </div>
            {/* QuickCapture moved to Main Sidebar per user request */}
        </div>
    );
};

export default FieldLayout;
