import React from 'react';
import { Paperclip } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectMaterialsService } from '../../services/projectMaterials';
import { projectsService } from '../../services/projects';
import { GlobalDiscussion } from '../../components/common/GlobalDiscussion';
import { CommentReferenceType } from '../../services/comments';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  materialId: string | null;
}

export const KardexDetailDrawer = ({ isOpen, onClose, projectId, materialId }: Props) => {
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getById(projectId),
    enabled: isOpen && !!projectId,
  });

  const { data: material } = useQuery({
    queryKey: ['projectMaterial', materialId],
    queryFn: () => projectMaterialsService.getById(materialId!),
    enabled: isOpen && !!materialId,
  });

  const { data: kardex = [], isLoading } = useQuery({
    queryKey: ['kardex', materialId],
    queryFn: () => projectMaterialsService.getKardex(materialId!),
    enabled: isOpen && !!materialId,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl relative flex flex-col animate-slide-in-right">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Kardex / Historial de Movimientos
            </h2>
            {material && (
              <p className="text-sm text-slate-500 mt-1">
                {material.material?.name} • Código: {material.projectSKU || '-'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Cargando movimientos...</div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Stock Disponible</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {material?.stockAvailable || 0}{' '}
                    <span className="text-base font-normal text-slate-500">
                      {material?.material?.unit}
                    </span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Presupuesto Ejecutado</p>
                  <p className="text-2xl font-bold text-slate-800">
                    <span className="text-base font-normal text-slate-500 mr-1">
                      {project?.currency || '$'}
                    </span>
                    {kardex
                      .filter((m) => m.type === 'IN')
                      .reduce((acc, curr) => acc + curr.amount, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Total Consumido</p>
                  <p className="text-2xl font-bold text-brand-oro">
                    {material?.stockConsumed || 0}{' '}
                    <span className="text-base font-normal text-brand-ambar/80">
                      {material?.material?.unit}
                    </span>
                  </p>
                </div>
              </div>

              {/* Kardex Ledger */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-500 font-semibold uppercase text-xs">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3 text-center">Tipo</th>
                      <th className="px-4 py-3">Detalle</th>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3 text-right">Cant.</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kardex.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Ningún movimiento registrado para este material.
                        </td>
                      </tr>
                    ) : (
                      kardex.map((movement) => (
                        <tr key={movement.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(movement.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                movement.type === 'IN'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {movement.type === 'IN' ? 'Entrada' : 'Salida'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {movement.type === 'IN' ? (
                              <div className="space-y-1">
                                <div className="font-medium text-slate-800">Ingreso Manual</div>
                                {movement.documentNumber && (
                                  <div className="text-xs text-slate-600">
                                    OC:{' '}
                                    <span className="font-medium text-slate-800">
                                      {movement.documentNumber}
                                    </span>
                                  </div>
                                )}
                                {movement.documentUrl && (
                                  <a
                                    href={movement.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-brand-oro hover:text-brand-ambar transition-colors flex items-center gap-1 font-medium"
                                  >
                                    <Paperclip className="w-3 h-3" /> Ver Documento adjunto
                                  </a>
                                )}
                                {movement.notes && (
                                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {movement.notes.replace(/^\[QTY:[0-9.]+\]\s*/, '')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="font-medium text-slate-800">Consumo Material</div>
                                {movement.activity && (
                                  <div className="text-xs text-slate-600">
                                    Tarea:{' '}
                                    <span className="font-medium text-slate-800">
                                      {movement.activity.name}
                                    </span>
                                  </div>
                                )}
                                {movement.notes && (
                                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {movement.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {movement.user ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center flex-shrink-0 text-xs text-slate-600 font-medium">
                                  {movement.user.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span
                                  className="text-sm text-slate-700 truncate max-w-[120px]"
                                  title={movement.user.name || undefined}
                                >
                                  {movement.user.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No registrado</span>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium ${movement.type === 'IN' ? 'text-green-600' : 'text-slate-700'}`}
                          >
                            {movement.type === 'IN' ? '+' : '-'}
                            {movement.quantity.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 font-medium">
                            <span className="text-slate-400 font-normal mr-1">
                              {project?.currency || '$'}
                            </span>
                            {movement.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Discussion Thread */}
              {materialId && material && (
                <div className="pt-4 border-t border-slate-100">
                  <GlobalDiscussion
                    referenceType={CommentReferenceType.MATERIAL}
                    referenceId={material.materialId}
                    projectId={projectId}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
