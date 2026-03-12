import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Briefcase, Phone, Mail, Globe, Users, FolderKanban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ContractorResourcesModal } from './ContractorResourcesModal';
import { ConstructorProjectsModal } from './ConstructorProjectsModal';
import { useTranslation } from 'react-i18next';
const contractorSchema = z.object({
  name: z.string().min(2, 'Commercial Name is required'),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialties: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

type ContractorForm = z.infer<typeof contractorSchema>;

type TabValue = 'all' | 'active' | 'inactive';

export const Contractors = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  // Resource Modal State
  const [selectedContractorForResources, setSelectedContractorForResources] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Projects Modal State
  const [selectedConstructorForProjects, setSelectedConstructorForProjects] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContractorForm>({
    resolver: zodResolver(contractorSchema),
  });

  // Fetch
  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors-full'],
    queryFn: async () => {
      const res = await api.get(`/contractors`);
      return res.data;
    },
    enabled: !!token,
  });

  // Filtering Logic
  // Assuming there's no native "isActive" built-in yet on the backend contractor,
  // but if there is, we could use it. For now, we'll pretend all are active unless we add `isActive` to contractor.
  // Actually, wait, does contractor have isActive? In schema: No, we didn't add it to Contractor model directly in our previous DB changes, but maybe we can add it to the filter logic if it exists.
  // Let's just create a mock filter.
  const filteredContractors = useMemo(() => {
    return contractors.filter((c: any) => {
      // Simulating a state filter if `isActive` exists, otherwise show all
      if (activeTab === 'active') return c.isActive !== false;
      if (activeTab === 'inactive') return c.isActive === false;
      return true; // 'all'
    });
  }, [contractors, activeTab]);

  // Mutations
  const mutation = useMutation({
    mutationFn: async (data: ContractorForm) => {
      if (editingId) {
        return api.patch(`/contractors/${editingId}`, data);
      }
      return api.post(`/contractors`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors-full'] });
      setIsModalOpen(false);
      setEditingId(null);
      reset();
      toast.success(t('contractors.saveSuccess'));
    },
    onError: (err: any) => {
      const message = err.response?.data?.message;
      const errorMsg = Array.isArray(message)
        ? message.join(', ')
        : message || t('contractors.saveError');
      toast.error(errorMsg);
    },
  });

  const onSubmit = (data: ContractorForm) => {
    mutation.mutate(data);
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setValue('name', c.name);
    setValue('legalName', c.legalName || '');
    setValue('taxId', c.taxId || '');
    setValue('email', c.email || '');
    setValue('phone', c.phone || '');
    setValue('address', c.address || '');
    setValue(
      'specialties',
      c.specialties ? c.specialties.replace(/"/g, '').replace('[', '').replace(']', '') : '',
    );
    setValue('contactPersonName', c.contactPersonName || '');
    setValue('contactPersonPhone', c.contactPersonPhone || '');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Directorio de Constructores
          </h2>
          <p className="text-gray-500 mt-1">
            Administra tus constructores, especialidades y recursos asignados.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            reset();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          Registrar Constructor
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Activos' },
            { id: 'inactive', label: 'Archivados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabValue)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              <span
                className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium 
                ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                {tab.id === 'all'
                  ? contractors.length
                  : contractors.filter((c: any) =>
                      tab.id === 'active' ? c.isActive !== false : c.isActive === false,
                    ).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 w-[25%]">Constructor</th>
                <th className="px-6 py-4 w-[25%]">Especialidad</th>
                <th className="px-6 py-4 w-[25%]">Contacto Principal</th>
                <th className="px-6 py-4 w-[10%] text-center">Estado</th>
                <th className="px-6 py-4 w-[15%] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Cargando constructores...
                  </td>
                </tr>
              ) : filteredContractors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">No se encontraron constructores</p>
                      <p className="text-sm mt-1">
                        Comienza agregando tu primer constructor al sistema.
                      </p>
                      <button
                        onClick={() => {
                          reset();
                          setEditingId(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                      >
                        <Plus size={16} /> Registrar Constructor
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContractors.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <div
                          className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => handleEdit(c)}
                        >
                          {c.name}
                        </div>
                        {c.legalName && (
                          <div className="text-xs text-gray-500 mt-0.5">{c.legalName}</div>
                        )}
                        {c.taxId && (
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-mono">
                            <Globe size={10} /> NIT: {c.taxId}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {c.specialties ? (
                        <div className="flex flex-wrap gap-1.5">
                          {c.specialties
                            .replace(/[\[\]"]/g, '')
                            .split(',')
                            .map((s: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                              >
                                {s.trim()}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No especificada</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {c.contactPersonName || c.email || c.phone ? (
                        <div className="flex flex-col gap-1.5">
                          {c.contactPersonName && (
                            <div className="text-sm font-medium text-gray-800">
                              {c.contactPersonName}
                            </div>
                          )}
                          {(c.phone || c.contactPersonPhone) && (
                            <div className="flex items-center text-[13px] text-gray-600 gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                              <Phone size={13} className="text-gray-400" />
                              {c.phone || c.contactPersonPhone}
                            </div>
                          )}
                          {c.email && (
                            <div
                              className="flex items-center text-[13px] text-gray-600 gap-1.5 opacity-80 hover:opacity-100 transition-opacity truncate max-w-[200px]"
                              title={c.email}
                            >
                              <Mail size={13} className="text-gray-400" />
                              {c.email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Sin contacto</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {c.isActive !== false ? (
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
                      <div className="flex items-center justify-end gap-2 pr-2">
                        <button
                          onClick={() =>
                            setSelectedConstructorForProjects({ id: c.id, name: c.name })
                          }
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 border border-purple-100 bg-purple-50/50 hover:border-purple-200"
                          title="Gestionar Proyectos"
                        >
                          <FolderKanban size={16} />
                          <span className="text-xs font-medium px-1">Proyectos</span>
                        </button>
                        <button
                          onClick={() =>
                            setSelectedContractorForResources({ id: c.id, name: c.name })
                          }
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 border border-blue-100 bg-blue-50/50 hover:border-blue-200"
                          title="Gestionar Recursos"
                        >
                          <Users size={16} />
                          <span className="text-xs font-medium px-1">Recursos</span>
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Editar Constructor"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto px-4 py-10 font-sans">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 my-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="text-blue-600" size={24} />
              {editingId ? 'Editar Constructor' : 'Nuevo Constructor'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Comercial *
                  </label>
                  <input
                    {...register('name')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ej. Constructora Alfa"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social
                  </label>
                  <input
                    {...register('legalName')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ej. Alfa S.A."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIT / Tax ID
                  </label>
                  <input
                    {...register('taxId')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Empresa
                  </label>
                  <input
                    {...register('email')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono Empresa
                  </label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección Fiscal
                  </label>
                  <input
                    {...register('address')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 mt-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 bg-gray-50 uppercase tracking-wider p-2 rounded">
                  Datos de Contacto e Información Adicional
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Contacto
                    </label>
                    <input
                      {...register('contactPersonName')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Dueño o Encargado"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono Móvil
                    </label>
                    <input
                      {...register('contactPersonPhone')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidades{' '}
                      <span className="text-gray-400 font-normal">(separadas por coma)</span>
                    </label>
                    <input
                      {...register('specialties')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Ej. Diseño Estructural, Carpintería, Fontanería"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar Ficha' : 'Guardar Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedContractorForResources && (
        <ContractorResourcesModal
          contractorId={selectedContractorForResources.id}
          contractorName={selectedContractorForResources.name}
          onClose={() => setSelectedContractorForResources(null)}
        />
      )}

      {selectedConstructorForProjects && (
        <ConstructorProjectsModal
          constructorId={selectedConstructorForProjects.id}
          constructorName={selectedConstructorForProjects.name}
          onClose={() => setSelectedConstructorForProjects(null)}
        />
      )}
    </div>
  );
};
