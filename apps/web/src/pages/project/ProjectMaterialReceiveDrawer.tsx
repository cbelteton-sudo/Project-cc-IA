import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectMaterialsService } from '../../services/projectMaterials';
import { projectsService } from '../../services/projects';
import { api } from '../../lib/api';
import { Upload, X } from 'lucide-react';

const schema = z.object({
  quantity: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
  date: z.string().optional(),
  poNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  materialId: string | null;
}

export const ProjectMaterialReceiveDrawer = ({ isOpen, onClose, projectId, materialId }: Props) => {
  const queryClient = useQueryClient();
  const [poFile, setPoFile] = useState<File | null>(null);

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 0,
      price: 0,
      date: new Date().toISOString().split('T')[0],
      poNumber: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (existingMaterial) {
      reset({
        quantity: 0,
        price: existingMaterial.plannedPrice || 0,
        date: new Date().toISOString().split('T')[0],
        poNumber: '',
        notes: '',
      });
    }
  }, [existingMaterial, reset, isOpen]);

  const handleClose = () => {
    setPoFile(null);
    onClose();
  };

  const receiveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      let documentUrl = undefined;

      if (poFile) {
        const formData = new FormData();
        formData.append('file', poFile);
        formData.append('projectId', projectId);
        // Using photos upload endpoint temporarily for documents (images preferred)
        // Pass projectId in query string because NestXD guards run before multer interceptor parses the body
        const uploadRes = await api.post(`/photos/upload?projectId=${projectId}`, formData);
        documentUrl = uploadRes.data.urlMain || uploadRes.data.url;
      }

      return projectMaterialsService.receive(materialId!, {
        ...data,
        poDocumentUrl: documentUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMaterials', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectMaterial', materialId] });
      toast.success('Ingreso de material registrado exitosamente');
      onClose();
    },
    onError: (error: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const message =
        err.response?.data?.message || err.message || 'Ocurrió un error al registrar el ingreso';
      toast.error(message);
    },
  });

  const onSubmit = (data: FormValues) => {
    receiveMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-slide-in-right">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Registrar Ingreso</h2>
            {materialId && existingMaterial && (
              <p className="text-sm text-slate-500 mt-1">{existingMaterial.material?.name}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Cargando información...</div>
          ) : (
            <form id="receive-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Inventario Actual</p>
                  <p className="text-lg font-bold text-slate-800">
                    {existingMaterial?.stockAvailable || 0}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      {existingMaterial?.material?.unit}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cantidad a Ingresar *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e') e.preventDefault();
                      }}
                      {...register('quantity')}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 py-2 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-sm">
                        {existingMaterial?.material?.unit}
                      </span>
                    </div>
                  </div>
                  {errors.quantity && (
                    <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Precio Unitario de Compra ({project?.currency || '$'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') e.preventDefault();
                    }}
                    {...register('price')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Por defecto sugerimos el precio planeado.
                  </p>
                  {errors.price && (
                    <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    disabled
                    {...register('date')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                  />
                  {errors.date && (
                    <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      No. de Orden de Compra
                    </label>
                    <input
                      type="text"
                      {...register('poNumber')}
                      placeholder="Ej. OC-2023-001"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Documento OC
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPoFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full border border-slate-200 border-dashed rounded-lg px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center gap-2 text-slate-600">
                        <Upload className="w-4 h-4 text-brand-ambar" />
                        <span className="truncate">
                          {poFile ? poFile.name : 'Adjuntar Documento'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notas / Referencia (Opcional)
                  </label>
                  <textarea
                    {...register('notes')}
                    placeholder="Ej. Entregado por proveedor X"
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-ambar/50 outline-none resize-none"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium text-sm rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="receive-form"
            disabled={receiveMutation.isPending}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {receiveMutation.isPending ? 'Registrando...' : 'Confirmar Ingreso'}
          </button>
        </div>
      </div>
    </div>
  );
};
