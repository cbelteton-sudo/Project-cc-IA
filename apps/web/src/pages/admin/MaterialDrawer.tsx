import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { materialsService, type CreateMaterialDTO } from '../../services/materials';
import { AxiosError } from 'axios';
import { useRegion } from '../../context/RegionContext';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  unit: z.string().min(1, 'La unidad de medida es obligatoria'),
  costParam: z.coerce.number().min(0, 'El costo base debe ser mayor o igual a 0'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  materialId?: string | null;
}

export const MaterialDrawer = ({ isOpen, onClose, materialId }: Props) => {
  const queryClient = useQueryClient();
  const { currency } = useRegion();
  const currencySymbol = currency === 'GTQ' ? 'Q' : '$';

  const { data: existingMaterial, isLoading } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => materialsService.getById(materialId!),
    enabled: !!materialId && isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      unit: '',
      costParam: 0,
    },
  });

  useEffect(() => {
    if (existingMaterial) {
      reset({
        name: existingMaterial.name,
        description: existingMaterial.description || '',
        unit: existingMaterial.unit,
        costParam: existingMaterial.costParam || 0,
      });
    } else {
      reset({
        name: '',
        description: '',
        unit: 'Unidad',
        costParam: 0,
      });
    }
  }, [existingMaterial, reset, isOpen]);

  const saveMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (materialId) {
        return materialsService.update(materialId, data);
      }
      return materialsService.create(data as CreateMaterialDTO);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(
        materialId ? 'Material actualizado exitosamente' : 'Material agregado al catálogo maestro',
      );
      onClose();
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message || 'Ocurrió un error al guardar el material';
      toast.error(message);
    },
  });

  const onSubmit = (data: FormValues) => {
    saveMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-white h-full shadow-2xl relative flex flex-col animate-slide-in-right">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {materialId ? 'Editar Material' : 'Nuevo Material Global'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Este material formará parte del catálogo de la constructora.
            </p>
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
            <div className="p-8 text-center text-slate-500">Cargando material...</div>
          ) : (
            <form
              id="material-global-form"
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                  <input
                    {...register('name')}
                    placeholder="Ej. Cemento Portland Tipo 1"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unidad de Medida *
                  </label>
                  <input
                    {...register('unit')}
                    placeholder="Ej. Saco, m3, Unidad, Varilla"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none"
                  />
                  {errors.unit && (
                    <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Detalles sobre el material de construcción..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Costo Paramétrico Ref. ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('costParam')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Precio referencial general, puede variar por proyecto.
                  </p>
                  {errors.costParam && (
                    <p className="text-xs text-red-500 mt-1">{errors.costParam.message}</p>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="material-global-form"
            disabled={isSubmitting || isLoading}
            className="bg-brand-ambar hover:bg-brand-oro text-white px-6 py-2 rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Material'}
          </button>
        </div>
      </div>
    </div>
  );
};
