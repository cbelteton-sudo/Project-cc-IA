import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Banknote, ArrowRight, Wallet } from 'lucide-react';
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
}

export const Budgets = () => {
    const { token } = useAuth();
    const { t } = useTranslation();

    // Fetch Projects to list them
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token,
    });

    if (isLoading) return <div className="p-8">Cargando directorio de presupuestos...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Directorio de Presupuestos</h2>
                    <p className="text-gray-500 text-sm">Selecciona un proyecto para gestionar su control financiero.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects?.map((project: Project) => (
                    <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition">
                                <Banknote size={24} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {project.status === 'ACTIVE' ? 'Activo' : project.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-gray-500">{t('projects.code')}: {project.code || 'N/A'}</p>
                            {project.globalBudget && (
                                <p className="text-sm font-mono font-bold text-gray-800">
                                    {new Intl.NumberFormat('es-GT', { style: 'currency', currency: project.currency || 'USD' }).format(project.globalBudget)}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-1">
                                <Wallet size={16} className="text-gray-400" />
                                <span>{project._count?.budgets || 0} Presupuesto(s)</span>
                            </div>

                            <Link to={`/projects/${project.id}`} className="flex items-center text-blue-600 hover:underline font-medium">
                                Ver Detalles <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>
                    </div>
                ))}

                {projects?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No hay proyectos activos. Crea un proyecto primero.
                    </div>
                )}
            </div>
        </div>
    );
};
