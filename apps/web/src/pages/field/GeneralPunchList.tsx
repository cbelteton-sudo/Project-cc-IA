import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { Building, ArrowRight, AlertTriangle } from 'lucide-react';

export const GeneralPunchList = () => {
    const { data: projects, isLoading, error } = useProjects();
    const navigate = useNavigate();

    // If only one project, we could auto-redirect, but let's show list for now.

    if (isLoading) return <div className="p-10 text-center animate-pulse">Cargando proyectos...</div>;

    if (error) {
        return (
            <div className="p-10 text-center">
                <div className="text-red-500 mb-2">Error al cargar proyectos</div>
                <div className="text-sm text-gray-500">{(error as any).message}</div>
                {(error as any).response?.status === 403 && (
                    <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                        No tienes permisos para ver la lista general de proyectos.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="text-blue-600" />
                    Punch List Pro
                </h1>
                <p className="text-gray-500">Selecciona un proyecto para gestionar sus observaciones.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects?.map((project: any) => (
                    <button
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}/punch`)}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Building size={24} />
                            </div>
                            <span className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded">
                                {project.code}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1 group-hover:text-blue-400">
                            Ver observaciones <ArrowRight size={14} />
                        </p>
                    </button>
                ))}

                {(!projects || projects.length === 0) && (
                    <div className="col-span-full p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400">No hay proyectos asignados.</p>
                        <p className="text-xs text-gray-400 mt-2">Si crees que esto es un error, contacta a soporte.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
