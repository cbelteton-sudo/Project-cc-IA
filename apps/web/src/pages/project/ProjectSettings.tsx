import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
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

  const { register, control, handleSubmit, reset } = useForm<Partial<Project>>({
    defaultValues: {
      costCenters: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'costCenters',
  });

  useEffect(() => {
    if (project) {
      reset({
        enablePMDashboard: project.enablePMDashboard || false,
        enablePunchListPro: project.enablePunchListPro || false,
        enableScrum: project.enableScrum || false,
        enableBudget: project.enableBudget || false,
        enableFieldManagement: project.enableFieldManagement || false,
        enableMaterials: project.enableMaterials || false,
        costCenters: project.costCenters || [],
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

          <div className="pt-4 border-t border-gray-200 mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Centros de Costo (CECOs)</h2>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => append({ code: '', name: '' })}
                className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-md transition"
              >
                <Plus size={16} /> Agregar CECO
              </button>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              {fields.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay centros de costo configurados para este proyecto.
                </p>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  <div className="w-1/3">
                    <input
                      {...register(`costCenters.${index}.code`, { required: true })}
                      placeholder="Código (Ej. MAT)"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      {...register(`costCenters.${index}.name`, { required: true })}
                      placeholder="Nombre (Ej. Materia Prima)"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition"
                    title="Eliminar CECO"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition shadow-sm"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectSettings;
