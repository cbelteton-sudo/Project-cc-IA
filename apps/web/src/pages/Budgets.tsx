import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Banknote, ArrowRight, Wallet, Search, Folder, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

// Reusing Project type for simplicity, though we only need basic info
interface Project {
    id: string;
    name: string;
    code: string;
    status: string;
    globalBudget?: number;
    currency?: string;
    _count?: {
        budgets: number;
    };
    thumbnail?: string;
}

export const Budgets = () => {
    const { token } = useAuth();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Projects to list them
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token,
    });

    const filteredProjects = projects?.filter((p: Project) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return (
        <div className="container mx-auto max-w-7xl p-6">
            <div className="flex justify-between items-center mb-8 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
    );

    return (
        <div className="container mx-auto max-w-7xl p-6 min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Directorio de Presupuestos</h2>
                    <p className="text-gray-500 mt-1">Selecciona un proyecto para gestionar su control financiero.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-field-blue outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Projects Table List View */}
            {filteredProjects?.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Folder size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No se encontraron proyectos</h3>
                    <p className="text-gray-500 mb-6">Prueba con otra búsqueda.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden ring-1 ring-black/5">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-field-blue text-white shadow-md z-10 relative">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/80">Proyecto</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-white/80">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right text-white/80">Presupuesto Global</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-white/80">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProjects?.map((project: Project) => (
                                <tr key={project.id} className="hover:bg-field-gray/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <Building2 size={20} />
                                            </div>
                                            <div className="font-bold text-gray-900 group-hover:text-field-blue transition-colors text-base">
                                                {project.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${project.status === 'ACTIVE' || project.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700 border-green-200' :
                                            project.status === 'DONE' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {project.status === 'ACTIVE' || project.status === 'IN_PROGRESS' ? 'Activo' : project.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-bold text-gray-900">
                                            {project.globalBudget
                                                ? new Intl.NumberFormat('es-GT', { style: 'currency', currency: project.currency || 'USD' }).format(project.globalBudget)
                                                : <span className="text-gray-400 italic">---</span>
                                            }
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-center">
                                            <Link
                                                to={`/projects/${project.id}?tab=matrix`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-field-blue hover:bg-slate-800 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
                                            >
                                                <Wallet size={16} />
                                                <span>Presupuesto</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
