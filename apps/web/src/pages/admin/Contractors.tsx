import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Briefcase, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Schema
const contractorSchema = z.object({
    name: z.string().min(2, 'Commercial Name is required'),
    legalName: z.string().optional(),
    taxId: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    specialties: z.string().optional(), // We'll handle this as simple string for demo, or JSON stringify
    contactPersonName: z.string().optional(),
    contactPersonPhone: z.string().optional(),
});

type ContractorForm = z.infer<typeof contractorSchema>;

export const Contractors = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<ContractorForm>({
        resolver: zodResolver(contractorSchema)
    });

    // Fetch
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: contractors, isLoading } = useQuery({
        queryKey: ['contractors-full'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/contractors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Should fetch extended profile if endpoint supports it, assuming it does based on Service
            return res.data;
        },
        enabled: !!token
    });

    // Mutations
    const mutation = useMutation({
        mutationFn: async (data: ContractorForm) => {
            // Transform optional empty strings if needed, backend should handle
            if (editingId) {
                return axios.patch(`${API_URL}/contractors/${editingId}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            return axios.post(`${API_URL}/contractors`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contractors-full'] });
            setIsModalOpen(false);
            setEditingId(null);
            reset();
            toast.success('Contractor saved successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error saving contractor');
        }
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
        setValue('specialties', c.specialties ? c.specialties.replace(/"/g, '').replace('[', '').replace(']', '') : ''); // simple parse for demo
        setValue('contactPersonName', c.contactPersonName || '');
        setValue('contactPersonPhone', c.contactPersonPhone || '');
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Directorio de Contratistas</h2>
                <button
                    onClick={() => { setEditingId(null); reset(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    Registrar Contratista
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contractors?.map((c: any) => (
                    <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{c.name}</h3>
                                    <p className="text-xs text-gray-500">{c.legalName || 'Sin Razón Social'}</p>
                                </div>
                            </div>
                            <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-blue-600">
                                <Edit size={16} />
                            </button>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                            {c.taxId && <p className="flex items-center gap-2"><Globe size={14} /> Max ID: <span className="font-mono text-xs">{c.taxId}</span></p>}
                            {(c.email || c.contactPersonName) && (
                                <div className="pt-2 border-t border-gray-100 mt-2">
                                    <p className="font-semibold text-xs text-gray-400 uppercase">Contacto</p>
                                    <p className="text-gray-900">{c.contactPersonName}</p>
                                    {c.email && <p className="text-xs text-blue-600 flex items-center gap-1"><Mail size={12} />{c.email}</p>}
                                    {c.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12} />{c.phone}</p>}
                                </div>
                            )}
                            {c.specialties && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {c.specialties.replace(/[\[\]"]/g, '').split(',').map((s: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s.trim()}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl my-auto">
                        <h3 className="text-xl font-bold mb-4">{editingId ? 'Editar Ficha Contratista' : 'Nuevo Contratista'}</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial *</label>
                                <input {...register('name')} className="w-full border rounded px-3 py-2" placeholder="Ej. Constructora Alfa" />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                                <input {...register('legalName')} className="w-full border rounded px-3 py-2" placeholder="Ej. Alfa S.A." />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIT / Tax ID</label>
                                <input {...register('taxId')} className="w-full border rounded px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Empresa</label>
                                <input {...register('email')} className="w-full border rounded px-3 py-2" />
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input {...register('phone')} className="w-full border rounded px-3 py-2" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                                <input {...register('address')} className="w-full border rounded px-3 py-2" />
                            </div>

                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-semibold text-gray-900 mb-2">Contacto Principal</h4>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Contacto</label>
                                <input {...register('contactPersonName')} className="w-full border rounded px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Contacto</label>
                                <input {...register('contactPersonPhone')} className="w-full border rounded px-3 py-2" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidades (separadas por coma)</label>
                                <input {...register('specialties')} className="w-full border rounded px-3 py-2" placeholder="Ej. Obra Gris, Electricidad" />
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-3 mt-6 border-t pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    {isSubmitting ? 'Guardando...' : 'Guardar Ficha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
