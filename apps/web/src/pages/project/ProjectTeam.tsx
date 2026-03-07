import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

const memberSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  role: z.string().min(1, 'El rol es requerido'),
  contractorId: z.string().min(1, 'El contratista es requerido'),
});

type MemberForm = z.infer<typeof memberSchema>;

const PROJECT_ROLES = [
  'PROJECT_ADMIN',
  'DIRECTOR',
  'PM',
  'FINANCIERO',
  'SUPERVISOR',
  'RESIDENTE_OBRA',
  'CONTRACTOR_LEAD',
  'FIELD_OPERATOR',
  'VIEWER',
];

const ROLE_LABELS: Record<string, string> = {
  PROJECT_ADMIN: 'Administrador de Configuraciones del Proyecto',
  DIRECTOR: 'Director',
  PM: 'Project Manager',
  FINANCIERO: 'Administrador Financiero',
  SUPERVISOR: 'Supervisor',
  RESIDENTE_OBRA: 'Residente de Obra',
  CONTRACTOR_LEAD: 'Constructor Principal',
  FIELD_OPERATOR: 'Operador de Campo',
  VIEWER: 'Espectador',
};

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    contractorId: string | null;
  };
}

interface ContractInfo {
  id: string;
  name: string;
}

interface OrgUser {
  id: string;
  name: string | null;
  email: string;
}

export const ProjectTeam = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { token, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      role: 'VIEWER',
    },
  });

  // Fetch Project Members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const res = await api.get(`/admin/projects/${projectId}/members`);
      return res.data;
    },
    enabled: !!token && !!projectId,
  });

  // Fetch Org Users for the dropdown (to make it easy to invite existing users)
  // Or we can just allow them to type an email. Let's do a select if we want,
  // but a text input that creates an invitation if the user doesn't exist might be better.
  // The backend project-members.controller requires the user to already exist?
  // Let's assume the user types the email of an existing org user, or we fetch them.
  const { data: orgUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get(`/admin/users`);
      return res.data;
    },
    enabled: !!token && isModalOpen,
  });

  // Fetch Project Contractors
  const { data: projectContractors = [] } = useQuery({
    queryKey: ['project-contractors', projectId],
    queryFn: async () => {
      const res = await api.get(`/contractors`, { params: { projectId } });
      return res.data;
    },
    enabled: !!token && !!projectId && isModalOpen,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: MemberForm) => {
      if (editingUserId) {
        return api.patch(`/admin/projects/${projectId}/members/${editingUserId}`, {
          role: data.role,
          contractorId: data.contractorId,
        });
      }
      return api.post(`/admin/projects/${projectId}/members`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setIsModalOpen(false);
      setEditingUserId(null);
      reset();
      toast.success(
        editingUserId ? 'Rol actualizado correctamente' : 'Miembro agregado exitosamente',
      );
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Error al guardar el miembro');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/admin/projects/${projectId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Miembro removido exitosamente');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Error al remover el miembro');
    },
  });

  const onSubmit = (data: MemberForm) => {
    saveMutation.mutate(data);
  };

  const handleEdit = (m: ProjectMember) => {
    setEditingUserId(m.user.id);
    setValue('name', m.user.name || '');
    setValue('email', m.user.email || '');
    setValue('phone', m.user.phone || '');
    setValue('role', m.role);
    setValue('contractorId', m.user.contractorId || '');
    setIsModalOpen(true);
  };

  const handleRemove = (userId: string) => {
    if (confirm('¿Estás seguro de que deseas remover a este miembro del proyecto?')) {
      removeMutation.mutate(userId);
    }
  };

  const openNewModal = () => {
    setEditingUserId(null);
    reset();
    setIsModalOpen(true);
  };

  if (loadingMembers) {
    return <div className="p-8 text-center text-gray-500">Cargando equipo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Equipo del Proyecto</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona los miembros internos y sus roles en este proyecto.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} />
          Agregar Miembro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Rol en Proyecto</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m: ProjectMember) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {m.user.name?.charAt(0) || m.user.email.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {m.user.name || 'Sin Nombre'}
                      </p>
                      {m.user.id === currentUser?.userId && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                          Tú
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{m.user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      m.role === 'PROJECT_ADMIN' || m.role === 'DIRECTOR'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : m.role === 'PM' || m.role === 'SUPERVISOR'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : m.role === 'RESIDENTE_OBRA' || m.role === 'CONTRACTOR_LEAD'
                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(m)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Editar rol"
                    >
                      <Edit size={16} />
                    </button>
                    {m.user.id !== currentUser?.userId && (
                      <button
                        onClick={() => handleRemove(m.user.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remover del proyecto"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay miembros asignados a este proyecto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUserId ? 'Editar Rol del Miembro' : 'Agregar Miembro al Proyecto'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  {...register('name')}
                  placeholder="Ej. Juan Pérez"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                {editingUserId ? (
                  <input
                    {...register('email')}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 outline-none"
                  />
                ) : (
                  <>
                    <input
                      type="email"
                      list="org-users-list"
                      {...register('email')}
                      placeholder="usuario@empresa.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <datalist id="org-users-list">
                      {orgUsers.map((u: OrgUser) => (
                        <option key={u.id} value={u.email}>
                          {u.name || 'Sin nombre'}
                        </option>
                      ))}
                    </datalist>
                  </>
                )}
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
                {!editingUserId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Escriba un nuevo correo para invitar, o seleccione un usuario existente.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <input
                  {...register('phone')}
                  placeholder="Ej. +52 555 123 4567"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol en el Proyecto
                </label>
                <select
                  {...register('role')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {PROJECT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contratista responsable *
                </label>
                <select
                  {...register('contractorId')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Seleccione contratista --</option>
                  {projectContractors.map((c: ContractInfo) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.contractorId && (
                  <p className="text-xs text-red-500 mt-1">{errors.contractorId.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Asocia a este miembro a un contratista del proyecto.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : editingUserId
                      ? 'Actualizar Rol'
                      : 'Agregar Miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
