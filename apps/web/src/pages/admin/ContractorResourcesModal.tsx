import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { X, Plus, Edit, Trash2, User, Phone, Mail, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

interface ResourceModalProps {
  contractorId: string;
  contractorName: string;
  onClose: () => void;
}

const resourceSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  role: z.enum(['CREW', 'OPERATOR', 'INSTALLER', 'SUPERVISOR']),
  phone: z.string().optional(),
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Formato de correo inválido'),
  isActive: z.boolean(),
});

type ResourceForm = z.infer<typeof resourceSchema>;

const ROLE_LABELS: Record<string, string> = {
  CREW: 'Cuadrilla',
  OPERATOR: 'Operario',
  INSTALLER: 'Instalador',
  SUPERVISOR: 'Supervisor',
};

const ROLE_COLORS: Record<string, string> = {
  CREW: 'bg-blue-100 text-blue-800 border-blue-200',
  OPERATOR: 'bg-green-100 text-green-800 border-green-200',
  INSTALLER: 'bg-orange-100 text-orange-800 border-orange-200',
  SUPERVISOR: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const ContractorResourcesModal: React.FC<ResourceModalProps> = ({
  contractorId,
  contractorName,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['contractor-resources', contractorId],
    queryFn: async () => {
      const res = await api.get(`/contractors/${contractorId}/resources`);
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: '',
      role: 'OPERATOR',
      email: '',
      phone: '',
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ResourceForm) => {
      if (editingId) {
        return api.patch(`/contractors/resources/${editingId}`, data);
      }
      return api.post(`/contractors/${contractorId}/resources`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-resources', contractorId] });
      resetForm();
      toast.success(editingId ? 'Recurso actualizado' : 'Recurso agregado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar el recurso');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/contractors/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-resources', contractorId] });
      toast.success('Recurso eliminado');
    },
  });

  const resetForm = () => {
    reset({ role: 'OPERATOR', isActive: true, name: '', phone: '', email: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (resource: any) => {
    setEditingId(resource.id);
    setValue('name', resource.name);
    setValue('role', resource.role as any);
    setValue('phone', resource.phone || '');
    setValue('email', resource.email || '');
    setValue('isActive', resource.isActive);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar este recurso (${name})?`)) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: ResourceForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              Recursos / Personal
            </h2>
            <p className="text-sm text-gray-500 mt-1">{contractorName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
          {isFormOpen ? (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingId ? 'Editar Recurso' : 'Nuevo Recurso'}
                </h3>
                <div className="text-sm text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-md border border-gray-200 shadow-sm flex items-center gap-2">
                  Asignando a: <span className="font-bold text-gray-900">{contractorName}</span>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      {...register('name')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Ej. Juan Pérez"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol / Tipo
                    </label>
                    <select
                      {...register('role')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="OPERATOR">{ROLE_LABELS.OPERATOR}</option>
                      <option value="CREW">{ROLE_LABELS.CREW}</option>
                      <option value="INSTALLER">{ROLE_LABELS.INSTALLER}</option>
                      <option value="SUPERVISOR">{ROLE_LABELS.SUPERVISOR}</option>
                    </select>
                  </div>

                  {editingId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        {...register('isActive', { setValueAs: (v) => v === 'true' })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      {...register('phone')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Opcional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Ej. juan@empresa.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-5">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {mutation.isPending ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-md border border-gray-200 shadow-sm flex items-center gap-2">
                Asignando a: <span className="font-bold text-gray-900">{contractorName}</span>
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
              >
                <Plus size={16} /> Agregar
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Nombre Completo</th>
                    <th className="px-6 py-4">Rol en Obra</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        Cargando recursos...
                      </td>
                    </tr>
                  ) : resources?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <ShieldAlert className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-base text-gray-500 font-medium">
                            No hay recursos registrados
                          </p>
                          <p className="text-sm mt-1">
                            Agrega personal, cuadrillas u operarios para este contratista.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    resources?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{r.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          {r.source === 'USER' ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <User size={12} className="text-indigo-500" />
                                Usuario: {r.role}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[r.role] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {ROLE_LABELS[r.role] || r.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {r.phone ? (
                              <div className="flex items-center text-sm text-gray-600 gap-1.5 hover:text-blue-600">
                                <Phone size={14} /> {r.phone}
                              </div>
                            ) : null}
                            {r.email ? (
                              <div className="flex items-center text-sm text-gray-600 gap-1.5 hover:text-blue-600">
                                <Mail size={14} /> {r.email}
                              </div>
                            ) : null}
                            {!r.phone && !r.email && (
                              <span className="text-sm text-gray-400 italic">No provisto</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {r.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {r.source !== 'USER' ? (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(r)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id, r.name)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic">
                              En Equipo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
