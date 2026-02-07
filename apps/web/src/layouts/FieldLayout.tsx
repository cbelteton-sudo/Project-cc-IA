import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';
import { Wifi, WifiOff, Home, List, AlertCircle, FileText } from 'lucide-react';

const FieldLayout: React.FC = () => {
    const { isOnline, syncNow } = useNetwork();
    const location = useLocation();

    const getNavClass = (path: string) => {
        return `flex flex-col items-center justify-center w-full h-full ${location.pathname.startsWith(path) ? 'text-blue-600' : 'text-gray-500'
            }`;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Top Bar */}
            <div className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
                <h1 className="text-lg font-bold text-gray-800">Field Manager</h1>
                <div className="flex items-center space-x-2">
                    {!isOnline && (
                        <button onClick={syncNow} className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center">
                            <WifiOff size={16} className="mr-1" /> Offline
                        </button>
                    )}
                    {isOnline && <Wifi size={18} className="text-green-500" />}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto pb-20">
                <Outlet />
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 h-16 flex justify-around items-center z-10">
                <Link to="/field/today" className={getNavClass('/field/today')}>
                    <Home size={24} />
                    <span className="text-xs mt-1">Today</span>
                </Link>
                <Link to="/field/daily" className={getNavClass('/field/daily')}>
                    <FileText size={24} />
                    <span className="text-xs mt-1">Daily Log</span>
                </Link>
                <Link to="/field/issues" className={getNavClass('/field/issues')}>
                    <AlertCircle size={24} />
                    <span className="text-xs mt-1">Issues</span>
                </Link>
            </div>
        </div>
    );
};

export default FieldLayout;
