import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { materialsService, type Material } from '../../services/materials';
import { MaterialDrawer } from './MaterialDrawer';
import { useRegion } from '../../context/RegionContext';

export const Materials = () => {
  const queryClient = useQueryClient();
  const { currency } = useRegion();
  const currencySymbol = currency === 'GTQ' ? 'Q' : '$';

  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: materialsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: materialsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material eliminado permanentemente');
    },
    onError: () => {
      toast.error('No se pudo eliminar el material. Podría estar asignado a un proyecto.');
    },
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este material del catálogo maestro?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo Maestro de Materiales</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona la lista global de materiales disponibles para todos los proyectos de la
            constructora.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedMaterialId(null);
            setIsDrawerOpen(true);
          }}
          className="bg-brand-ambar hover:bg-brand-oro text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Nuevo Material
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ambar/50"
          />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">ID Global</th>
                <th className="px-6 py-4">Nombre y Descripción</th>
                <th className="px-6 py-4">Unidad</th>
                <th className="px-6 py-4 text-right">Costo Paramétrico Ref. ({currencySymbol})</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Cargando catálogo maestro...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron materiales en el catálogo base.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((item: Material) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {item.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 max-w-md">
                        {item.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.unit}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {item.costParam != null ? `${currencySymbol} ${item.costParam}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedMaterialId(item.id);
                            setIsDrawerOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-ambar hover:bg-brand-ambar/10 rounded-md transition"
                          title="Editar Material"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Eliminar Material"
                        >
                          <Trash2 size={16} />
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

      <MaterialDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedMaterialId(null);
        }}
        materialId={selectedMaterialId}
      />
    </div>
  );
};
