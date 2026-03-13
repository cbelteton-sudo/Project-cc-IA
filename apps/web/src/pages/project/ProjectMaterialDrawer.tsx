import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectMaterialsService } from '../../services/projectMaterials';
import { projectsService } from '../../services/projects';
import { api } from '../../lib/api';
import { GlobalDiscussion } from '../../components/common/GlobalDiscussion';
import { CommentReferenceType } from '../../services/comments';

const schema = z.object({
  materialId: z.string().min(1, 'Debe seleccionar un material base'),
  costCenter: z.string().min(1, 'Debe seleccionar un Centro de Costo (CECO)'),
  projectSKU: z.string().optional(),
  plannedQty: z.coerce.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  plannedPrice: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  materialId: string | null;
}

export const ProjectMaterialDrawer = ({ isOpen, onClose, projectId, materialId }: Props) => {
  const queryClient = useQueryClient();

  // Fetch Global Materials to populate dropdown
  const { data: globalMaterials = [], isLoading: isLoadingGlobal } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await api.get('/materials');
      return res.data;
    },
    enabled: isOpen && !materialId, // Only need list if creating new
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getById(projectId),
    enabled: isOpen && !!projectId,
  });

  const { data: existingMaterial, isLoading } = useQuery({
    queryKey: ['projectMaterial', materialId],
    queryFn: () => projectMaterialsService.getById(materialId!),
    enabled: !!materialId && isOpen,
  });

  const { data: projectMaterials = [] } = useQuery({
    queryKey: ['projectMaterials', projectId],
    queryFn: () => projectMaterialsService.getAllByProject(projectId),
    enabled: isOpen,
  });

  const [searchTerm, setSearchTerm] = useState('');

  const availableGlobalMaterials = useMemo(() => {
    if (!globalMaterials) return [];
    // Filter out materials that are already in the project
    const addedMaterialIds = new Set(
      (projectMaterials as { materialId: string }[]).map((pm) => pm.materialId),
    );
    let filtered = (globalMaterials as { id: string; name: string; unit: string }[]).filter(
      (gm) => !addedMaterialIds.has(gm.id),
    );

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((gm) => gm.name.toLowerCase().includes(lowerSearch));
    }
    return filtered;
  }, [globalMaterials, projectMaterials, searchTerm]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      materialId: '',
      costCenter: '',
      plannedQty: 0,
      plannedPrice: 0,
    },
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (existingMaterial) {
      reset({
        materialId: existingMaterial.materialId,
        costCenter: existingMaterial.costCenter || '',
        projectSKU: existingMaterial.projectSKU || '',
        plannedQty: existingMaterial.plannedQty || 0,
        plannedPrice: existingMaterial.plannedPrice || 0,
      });
    } else {
      reset({
        materialId: '',
        costCenter: '',
        projectSKU: '',
        plannedQty: 0,
        plannedPrice: 0,
      });
    }
  }, [existingMaterial, reset, isOpen]);

  const saveMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (materialId) {
        return projectMaterialsService.update(materialId, data);
      }
      return projectMaterialsService.create({ ...data, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMaterials', projectId] });
      toast.success(
        materialId ? 'Material actualizado exitosamente' : 'Material agregado al proyecto',
      );
      onClose();
    },
    onError: (error: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const message = err.response?.data?.message || 'Ocurrió un error al guardar el material';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectMaterialsService.delete(materialId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMaterials', projectId] });
      toast.success('Material eliminado del proyecto');
      onClose();
    },
    onError: () => {
      toast.error('No se pudo eliminar el material, puede que tenga uso registrado.');
    },
  });

  const onSubmit = (data: FormValues) => {
    saveMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de eliminar este material del catálogo del proyecto?')) {
      deleteMutation.mutate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl relative flex flex-col animate-slide-in-right">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {materialId ? 'Detalles del Material de Proyecto' : 'Agregar Nuevo Material'}
            </h2>
            {materialId && existingMaterial && (
              <p className="text-sm text-slate-500 mt-1">{existingMaterial.material?.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Cargando información...</div>
          ) : (
            <form id="material-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Información Base
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Material del Catálogo Global *
                  </label>
                  <input type="hidden" {...register('materialId')} />

                  {materialId && existingMaterial ? (
                    <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500">
                      {existingMaterial.material?.name}
                    </div>
                  ) : (
                    <div className="relative" ref={dropdownRef}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-4 w-4 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar material global..."
                          className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none ${
                            errors.materialId ? 'border-red-500' : 'border-slate-200'
                          }`}
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsDropdownOpen(true);
                            if (getValues('materialId')) {
                              setValue('materialId', '', { shouldValidate: true });
                            }
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          disabled={globalMaterials.length === 0 && !isLoadingGlobal}
                          autoComplete="off"
                        />
                      </div>

                      {isDropdownOpen && availableGlobalMaterials.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {availableGlobalMaterials.map(
                            (gm: { id: string; name: string; unit: string }) => (
                              <div
                                key={gm.id}
                                className="px-4 py-2 text-sm text-slate-700 hover:bg-brand-ambar/10 cursor-pointer border-b border-slate-100 last:border-0"
                                onClick={() => {
                                  setValue('materialId', gm.id, { shouldValidate: true });
                                  setSearchTerm(gm.name);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                {gm.name}{' '}
                                <span className="text-slate-400 text-xs ml-1">({gm.unit})</span>
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      {isDropdownOpen && availableGlobalMaterials.length === 0 && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm text-slate-500 text-center">
                          No se encontraron materiales para "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}

                  {!materialId &&
                    availableGlobalMaterials.length === 0 &&
                    globalMaterials.length > 0 &&
                    !searchTerm && (
                      <p className="text-xs text-slate-500 mt-1">
                        Todos los materiales globales ya han sido agregados al proyecto.
                      </p>
                    )}
                  {!materialId && globalMaterials.length === 0 && !isLoadingGlobal && (
                    <p className="text-xs text-brand-oro mt-1">
                      ⚠️ Primero debes crear materiales en el catálogo matriz.
                    </p>
                  )}
                  {errors.materialId && (
                    <p className="text-xs text-red-500 mt-1">{errors.materialId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Centro de Costo (CECO) *
                  </label>
                  <select
                    {...register('costCenter')}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none ${
                      errors.costCenter ? 'border-red-500' : 'border-slate-200'
                    } bg-white`}
                  >
                    <option value="">-- Seleccione CECO --</option>
                    {project?.costCenters?.map((ceco: { code: string; name: string }) => (
                      <option key={ceco.code} value={ceco.code}>
                        {ceco.code} - {ceco.name}
                      </option>
                    ))}
                  </select>
                  {errors.costCenter && (
                    <p className="text-xs text-red-500 mt-1">{errors.costCenter.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    SKU / Código del Proyecto
                  </label>
                  <input
                    {...register('projectSKU')}
                    placeholder="Ej. MAT-ELEC-001"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Código interno específico para este proyecto (opcional).
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Planificación y Presupuesto
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cantidad Planeada Estimada
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('plannedQty')}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio Unitario Planeado ({project?.currency || '$'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('plannedPrice')}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {materialId && existingMaterial && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Estado Actual en Campo
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Inventario Disponible</p>
                      <p
                        className={`text-xl font-bold ${existingMaterial.stockAvailable > 0 ? 'text-green-600' : 'text-slate-700'}`}
                      >
                        {existingMaterial.stockAvailable}{' '}
                        <span className="text-sm font-normal text-slate-500">
                          {existingMaterial.material?.unit}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Cantidad Consumida</p>
                      <p className="text-xl font-bold text-slate-800">
                        {existingMaterial.stockConsumed}{' '}
                        <span className="text-sm font-normal text-slate-500">
                          {existingMaterial.material?.unit}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Discussion Thread */}
              {materialId && existingMaterial && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider pb-2">
                    Discusión y Comentarios
                  </h3>
                  <div className="h-[400px]">
                    <GlobalDiscussion
                      referenceType={CommentReferenceType.MATERIAL}
                      referenceId={existingMaterial.materialId}
                      projectId={projectId}
                    />
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <div>
            {materialId && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 font-medium text-sm rounded-lg transition"
              >
                Remover del Proyecto
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium text-sm rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="material-form"
              disabled={isSubmitting}
              className="px-6 py-2 bg-brand-ambar hover:bg-brand-oro text-white font-medium text-sm rounded-lg transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Material'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
