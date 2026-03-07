import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const createProjectSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  clientName: z.string().optional(),
  contractorId: z.string().optional(),
  description: z.string().optional(),
  estimatedBudget: z.coerce.number().min(0, 'El presupuesto debe ser positivo').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  methodology: z.enum(['SCRUM', 'KANBAN']),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  customTrigger?: React.ReactNode;
}

export function CreateProjectModal({ customTrigger }: CreateProjectModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      clientName: '',
      contractorId: '',
      description: '',
      estimatedBudget: 0,
      methodology: 'SCRUM',
    },
  });

  const { data: contractors } = useQuery({
    queryKey: ['contractors'],
    queryFn: async () => {
      const res = await api.get('/contractors');
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateProjectFormValues) => {
      const response = await api.post(`/scrum/projects`, data);
      return response.data;
    },
    onSuccess: (newProject) => {
      setOpen(false);
      reset();
      setServerError(null);
      toast.success('Proyecto creado exitosamente');
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Redirect to new project directly to Planning tab
      navigate(`/projects/${newProject.id}/plan`);
    },
    onError: (error: any) => {
      console.error(error);
      const message =
        error.response?.data?.message || 'Error al crear el proyecto. Intenta de nuevo.';
      setServerError(message);
      toast.error(message);
    },
  });

  function onSubmit(data: CreateProjectFormValues) {
    setServerError(null);
    mutation.mutate(data);
  }

  return (
    <>
      {customTrigger ? (
        <div onClick={() => setOpen(true)} className="inline-block w-full md:w-auto">
          {customTrigger}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nuevo Proyecto
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-xl">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              Nuevo Proyecto
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Construye con certeza: controla tiempos, reduce riesgos y cuida el
              presupuesto—ágilmente. Agrega los datos generales del proyecto y sus parámetros clave
              para empezar con orden.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="text-slate-700 font-medium text-sm">
                  Nombre del Proyecto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej. Torre Mawi - Fase 2"
                  className="border-slate-200 focus-visible:ring-slate-400 bg-white"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-slate-700 font-medium text-sm">
                  Cliente
                </Label>
                <Input
                  id="clientName"
                  placeholder="Nombre de la empresa"
                  className="border-slate-200 focus-visible:ring-slate-400 bg-white"
                  {...register('clientName')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractorId" className="text-slate-700 font-medium text-sm">
                  Contratista Principal
                </Label>
                <select
                  id="contractorId"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 text-slate-700"
                  {...register('contractorId')}
                >
                  <option value="">Seleccione un contratista (Opcional)</option>
                  {contractors?.map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2 pt-2">
                <Label htmlFor="description" className="text-slate-700 font-medium text-sm">
                  Descripción General
                </Label>
                <Textarea
                  id="description"
                  placeholder="Breve descripción del alcance y objetivos..."
                  className="resize-none min-h-[80px] border-slate-200 focus-visible:ring-slate-400 bg-white"
                  {...register('description')}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="startDate" className="text-slate-700 font-medium text-sm">
                  Fecha Inicio Prevista
                </Label>
                <Input
                  type="date"
                  id="startDate"
                  className="border-slate-200 focus-visible:ring-slate-400 bg-white text-slate-700"
                  {...register('startDate')}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="endDate" className="text-slate-700 font-medium text-sm">
                  Fecha Fin Estimada
                </Label>
                <Input
                  type="date"
                  id="endDate"
                  className="border-slate-200 focus-visible:ring-slate-400 bg-white text-slate-700"
                  {...register('endDate')}
                />
              </div>

              <div className="space-y-2 md:col-span-2 pt-2">
                <Label htmlFor="estimatedBudget" className="text-slate-700 font-medium text-sm">
                  Presupuesto Global Referencial
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-semibold text-sm">
                    Q
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    id="estimatedBudget"
                    className="pl-12 border-slate-200 focus-visible:ring-slate-400 bg-white"
                    placeholder="0.00"
                    {...register('estimatedBudget')}
                  />
                </div>
                {errors.estimatedBudget && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.estimatedBudget.message}
                  </p>
                )}
              </div>
            </div>

            {serverError && (
              <div className="p-3 mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <span className="mt-0.5">⚠️</span> <span>{serverError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-sm font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm px-6 text-sm font-medium"
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Crear Proyecto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
