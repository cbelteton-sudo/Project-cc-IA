import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Edit2, PlusSquare, FileText } from 'lucide-react';
import { projectMaterialsService } from '../../services/projectMaterials';
import type { ProjectMaterial } from '../../services/projectMaterials';
import { projectsService } from '../../services/projects';
import { ProjectMaterialDrawer } from './ProjectMaterialDrawer';
import { ProjectMaterialReceiveDrawer } from './ProjectMaterialReceiveDrawer';
import { KardexDetailDrawer } from './KardexDetailDrawer';

export const ProjectMaterialsCatalog = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'KARDEX'>('CATALOG');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isKardexOpen, setIsKardexOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['projectMaterials', projectId],
    queryFn: () => projectMaterialsService.getAllByProject(projectId!),
    enabled: !!projectId,
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getById(projectId!),
    enabled: !!projectId,
  });

  const filteredMaterials = materials.filter(
    (m: ProjectMaterial) =>
      m.material?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.projectSKU?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenDrawer = (materialId?: string) => {
    setSelectedMaterialId(materialId || null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedMaterialId(null);
  };

  const handleOpenReceive = (materialId: string) => {
    setSelectedMaterialId(materialId);
    setIsReceiveOpen(true);
  };

  const handleCloseReceive = () => {
    setIsReceiveOpen(false);
    setSelectedMaterialId(null);
  };

  const handleOpenKardex = (materialId: string) => {
    setSelectedMaterialId(materialId);
    setIsKardexOpen(true);
  };

  const handleCloseKardex = () => {
    setIsKardexOpen(false);
    setSelectedMaterialId(null);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Materiales del Proyecto</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona los materiales, existencias y especificaciones técnicas para este proyecto.
          </p>
        </div>
        <button
          onClick={() => handleOpenDrawer()}
          className="bg-brand-ambar hover:bg-brand-oro text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Nuevo Material
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-max">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            activeTab === 'CATALOG'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Catálogo y Existencias
        </button>
        <button
          onClick={() => setActiveTab('KARDEX')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            activeTab === 'KARDEX'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Kardex / Consumos
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, código o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ambar/50"
          />
        </div>
        {/* Filters could go here */}
      </div>

      {/* Data Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Código / SKU</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Unidad</th>
                {activeTab === 'CATALOG' ? (
                  <>
                    <th className="px-6 py-4 text-right">Cant. Estimada</th>
                    <th className="px-6 py-4 text-right">Costo Unitario</th>
                    <th className="px-6 py-4 text-right">Existencia Actual</th>
                    <th className="px-6 py-4 text-right">Cant. Consumida</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-right">Presupuesto (Cant)</th>
                    <th className="px-6 py-4 text-right">Inventario Actual</th>
                    <th className="px-6 py-4 text-right">Consumo Real</th>
                    <th className="px-6 py-4 text-right">Desviación</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Cargando catálogo...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron materiales.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((item: ProjectMaterial) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.projectSKU || '-'}</div>
                      <div className="text-xs text-slate-500">
                        Global ID: {item.materialId.substring(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {item.material?.name || 'Manual'}
                      </div>
                      <div
                        className="text-xs text-slate-500 line-clamp-1 max-w-xs"
                        title={item.material?.description || ''}
                      >
                        {item.material?.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.material?.unit || '-'}
                    </td>

                    {activeTab === 'CATALOG' ? (
                      <>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium">{item.plannedQty || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-slate-600">
                            {project?.currency || '$'} {item.plannedPrice || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (item.stockAvailable ?? 0) > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.stockAvailable || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-slate-600">{item.stockConsumed || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenReceive(item.id)}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                              title="Registrar Ingreso de Stock"
                            >
                              <PlusSquare size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenDrawer(item.id)}
                              className="p-1.5 text-slate-400 hover:text-brand-ambar hover:bg-brand-ambar/10 rounded-md transition"
                              title="Ver detalles / Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-slate-800">{item.plannedQty || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-slate-800">
                            {item.stockAvailable || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-slate-800">
                            {item.stockConsumed || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (item.plannedQty || 0) - (item.stockConsumed || 0) >= 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {(item.plannedQty || 0) - (item.stockConsumed || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenKardex(item.id)}
                              className="p-1.5 text-slate-400 hover:text-brand-oro hover:bg-amber-50 rounded-md transition"
                              title="Ver Kardex / Movimientos"
                            >
                              <FileText size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer para agregar/editar */}
      <ProjectMaterialDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        projectId={projectId!}
        materialId={selectedMaterialId}
      />

      {/* Drawer para registrar ingreso */}
      <ProjectMaterialReceiveDrawer
        isOpen={isReceiveOpen}
        onClose={handleCloseReceive}
        projectId={projectId!}
        materialId={selectedMaterialId}
      />

      {/* Drawer del Kardex de Detalles */}
      <KardexDetailDrawer
        isOpen={isKardexOpen}
        onClose={handleCloseKardex}
        projectId={projectId!}
        materialId={selectedMaterialId}
      />
    </div>
  );
};
