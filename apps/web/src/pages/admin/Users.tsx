import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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
        formState: { errors, isSubmitting }
    } = useForm<UserForm>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: 'OPERADOR'
        }
    });

    const selectedRole = watch('role');

    // Fetch Users
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    // Fetch Contractors (for dropdown)
    const { data: contractors } = useQuery({
        queryKey: ['contractors-list'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/contractors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token && selectedRole === 'CONTRATISTA'
    });

    // Mutations
    const mutation = useMutation({
        mutationFn: async (data: UserForm) => {
            if (editingUser) {
                return axios.patch(`${API_URL}/admin/users/${editingUser.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            return axios.post(`${API_URL}/admin/users`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setIsModalOpen(false);
            setEditingUser(null);
            reset();
            toast.success('User saved successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error saving user');
        }
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Usuarios del Sistema</h2>
                <button
                    onClick={() => { setEditingUser(null); reset(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    Nuevo Usuario
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
                                            <p className="text-sm font-medium text-gray-900">{user.name || 'Sin Nombre'}</p>
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
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${user.role === 'ADMINISTRADOR' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                        user.role === 'CONTRATISTA' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                            'bg-gray-100 text-gray-700 border-gray-200'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <span className="text-xs text-green-600 font-medium">Activo</span>
                                    {/* TODO: Implement toggle active */}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button onClick={() => handleEdit(user)} className="text-gray-400 hover:text-blue-600 p-1">
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
                        <h3 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input {...register('name')} className="w-full border rounded px-3 py-2" />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input {...register('email')} className="w-full border rounded px-3 py-2" />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select {...register('role')} className="w-full border rounded px-3 py-2">
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            {selectedRole === 'CONTRATISTA' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Contratista</label>
                                    <select {...register('contractorId')} className="w-full border rounded px-3 py-2">
                                        <option value="">Seleccionar Contratista...</option>
                                        {contractors?.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {errors.contractorId && <p className="text-xs text-red-500">{errors.contractorId.message}</p>}
                                    <p className="text-xs text-yellow-600 mt-1">
                                        ⚠ El usuario solo verá datos de este contratista.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
