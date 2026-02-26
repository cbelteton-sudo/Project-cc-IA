import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Shield, User as UserIcon, Briefcase } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Schema
const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'Role is required'),
  contractorId: z.string().optional(),
  // password: z.string().optional(), // managed by backend for MVP
});

type UserForm = z.infer<typeof userSchema>;

const ROLES = ['ADMINISTRADOR', 'DIRECTOR', 'SUPERVISOR', 'RESIDENTE', 'OPERADOR', 'CONTRATISTA'];

export const AdminUsers = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'OPERADOR',
    },
  });

  const selectedRole = watch('role');

  // Fetch Users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get(`/admin/users`);
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch Contractors (for dropdown)
  const { data: contractors } = useQuery({
    queryKey: ['contractors-list'],
    queryFn: async () => {
      const res = await api.get(`/contractors`);
      return res.data;
    },
    enabled: !!token && selectedRole === 'CONTRATISTA',
  });

  // Mutations
  // Invitation State
  const [invitationData, setInvitationData] = useState<{ token: string; email: string } | null>(
    null,
  );

  // Mutations
  const mutation = useMutation({
    mutationFn: async (data: UserForm) => {
      if (editingUser) {
        return api.patch(`/admin/users/${editingUser.id}`, data);
      }
      // Invite flow
      return api.post(`/admin/invite`, data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);

      if (!editingUser && res.data.invitationToken) {
        // It was an invite
        setInvitationData({
          token: res.data.invitationToken,
          email: watch('email'),
        });
      } else {
        toast.success(editingUser ? 'Usuario actualizado' : 'Usuario invitado');
      }

      setEditingUser(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error saving user');
    },
  });

  const onSubmit = (data: UserForm) => {
    // If not contractor, ensure contractorId is undefined/null
    if (data.role !== 'CONTRATISTA') {
      data.contractorId = undefined;
    }
    mutation.mutate(data);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setValue('name', user.name || '');
    setValue('email', user.email);
    setValue('role', user.role);
    setValue('contractorId', user.contractorId || '');
    setIsModalOpen(true);
  };

  const copyInviteLink = () => {
    if (!invitationData) return;
    const link = `${window.location.origin}/accept-invite?token=${invitationData.token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado al portapapeles');
    setInvitationData(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Usuarios del Sistema</h2>
        <button
          onClick={() => {
            setEditingUser(null);
            reset();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Invitar Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Rol</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {user.name?.charAt(0) || user.email.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || 'Sin Nombre'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.contractor && (
                        <p className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                          <Briefcase size={10} />
                          {user.contractor.name}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      user.role === 'ADMINISTRADOR'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : user.role === 'CONTRATISTA'
                          ? 'bg-orange-50 text-orange-700 border-orange-100'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      user.status === 'INVITED'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                        : user.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-gray-50 text-gray-700 border-gray-100'
                    }`}
                  >
                    {user.status || 'ACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-gray-400 hover:text-blue-600 p-1"
                  >
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingUser ? 'Editar Usuario' : 'Invitar Usuario'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre (Opcional)
                </label>
                <input
                  {...register('name')}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ej. Juan Pérez"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...register('email')}
                    className="w-full border rounded px-3 py-2"
                    placeholder="usuario@empresa.com"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select {...register('role')} className="w-full border rounded px-3 py-2">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRole === 'CONTRATISTA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa Contratista
                  </label>
                  <select {...register('contractorId')} className="w-full border rounded px-3 py-2">
                    <option value="">Seleccionar Contratista...</option>
                    {contractors?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.contractorId && (
                    <p className="text-xs text-red-500">{errors.contractorId.message}</p>
                  )}
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠ El usuario solo verá datos de este contratista.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isSubmitting ? 'Enviando...' : editingUser ? 'Actualizar' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Success Modal */}
      {invitationData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">¡Invitación Enviada!</h3>
            <p className="text-gray-600 mb-4">
              Se ha generado una invitación para{' '}
              <span className="font-semibold">{invitationData.email}</span>.
              <br />
              Comparte este enlace con el usuario:
            </p>

            <div className="bg-gray-100 p-3 rounded text-sm text-gray-800 break-all mb-4 select-all cursor-text font-mono border border-gray-200">
              {`${window.location.origin}/accept-invite?token=${invitationData.token}`}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={copyInviteLink}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Copiar y cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
