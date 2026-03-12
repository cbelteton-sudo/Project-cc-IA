import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { projectsService } from '@/services/projects';
import type { Project } from '@/services/projects';

export const ProjectSettings = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsService.getById(id!),
    enabled: !!id,
  });

  const { register, handleSubmit, reset } = useForm<Partial<Project>>();

  useEffect(() => {
    if (project) {
      reset({
        enablePMDashboard: project.enablePMDashboard || false,
        enablePunchListPro: project.enablePunchListPro || false,
        enableScrum: project.enableScrum || false,
        enableBudget: project.enableBudget || false,
        enableFieldManagement: project.enableFieldManagement || false,
        enableMaterials: project.enableMaterials || false,
      });
    }
  }, [project, reset]);

  const mutation = useMutation({
    mutationFn: (data: Partial<Project>) => projectsService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      toast.success('Configuración actualizada correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar la configuración');
    },
  });

  const onSubmit = (data: Partial<Project>) => {
    mutation.mutate(data);
  };

  if (isLoading) return <div>Cargando configuración...</div>;
  if (!project) return <div>Proyecto no encontrado...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800">Configuración del Proyecto</h1>

      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Módulos Activos</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableFieldManagement"
              {...register('enableFieldManagement')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableFieldManagement" className="text-sm font-medium text-gray-700">
              Gestión de Campo (Field Management)
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enablePMDashboard"
              {...register('enablePMDashboard')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enablePMDashboard" className="text-sm font-medium text-gray-700">
              PM Dashboard
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enablePunchListPro"
              {...register('enablePunchListPro')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enablePunchListPro" className="text-sm font-medium text-gray-700">
              Punch List Pro
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableScrum"
              {...register('enableScrum')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableScrum" className="text-sm font-medium text-gray-700">
              Scrum & Planificación
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableBudget"
              {...register('enableBudget')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableBudget" className="text-sm font-medium text-gray-700">
              Presupuestos & Costos
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableMaterials"
              {...register('enableMaterials')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableMaterials" className="text-sm font-medium text-gray-700">
              Gestión de Materiales
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectSettings;
