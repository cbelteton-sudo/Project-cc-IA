import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, ArrowLeft, Printer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const SprintAssignmentsReport = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  // API_URL handled by api instance

  const { data, isLoading, error } = useQuery({
    queryKey: ['sprint-assignments', projectId],
    queryFn: async () => {
      const res = await api.get(`/reports/project/${projectId}/sprint-assignments`);
      return res.data;
    },
    enabled: !!projectId && !!token,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-slate-600">Cargando reporte...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudo cargar el reporte de asignaciones. Intentelo de nuevo más tarde.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>
      </div>
    );
  }

  if (!data || !data.sprint) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-10 w-10 text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">No hay Sprint Activo</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          No se encontró un sprint activo o reciente para este proyecto.
        </p>
        <Button onClick={() => navigate(-1)} className="mt-6" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>
      </div>
    );
  }

  const { sprint, assignments } = data;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 print:bg-white print:p-0">
      {/* Navigation & Actions - Hidden on Print */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-slate-200/50">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Reportes
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Reporte
        </Button>
      </div>

      {/* Report Content */}
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Section */}
        <Card className="border-none shadow-none print:shadow-none">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Reporte de Asignaciones de Proyecto
                </CardTitle>
                <CardDescription className="mt-1 text-base text-slate-600">
                  Sprint: <span className="font-semibold text-slate-900">{sprint.name}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1 text-sm text-slate-600">
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                  <span className="font-medium text-slate-700">Estado:</span>
                  <Badge
                    variant={sprint.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="uppercase text-[10px]"
                  >
                    {sprint.status === 'ACTIVE' ? 'Activo' : sprint.status}
                  </Badge>
                </div>
                <div className="mt-2 text-right">
                  <p>
                    Del{' '}
                    <span className="font-medium text-slate-900">
                      {format(new Date(sprint.startDate), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </p>
                  <p>
                    Al{' '}
                    <span className="font-medium text-slate-900">
                      {format(new Date(sprint.endDate), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 rounded-lg bg-blue-50 p-4 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Objetivo del Sprint</h3>
              <p className="text-sm text-blue-800 italic">
                "{sprint.goal || 'Sin objetivo definido'}"
              </p>
            </div>

            {/* Assignments Table */}
            <div className="overflow-hidden rounded-md border border-slate-200 print:border-slate-300">
              <Table>
                <TableHeader className="bg-slate-50 print:bg-slate-100">
                  <TableRow>
                    <TableHead className="w-[30%] font-semibold text-slate-700">
                      Tarea / Actividad
                    </TableHead>
                    <TableHead className="w-[20%] font-semibold text-slate-700">
                      Responsable
                    </TableHead>
                    <TableHead className="w-[15%] font-semibold text-slate-700">Estado</TableHead>
                    <TableHead className="w-[15%] font-semibold text-slate-700">
                      Prioridad
                    </TableHead>
                    <TableHead className="w-[20%] font-semibold text-slate-700 text-right">
                      Fechas
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                        No hay asignaciones en este sprint.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((task: any) => (
                      <TableRow key={task.id} className="print:break-inside-avoid">
                        <TableCell className="font-medium text-slate-900">
                          {task.title}
                          <div className="mt-1 text-xs text-slate-500 capitalize">
                            {task.type.toLowerCase().replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">{task.assignee}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            {task.assigneeType === 'CONTRACTOR'
                              ? 'Contratista'
                              : task.assigneeType === 'USER'
                                ? 'Usuario'
                                : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-white">
                            {task.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium 
                              ${
                                task.priority === 'URGENT'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'HIGH'
                                    ? 'bg-orange-100 text-orange-700'
                                    : task.priority === 'MEDIUM'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {task.priority || 'Normal'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-xs text-slate-600">
                            <span className="block">
                              Inicio: {format(new Date(task.startDate), 'dd/MM/yyyy')}
                            </span>
                            <span
                              className={`block font-medium ${new Date(task.endDate) < new Date() && task.status !== 'DONE' ? 'text-red-600' : 'text-slate-900'}`}
                            >
                              Fin: {format(new Date(task.endDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer with Timestamp */}
            <div className="mt-8 text-center text-xs text-slate-400 print:mt-12">
              Reporte generado el{' '}
              {format(new Date(), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
            </div>
          </CardContent>
        </Card>
      </div>
      <style type="text/css" media="print">
        {`
          @page { size: landscape; margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; }
        `}
      </style>
    </div>
  );
};
