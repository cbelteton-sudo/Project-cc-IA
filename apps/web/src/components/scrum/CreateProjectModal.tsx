import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Loader2 } from 'lucide-react';

const createProjectSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  estimatedBudget: z.coerce.number().min(0, 'El presupuesto debe ser positivo').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

export function CreateProjectModal() {
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
      description: '',
      estimatedBudget: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateProjectFormValues) => {
      const response = await axios.post(`${API_URL}/scrum/projects`, data);
      return response.data;
    },
    onSuccess: (newProject) => {
      setOpen(false);
      reset();
      setServerError(null);
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Redirect to new project
      navigate(`/scrum/${newProject.id}`);
    },
    onError: (error: any) => {
      console.error(error);
      setServerError(
        error.response?.data?.message || 'Error al crear el proyecto. Intenta de nuevo.',
      );
    },
  });

  function onSubmit(data: CreateProjectFormValues) {
    setServerError(null);
    mutation.mutate(data);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Nuevo Proyecto
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Proyecto Scrum</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Proyecto *</Label>
              <Input id="name" placeholder="Ej. Torre A - Fase 2" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Breve descripción del alcance..."
                className="resize-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input type="date" id="startDate" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha Fin (Est.)</Label>
                <Input type="date" id="endDate" {...register('endDate')} />
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">Presupuesto Estimado</Label>
              <Input
                type="number"
                id="estimatedBudget"
                placeholder="0.00"
                {...register('estimatedBudget')}
              />
              {errors.estimatedBudget && (
                <p className="text-sm text-red-500">{errors.estimatedBudget.message}</p>
              )}
            </div>

            {serverError && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {serverError}
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Proyecto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
